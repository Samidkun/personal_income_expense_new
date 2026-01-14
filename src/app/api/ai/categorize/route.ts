import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { description, type } = body

        if (!description) {
            return NextResponse.json(
                { success: false, error: 'Description required' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
            // Fallback to keyword-based matching if no API key
            return await fallbackCategorization(description, type)
        }

        // Get categories for context
        const categories = await prisma.category.findMany({
            where: type ? { type } : undefined
        })

        const categoryList = categories.map(c => `- ${c.name} (${c.type})`).join('\n')

        // Call Gemini API
        const prompt = `Berdasarkan deskripsi transaksi berikut, pilih kategori yang paling sesuai.

Deskripsi: "${description}"
Tipe: ${type || 'EXPENSE atau INCOME'}

Kategori yang tersedia:
${categoryList}

Balas HANYA dengan nama kategori yang paling sesuai, tanpa penjelasan.`

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 50
                    }
                })
            }
        )

        const data = await response.json()

        if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return await fallbackCategorization(description, type)
        }

        const suggestedName = data.candidates[0].content.parts[0].text.trim()

        // Find matching category
        const matchedCategory = categories.find(
            c => c.name.toLowerCase() === suggestedName.toLowerCase()
        )

        if (matchedCategory) {
            return NextResponse.json({
                success: true,
                data: {
                    categoryId: matchedCategory.id,
                    categoryName: matchedCategory.name,
                    confidence: 'high',
                    source: 'ai'
                }
            })
        }

        // Partial match
        const partialMatch = categories.find(
            c => c.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
                suggestedName.toLowerCase().includes(c.name.toLowerCase())
        )

        if (partialMatch) {
            return NextResponse.json({
                success: true,
                data: {
                    categoryId: partialMatch.id,
                    categoryName: partialMatch.name,
                    confidence: 'medium',
                    source: 'ai'
                }
            })
        }

        return await fallbackCategorization(description, type)
    } catch (error) {
        console.error('AI categorization error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to categorize' },
            { status: 500 }
        )
    }
}

async function fallbackCategorization(description: string, type?: string) {
    const categories = await prisma.category.findMany({
        where: type ? { type: type as 'INCOME' | 'EXPENSE' } : undefined
    })

    const desc = description.toLowerCase()

    // Keyword mapping for common expenses
    const keywordMap: Record<string, string[]> = {
        'Makanan & Minuman': ['makan', 'nasi', 'ayam', 'kopi', 'teh', 'snack', 'jajan', 'gofood', 'grabfood', 'resto', 'restaurant', 'cafe', 'warung'],
        'Transportasi': ['bensin', 'parkir', 'ojol', 'gojek', 'grab', 'taxi', 'bus', 'kereta', 'toll', 'tol', 'transport'],
        'Belanja': ['belanja', 'beli', 'shopee', 'tokped', 'tokopedia', 'lazada', 'bukalapak', 'mall', 'supermarket', 'indomaret', 'alfamart'],
        'Hiburan': ['nonton', 'bioskop', 'game', 'spotify', 'netflix', 'youtube', 'hiburan', 'entertainment'],
        'Tagihan': ['listrik', 'pln', 'air', 'pdam', 'internet', 'wifi', 'pulsa', 'paket data', 'telepon'],
        'Kesehatan': ['obat', 'apotek', 'dokter', 'rumah sakit', 'klinik', 'kesehatan', 'vitamin'],
        'Pendidikan': ['kursus', 'sekolah', 'kuliah', 'buku', 'belajar', 'les'],
        'Gaji': ['gaji', 'salary', 'upah', 'honor', 'honorarium'],
        'Bonus': ['bonus', 'thr', 'insentif', 'komisi'],
        'Investasi': ['dividen', 'bunga', 'return', 'profit', 'capital gain'],
        'Lainnya': []
    }

    for (const [categoryName, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(kw => desc.includes(kw))) {
            const match = categories.find(c => c.name === categoryName)
            if (match) {
                return NextResponse.json({
                    success: true,
                    data: {
                        categoryId: match.id,
                        categoryName: match.name,
                        confidence: 'medium',
                        source: 'keyword'
                    }
                })
            }
        }
    }

    // Return "Lainnya" as default
    const defaultCategory = categories.find(c => c.name === 'Lainnya')
    if (defaultCategory) {
        return NextResponse.json({
            success: true,
            data: {
                categoryId: defaultCategory.id,
                categoryName: defaultCategory.name,
                confidence: 'low',
                source: 'default'
            }
        })
    }

    // Return first category as absolute fallback
    if (categories.length > 0) {
        return NextResponse.json({
            success: true,
            data: {
                categoryId: categories[0].id,
                categoryName: categories[0].name,
                confidence: 'low',
                source: 'default'
            }
        })
    }

    return NextResponse.json({
        success: false,
        error: 'No categories found'
    }, { status: 404 })
}
