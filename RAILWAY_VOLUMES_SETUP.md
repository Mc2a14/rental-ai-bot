# Railway Volumes Setup Guide - Step by Step

This guide will help you set up persistent storage for uploaded images using Railway Volumes.

## What You'll Achieve

After completing this setup, uploaded images will persist even when Railway restarts your container. Images will no longer disappear!

---

## Step 1: Access Railway Dashboard

1. Go to **https://railway.app**
2. **Log in** to your Railway account
3. Click on your **rental-ai-bot** project (or the project name you're using)

---

## Step 2: Create a New Volume

**Where to find it - Multiple ways:**

### Option A: Top Menu Bar
1. Look at the **top of the page** - you should see your project name
2. Look for a **"+"** button or **"New"** button in the top right area
3. Click it → Select **"Volume"** from the dropdown

### Option B: Left Sidebar
1. Look at the **left sidebar** of your project
2. You might see a list of services/resources
3. Look for a **"+"** icon or **"Add"** button at the bottom or top of the sidebar
4. Click it → Select **"Volume"**

### Option C: Service Settings
1. Click on your **service** (the one running your app - might be called "rental-ai-bot" or similar)
2. Look for a **"Settings"** tab or **"Storage"** tab
3. Look for **"Volumes"** section
4. Click **"Add Volume"** or **"Create Volume"**

### Option D: Project Settings
1. Click on your **project name** at the top
2. Look for **"Settings"** or **"Resources"** tab
3. Look for **"Volumes"** section
4. Click **"Create Volume"** or **"Add Volume"**

### Still Can't Find It?
- Railway's UI changes frequently
- Try clicking around different tabs: **Settings**, **Resources**, **Storage**
- Look for any button that says **"Add"**, **"Create"**, **"New"**, or has a **"+"** icon
- The volume option might be under **"Resources"** or **"Data"** section

---

## Step 3: Configure the Volume

1. **Volume Name**: Give it a descriptive name like:
   - `image-uploads` or
   - `rental-ai-images` or
   - `uploads-storage`
   
   *(Any name works, just make it memorable)*

2. **Size**: 
   - Start with **1 GB** (you can increase later if needed)
   - This is plenty for hundreds of images

3. Click **"Create"** or **"Add"** to create the volume

---

## Step 4: Mount the Volume to Your Service

1. After creating the volume, you need to **attach it to your service**
2. In your project, find your **service** (the one running your Node.js app)
3. Click on the **service** to open its settings
4. Look for a tab or section called:
   - **"Volumes"** or
   - **"Storage"** or
   - **"Settings"** → **"Volumes"**

5. Click **"Add Volume"** or **"Mount Volume"**

---

## Step 5: Set the Mount Path

This is the **critical step** - you need to mount the volume to the correct directory:

1. In the mount configuration, you'll see two fields:
   - **Volume**: Select the volume you just created (e.g., `image-uploads`)
   - **Mount Path**: Enter the following path:
     ```
     /app/public/uploads
     ```
   
   ⚠️ **IMPORTANT**: The path must be exactly `/app/public/uploads`
   
   This matches where your code saves uploaded images.

2. Click **"Mount"** or **"Save"**

---

## Step 6: Redeploy Your Service

1. After mounting the volume, Railway may automatically redeploy
2. If not, you can manually trigger a redeploy:
   - Go to your service
   - Click **"Deploy"** or **"Redeploy"**
   - Or make a small change (like adding a comment) and push to GitHub

3. Wait for the deployment to complete (usually 1-2 minutes)

---

## Step 7: Verify It's Working

1. **Test the upload**:
   - Go to your admin panel: `https://your-app.up.railway.app/admin`
   - Navigate to Step 3 → "Helpful Images for Guests"
   - Upload a test image (e.g., parking lot photo)
   - Save the configuration

2. **Test the image display**:
   - Go to your guest chat page
   - Ask "Where do I park?"
   - The image should display correctly

3. **Test persistence**:
   - Wait a few minutes
   - Ask the same question again
   - The image should still be there (even if Railway restarted)

---

## Troubleshooting

### Issue: "Volume not found" or "Mount failed"

**Solution**: 
- Make sure you created the volume first (Step 2-3)
- Check that you selected the correct volume name
- Verify the mount path is exactly `/app/public/uploads`

### Issue: Images still disappear after restart

**Solution**:
- Verify the mount path is correct: `/app/public/uploads`
- Check Railway logs to see if there are any errors
- Make sure the volume is actually mounted (check the service settings)

### Issue: "Permission denied" errors

**Solution**:
- Railway should handle permissions automatically
- If you see permission errors, the mount path might be wrong
- Try unmounting and remounting the volume

### Issue: Can't find "Volumes" option

**Solution**:
- Railway's UI may vary
- Look for "Storage", "Persistent Storage", or "Data" sections
- Check the service settings/configuration tabs
- If still not found, Railway might have changed the UI - check their docs

---

## How It Works

- **Before**: Images saved to `/app/public/uploads` → Deleted on restart ❌
- **After**: Images saved to `/app/public/uploads` → Volume persists → Survives restarts ✅

The volume acts like a permanent hard drive attached to your container. Even when Railway restarts your app, the volume (and all images in it) remains intact.

---

## Cost

- Railway Volumes are typically **included in free tier** for small sizes (1-5 GB)
- Check Railway's pricing page for current limits
- 1 GB is usually enough for hundreds of images

---

## Next Steps

Once set up:
1. ✅ Images will persist across restarts
2. ✅ You can upload images without worrying about losing them
3. ✅ Guests will always see the images when the bot references them

**That's it!** Your images are now persistent. 🎉

---

## Need Help?

If you run into issues:
1. Check Railway's logs in the dashboard
2. Verify the mount path is exactly `/app/public/uploads`
3. Make sure the volume is actually attached to your service
4. Try uploading a test image and checking if it persists after a few minutes

