# Railway Deployment Guide

## Getting Your App URL

### Option 1: Deploy to Railway (Recommended)

1. **Sign up/Login to Railway**
   - Go to https://railway.app
   - Sign up with GitHub (easiest)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `rental-ai-bot`

3. **Add Environment Variables**
   In Railway dashboard, go to your project → Variables tab, add:
   ```
   AI_API_KEY=your_openai_api_key_here
   NODE_ENV=production
   SESSION_SECRET=generate_a_random_string_here
   ```

4. **Deploy**
   - Railway will automatically detect your `package.json` and deploy
   - Wait 2-3 minutes for deployment

5. **Get Your URL**
   - After deployment, Railway will give you a URL like:
   - `https://your-app-name.up.railway.app`
   - This is your **public URL** you can share!

6. **Custom Domain (Optional)**
   - In Railway, go to Settings → Domains
   - Add your custom domain if you have one

### Option 2: Use Localhost for Testing

For now, while developing:
- **Local URL**: `http://localhost:3000`
- **Guest Link**: `http://localhost:3000/property/your-property-id`

This only works on your computer. For sharing with others, you need Railway.

## Quick Railway Setup Steps

```bash
# 1. Make sure your code is on GitHub
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. Go to railway.app and connect your GitHub repo
# 3. Add environment variables in Railway dashboard
# 4. Deploy!
```

## Your Guest Links Will Be:

**After Railway Deployment:**
```
https://your-app-name.up.railway.app/property/property_1234567890_abc123
```

**Before Deployment (Local Testing):**
```
http://localhost:3000/property/property_1234567890_abc123
```

## Important Notes

- Railway gives you a free URL automatically
- The URL is public and can be shared
- You can add a custom domain later
- Railway handles HTTPS automatically
- Your app will be accessible 24/7

## Important: Data Persistence

⚠️ **Railway uses an ephemeral filesystem** - data files are lost when the container restarts!

**Current Issue:** Properties are saved but disappear after Railway restarts.

**Solutions:**
1. **Use Railway PostgreSQL** (Recommended)
   - Add PostgreSQL service in Railway
   - Properties will persist in database
   - More reliable for production

2. **Use Railway Volumes** (Alternative)
   - Add a volume in Railway dashboard
   - Mount it to `/app/data` directory
   - Data will persist across restarts

3. **Use External Database** (Best for production)
   - Use Railway PostgreSQL, Supabase, or MongoDB Atlas
   - Most reliable solution

**For now:** Properties work until Railway restarts. Check Railway logs to see when restarts happen.

## Troubleshooting

**Can't find the URL?**
- Check Railway dashboard → Your project → Settings
- Look for "Domains" or "Deployments" tab
- The URL is shown after first successful deployment

**App not working on Railway?**
- Check Railway logs (in dashboard)
- Verify environment variables are set
- Make sure `AI_API_KEY` is correct

**Properties disappearing?**
- This is expected with ephemeral filesystem
- Check Railway logs for restart events
- Consider using PostgreSQL (see Data Persistence above)

