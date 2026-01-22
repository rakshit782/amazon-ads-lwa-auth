# Amazon Ads Automation Platform

🚀 Full-stack application for automating Amazon Advertising campaigns with real-time analytics and optimization.

## Features

- 📊 Real-time Performance Metrics
- 🤖 Automated Campaign Management
- 💰 Budget Optimization
- 🎯 Keyword Bid Automation
- 📈 Advanced Analytics Dashboard
- 🔔 Smart Alerts & Notifications
- 🌍 Multi-Marketplace Support (NA, EU, FE)
- 🔒 Enterprise-Grade Security

## Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Modern UI with animations
- Responsive design

**Backend:**
- Node.js + Express
- PostgreSQL (Neon)
- JWT Authentication
- Amazon Advertising API

## Setup Instructions

### 1. Database Setup (Neon)

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string
4. Run the migration:

```bash
# Connect to your Neon database
psql "your_neon_connection_string"

# Run the migration
\i database/migrations/001_add_password_role.sql
```

### 2. Amazon Advertising API Setup

1. Go to [Amazon Advertising API](https://advertising.amazon.com/API/docs/en-us/get-started/overview)
2. Register for API access
3. Create a LWA Security Profile
4. Get your Client ID and Client Secret
5. Add redirect URL: `https://your-domain.vercel.app/api/auth/callback`

### 3. Environment Variables

Create a `.env` file or add to Vercel:

```env
DATABASE_URL=your_neon_connection_string
LWA_CLIENT_ID=your_amazon_client_id
LWA_CLIENT_SECRET=your_amazon_client_secret
JWT_SECRET=your_random_32_char_string
REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
FRONTEND_URL=https://your-domain.vercel.app
AMAZON_ADS_API_SCOPE=advertising::campaign_management advertising::audiences
NODE_ENV=production
```

### 4. Generate JWT Secret

```bash
openssl rand -base64 32
```

### 5. Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password TEXT,
  role VARCHAR(20) DEFAULT 'ADMIN',
  marketplace VARCHAR(10) NOT NULL,
  region VARCHAR(10) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  token_expiry TIMESTAMP,
  profile_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_sync TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email/password (ADMIN role)
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/get-auth-url` - Get Amazon OAuth URL
- `GET /api/auth/callback` - Amazon OAuth callback
- `POST /api/auth/exchange-token` - Exchange code for tokens

### Protected Routes (require JWT)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/disconnect-amazon` - Disconnect Amazon
- `DELETE /api/auth/delete-account` - Delete account
- `POST /api/auth/refresh-token` - Refresh access token

## Default User Role

All registered users are assigned **ADMIN** role by default, giving them full access to:
- Campaign management
- Analytics dashboard
- Automation rules
- All platform features

## Usage

### Option 1: Email/Password Registration
1. Visit your app URL
2. Click "Sign Up" tab
3. Fill in name, email, password, marketplace
4. You're registered as ADMIN!

### Option 2: Amazon OAuth
1. Visit your app URL
2. Click "Connect with Amazon"
3. Fill in name, email, marketplace
4. Authorize with Amazon
5. You're registered as ADMIN!

## Development

```bash
# Install dependencies
npm install

# Run locally
cd backend
node server.js
```

## License

MIT

## Support

For issues or questions, please open a GitHub issue.