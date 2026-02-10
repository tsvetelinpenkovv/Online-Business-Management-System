# Hostinger CDN Configuration

## Deployment to Hostinger

### Step 1: Build the project
```bash
npm run build
```
This creates the `dist/` folder with optimized, hashed files.

### Step 2: Upload to Hostinger
1. Go to Hostinger hPanel → File Manager
2. Navigate to `public_html`
3. Upload entire contents of `dist/` folder
4. Ensure `index.html` is in the root of `public_html`

## .htaccess Configuration

Create/edit `public_html/.htaccess`:

```apache
# Enable Rewrite Engine for SPA
RewriteEngine On
RewriteBase /

# Don't rewrite files or directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite all other routes to index.html
RewriteRule ^ index.html [QSA,L]

# ===== COMPRESSION =====
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE image/svg+xml
  AddOutputFilterByType DEFLATE application/font-woff
  AddOutputFilterByType DEFLATE application/font-woff2
</IfModule>

# ===== CACHING =====
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML — never cache (always get latest deploy)
  ExpiresByType text/html "access plus 0 seconds"

  # JS & CSS — 1 year (Vite adds content hashes)
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"

  # Images — 1 week
  ExpiresByType image/png "access plus 1 week"
  ExpiresByType image/svg+xml "access plus 1 week"
  ExpiresByType image/x-icon "access plus 1 week"
  ExpiresByType image/jpeg "access plus 1 week"
  ExpiresByType image/webp "access plus 1 week"

  # Fonts — 1 year
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"
  ExpiresByType application/font-woff2 "access plus 1 year"
</IfModule>

# Cache-Control headers for hashed assets
<IfModule mod_headers.c>
  # Hashed assets in /assets/ — immutable cache
  <FilesMatch "\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # HTML — no cache
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>

  # Security headers
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# ===== SECURITY =====
# Block access to sensitive files
<FilesMatch "\.(env|json|lock|md|yml|yaml|toml)$">
  Order allow,deny
  Deny from all
</FilesMatch>

# Block directory listing
Options -Indexes
```

## Hostinger Built-in CDN

1. Go to hPanel → **Performance** → **CDN**
2. Enable Hostinger CDN (included in Business+ plans)
3. This adds edge caching globally via their CDN network

### If using Hostinger CDN:
- Cache is purged automatically on file upload
- You can manually purge at hPanel → CDN → Purge Cache
- The `.htaccess` rules above still apply for browser caching

## Hostinger + Cloudflare (Best Performance)

For maximum performance, combine Hostinger hosting with Cloudflare CDN:

1. Deploy to Hostinger with `.htaccess` above
2. Add domain to Cloudflare (change nameservers)
3. Follow the Cloudflare CDN guide (`cdn-cloudflare.md`)
4. Disable Hostinger CDN to avoid double-proxying

This gives you: Hostinger hosting + Cloudflare's 300+ edge locations + advanced caching rules.

## Performance Checklist
- [x] Gzip/Deflate compression via .htaccess
- [x] Long cache TTL for hashed assets (JS/CSS)
- [x] No cache for HTML (instant deploys)
- [x] SPA routing via RewriteRule
- [x] Security headers
- [x] Font caching
- [x] Image caching
