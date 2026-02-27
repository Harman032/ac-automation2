
# CanAccount - Canadian Accountant Automation Software (MVP)

## Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL** (v8+)

### 2. Database Setup
1. Open your MySQL terminal or GUI (like MySQL Workbench).
2. Execute the contents of `schema.sql` located in the root directory.
   - This creates the `canadian_accountant` DB and sets up a demo user (`admin`/`password`).

### 3. Backend Configuration
1. Navigate to the `backend` folder.
2. Run `npm install`.
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
1. **Start Backend**: In the `backend` folder, run `npm run dev` and 'npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss'.
2. **Start Frontend**: Open the root `index.html` in your browser (use a local server like `npx serve` for best results).
3. **Login**: Use `admin` / `password`.

### 5. Troubleshooting "Failed to Fetch"
The app has a **Resilient API Layer**. If the backend server is not running or your DB isn't connected, the app will automatically switch to **LocalDB Mode** (storing data in your browser's LocalStorage) so you can still demo all features.
