export async function sendTelegramMessage(chatId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN is not set')
        return false
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        })

        const data = await response.json()
        if (!data.ok) {
            console.error('Telegram API Error:', data)
            return false
        }
        return true
    } catch (error) {
        console.error('Failed to send Telegram message:', error)
        return false
    }
}
