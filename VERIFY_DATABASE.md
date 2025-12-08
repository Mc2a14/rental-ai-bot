# Verify PostgreSQL Database Setup

## Step 1: Check Railway Logs

1. Go to Railway dashboard
2. Click on your **app service** (not the PostgreSQL service)
3. Go to **"Deployments"** tab
4. Click on the latest deployment
5. Click **"View Logs"**

### Look for these messages:

✅ **Success messages:**
```
✅ Database connected successfully
✅ Database schema initialized
```

❌ **If you see these, database is NOT connected:**
```
📁 Using file-based storage (no database)
⚠️ Database connection failed, using file-based storage
```

## Step 2: Test Creating a Property

1. Go to your Railway app URL: `https://rental-ai-bot-production.up.railway.app/admin`
2. Log in or create a new user
3. Create a new property
4. Save the configuration
5. Copy the guest link

## Step 3: Test the Guest Link

1. Open the guest link in a new incognito/private window
2. The property should load correctly
3. Ask a question - it should answer with the correct property information

## Step 4: Verify Data Persists

1. Wait a few minutes
2. Refresh the guest link
3. The property should still be there (not showing "Property Not Found")
4. This confirms data is persisting in the database

## Step 5: Check Database Directly (Optional)

If you want to verify data is in the database:

1. In Railway, click on your **PostgreSQL service**
2. Go to **"Data"** tab
3. You can run SQL queries to see your data:

```sql
-- See all properties
SELECT property_id, name, user_id, created_at FROM properties;

-- See all users
SELECT user_id, username, created_at FROM users;

-- Count properties
SELECT COUNT(*) FROM properties;
```

## Troubleshooting

**If properties still disappear:**
- Check Railway logs for database connection errors
- Verify `DATABASE_URL` is set in your app's environment variables
- Make sure PostgreSQL service is running (green status)

**If you see "Property Not Found":**
- Check if the property was actually saved (check logs)
- Verify database connection is working
- Try creating a new property after confirming database is connected

