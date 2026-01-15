const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
})

async function main() {
    const url = process.env.DATABASE_URL || 'NOT_FOUND';
    console.log('Loaded DATABASE_URL:', url.replace(/:([^:@]+)@/, ':****@')); // Mask password

    console.log('Testing connection...');
    try {
        const count = await prisma.wallet.count();
        console.log(`✅ Connection SUCCESS! Found ${count} wallets.`);
    } catch (e) {
        console.error('❌ Connection FAILED!');
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main()
