# Amazon Ads LWA Authentication App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)

A production-ready web application for Amazon Advertising API authentication using Login with Amazon (LWA) OAuth 2.0, with **Neon PostgreSQL** database and **audiences scope** support.

## ✨ Features

- ✅ **Amazon LWA OAuth 2.0** integration with multi-marketplace support
- ✅ **Neon PostgreSQL** database for secure user credential storage
- ✅ **Audiences Scope** - Access to Amazon Advertising audiences data
- ✅ **Dynamic Marketplace Selection** - NA, EU, and FE regions
- ✅ **User-Specific Token Management** - Secure refresh token storage per user
- ✅ **Automatic Token Refresh** - Seamless access token renewal
- ✅ **Amazon Ads API Integration** - Fetch profiles, campaigns, ad groups, keywords, and audiences
- ✅ **Automated Data Sync** - One-click sync of all advertising data
- ✅ **Modern UI** - Clean, responsive frontend with Amazon LWA button
- ✅ **Multi-tenant Architecture** - Support for multiple users/brands

## 📦 Tech Stack

### Backend
- **Node.js** with Express.js
- **Neon PostgreSQL** (serverless PostgreSQL)
- **JWT** for session management
- **Axios** for API requests

### Frontend
- **Vanilla JavaScript** (no framework dependencies)
- **HTML5** & **CSS3**
- **Amazon LWA Button** integration

## 🛠️ Project Structure

```
amazon-ads-lwa-auth/
├── backend/
│   ├── config/
│   │   └── database.js          # Neon PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js    # LWA OAuth logic
│   │   └── adsController.js     # Amazon Ads API calls
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── migrations/
│   │   └── init.js              # Database initialization
│   ├── models/
│   │   └── User.js              # User model with SQL queries
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   └── ads.js               # Ads API routes
│   ├── utils/
│   │   └── amazonAds.js         # Marketplace configuration
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── auth.js              # Authentication client
    │   └── app.js               # Main app logic
    └── index.html
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Neon PostgreSQL account (free tier available)
- Amazon Seller Central Developer account
- Amazon Advertising API access approved

### 1. Clone the Repository

```bash
git clone https://github.com/rakshit782/amazon-ads-lwa-auth.git
cd amazon-ads-lwa-auth
```

### 2. Setup Neon PostgreSQL

1. Sign up at [Neon.tech](https://neon.tech/)
2. Create a new project
3. Copy your connection string (looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname`)
4. Save it for the next step

### 3. Backend Setup

```bash
cd backend
npm install
```

### 4. Environment Configuration

Create `.env` file from the example:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

# Neon PostgreSQL Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/amazon_ads_db?sslmode=require

# Amazon LWA Credentials
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
LWA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
REDIRECT_URI=http://localhost:3000/api/auth/callback

# Amazon Ads API Scopes (includes audiences)
AMAZON_ADS_API_SCOPE=advertising::campaign_management advertising::audiences

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_key_min_32_chars
```

### 5. Database Migration

Run the migration to create the users table:

```bash
npm run migrate
```

You should see:
```
✓ Neon PostgreSQL connected successfully
✓ Users table ready
✓ All migrations completed successfully
```

### 6. Start Backend Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 7. Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Serve the frontend using any local server:

**Option A: Python**
```bash
python -m http.server 5500
```

**Option B: Node.js http-server**
```bash
npx http-server -p 5500
```

**Option C: VS Code Live Server**
- Install Live Server extension
- Right-click `index.html` → Open with Live Server

### 8. Amazon Seller Central Setup

1. Go to [Amazon Seller Central Developer Console](https://developer.amazonservices.com/)
2. Register a new application
3. Add these details:
   - **Application Name**: Your app name
   - **Redirect URI**: `http://localhost:3000/api/auth/callback`
   - **API Scopes**: 
     - `advertising::campaign_management`
     - `advertising::audiences`
4. Copy Client ID and Client Secret to your `.env` file
5. Submit for Amazon Advertising API access (if not already approved)

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/get-auth-url` | Generate LWA authorization URL |
| GET | `/api/auth/callback` | OAuth callback handler |
| POST | `/api/auth/exchange-token` | Exchange auth code for tokens |
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/auth/refresh-token` | Refresh access token |

### Amazon Ads API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ads/profiles` | Fetch advertising profiles |
| GET | `/api/ads/campaigns` | Fetch campaigns |
| GET | `/api/ads/ad-groups` | Fetch ad groups |
| GET | `/api/ads/keywords` | Fetch keywords |
| GET | `/api/ads/audiences` | Fetch audiences (**NEW**) |
| GET | `/api/ads/campaigns/metrics` | Fetch campaign metrics |
| POST | `/api/ads/automate-sync` | Sync all data automatically |

## 🔐 Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  marketplace VARCHAR(10) NOT NULL,
  region VARCHAR(10) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  token_expiry TIMESTAMP,
  profile_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🌐 Supported Marketplaces

| Region | Code | Countries | Endpoint |
|--------|------|-----------|----------|
| **North America** | NA | US, CA, MX | advertising-api.amazon.com |
| **Europe** | EU | UK, DE, FR, IT, ES | advertising-api-eu.amazon.com |
| **Far East** | FE | JP, AU, IN, SG | advertising-api-fe.amazon.com |

## 🔄 OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Amazon LWA
    participant Neon DB

    User->>Frontend: Enter details & select marketplace
    Frontend->>Backend: POST /auth/get-auth-url
    Backend->>Frontend: Return authorization URL
    Frontend->>Amazon LWA: Redirect to LWA
    User->>Amazon LWA: Login & authorize
    Amazon LWA->>Backend: Redirect with auth code
    Backend->>Frontend: Redirect with code
    Frontend->>Backend: POST /auth/exchange-token
    Backend->>Amazon LWA: Exchange code for tokens
    Amazon LWA->>Backend: Return access + refresh tokens
    Backend->>Neon DB: Store user credentials
    Backend->>Frontend: Return JWT token
    Frontend->>User: Show dashboard
```

## 📊 Usage Example

### Fetching Campaigns

```javascript
const response = await fetch('http://localhost:3000/api/ads/campaigns', {
  headers: {
    'Authorization': `Bearer ${yourJwtToken}`
  }
});

const { campaigns } = await response.json();
console.log(campaigns);
```

### Fetching Audiences (NEW)

```javascript
const response = await fetch('http://localhost:3000/api/ads/audiences', {
  headers: {
    'Authorization': `Bearer ${yourJwtToken}`
  }
});

const { audiences } = await response.json();
console.log(audiences);
```

## ⚠️ Troubleshooting

### Database Connection Issues

```bash
# Test Neon connection
psql "postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

### Token Expiry

Tokens are automatically refreshed. If you face issues:
- Check `token_expiry` in database
- Ensure refresh token is valid
- Re-authenticate if refresh token expired

### CORS Issues

Update `FRONTEND_URL` in `.env` to match your frontend URL

## 📦 Deployment

### Backend (Railway/Render/Vercel)

1. Push to GitHub
2. Connect repository
3. Add environment variables
4. Deploy

### Frontend (Vercel/Netlify)

1. Deploy `frontend` folder
2. Update `API_BASE_URL` in `js/auth.js`

### Database

Neon PostgreSQL is already serverless and production-ready!

## 📝 License

MIT License - feel free to use this project for your needs!

## 👤 Author

**Rakshit Vaish**
- GitHub: [@rakshit782](https://github.com/rakshit782)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⭐ Show Your Support

Give a ⭐ if this project helped you!

---

Built with ❤️ for Amazon Advertising automation