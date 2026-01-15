import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { startDate, endDate, mode = 'SUMMARY' } = body

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'Start date and end date required' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'API Key not configured' },
                { status: 500 }
            )
        }

        // 1. Fetch Transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                category: true
            }
        })

        if (transactions.length === 0) {
            return NextResponse.json({
                success: true,
                data: "Belum ada data transaksi di periode ini. Yuk mulai catat pengeluaranmu!"
            })
        }

        // 2. Aggregate Data (Token Efficiency)
        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0)

        const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0)

        const categoryBreakdown: Record<string, number> = {}
        transactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(t => {
                const name = t.category.name
                categoryBreakdown[name] = (categoryBreakdown[name] || 0) + Number(t.amount)
            })

        // Sort categories by amount
        const topCategories = Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => `- ${name}: Rp ${amount.toLocaleString('id-ID')}`)
            .join('\n')

        const largestExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .sort((a, b) => Number(b.amount) - Number(a.amount))[0]

        // 3. Construct Prompt
        const formatIDR = (num: number) => `Rp ${num.toLocaleString('id-ID')}`

        const validModes = ['SUMMARY', 'TIPS', 'ROAST', 'FORECAST']
        const selectedMode = validModes.includes(mode) ? mode : 'SUMMARY'

        const dataContext = `
Data Keuangan (${startDate} s/d ${endDate}):
- Total Pemasukan: ${formatIDR(totalIncome)}
- Total Pengeluaran: ${formatIDR(totalExpense)}
- Sisa Saldo Periode Ini: ${formatIDR(totalIncome - totalExpense)}
- Pengeluaran Terbesar (Top 5 Kategori):
${topCategories}
- Transaksi Termahal: ${largestExpense ? `${largestExpense.description || largestExpense.category.name} (${formatIDR(Number(largestExpense.amount))})` : '-'}
`

        let systemInstruction = ''
        switch (selectedMode) {
            case 'SUMMARY':
                systemInstruction = "Anda adalah asisten keuangan pribadi. Berikan ringkasan eksekutif yang singkat, padat, dan jelas tentang kondisi keuangan user berdasarkan data berikut. Gunakan bahasa Indonesia yang formal tapi santai."
                break
            case 'TIPS':
                systemInstruction = "Anda adalah konsultan keuangan bijak. Berikan 3 saran praktis dan actionable untuk berhemat atau mengelola uang lebih baik berdasarkan data pengeluaran user ini. Fokus pada kategori pengeluaran terbesar."
                break
            case 'ROAST':
                systemInstruction = "Anda adalah teman yang 'julid' dan sarkas. 'Roast' (ejek) kebiasaan belanja user ini dengan pedas tapi lucu. Komentari pengeluaran terbesar mereka. Gunakan bahasa gaul Indonesia."
                break
            case 'FORECAST':
                systemInstruction = "Anda adalah analis data. Berdasarkan pola pengeluaran ini, proyeksikan apa yang mungkin terjadi bulan depan jika user tidak mengubah kebiasaannya. Beri peringatan jika ada potensi masalah cashflow."
                break
        }

        const prompt = `${systemInstruction}\n\n${dataContext}\n\nJawab dalam format Markdown.`

        // 4. Call AI
        let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`
        let headers: any = { 'Content-Type': 'application/json' }
        let bodyPayload: any = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7, // Higher creativity for insights
                maxOutputTokens: 500
            }
        }

        const isOpenRouter = apiKey.startsWith('sk-or-')

        if (isOpenRouter) {
            apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://samidtrack.com',
                'X-Title': 'SamidTrack Finance'
            }
            bodyPayload = {
                model: 'mistralai/mistral-7b-instruct:free',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: dataContext }
                ],
                temperature: 0.7,
                max_tokens: 500
            }
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers as any,
            body: JSON.stringify(bodyPayload)
        })

        const data = await response.json()
        let resultText = ''

        if (isOpenRouter) {
            resultText = data.choices?.[0]?.message?.content || 'Gagal mengambil insight.'
        } else {
            resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal mengambil insight.'
        }

        return NextResponse.json({
            success: true,
            data: resultText
        })

    } catch (error) {
        console.error('AI Insight Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
