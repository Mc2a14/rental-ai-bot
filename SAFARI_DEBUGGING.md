# How to View Console Logs in Safari and iPhone

## Safari (Mac)

1. **Enable Developer Menu:**
   - Open Safari
   - Go to **Safari > Settings** (or **Preferences**)
   - Click the **Advanced** tab
   - Check ✅ **"Show Develop menu in menu bar"**

2. **Open Web Inspector:**
   - Open the webpage you want to debug
   - Go to **Develop > Show Web Inspector** (or press `Cmd + Option + I`)
   - Click the **Console** tab to see all console logs

## iPhone Safari

### Method 1: Connect iPhone to Mac (Recommended)

1. **Enable Web Inspector on iPhone:**
   - On your iPhone, go to **Settings > Safari > Advanced**
   - Turn on **"Web Inspector"**

2. **Connect iPhone to Mac:**
   - Connect your iPhone to your Mac with a USB cable
   - On your Mac, open Safari
   - Go to **Develop** menu (after enabling it - see Safari Mac instructions above)
   - You'll see your iPhone listed under the **Develop** menu
   - Hover over your iPhone name
   - You'll see a list of open Safari tabs
   - Click on the webpage you want to debug
   - The Web Inspector will open on your Mac showing the iPhone's console

### Method 2: Use Safari on Mac (Remote Debugging)

If you see "Use for Deployment" in the Develop menu:
- This is for iOS app development, not web debugging
- For web debugging, you need to:
  1. Make sure Web Inspector is enabled on iPhone (Settings > Safari > Advanced)
  2. Connect iPhone to Mac via USB
  3. Open the webpage on iPhone Safari
  4. On Mac Safari, go to Develop > [Your iPhone Name] > [Webpage Name]
  5. The console will open on your Mac

### Troubleshooting iPhone Debugging

**"Use for Deployment" doesn't work for web debugging:**
- That option is for iOS app development
- For web pages, you need to use the method above (Develop > iPhone > Webpage)

**Can't see iPhone in Develop menu:**
- Make sure iPhone is connected via USB
- Make sure Web Inspector is enabled on iPhone (Settings > Safari > Advanced)
- Make sure you have a webpage open in Safari on iPhone
- Try unlocking your iPhone
- Try disconnecting and reconnecting the USB cable

**Console is empty:**
- Make sure you're looking at the correct webpage
- Refresh the page on iPhone
- Check if there are any errors in the Console tab

## Alternative: View Logs in the Page

The app now shows debug information directly on the page when there's an error. Look for a red error box in the chat area with details about:
- Property ID
- Error message
- API URL being called
- Instructions for viewing console logs
