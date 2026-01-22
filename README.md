# 🚀 Amazon Ads Automation Platform

> Multi-tenant Amazon Advertising campaign automation and management platform with real-time data synchronization

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue.svg)](https://neon.tech/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Features

### ✅ Authentication & Authorization
- Email/Password authentication with JWT
- Amazon Login with Amazon (LWA) OAuth integration
- Role-based access control (MASTER, ADMIN, USER)
- Protected routes and API endpoints
- Secure password hashing with bcrypt

### 📊 Dashboard & Analytics
- Real-time campaign performance metrics
- 8 key performance indicators (KPIs)
- Campaign, Ad Group, and Keyword management
- Audience targeting insights
- Custom alerts and notifications

### 🔄 Amazon Ads Integration
- OAuth 2.0 authentication flow
- Automatic token refresh
- Multi-marketplace support (NA, EU, FE)
- Real-time data synchronization
- Campaign metrics and reporting

### 👤 User Management
- Profile customization
- Password management
- Amazon account connection/disconnection
- Account deletion (soft delete)

### 🎨 Modern UI/UX
- Responsive design
- Gradient-based theme
- Tab-based navigation
- Loading states and animations
- Error handling with user feedback

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon)
- **Authentication:** JWT, bcrypt
- **API Integration:** Axios

### Frontend
- **HTML5/CSS3**
- **Vanilla JavaScript**
- **Responsive Design**

### Infrastructure
- **Hosting:** Vercel
- **Database:** Neon PostgreSQL
- **Version Control:** Git/GitHub

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js 18+ installed
PostgreSQL database (Neon account)
Amazon Developer Account
Amazon Advertising API access
```

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

### 3. Environment Setup

Create `.env` file in `backend/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host.region.aws.neon.tech/dbname?sslmode=require

# Amazon LWA (Login with Amazon)
LWA_CLIENT_ID=amzn1.application-oa2-client.YOUR_CLIENT_ID
LWA_CLIENT_SECRET=YOUR_CLIENT_SECRET
REDIRECT_URI=http://localhost:3000/api/auth/callback

# Amazon Ads API Scopes
AMAZON_ADS_API_SCOPE=advertising::campaign_management advertising::audiences

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_random_32_character_secret_key_here
```

### 4. Database Setup

```bash
# Test database connection
npm run test:db

# Run migrations
npm run migrate

# (Optional) Generate mock data for testing
npm run db:mock
```

### 5. Start Development Server

```bash
# Backend
cd backend
npm run dev

