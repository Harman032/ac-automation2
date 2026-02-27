# CanAccount - Canadian Accountant Automation Software (MVP)

A comprehensive, full-stack automation platform designed specifically for Canadian accountants to streamline their workflow, manage clients, and automate compliance tasks.

## 🚀 Features
- **Client Management**: Track and manage client details, contact info, and tax profiles.
- **Compliance Tracking**: Overview of deadlines, tax returns, and corporate filings.
- **Automated Workflows**: Streamline repetitive accounting tasks.
- **Resilient API Layer**: Zero-downtime offline fallback using LocalStorage if the backend server is temporarily unavailable.

## 💻 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS (v4), React Router
- **Backend**: Node.js, Express.js
- **Database**: MySQL 8+
- **Emails**: Nodemailer for automated email notifications

## 🛠️ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MySQL** (v8 or higher)

### 2. Database Setup
1. Open your MySQL terminal or GUI (like MySQL Workbench).
2. Execute the contents of `schema.sql` located in the root directory.
   - This creates the `canadian_accountant` DB and sets up a default demo user (`admin`/`password`).

### 3. Backend Configuration
1. Navigate to the `backend` folder.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the `backend` folder:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=canadian_accountant

# Real Email Setup (Gmail recommended for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

### 4. Running the Application
1. **Start Backend**: In the `backend` folder, run `npm run dev`.
2. **Start Frontend**: Open the terminal in the root folder, run `npm install` and then `npm run dev` to start the Vite server. 
3. **Login**: Use the credentials `admin` / `password`.

### 5. Troubleshooting "Failed to Fetch"
The app has a **Resilient API Layer**. If the backend server is not running or your DB isn't connected, the frontend will automatically switch to **LocalDB Mode** (storing data in your browser's LocalStorage) so you can still demo all features interactively.
