import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

export async function POST(request: Request) {
    try {
        const { chatId } = await request.json()

        if (!chatId) {
            return NextResponse.json(
                { success: false, error: 'Chat ID is required' },
                { status: 400 }
            )
        }

        const success = await sendTelegramMessage(chatId, `<b>🔔 Tes Notifikasi Berhasil!</b>

Halo! 👋
Ini adalah pesan tes dari <i>SamidTrackFinance</i>.

<b>Status:</b> ✅ Terhubung
<b>Waktu:</b> ${new Date().toLocaleTimeString('id-ID')}

Bot ini siap mengirim laporangan keuanganmu! 🚀`)

        if (success) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to send message via Telegram API' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Test Telegram Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