# Frontend (in separate terminal)
# Open frontend/login.html in browser or use Live Server
```

### 6. Access Application

```
Frontend: http://localhost:5500/login.html
Backend API: http://localhost:3000
```

## 📁 Project Structure

```
amazon-ads-lwa-auth/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── adsController.js     # Amazon Ads API logic
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── models/
│   │   └── User.js              # User model
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   └── ads.js               # Ads routes
│   ├── utils/
│   │   └── amazonAds.js         # Amazon API helpers
│   ├── migrations/
│   │   └── init.js              # Database schema
│   ├── scripts/
│   │   ├── generate-mock-data.js
│   │   ├── reset-database.js
│   │   └── test-connection.js
│   ├── .env                     # Environment variables
│   ├── server.js                # Express server
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── styles.css           # Global styles
│   ├── js/
│   │   ├── auth.js              # Auth utilities
│   │   ├── dashboard.js         # Dashboard logic
│   │   └── profile.js           # Profile management
│   ├── login.html               # Login/Register page
│   ├── dashboard.html           # Main dashboard
│   ├── profile.html             # User profile
│   ├── index.html               # Amazon OAuth flow
│   └── callback.html            # OAuth callback handler
├── vercel.json                  # Vercel configuration
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # This file
```

## 🔑 Amazon Developer Setup

### 1. Create Login with Amazon (LWA) Application

1. Go to [developer.amazon.com](https://developer.amazon.com)
2. Navigate to **Login with Amazon** → **Create a New Security Profile**
3. Fill in application details:
   - **Name:** Amazon Ads Automation
   - **Description:** Campaign management platform
   - **Privacy Policy URL:** Your website

### 2. Configure Web Settings

**Allowed Origins:**
```
http://localhost:5500
http://localhost:3000
https://your-app.vercel.app
```

**Allowed Return URLs:**
```
http://localhost:3000/api/auth/callback
https://your-app.vercel.app/api/auth/callback
```

### 3. Get Credentials

- **Client ID:** Copy from security profile
- **Client Secret:** Click "Show Secret" and copy
- Add both to your `.env` file

### 4. Apply for Amazon Advertising API Access

1. Go to [advertising.amazon.com](https://advertising.amazon.com)
2. Navigate to **Account Settings → API**
3. Click **Request API Access**
4. Fill out application (approval takes 1-2 business days)

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER',
  marketplace VARCHAR(10),
  region VARCHAR(10),
  refresh_token TEXT,
  access_token TEXT,
  token_expiry TIMESTAMP,
  profile_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES users(id),
  "platformId" VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  state VARCHAR(50),
  budget DECIMAL(10, 2),
  "budgetType" VARCHAR(50),
  "startDate" DATE,
  impressions INTEGER,
  clicks INTEGER,
  spend DECIMAL(10, 2),
  sales DECIMAL(10, 2),
  orders INTEGER,
  acos DECIMAL(5, 2),
  roas DECIMAL(5, 2),
  ctr DECIMAL(5, 2),
  cpc DECIMAL(5, 2),
  "conversionRate" DECIMAL(5, 2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

*See `backend/migrations/init.js` for complete schema*

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register              Register new user
POST   /api/auth/login                 Login user
GET    /api/auth/profile               Get user profile (protected)
PUT    /api/auth/update-profile        Update profile (protected)
PUT    /api/auth/change-password       Change password (protected)
POST   /api/auth/disconnect-amazon     Disconnect Amazon (protected)
DELETE /api/auth/delete-account        Delete account (protected)
```

### Amazon OAuth

```
POST   /api/auth/get-auth-url          Generate Amazon auth URL
GET    /api/auth/callback              OAuth callback handler
POST   /api/auth/exchange-token        Exchange code for tokens
POST   /api/auth/refresh-token         Refresh access token (protected)
```

### Amazon Ads

```
GET    /api/ads/dashboard              Get dashboard data (protected)
GET    /api/ads/campaigns              List campaigns (protected)
GET    /api/ads/ad-groups              List ad groups (protected)
GET    /api/ads/keywords               List keywords (protected)
POST   /api/ads/automate-sync          Sync Amazon data (protected)
```

## 🧪 Testing

### Test Environment Variables
```bash
npm run test:env
```

### Test Database Connection
```bash
npm run test:db
```

### Generate Mock Data
```bash
npm run db:mock
```

### Test API Endpoints

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","marketplace":"NA"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Add Environment Variables

In Vercel Dashboard:
1. Go to **Project Settings → Environment Variables**
2. Add all variables from `.env`
3. Redeploy

### Update Redirect URIs

After deployment, update in Amazon Developer Console:
```
https://your-app.vercel.app/api/auth/callback
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📝 NPM Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run migrate        # Run database migrations
npm run db:reset       # Reset database
npm run db:mock        # Generate mock data
npm run test:db        # Test database connection
npm run test:env       # Verify environment variables
```

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- HTTP-only cookies (recommended for production)
- CORS configured
- Environment variables for secrets
- SQL injection prevention via parameterized queries
- Token refresh mechanism

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Rakshit Vaish**
- GitHub: [@rakshit782](https://github.com/rakshit782)
- Repository: [amazon-ads-lwa-auth](https://github.com/rakshit782/amazon-ads-lwa-auth)

## 🙏 Acknowledgments

- Amazon Advertising API Documentation
- Neon PostgreSQL
- Express.js Community
- Vercel Platform

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review Amazon Advertising API docs

---

**Made with ❤️ for Amazon Sellers**