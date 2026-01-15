const fs = require('fs');
const path = require('path');

// Trying with old password 'samidtrackfinance' first
const password = 'samidtrackfinance';

const envContent = `DATABASE_URL="postgresql://postgres.emphohqdkfaxecxwptna:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.emphohqdkfaxecxwptna:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="samidtrack-finance-secret-key-2024"
AUTH_PASSWORD="03062004"
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent, { encoding: 'utf8' });
console.log('.env updated with new project ID and assumed password.');
