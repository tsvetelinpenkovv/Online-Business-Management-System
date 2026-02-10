# Cloudflare CDN Configuration

## Option A: Cloudflare Pages (Recommended)

1. Push code to GitHub
2. Go to Cloudflare Dashboard → Pages → Create project
3. Connect GitHub repo, set:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `NODE_VERSION` = `18`
4. Deploy — Cloudflare automatically serves from 300+ edge locations

### Cache Rules (auto-applied)
- `dist/assets/*` — immutable, cached 1 year (content hashes)
- `index.html` — revalidated on every request (no-cache)
- `_headers` file is read automatically by Cloudflare Pages

## Option B: Cloudflare CDN Proxy (existing hosting)

1. Add domain to Cloudflare (change nameservers)
2. Enable orange cloud (proxy) on DNS record
3. Go to **Caching → Cache Rules**, create rule:

### Rule 1: Cache static assets aggressively
- **When**: URI Path contains `/assets/`
- **Then**: Cache eligible, Edge TTL = 1 year, Browser TTL = 1 year

### Rule 2: Bypass cache for HTML
- **When**: URI Path equals `/` OR URI Path equals `/index.html`
- **Then**: Bypass cache

### Rule 3: Cache images
- **When**: URI Path matches `*.png` OR `*.svg` OR `*.ico`
- **Then**: Cache eligible, Edge TTL = 7 days

4. Enable **Auto Minify** (JS, CSS, HTML) in Speed → Optimization
5. Enable **Brotli** compression in Speed → Optimization
6. Enable **Early Hints** in Speed → Optimization
7. Enable **HTTP/3 (QUIC)** in Network

## Performance Settings
- **Polish**: Lossless (compress images)
- **Rocket Loader**: OFF (conflicts with Vite modules)
- **Argo Smart Routing**: ON (if on paid plan, reduces latency ~30%)

## Security (recommended)
- SSL/TLS: Full (strict)
- Always Use HTTPS: ON
- HSTS: Enable with 6-month max-age
- Under Attack Mode: OFF (use only during DDoS)

## Page Rules (legacy, if not using Cache Rules)
```
*.yourdomain.com/assets/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
  Browser Cache TTL: 1 year

*.yourdomain.com/
  Cache Level: Bypass
```
