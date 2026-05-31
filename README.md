# Haiti vs Scotland — Ticket Price Monitor

Live ticket price tracker. Checks multiple sites, shows the lowest price, and emails you when prices drop below your target.

---

## Deploy to Vercel (free, 5 minutes)

### 1. Install Git and Node.js
- Git: https://git-scm.com/download/win
- Node.js: https://nodejs.org (LTS version)

### 2. Push to GitHub
1. Go to https://github.com/new and create a new **private** repo called `ticket-monitor`
2. Open PowerShell in the project folder and run:
```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ticket-monitor.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New Project** → import your `ticket-monitor` repo
3. Click **Deploy** (no settings to change)

### 4. Set up email alerts (optional)
In Vercel → your project → Settings → Environment Variables, add:
- `GMAIL_USER` = your Gmail address
- `GMAIL_PASS` = your Gmail App Password

To get a Gmail App Password:
Google Account → Security → 2-Step Verification → App passwords → create one called "Ticket Monitor"

### 5. Share the URL
Vercel gives you a URL like `https://ticket-monitor-abc123.vercel.app`
Share it with friends — no login needed.

---

## Run locally (for development)

```powershell
npm install
npx playwright install chromium
copy .env.example .env.local
# edit .env.local with your Gmail credentials
npm run dev
```

Then open http://localhost:3000

---

## Adding ticket sites

On the web app, expand "Sites & settings" and paste in the URLs for:
- Vivid Seats
- StubHub
- SeatGeek
- Ticketmaster
- AXS

The scraper handles JavaScript-rendered pages automatically.
