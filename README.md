# NavTrade

A full-stack trading journal for logging trades and tracking real performance which includes the win rate, profit factor, drawdown, and streaks, calculated from your actual trade history.

**Live app:** [nav-trade.vercel.app](https://nav-trade.vercel.app)
**API:** [navtrade-production.up.railway.app](https://navtrade-production.up.railway.app)

---

## Features

- Signup/login with JWT auth and Argon2 password hashing
- Log, edit, and delete trades (ticker, entry/exit price, size, direction, date, notes)
- Dashboard: total P&L, win rate, profit factor, avg win/loss, best/worst trade
- Equity curve, max drawdown, and streak tracking
- P&L breakdown by symbol
- Calendar view with daily P&L
- Editable profile with configurable starting balance

---

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL (via Supabase), JWT + Argon2 auth
**Frontend:** React (Vite), Tailwind CSS, Recharts
**Deployment:** Railway (backend), Vercel (frontend)

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Create an account |
| POST | `/auth/login` | No | Log in |
| GET / POST | `/trades` | Yes | List or create trades |
| PUT / DELETE | `/trades/{id}` | Yes | Edit or delete a trade |
| GET | `/stats` | Yes | Performance stats |
| GET / PUT | `/users/me` | Yes | View or update profile |

---

## Running Locally

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Add a `.env` file with `DATABASE_URL` and `SECRET_KEY`.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Known Limitations / Features to be added

- No password reset flow (needs email infrastructure)
- No refresh tokens — JWT expires after 24h
- No rate limiting on login
- No profile picture upload
