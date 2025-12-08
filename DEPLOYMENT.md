# Deployment Guide

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your DeepSeek API key to `.env`:
   ```env
   AI_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Railway Deployment

### Method 1: Railway CLI

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Initialize project:
   ```bash
   railway init
   ```

4. Add environment variables:
   ```bash
   railway variables set AI_API_KEY=your_api_key
   railway variables set NODE_ENV=production
   railway variables set SESSION_SECRET=your_random_secret
   ```

5. Deploy:
   ```bash
   railway up
   ```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard:
   - `AI_API_KEY` - Your DeepSeek API key
   - `NODE_ENV=production`
   - `SESSION_SECRET` - Generate a secure random string
   - `PORT` - Railway will set this automatically
4. Deploy automatically on push

### Environment Variables for Railway

Required:
- `AI_API_KEY` - DeepSeek API key
- `NODE_ENV=production`

Optional:
- `SESSION_SECRET` - Session secret (generate a random string)
- `CORS_ORIGIN` - CORS origin (default: `*`)

## Docker Deployment

### Build
```bash
docker build -t rental-ai-bot .
```

### Run
```bash
docker run -d \
  -p 3000:3000 \
  -e AI_API_KEY=your_api_key \
  -e NODE_ENV=production \
  -e SESSION_SECRET=your_secret \
  --name rental-ai-bot \
  rental-ai-bot
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - AI_API_KEY=${AI_API_KEY}
      - NODE_ENV=production
      - SESSION_SECRET=${SESSION_SECRET}
    volumes:
      - ./data:/app/data
```

Run:
```bash
docker-compose up -d
```

## Health Checks

The application includes a health check endpoint:
- Health: `GET /` (returns 200 if server is running)

## Troubleshooting

### AI Chat Not Working

1. Check `AI_API_KEY` is set correctly
2. Verify API key is valid
3. Check server logs for errors
4. Ensure network connectivity to DeepSeek API

### Data Not Persisting

1. Ensure `data/` directory exists and is writable
2. Check file permissions
3. Verify disk space

### Port Already in Use

Change `PORT` in `.env` or use Railway's automatic port assignment.

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set secure `SESSION_SECRET`
- [ ] Configure `CORS_ORIGIN` appropriately
- [ ] Set `AI_API_KEY`
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Review security headers (Helmet.js is configured)
- [ ] Set up monitoring/logging
- [ ] Backup data directory

