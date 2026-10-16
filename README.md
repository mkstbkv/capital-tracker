# 💰 CapitalTracker (КапиталТрекер)

A premium, full-stack personal finance and cash flow management ecosystem built with **React (TypeScript)**, **Node.js (Express)**, and **PostgreSQL**.

## 👑 Key Features
- **NBKR Live Currency Integration:** Automatically fetches official daily exchange rates directly from the National Bank of the Kyrgyz Republic (NBKR) for real-time multi-currency capital recalculation (KGS, USD, RUB, EUR).
- **Premium Excel Statement Export (.xlsx):** Generates styled financial statements with dynamic auto-fit column sizes, zebra-striping rows, and accurate opening/closing balance reconciliation.
- **Dynamic Financial Widgets:** Real-time metrics calculating Savings Rate, Average Daily Expense, and Top Expense Category based on custom date ranges.
- **Budget Limits Control:** Interactive progress bars with visual indicators (Green/Yellow/Red) and over-budget warnings for specific categories.
- **Interactive Recharts Analytics:** Visualizes multi-month historical trends and category distribution for both income and expenses.
- **Executive UI with Dark Mode:** Adaptive high-end dark theme that persists choices in the local storage.
- **Personalized Categories & Live Search:** Users can create custom isolated expense/income nodes and perform real-time text filtration across the transaction history ledger.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS (v4), Recharts, SheetJS (xlsx-js-style), Axios.
- **Backend:** Node.js, Express, PostgreSQL (pg), xml2js, iconv-lite.
