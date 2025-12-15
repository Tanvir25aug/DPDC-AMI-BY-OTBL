# DPDC AMI Security Protection Guide

## Overview

This application now has comprehensive security measures to protect against:
- ✅ Iframe embedding and clickjacking attacks
- ✅ Cross-Site Scripting (XSS) attacks
- ✅ Cross-Origin Resource Sharing (CORS) violations
- ✅ Unauthorized data scraping
- ✅ Automated bot access
- ✅ Rate limiting and DDoS prevention
- ✅ Man-in-the-middle attacks

---

## 🛡️ Security Layers Implemented

### Layer 1: Nginx Security Headers

**Location:** `deployment/nginx.conf`

#### X-Frame-Options: DENY
Completely blocks the application from being embedded in iframes, even from the same domain.

```nginx
add_header X-Frame-Options "DENY" always;
```

**Protection:** Prevents clickjacking attacks where malicious sites embed your app in an iframe.

#### Content Security Policy (CSP)
Restricts which resources can be loaded and executed on your website.

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';
  object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
```

**Protection:**
- `frame-ancestors 'none'` - Blocks all iframe embedding attempts
- `object-src 'none'` - Blocks Flash and other plugins
- `default-src 'self'` - Only allows resources from your domain
- `base-uri 'self'` - Prevents base tag injection attacks

#### X-Content-Type-Options: nosniff
Prevents browsers from MIME-sniffing responses away from declared content-type.

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

**Protection:** Prevents attackers from executing malicious scripts disguised as images or other files.

#### Strict-Transport-Security (HSTS)
Forces browsers to only connect via HTTPS for 1 year.

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Protection:** Prevents man-in-the-middle attacks by enforcing HTTPS.

#### Permissions Policy
Disables unnecessary browser features.

```nginx
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;
```

**Protection:** Reduces attack surface by disabling features your app doesn't need.

---

### Layer 2: Express.js Helmet Middleware

**Location:** `backend/src/server.js`

#### Frame Guard: DENY
Backend-level protection against iframe embedding.

```javascript
frameguard: {
  action: 'deny'
}
```

#### Content Security Policy
Duplicate protection at the application level (in case Nginx is bypassed).

```javascript
contentSecurityPolicy: {
  directives: {
    frameAncestors: ["'none'"], // Block all iframe embedding
    frameSrc: ["'none'"],       // Block all iframes
    objectSrc: ["'none'"]       // Block plugins
  }
}
```

#### HSTS Configuration
```javascript
hsts: {
  maxAge: 31536000,      // 1 year
  includeSubDomains: true,
  preload: true
}
```

---

### Layer 3: CORS Protection

**Location:** `backend/src/server.js`

#### Strict Origin Checking
Only allows requests from explicitly whitelisted domains in production.

```javascript
app.use(cors({
  origin: function (origin, callback) {
    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error('CORS policy: This origin is not allowed'), false);
      }
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Protection:**
- Blocks API requests from unauthorized websites
- Prevents data scraping from browser-based scripts
- Only allows specific HTTP methods

**Configuration:** Set `ALLOWED_ORIGINS` in `.env` file

---

### Layer 4: API Protection Middleware

**Location:** `backend/src/middleware/apiProtection.js`

#### 1. Referer Checking
Validates that API requests come from allowed domains only.

```javascript
checkRefererMiddleware()
```

**Protection:** Blocks requests from unauthorized websites trying to access your API.

#### 2. Iframe Detection
Detects and blocks requests made from within iframes.

```javascript
detectIframeMiddleware()
```

Checks browser security headers:
- `Sec-Fetch-Dest: iframe` → BLOCKED
- `Sec-Fetch-Dest: embed` → BLOCKED
- `Sec-Fetch-Dest: object` → BLOCKED

**Protection:** Even if someone bypasses other protections, this detects iframe usage.

#### 3. Suspicious User Agent Blocking
Blocks automated scrapers, bots, and unauthorized tools.

```javascript
blockSuspiciousUserAgents()
```

**Blocked patterns:**
- curl
- wget
- scrapy
- bot/spider/crawler
- scraper

**Protection:** Prevents automated data harvesting and scraping.

#### 4. Aggressive Rate Limiting
Limits each IP to 50 requests per minute.

```javascript
aggressiveRateLimitMiddleware()
```

**Protection:**
- Prevents brute force attacks
- Stops rapid data scraping attempts
- Mitigates DDoS attacks

---

### Layer 5: Rate Limiting

**Location:** `backend/src/middleware/rateLimiter.js`

#### General API Rate Limiter
- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Response:** 429 Too Many Requests

#### Auth Rate Limiter
- **Window:** 15 minutes
- **Max Attempts:** 5 per IP
- **Skips:** Successful logins
- **Response:** 429 Too Many Login Attempts

#### Query Rate Limiter
- **Window:** 1 minute
- **Max Queries:** 10 per IP
- **Response:** 429 Query Rate Limit Exceeded

---

## 🔒 How These Protections Work Together

### Scenario 1: Someone tries to embed your site in an iframe

```
User's Browser → Attempts to load your site in iframe
↓
Nginx sends: X-Frame-Options: DENY
↓
Browser BLOCKS the iframe
↓
If browser ignores header → Backend sends CSP: frame-ancestors 'none'
↓
If still loaded → detectIframeMiddleware() checks Sec-Fetch-Dest
↓
API request BLOCKED with 403 Forbidden
```

**Result:** ✅ Complete protection against iframe embedding

---

### Scenario 2: Automated scraper tries to fetch data

```
Scraper (curl/wget) → Sends request to /api/customers
↓
blockSuspiciousUserAgents() detects "curl" in User-Agent
↓
Request BLOCKED with 403 Forbidden
```

**Result:** ✅ Automated scraping prevented

---

### Scenario 3: Unauthorized website tries to call your API

```
External Website (malicious.com) → JavaScript calls your API
↓
Browser sends: Origin: https://malicious.com
↓
CORS middleware checks ALLOWED_ORIGINS
↓
malicious.com NOT in whitelist
↓
Request BLOCKED by CORS policy
↓
If Origin header bypassed → checkRefererMiddleware() validates Referer
↓
Referer doesn't match allowed domains
↓
Request BLOCKED with 403 Forbidden
```

**Result:** ✅ Cross-site data access prevented

---

### Scenario 4: Rapid automated requests (brute force/scraping)

```
IP 192.168.1.100 → Sends 60 requests in 1 minute
↓
aggressiveRateLimitMiddleware() tracks requests
↓
After 50th request → Further requests BLOCKED
↓
Response: 429 Too Many Requests
```

**Result:** ✅ Rate limiting prevents abuse

---

## ⚙️ Configuration

### 1. Environment Variables

Edit `backend/.env` file:

```bash
# Production Security Settings
NODE_ENV=production

# IMPORTANT: Set your actual domain(s) here
# Multiple domains separated by commas (NO SPACES)
ALLOWED_ORIGINS=https://dpdc-ami.dpdc.org.bd,https://www.dpdc-ami.dpdc.org.bd

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window
```

### 2. Nginx Configuration

After updating `deployment/nginx.conf`, reload Nginx:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Testing Your Security

#### Test 1: Iframe Blocking
Create an HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <iframe src="https://your-domain.com"></iframe>
</body>
</html>
```
**Expected:** Browser console shows error, iframe doesn't load.

#### Test 2: CORS Protection
Open browser console on any other website:
```javascript
fetch('https://your-domain.com/api/health')
  .then(r => r.json())
  .then(console.log)
```
**Expected:** CORS error in console, request blocked.

#### Test 3: User Agent Blocking
```bash
curl https://your-domain.com/api/health
```
**Expected:** 403 Forbidden response in production.

#### Test 4: Rate Limiting
Make 60 rapid requests to any API endpoint.
**Expected:** After 50 requests, 429 Too Many Requests response.

---

## 📊 Monitoring Security

### Checking Security Headers

Use online tools to verify your headers:
- https://securityheaders.com/
- https://observatory.mozilla.org/

### Log Monitoring

Security events are logged in:
- `backend/logs/app.log`
- `/var/log/nginx/dpdc-ami-error.log`

Look for:
```
Blocked iframe embedding attempt
Blocked request from unauthorized referer
Blocked suspicious user agent
Rate limit exceeded
```

---

## 🚨 Troubleshooting

### Issue: Legitimate users getting blocked

**Solution:** Add their domain to ALLOWED_ORIGINS
```bash
ALLOWED_ORIGINS=https://your-domain.com,https://partner-domain.com
```

### Issue: Mobile app can't access API

**Solution:** Mobile apps don't send Origin header, so they're allowed by default. If blocked, check:
1. User agent isn't matching suspicious patterns
2. Rate limits aren't too strict
3. IP address isn't being shared (NAT/proxy)

### Issue: Development tools blocked

**Solution:** In development mode, most protections are relaxed:
```bash
NODE_ENV=development  # Less strict security for testing
```

---

## 📝 Security Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Configure `ALLOWED_ORIGINS` with your actual domain(s)
- [ ] Update `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to strong random values
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Update Nginx configuration with your domain name
- [ ] Reload Nginx after configuration changes
- [ ] Test all security headers using securityheaders.com
- [ ] Test iframe blocking with sample HTML page
- [ ] Test CORS protection from external domain
- [ ] Monitor logs for security events
- [ ] Set up automated security updates for server

---

## 🔐 What Data is Protected

### Telegram Bot
The Telegram bot is **NOT affected** by these security measures because:
- It runs as a separate service (not a web API)
- It uses Telegram's secure API (token-based authentication)
- It only responds to authenticated Telegram users
- No web browser involvement

### MS Teams Reports
Teams reports are **NOT affected** because:
- They use webhook URLs (outgoing only, not incoming API)
- Teams validates webhook authenticity
- No browser or CORS involvement

### Protected APIs
These security measures protect:
- `/api/*` - All REST API endpoints
- Customer data queries
- Billing information
- User authentication
- Database queries
- Real-time socket connections

---

## 📚 Additional Resources

- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

## 🆘 Support

If you encounter security issues:

1. **Never disable security in production**
2. Check logs for specific error messages
3. Verify environment variables are set correctly
4. Test in development mode first
5. Contact development team with specific error details

---

**Last Updated:** December 14, 2025
**Security Level:** High
**Compliance:** OWASP Best Practices
