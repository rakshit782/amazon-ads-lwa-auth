# Amazon Ads LWA Authentication & Automation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)

A production-ready, comprehensive Amazon Advertising API automation platform with Login with Amazon (LWA) OAuth 2.0, **Neon PostgreSQL** database integration, and **full campaign management capabilities**.

## ✨ Features

### Authentication & Security
- ✅ **Amazon LWA OAuth 2.0** - Secure authentication with token management
- ✅ **Multi-Marketplace Support** - NA, EU, and FE regions
- ✅ **Automatic Token Refresh** - Seamless access token renewal
- ✅ **JWT Session Management** - Secure user sessions

### Database & Storage
- ✅ **Neon PostgreSQL** - Serverless, autoscaling database
- ✅ **Complete Schema** - Users, Accounts, Campaigns, Ad Groups, Keywords, Alerts, Optimization Rules
- ✅ **User-Specific Data** - Isolated multi-tenant architecture
- ✅ **Automatic Sync** - Real-time data synchronization with Amazon Ads API

### Amazon Ads API Integration
- ✅ **Profiles Management** - Fetch and manage advertising profiles
- ✅ **Campaigns** - Full CRUD operations with metrics tracking
- ✅ **Ad Groups** - Manage ad groups within campaigns
- ✅ **Keywords** - Track keyword performance with match types
- ✅ **Audiences Scope** - Access to Amazon Advertising audiences
- ✅ **Performance Metrics** - Impressions, clicks, spend, sales, ACOS, ROAS, CTR, CPC, CVR

### Automation & Alerts
- ✅ **Optimization Rules** - Create custom automation rules
- ✅ **Alert System** - Real-time notifications for campaign events
- ✅ **Bulk Data Sync** - One-click synchronization of all advertising data
- ✅ **Dashboard Analytics** - Comprehensive metrics and summaries

## 📊 Database Schema

Your Neon database includes 7 comprehensive tables:

### Core Tables

**1. users** - Authentication and user management
- Stores LWA tokens, marketplace, profile ID
- Tracks last sync timestamp

**2. accounts** - Platform account connections
- Multi-platform support (Amazon, Walmart ready)
- Token management per account

**3. campaigns** - Ad campaign data and metrics
- Full campaign details (budget, targeting, dates)
- Performance metrics (impressions, clicks, spend, sales, ACOS, ROAS)
- State management (enabled, paused, archived)

**4. ad_groups** - Ad group organization
- Grouped under campaigns
- Bid management and performance tracking

**5. keywords** - Keyword-level data
- Match type support (exact, phrase, broad)
- Individual keyword performance
- Bid optimization data

**6. alerts** - Notification system
- Campaign alerts and warnings
- User-specific notifications
- Read/unread tracking

**7. optimization_rules** - Automation engine
- Custom rule conditions
- Automated actions
- Execution tracking

## 🛠️ Tech Stack

### Backend
- **Node.js 16+** with Express.js
- **Neon PostgreSQL** (serverless PostgreSQL)
- **JWT** for authentication
- **Axios** for API requests
- **UUID** for unique ID generation

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5 & CSS3** - Modern, responsive design
- **Amazon LWA Button** - Native integration

## 📝 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/get-auth-url` | Generate LWA authorization URL |
| GET | `/callback` | OAuth callback handler |
| POST | `/exchange-token` | Exchange auth code for tokens |
| GET | `/profile` | Get user profile |
| POST | `/refresh-token` | Refresh access token |

### Amazon Ads API (`/api/ads`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard summary with metrics |
| GET | `/profiles` | Fetch and store advertising profiles |
| GET | `/campaigns` | Fetch and store campaigns in DB |
| GET | `/ad-groups` | Fetch and store ad groups in DB |
| GET | `/keywords` | Fetch and store keywords in DB |
| GET | `/audiences` | Fetch audiences (NEW) |
| GET | `/campaigns/metrics` | Get aggregated campaign metrics |
| POST | `/automate-sync` | Comprehensive data sync to database |
| GET | `/alerts` | Get user alerts |
| PUT | `/alerts/:id/read` | Mark alert as read |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/rakshit782/amazon-ads-lwa-auth.git
cd amazon-ads-lwa-auth/backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Neon Database URL (from neon.tech dashboard)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# Amazon LWA Credentials (from Seller Central)
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
LWA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
REDIRECT_URI=http://localhost:3000/api/auth/callback

# Scopes (includes audiences)
AMAZON_ADS_API_SCOPE=advertising::campaign_management advertising::audiences

# JWT Secret (generate random 32+ chars)
JWT_SECRET=your_random_secret_key_here
```

### 3. Start Backend

```bash
# The migration will run automatically when server starts
npm run dev
```

You should see:
```
✓ Neon PostgreSQL connected successfully
Server running on port 3000
```

### 4. Start Frontend

```bash
cd ../frontend
python -m http.server 5500
# OR use Live Server extension in VS Code
```

### 5. Access Application

Open browser: **http://localhost:5500**

## 🔐 Amazon Seller Central Setup

1. Go to [Amazon Seller Central Developer Console](https://developer.amazonservices.com/)
2. Register your application:
   - **Redirect URI**: `http://localhost:3000/api/auth/callback`
   - **API Scopes**:
     - `advertising::campaign_management`
     - `advertising::audiences`
