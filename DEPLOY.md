# TalentIQ — Deployment Guide

## Architecture

```
┌──────────────────┐        ┌──────────────────────────┐
│   Vercel         │ ──────▶│   Railway / Render       │
│   Next.js 15     │  HTTPS │   FastAPI (Gunicorn)      │
│   (Frontend)     │        │   (Backend)               │
└──────────────────┘        └──────────┬───────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
               ┌──────────▼──────────┐  ┌──────────▼──────────┐
               │   Supabase          │  │   Upstash Redis      │
               │   PostgreSQL        │  │   (Celery broker)    │
               └─────────────────────┘  └─────────────────────┘
```

---

## Option A — Vercel (Frontend) + Railway (Backend) ← Recommended

### Step 1: Deploy the Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo**
2. Select `talent-IQ-master` → set **Root Directory** to `backend`
3. Railway auto-detects the `Dockerfile` — no extra config needed
4. Add these **environment variables** in Railway Settings → Variables:

```env
APP_ENV=production
DATABASE_URL=postgresql+psycopg_async://USER:PASS@HOST:5432/DB
REDIS_URL=rediss://...             # Upstash Redis URL (TLS)
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
CLERK_JWT_ISSUER=https://YOUR-CLERK-INSTANCE.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_...
ALLOW_INSECURE_JWT_DECODE=false
ALLOWED_ORIGINS=https://YOUR-APP.vercel.app
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=google/gemma-4-31b-it:free
STREAM_API_KEY=...
STREAM_API_SECRET=...
PISTON_URL=                        # Leave blank to disable code execution
```

5. Note your Railway backend URL: `https://YOUR-BACKEND.railway.app`

---

### Step 2: Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `talent-IQ-master` → set **Root Directory** to `frontend`
3. Framework preset: **Next.js** (auto-detected)
4. Add these **environment variables** in Vercel Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.railway.app/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STREAM_API_KEY=...
```

5. Click **Deploy**

---

### Step 3: Configure Clerk for Production

1. Clerk Dashboard → **Domains** → Add your Vercel URL (`https://YOUR-APP.vercel.app`)
2. Clerk Dashboard → **Webhooks** → Add endpoint:
   - URL: `https://YOUR-BACKEND.railway.app/v1/auth/webhook`
   - Events: `user.created`, `user.updated`, `user.deleted`
3. Copy the **Signing Secret** → set `CLERK_WEBHOOK_SECRET` in Railway

---

### Step 4: Get the Clerk JWT Public Key

1. Clerk Dashboard → **API Keys** → scroll to **"Advanced" → "JWT public key"**
2. Click **Copy** — it starts with `-----BEGIN PUBLIC KEY-----`
3. Set it as `CLERK_JWT_PUBLIC_KEY` in Railway (paste the full multi-line key)

---

## Option B — Full Docker on a VPS (DigitalOcean / Hetzner)

### Prerequisites
- VPS with Docker + Docker Compose installed
- Domain pointed at the VPS IP
- SSL via Nginx + Certbot (or Caddy)

### Deploy

```bash
# 1. Clone repo on VPS
git clone https://github.com/yashu1412/TalentIQ.git
cd TalentIQ

# 2. Set up backend env
cp backend/.env.example backend/.env
nano backend/.env   # fill in all values, set APP_ENV=production

# 3. Set up frontend env
cp frontend/.env.example frontend/.env.local
nano frontend/.env.local   # set NEXT_PUBLIC_API_URL to your backend domain

# 4. Deploy with production overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 5. Verify
curl https://api.yourdomain.com/health
```

### Nginx Config (reverse proxy)

```nginx
# /etc/nginx/sites-available/talentiq-api
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support (AI Copilot streaming)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        chunked_transfer_encoding on;
    }
}

server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

---

## Verification Checklist

After deploying, verify each of these:

| Check | Command / URL |
|---|---|
| Backend health | `curl https://YOUR-BACKEND/health` → `{"status":"healthy"}` |
| API docs | Visit `https://YOUR-BACKEND/docs` |
| Frontend loads | Visit `https://YOUR-APP.vercel.app` |
| Auth works | Sign in with Clerk → lands on dashboard |
| Resume upload | Upload PDF → ATS score appears |
| AI Copilot | Send message → response streams in real-time |
| CORS check | No `Access-Control-Allow-Origin` errors in browser console |

---

## Environment Variables Reference

### Backend (Required for Production)

| Variable | Description | Example |
|---|---|---|
| `APP_ENV` | Set to `production` | `production` |
| `DATABASE_URL` | Async Postgres URL | `postgresql+psycopg_async://...` |
| `REDIS_URL` | Redis connection URL | `redis://...` or `rediss://...` |
| `CLERK_SECRET_KEY` | Clerk server-side key | `sk_live_...` |
| `CLERK_JWT_PUBLIC_KEY` | PEM public key for JWT verification | `-----BEGIN PUBLIC KEY-----\n...` |
| `CLERK_JWT_ISSUER` | Your Clerk instance URL | `https://xxx.clerk.accounts.dev` |
| `CLERK_WEBHOOK_SECRET` | Svix webhook signing secret | `whsec_...` |
| `ALLOW_INSECURE_JWT_DECODE` | **Must be `false` in production** | `false` |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs | `https://app.vercel.app` |
| `OPENROUTER_API_KEY` | OpenRouter LLM API key | `sk-or-v1-...` |
| `STREAM_API_KEY` | Stream.io key | `8cvqb8rt299p` |
| `STREAM_API_SECRET` | Stream.io secret | `4ggxcge3ccg...` |

### Frontend (Required for Production)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full backend URL including `/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_STREAM_API_KEY` | Stream.io public key |
