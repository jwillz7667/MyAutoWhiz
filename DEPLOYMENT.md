# MyAutoWhiz Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Railway       │     │   Railway       │
│   (Web App)     │────▶│   (API)         │────▶│   (Worker)      │
│   Next.js 15    │     │   Express       │     │   BullMQ        │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                        ┌────────┴───────────────────────┴────────┐
                        │                                         │
                   ┌────┴────┐                              ┌─────┴─────┐
                   │ Railway │                              │  Upstash  │
                   │ Postgres│                              │   Redis   │
                   └─────────┘                              └───────────┘
```

## Prerequisites

- GitHub account (repo already pushed)
- Vercel account (free tier works)
- Railway account (free tier: $5/month credit)
- Upstash account (free tier: 10k commands/day)
- API Keys:
  - OpenAI API key
  - Google Places API key
  - Stripe account (test mode for development)
  - Resend account (for emails)

---

## Step 1: Database Setup (Railway PostgreSQL)

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Provision PostgreSQL"**
3. Click on the PostgreSQL service → **"Variables"** tab
4. Copy the `DATABASE_URL` value (you'll need this later)

---

## Step 2: Redis Setup (Upstash)

1. Go to [upstash.com](https://upstash.com) and sign in
2. Create a new Redis database
3. Select your region (same as Railway for lower latency)
4. Copy the `UPSTASH_REDIS_REST_URL` - format it as:
   ```
   redis://default:PASSWORD@HOST:PORT
   ```

---

## Step 3: Deploy API to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `jwillz7667/MyAutoWhiz`
4. **IMPORTANT - Monorepo Setup:**
   - **Root Directory**: Leave **EMPTY** (use repo root, not `apps/api`)
   - Go to **Settings** → **Build**
   - Set **Config File Path**: `apps/api/railway.toml`
   - This allows Railway to access the full monorepo for pnpm workspaces

5. Add Environment Variables (Settings → Variables):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Railway PostgreSQL URL |
| `REDIS_URL` | Your Upstash Redis URL |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Generate: `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GOOGLE_PLACES_API_KEY` | Your Google API key |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe |
| `RESEND_API_KEY` | Your Resend API key |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after Vercel deploy) |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

6. After deployment, note your API URL: `https://your-api.up.railway.app`

### Run Database Migrations

In Railway, go to your API service → **"Settings"** → **"Run Command"**:
```bash
npx prisma migrate deploy
```

---

## Step 4: Deploy Worker to Railway

1. In your Railway project, click **"New Service"** → **"GitHub Repo"**
2. Select the same repo `jwillz7667/MyAutoWhiz`
3. **IMPORTANT - Monorepo Setup:**
   - **Root Directory**: Leave **EMPTY** (use repo root)
   - Go to **Settings** → **Build**
   - Set **Config File Path**: `apps/worker/railway.toml`

4. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Same as API |
| `REDIS_URL` | Same as API |
| `RESEND_API_KEY` | Your Resend API key |
| `NODE_ENV` | `production` |

---

## Step 5: Deploy Web App to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import `jwillz7667/MyAutoWhiz`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`

5. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.up.railway.app/api/v1` |

6. Click **Deploy**

---

## Step 6: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-api.up.railway.app/api/v1/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to Railway's `STRIPE_WEBHOOK_SECRET`

---

## Step 7: Update CORS & Frontend URL

Go back to Railway API service and update:
- `FRONTEND_URL` = Your Vercel deployment URL

---

## Environment Variables Summary

### API (Railway)
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
OPENAI_API_KEY=sk-...
GOOGLE_PLACES_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FRONTEND_URL=https://myautowhiz.vercel.app
NODE_ENV=production
PORT=3001
```

### Worker (Railway)
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
RESEND_API_KEY=re_...
NODE_ENV=production
```

### Web (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app/api/v1
```

---

## Monitoring & Logs

- **Vercel**: Dashboard → Project → Deployments → Logs
- **Railway**: Dashboard → Service → Logs
- **Upstash**: Dashboard → Database → Data Browser

---

## Troubleshooting

### API not starting
- Check Railway logs for errors
- Verify DATABASE_URL is correct
- Run `npx prisma migrate deploy` manually

### Worker not processing jobs
- Ensure REDIS_URL is identical between API and Worker
- Check worker logs in Railway

### CORS errors
- Verify FRONTEND_URL in API matches Vercel URL exactly
- Check for trailing slashes

### Database connection issues
- Railway PostgreSQL may need `?sslmode=require` appended to URL

---

## Cost Estimates (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | Hobby (free) | Pro $20/mo |
| Railway | $5 credit | ~$10-20/mo |
| Upstash | 10k/day free | Pay-as-you-go |
| **Total** | **~$5/mo** | **~$30-50/mo** |
