# Railway PostgreSQL Setup Guide

## Why PostgreSQL?

Railway uses an **ephemeral filesystem** - data files are lost when the container restarts. PostgreSQL provides persistent storage that survives restarts.

## Setup Steps

### 1. Add PostgreSQL Service to Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Database"** → **"Add PostgreSQL"**
4. Railway will automatically create a PostgreSQL database

### 2. Get Database Connection String

1. Click on the PostgreSQL service you just created
2. Go to the **"Variables"** tab
3. You'll see `DATABASE_URL` - this is your connection string
4. **Copy this value** - you'll need it in the next step

### 3. Connect Your App to PostgreSQL

1. Go back to your main app service in Railway
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Paste the `DATABASE_URL` from your PostgreSQL service
5. Click **"Add"**

### 4. Redeploy

Railway will automatically detect the new environment variable and redeploy your app. The app will:
- Connect to PostgreSQL on startup
- Create the necessary tables automatically
- Start using the database instead of files

## Verify It's Working

After deployment, check Railway logs. You should see:
```
✅ Database connected successfully
✅ Database schema initialized
```

If you see:
```
📁 Using file-based storage (no database)
```
Then `DATABASE_URL` is not set correctly.

## How It Works

The app automatically:
- **Tries to connect to PostgreSQL** if `DATABASE_URL` is set
- **Falls back to file storage** if database is not available
- **Creates tables automatically** on first connection
- **Migrates data** - new properties/users go to database

## Benefits

✅ **Persistent storage** - data survives restarts  
✅ **Better performance** - faster queries  
✅ **Scalable** - can handle more data  
✅ **Reliable** - no data loss  

## Troubleshooting

**Database not connecting?**
- Check that `DATABASE_URL` is set in your app's variables
- Make sure PostgreSQL service is running in Railway
- Check Railway logs for connection errors

**Tables not created?**
- The app creates tables automatically on first connection
- Check logs for "Database schema initialized" message
- If tables exist, the app will use them

**Still using files?**
- Make sure `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running
- Restart your app service in Railway