3. Copy Client ID and Secret to `.env`
4. Submit for Amazon Advertising API access approval

## 💾 Database Operations

### Automatic Data Sync Flow

1. **User authenticates** → Tokens stored in `users` table
2. **Fetch profiles** → Stored in `accounts` table
3. **Fetch campaigns** → Stored in `campaigns` table with full details
4. **Fetch ad groups** → Linked to campaigns in `ad_groups`
5. **Fetch keywords** → Linked to campaigns/ad groups in `keywords`
6. **Metrics tracking** → Updated in respective tables

### Example: Auto Sync

```javascript
// POST /api/ads/automate-sync
// Syncs ALL data from Amazon to your database
{
  "success": true,
  "data": {
    "profiles": 3,
    "campaigns": 15,
    "adGroups": 42,
    "keywords": 230
  },
  "lastSync": "2026-01-22T12:30:00Z"
}
```

## 💡 Key Features Explained

### 1. Multi-Tenant Architecture
Each user's data is completely isolated:
- User-specific campaigns, keywords, and metrics
- Separate token management per user
- Individual sync timestamps

### 2. Automatic Token Management
- Tokens automatically refreshed before expiry
- No manual intervention required
- Seamless API access

### 3. Comprehensive Metrics Tracking
Track performance across all levels:
- **Campaign level**: Overall performance
- **Ad Group level**: Group-specific metrics
- **Keyword level**: Individual keyword ROI

### 4. Database-First Approach
- All Amazon data synced to your database
- Fast queries without API rate limits
- Historical data tracking
- Custom reporting capabilities

## 📊 Usage Examples

### Get Dashboard Summary

```javascript
GET /api/ads/dashboard
Authorization: Bearer {jwt_token}

Response:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "marketplace": "NA",
    "lastSync": "2026-01-22T12:00:00Z"
  },
  "campaigns": [ /* Top 5 campaigns */ ],
  "metrics": {
    "total_campaigns": 15,
    "total_impressions": 150000,
    "total_clicks": 3500,
    "total_spend": 2500.50,
    "total_sales": 12000.75,
    "avg_acos": 20.84,
    "avg_roas": 4.8
  },
  "unreadAlerts": 3
}
```

### Sync All Data

```javascript
POST /api/ads/automate-sync
Authorization: Bearer {jwt_token}

// Fetches from Amazon and stores in database:
// - All campaigns with full details
// - All ad groups
// - All keywords
// - Updates metrics
```

## 🔧 Development

### Project Structure

```
amazon-ads-lwa-auth/
├── backend/
│   ├── config/
│   │   └── database.js          # Neon connection
│   ├── controllers/
│   │   ├── authController.js    # LWA OAuth
│   │   └── adsController.js     # Amazon Ads API + DB sync
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── models/
│   │   ├── User.js              # User operations
│   │   ├── Account.js           # Account management
│   │   ├── Campaign.js          # Campaign CRUD
│   │   ├── AdGroup.js           # Ad group operations
│   │   ├── Keyword.js           # Keyword tracking
│   │   ├── Alert.js             # Alerts system
│   │   └── OptimizationRule.js  # Automation rules
│   ├── routes/
│   │   ├── auth.js
│   │   └── ads.js
│   ├── migrations/
│   │   └── init.js
│   ├── scripts/
│   │   └── reset-database.js
│   └── server.js
│
└── frontend/
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── auth.js
        └── app.js
```

## ⚠️ Troubleshooting

### Database Issues

If you see "column does not exist" errors:
```bash
cd backend
npm run db:reset  # Drops and recreates all tables
```

### Token Issues

If authentication fails:
1. Check LWA credentials in `.env`
2. Verify redirect URI matches Seller Central
3. Ensure scopes include both:
   - `advertising::campaign_management`
   - `advertising::audiences`

## 🚀 Deployment

### Backend (Railway/Render)
1. Connect GitHub repository
2. Add environment variables from `.env`
3. Deploy automatically

### Frontend (Vercel/Netlify)
1. Deploy `frontend` folder
2. Update `API_BASE_URL` in `js/auth.js`

### Database
Neon PostgreSQL is already serverless - no additional deployment needed!

## 📝 License

MIT License - Free to use for personal and commercial projects

## 👤 Author

**Rakshit Vaish**
- GitHub: [@rakshit782](https://github.com/rakshit782)
- Repository: [amazon-ads-lwa-auth](https://github.com/rakshit782/amazon-ads-lwa-auth)

## 🤝 Contributing

Contributions welcome! Please submit Pull Requests.

## ⭐ Show Support

Give a ⭐ if this helps your Amazon Ads automation!

---

**Built with ❤️ for comprehensive Amazon Advertising automation**

### What Makes This Different?

✅ **Database-First**: All data stored locally for fast access
✅ **Production-Ready**: Complete error handling and token management
✅ **Scalable**: Multi-tenant architecture supports multiple users
✅ **Comprehensive**: Full Amazon Ads API integration
✅ **Modern Stack**: Latest Node.js with serverless PostgreSQL