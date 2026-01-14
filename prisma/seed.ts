import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
    // Income categories
    { name: 'Gaji', icon: '💼', color: '#10B981', type: 'INCOME', isDefault: true },
    { name: 'Freelance', icon: '💻', color: '#3B82F6', isDefault: true, type: 'INCOME' },
    { name: 'Investasi', icon: '📈', color: '#8B5CF6', type: 'INCOME', isDefault: true },
    { name: 'Hadiah', icon: '🎁', color: '#EC4899', type: 'INCOME', isDefault: true },
    { name: 'Lainnya', icon: '💰', color: '#6B7280', type: 'INCOME', isDefault: true },

    // Expense categories
    { name: 'Makanan', icon: '🍔', color: '#F59E0B', type: 'EXPENSE', isDefault: true },
    { name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'EXPENSE', isDefault: true },
    { name: 'Belanja', icon: '🛒', color: '#EC4899', type: 'EXPENSE', isDefault: true },
    { name: 'Hiburan', icon: '🎮', color: '#8B5CF6', type: 'EXPENSE', isDefault: true },
    { name: 'Tagihan', icon: '📄', color: '#EF4444', type: 'EXPENSE', isDefault: true },
    { name: 'Kesehatan', icon: '🏥', color: '#10B981', type: 'EXPENSE', isDefault: true },
    { name: 'Pendidikan', icon: '📚', color: '#6366F1', type: 'EXPENSE', isDefault: true },
    { name: 'Rumah', icon: '🏠', color: '#14B8A6', type: 'EXPENSE', isDefault: true },
    { name: 'Lainnya', icon: '📦', color: '#6B7280', type: 'EXPENSE', isDefault: true },
]

const defaultWallets = [
    { name: 'Cash', type: 'CASH', balance: 0, color: '#10B981', icon: '💵', currency: 'IDR' },
    { name: 'Bank BCA', type: 'BANK', balance: 0, color: '#3B82F6', icon: '🏦', currency: 'IDR' },
    { name: 'GoPay', type: 'EWALLET', balance: 0, color: '#00AED6', icon: '📱', currency: 'IDR' },
]

async function main() {
    console.log('🌱 Seeding database...')

    // Create categories
    console.log('Creating categories...')
    for (const category of defaultCategories) {
        await prisma.category.upsert({
            where: {
                id: `default-${category.type.toLowerCase()}-${category.name.toLowerCase().replace(/\s+/g, '-')}`
            },
            update: {},
            create: {
                id: `default-${category.type.toLowerCase()}-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
                ...category,
                type: category.type as 'INCOME' | 'EXPENSE'
            }
        })
    }
    console.log(`✅ Created ${defaultCategories.length} categories`)

    // Create wallets
    console.log('Creating wallets...')
    for (const wallet of defaultWallets) {
        await prisma.wallet.upsert({
            where: {
                id: `default-${wallet.type.toLowerCase()}-${wallet.name.toLowerCase().replace(/\s+/g, '-')}`
            },
            update: {},
            create: {
                id: `default-${wallet.type.toLowerCase()}-${wallet.name.toLowerCase().replace(/\s+/g, '-')}`,
                ...wallet,
                type: wallet.type as 'CASH' | 'BANK' | 'EWALLET'
            }
        })
    }
    console.log(`✅ Created ${defaultWallets.length} wallets`)

    console.log('🎉 Seeding completed!')
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
