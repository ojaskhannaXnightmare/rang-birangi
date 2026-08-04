# 🆓 RANG BIRANGI — FREE Hosting Guide

## The Problem with Vercel Free Tier

Vercel Hobby (free) has a **10-second timeout** per serverless function.
When Supabase free tier has cold starts (database sleeps), API calls can
take 10+ seconds → Vercel kills the function → "retry/close" error.

## FREE Alternatives (No Credit Card Required)

### Option 1: Netlify (Recommended — Free, no cold starts)
Netlify gives you 100,000 requests/month free with **26-second timeout**.

1. Go to https://netlify.com → Sign up with GitHub
2. Add new site → Import from GitHub → Select `rang-birangi`
3. Build command: `bun run build` (or `npm run build`)
4. Publish directory: `.next`
5. Add env vars (same as Vercel)
6. Deploy — you get `rangbirangi.netlify.app`

### Option 2: Cloudflare Pages (Best free tier)
Cloudflare gives **unlimited requests** free with no cold starts.

1. Go to https://pages.cloudflare.com → Sign up
2. Create project → Connect GitHub → Select `rang-birangi`
3. Framework: Next.js
4. Build command: `npm run build`
5. Add env vars
6. Deploy — you get `rangbirangi.pages.dev`

**Note**: Cloudflare Pages uses edge workers — no cold starts ever!

### Option 3: Keep Vercel + Warm Up Supabase
If you want to stay on Vercel free tier:

1. Go to Supabase Dashboard → Settings → Database
2. Under "Connection Pooling", enable it
3. Set "Pool Mode" to "Transaction"
4. This reduces cold start time from 5s to <1s

Also, visit your site every 5 minutes to keep it warm:
- Use https://cron-job.org (free) to ping your Vercel URL every 5 min
- This prevents both Vercel AND Supabase from sleeping

### Option 4: Supabase + Vercel + Caching
Add caching headers to API routes so Vercel caches responses:

```typescript
// Add to each API route:
export const revalidate = 60 // Cache for 60 seconds
```

This means even if Supabase is slow, the cached response is served instantly.

## Summary

| Platform | Free? | Timeout | Cold Starts | Best For |
|----------|-------|---------|-------------|----------|
| **Cloudflare Pages** | ✅ | ∞ | ❌ None | Best — unlimited free |
| **Netlify** | ✅ | 26s | ❌ None | Good — easy setup |
| **Vercel Hobby** | ✅ | 10s | ✅ Yes | Testing only |
| **Railway** | $5/mo | 300s | ❌ None | Best paid |
| **Vercel Pro** | $20/mo | 60s | ❌ None | Best DX |

## My Recommendation

**Move to Cloudflare Pages** — it's completely free, has no cold starts,
unlimited requests, and works perfectly with Next.js + Supabase.

OR if you want to stay on Vercel:
1. Enable Supabase connection pooling
2. Use cron-job.org to ping your site every 5 minutes
3. Add `export const revalidate = 60` to API routes
