# 🌐 Custom Domain Setup Guide

## Step 1: Buy a Domain (5 minutes)

### Recommended Domain Registrars:
1. **Namecheap** (https://www.namecheap.com) - $10-15/year
2. **Google Domains** (https://domains.google) - $12/year
3. **Cloudflare** (https://www.cloudflare.com/products/registrar) - $8-10/year (cheapest)
4. **GoDaddy** (https://www.godaddy.com) - $12-15/year

### What to Look For:
- ✅ **.com** domain (most professional)
- ✅ **.app** or **.io** (modern, tech-friendly)
- ✅ **.net** or **.org** (alternative options)

### Domain Name Ideas:
- `yourname-ai.com`
- `rentalai.com`
- `yourname-rental.com`
- `propertyai.com`

**Example:** If your name is "John", you might get `john-rental-ai.com`

---

## Step 2: Connect Domain to Railway (10 minutes)

### In Railway Dashboard:

1. **Go to your project** → Click on your service
2. **Click "Settings"** tab
3. **Scroll to "Domains"** section
4. **Click "Generate Domain"** or **"Add Custom Domain"**
5. **Enter your domain** (e.g., `yourname-rental-ai.com`)
6. **Railway will show you DNS records** to add

---

## Step 3: Update DNS Records (5-10 minutes)

### Go to Your Domain Registrar:

1. **Log into your domain registrar** (Namecheap, Google, etc.)
2. **Find "DNS Management"** or **"DNS Settings"**
3. **Add the DNS records Railway provided:**

#### Typical Records Railway Needs:

**Type A Record:**
```
Name: @ (or leave blank)
Type: A
Value: [Railway's IP address]
TTL: 300 (or Auto)
```

**Type CNAME Record (for www):**
```
Name: www
Type: CNAME
Value: [Railway's domain] (e.g., your-app.up.railway.app)
TTL: 300 (or Auto)
```

### Example:
If Railway tells you to add:
- **A Record**: `@` → `35.123.45.67`
- **CNAME**: `www` → `your-app.up.railway.app`

Add exactly those in your domain registrar's DNS settings.

---

## Step 4: Wait for DNS Propagation (5 minutes - 48 hours)

- **Usually takes 5-30 minutes**
- **Can take up to 48 hours** (rare)
- **Check status in Railway dashboard**

### How to Check:
1. Go to Railway → Settings → Domains
2. Railway will show "Pending" or "Active"
3. When it says "Active", you're done!

---

## Step 5: Update Your App (If Needed)

### Update CORS Settings (if you have specific origins):

In `config/config.js`, update:
```javascript
corsOrigin: process.env.CORS_ORIGIN || 'https://yourname-rental-ai.com'
```

### Update Environment Variables in Railway:

1. Go to Railway → Your Service → Variables
2. Add/Update:
   ```
   CORS_ORIGIN=https://yourname-rental-ai.com
   ```

---

## Step 6: Test Your Domain

1. **Wait for DNS to propagate** (check Railway dashboard)
2. **Visit your domain**: `https://yourname-rental-ai.com`
3. **Test all features**:
   - Guest chat
   - Admin login
   - Property creation
   - Analytics

---

## Troubleshooting

### Domain Not Working?

1. **Check DNS propagation:**
   - Use https://dnschecker.org
   - Enter your domain
   - Check if records are propagated globally

2. **Check Railway logs:**
   - Railway → Deployments → View logs
   - Look for domain-related errors

3. **Verify DNS records:**
   - Make sure you added the exact records Railway provided
   - Check for typos

4. **Wait longer:**
   - DNS can take up to 48 hours (rare)
   - Usually works within 30 minutes

### SSL Certificate Issues?

- Railway automatically provides SSL certificates
- If you see SSL errors, wait 5-10 minutes after DNS propagates
- Railway needs time to issue the certificate

---

## Cost Breakdown

- **Domain**: $8-15/year
- **Railway**: Already included (no extra cost for custom domain)
- **SSL Certificate**: Free (Railway provides automatically)

**Total: ~$10-15/year** (just the domain)

---

## Quick Checklist

- [ ] Buy domain from registrar
- [ ] Add domain in Railway dashboard
- [ ] Copy DNS records from Railway
- [ ] Add DNS records in domain registrar
- [ ] Wait for DNS propagation (5-30 min)
- [ ] Update CORS settings (if needed)
- [ ] Test domain in browser
- [ ] Update any hardcoded URLs (if any)

---

## Need Help?

If you get stuck:
1. Check Railway's documentation: https://docs.railway.app
2. Check your domain registrar's DNS help docs
3. Ask me! I can help troubleshoot

---

## Example: Complete Setup

**Domain:** `rental-ai-bot.com`

1. Buy from Namecheap: $12/year
2. In Railway: Add `rental-ai-bot.com`
3. Railway shows: 
   - A Record: `@` → `35.123.45.67`
   - CNAME: `www` → `rental-ai-bot-production.up.railway.app`
4. In Namecheap DNS:
   - Add A record: `@` → `35.123.45.67`
   - Add CNAME: `www` → `rental-ai-bot-production.up.railway.app`
5. Wait 10 minutes
6. Visit: `https://rental-ai-bot.com` ✅

Done! 🎉

