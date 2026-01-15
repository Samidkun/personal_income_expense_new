# 💰 SamidTrackFinance

**SamidTrackFinance** is a modern, personal finance management application built to help users track expenses, income, and budgets with the power of **Artificial Intelligence** and **Real-time Notifications**.

Built with love using **Next.js 14** (App Router), **Prisma**, **PostgreSQL**, and styled with **Vanilla CSS Modules** for maximum performance.

---

## 🚀 Key Features

### 📊 Dashboard & Analytics
- **Real-time Overview:** Instant view of total balance, income, and expenses.
- **Interactive Charts:** Visual breakdown of spending habits by category.
- **Optimized Performance:** Uses **SWR** for instant navigation without loading spinners.

### 💸 Transaction Management
- **Multi-Wallet:** Manage Cash, Bank Accounts, and E-Wallets.
- **Categories & Tags:** Organize transactions with custom icons and colors.
- **Attachments:** Upload receipts or invoices for record-keeping.
- **Filter & Search:** Easily find past transactions with advanced filtering.

### 🤖 AI Utilities (Artificial Intelligence)
- **Smart Categorization:** Automatically suggests categories for new transactions.
- **AI Insights:**
  - **📝 Ringkasan:** Get a formal executive summary of your finances.
  - **💡 Saran:** Receives actionable tips to save money.
  - **🔥 Roasting:** Have the AI roast your bad spending habits.
  - **🔮 Ramalan:** Predict future expenses based on historical data.

### 🔔 Smart Notifications (Telegram Integration)
- **Free & Unlimited:** Uses Telegram Bot API for reliable, free alerts.
- **Budget Watchdog:** Automatically sends alerts when a category budget exceeds **80%** or **100%**.
- **Real-time Pushing:** No need to open the app to know if you're overspending.

### 📱 Mobile-First Design
- **Hybrid Navigation:** Bottom bar for quick access + Sidebar Drawer for full menu.
- **Responsive Layout:** Optimized for all screen sizes (Desktop, Tablet, Mobile).

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase/Neon)
- **ORM:** Prisma
- **Styling:** CSS Modules (Vanilla)
- **Data Fetching:** SWR (Stale-While-Revalidate)
- **AI Provider:** OpenRouter / Google Gemini
- **Notifications:** Telegram Bot API

---

## ⚙️ Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/personal_income_expense.git
cd personal_income_expense
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variable Setup
Create a `.env` file in the root directory and configure the following:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/db"
DIRECT_URL="postgresql://user:password@host:port/db?pgbouncer=true"

# Authentication (Simple)
JWT_SECRET="your-super-secret-key"

# AI Integration
GEMINI_API_KEY="your-openrouter-or-gemini-key"

# Telegram Integration (Get from @BotFather)
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🤖 How to Setup Telegram Notifications

1.  Open **Telegram** and search for **@BotFather**.
2.  Send `/newbot` to create a new bot.
3.  Copy the **HTTP API Token** provided.
4.  Paste it into your `.env` file as `TELEGRAM_BOT_TOKEN`.
5.  Search for your new bot username and click **Start**.
6.  Open the App > **Settings** > **Integrasi API**.
7.  Verify your integration by sending a test message.
    *   Need your Chat ID? Chat with **@userinfobot** to get it.

---

## 📸 Screenshots

*(Add screenshots of your Dashboard, Mobile View, and Telegram Notifications here)*

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
