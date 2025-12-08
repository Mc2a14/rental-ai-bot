# Setup Guide for MacBook Air

## Step-by-Step Instructions

### 1. Install Node.js (if not already installed)

**Check if Node.js is installed:**
```bash
node --version
```

If you see a version number, skip to step 2.

**If not installed, choose one method:**

#### Method A: Download from Website (Easiest)
1. Go to https://nodejs.org/
2. Click "Download" (LTS version recommended)
3. Open the downloaded `.pkg` file
4. Follow the installation wizard
5. **Restart Terminal** after installation

#### Method B: Using Homebrew (if you have it)
```bash
brew install node
```

### 2. Open Terminal

- Press `Cmd + Space` (Command + Spacebar)
- Type "Terminal"
- Press Enter

### 3. Navigate to Your Project

In Terminal, type:
```bash
cd ~/Desktop/rental-ai-bot-1
```

Press Enter. You should see the prompt change to show you're in that directory.

### 4. Install Dependencies

Type:
```bash
npm install
```

Press Enter. This will take a minute or two. You'll see lots of text scrolling by - that's normal!

### 5. Create Environment File

```bash
cp .env.example .env
```

### 6. Edit the .env File

You can edit it in Terminal with:
```bash
nano .env
```

Or open it in TextEdit:
```bash
open -a TextEdit .env
```

Add your DeepSeek API key:
```
AI_API_KEY=your_api_key_here
```

Save and close.

### 7. Start the Server

```bash
npm start
```

You should see:
```
🚀 Server running on port 3000
```

### 8. Open in Browser

Open Safari or Chrome and go to:
```
http://localhost:3000
```

## Troubleshooting

### "command not found: node"
- Node.js is not installed
- Follow Step 1 above

### "command not found: npm"
- Node.js installation didn't complete
- Reinstall Node.js from nodejs.org

### "Permission denied"
- Try: `sudo npm install` (enter your Mac password)

### Port 3000 already in use
- Change PORT in .env to 3001
- Or stop the other application using port 3000

## Quick Commands Reference

```bash
# Navigate to project
cd ~/Desktop/rental-ai-bot-1

# Install dependencies
npm install

# Start server
npm start

# Start with auto-reload (development)
npm run dev

# Stop server
Press Ctrl + C
```

## Need Help?

If you get stuck, check:
1. Node.js is installed: `node --version`
2. You're in the right directory: `pwd` (should show rental-ai-bot-1)
3. Dependencies installed: `ls node_modules` (should show folders)

