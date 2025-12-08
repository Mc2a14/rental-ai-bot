# Rental AI Bot - Clean Architecture

A modern, full-stack web application for short-term rental hosts with AI-powered guest assistance. Built with Node.js, Express, and vanilla JavaScript using clean architecture principles.

## ✨ Features

- 🤖 **AI-Powered Chat** - Intelligent guest assistance using DeepSeek AI
- 🏠 **Property Management** - Easy setup and configuration for hosts
- 📱 **Mobile-First Design** - Fully responsive, optimized for all devices
- 🌍 **Multi-Language Support** - English, Spanish, and French
- 🎨 **Dark/Light Theme** - User preference-based theming
- 🔒 **Secure Authentication** - User management with secure login
- 📊 **Guest Links** - Shareable property-specific chat links
- 🛠️ **Appliance Instructions** - Detailed appliance help for guests
- 📍 **Local Recommendations** - Host-curated local places
- 🐳 **Docker Support** - Containerized deployment
- 🚄 **Railway Ready** - One-click deployment to Railway

## 🏗️ Architecture

This project follows clean architecture principles:

```
├── config/          # Configuration files
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API route definitions
├── middleware/      # Express middleware
├── utils/           # Utility functions
├── data/            # JSON data storage
└── public/          # Frontend files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- DeepSeek API key (optional for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mc2a14/rental-ai-bot.git
   cd rental-ai-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   AI_API_KEY=your_deepseek_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Guest Chat: http://localhost:3000
   - Admin Portal: http://localhost:3000/admin

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `AI_API_KEY` | DeepSeek API key | Required for AI features |
| `AI_API_URL` | AI API endpoint | `https://api.deepseek.com/v1/chat/completions` |
| `AI_MODEL` | AI model to use | `deepseek-chat` |
| `SESSION_SECRET` | Session secret key | Change in production |
| `CORS_ORIGIN` | CORS allowed origin | `*` |

## 🎯 Usage

### For Hosts

1. **Register/Login**
   - Visit `/admin` to create an account or login
   - Create your property configuration
   - Add appliances, recommendations, and property details
   - Get your shareable guest link

2. **Property Setup**
   - Fill in property information
   - Add contact details
   - Configure check-in/check-out times
   - Add WiFi information
   - Set house rules
   - Add appliance instructions
   - Add local recommendations

### For Guests

1. **Access Guest Chat**
   - Open the guest link provided by the host
   - Start chatting with the AI assistant
   - Ask questions about the property, local area, appliances, etc.

## 🐳 Docker Deployment

### Build the image
```bash
docker build -t rental-ai-bot .
```

### Run the container
```bash
docker run -p 3000:3000 \
  -e AI_API_KEY=your_api_key \
  -e NODE_ENV=production \
  rental-ai-bot
```

## 🚄 Railway Deployment

1. **Connect your repository** to Railway
2. **Add environment variables** in Railway dashboard:
   - `AI_API_KEY`
   - `NODE_ENV=production`
   - `SESSION_SECRET` (generate a secure random string)
3. **Deploy** - Railway will automatically detect and deploy

The `railway.json` file is already configured for optimal deployment.

## 📱 Mobile Optimization

The application is fully optimized for mobile devices:
- Touch-friendly buttons (minimum 44px)
- Responsive design for all screen sizes
- iOS keyboard optimization
- Fast loading and smooth animations
- PWA-ready structure

## 🔧 Development

### Project Structure

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external API calls
- **Routes**: Define API endpoints
- **Middleware**: Error handling, validation, logging
- **Utils**: Helper functions and utilities

### Adding New Features

1. Create service in `services/`
2. Create controller in `controllers/`
3. Add routes in `routes/`
4. Update frontend in `public/`

## 🛡️ Security

- Helmet.js for security headers
- CORS configuration
- Input validation
- Error handling without exposing internals
- Secure session management

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for short-term rental hosts
