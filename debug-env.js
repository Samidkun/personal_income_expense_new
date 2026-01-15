const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('Direct URL:', process.env.DIRECT_URL)

try {
    const prisma = new PrismaClient()
    console.log('Prisma initialized')
} catch (e) {
    console.error('Prisma error:', e)
}
