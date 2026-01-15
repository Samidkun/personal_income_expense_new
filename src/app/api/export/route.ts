import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') || 'csv'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const where: Record<string, any> = {}

        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) where.date.lte = new Date(endDate)
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                category: true,
                wallet: true
            },
            orderBy: { date: 'desc' }
        })

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Keterangan', 'Jumlah']
            const rows = transactions.map((t: any) => [
                new Date(t.date).toLocaleDateString('id-ID'),
                t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
                t.category.name,
                t.wallet.name,
                t.description || '',
                Number(t.amount)
            ])

            const csv = [
                headers.join(','),
                ...rows.map((row: any) => row.map((cell: any) =>
                    typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
                ).join(','))
            ].join('\n')

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=transactions_${new Date().toISOString().split('T')[0]}.csv`
                }
            })
        }

        // JSON format for PDF generation on client
        return NextResponse.json({
            success: true,
            data: transactions.map((t: any) => ({
                date: new Date(t.date).toLocaleDateString('id-ID'),
                type: t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
                category: t.category.name,
                wallet: t.wallet.name,
                description: t.description || '-',
                amount: Number(t.amount)
            })),
            summary: {
                totalIncome: transactions
                    .filter((t: any) => t.type === 'INCOME')
                    .reduce((sum: number, t: any) => sum + Number(t.amount), 0),
                totalExpense: transactions
                    .filter((t: any) => t.type === 'EXPENSE')
                    .reduce((sum: number, t: any) => sum + Number(t.amount), 0),
                count: transactions.length
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to export data' },
            { status: 500 }
        )
    }
}
