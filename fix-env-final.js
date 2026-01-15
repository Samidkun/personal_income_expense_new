const fs = require('fs');
const path = require('path');

const envContent = `DATABASE_URL="postgresql://postgres.emphohqdkfaxecxwptna:samidtrackfinance@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.emphohqdkfaxecxwptna:samidtrackfinance@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="samidtrack-finance-secret-key-2024"
AUTH_PASSWORD="03062004"
GEMINI_API_KEY="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"
`;

fs.writeFileSync(path.join(__dirname, '.env'), envContent, { encoding: 'utf8' });
console.log('.env rewritten cleanly.');
