# 🚀 Amazon Ads Automation Platform

A comprehensive multi-tenant Amazon Advertising automation platform with real-time data sync, campaign management, and performance analytics.

## ✨ Features

### 🔐 Authentication
- Email/Password registration and login
- JWT-based authentication
- Amazon OAuth 2.0 integration
- Secure password hashing with bcrypt

### 📊 Dashboard
- Real-time metrics overview (Impressions, Clicks, Spend, Sales, ACOS, ROAS)
- Campaign performance tracking
- Ad group analytics
- Keyword performance monitoring
- Alert notifications

### 🔄 Data Synchronization
- Automated Amazon Ads API sync
- Real-time campaign data
- Keyword performance metrics
- Ad group statistics
- Automatic token refresh

### 👤 User Management
- Profile management
- Password changes
- Amazon account connection/disconnection
- Account deletion

### 🗄️ Database
- Neon PostgreSQL (serverless)
- Automatic migrations
- Data persistence
- Multi-tenant support

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (Neon)
- JWT Authentication
- Amazon Advertising API
- Axios for HTTP requests

### Frontend
- Vanilla JavaScript
- HTML5/CSS3
- Responsive design
- Modern gradient UI

### Deployment
- Vercel (Frontend + Serverless Functions)
- Neon PostgreSQL (Database)

## 📋 Prerequisites

- Node.js 16+
- Neon PostgreSQL account
- Amazon Seller Central account
- Amazon Advertising API access

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/rakshit782/amazon-ads-lwa-auth.git
cd amazon-ads-lwa-auth
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Migrations
```bash
npm run migrate
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Open Frontend
```
http://localhost:5500/login.html
```

## 📖 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Complete setup instructions
- [Deployment Guide](DEPLOYMENT.md) - Deploy to Vercel
- [API Documentation](docs/API.md) - API endpoints (coming soon)

## 🧪 Testing

```bash
# Test database connection
npm run test:db

# Test environment variables
npm run test:env

# Generate mock data (for testing)
npm run db:mock
```

## 📊 Database Schema

- **users** - User accounts and Amazon tokens
- **campaigns** - Campaign data and metrics
- **ad_groups** - Ad group information
- **keywords** - Keyword performance data
- **alerts** - User notifications
- **accounts** - Multi-tenant account management
- **optimization_rules** - Automation rules (coming soon)

## 🔑 Environment Variables

```env
DATABASE_URL=postgresql://...
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
LWA_CLIENT_SECRET=your_secret
JWT_SECRET=your_jwt_secret
REDIRECT_URI=http://localhost:3000/api/auth/callback
FRONTEND_URL=http://localhost:5500
```

## 🚀 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rakshit782/amazon-ads-lwa-auth)

Or manually:
```bash
vercel --prod
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/get-auth-url` - Get Amazon OAuth URL
- `POST /api/auth/exchange-token` - Exchange OAuth code

### Data
- `GET /api/ads/dashboard` - Dashboard metrics
- `GET /api/ads/campaigns` - List campaigns
- `GET /api/ads/ad-groups` - List ad groups
- `GET /api/ads/keywords` - List keywords
- `GET /api/ads/alerts` - List alerts
- `POST /api/ads/automate-sync` - Sync from Amazon

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Email: support@example.com

## 🙏 Acknowledgments

- Amazon Advertising API
- Neon PostgreSQL
- Vercel Platform

---

**Made with ❤️ for Amazon Sellers**