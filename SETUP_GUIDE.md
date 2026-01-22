# 🚀 Complete Setup Guide - Amazon Ads Automation Platform

## 📋 Prerequisites

- ✅ Node.js 16+ installed
- ✅ Python 3.x installed (for frontend server)
- ✅ Neon PostgreSQL account ([neon.tech](https://neon.tech))
- ✅ Amazon Seller Central account with API access
- ✅ Git installed

---

## 🎯 Step-by-Step Setup

### **Phase 1: Clone & Install**

#### 1.1 Clone Repository
```bash
git clone https://github.com/rakshit782/amazon-ads-lwa-auth.git
cd amazon-ads-lwa-auth
```

#### 1.2 Install Backend Dependencies
```bash
cd backend
npm install
```

**Expected Output:**
```
added 138 packages
found 0 vulnerabilities
```

---

### **Phase 2: Database Setup (Neon)**

#### 2.1 Create Neon Project
1. Go to [console.neon.tech](https://console.neon.tech)
2. Click **"New Project"**
3. Name: `amazon-ads-automation`
4. Region: Choose closest to you (e.g., US East)
5. Click **"Create Project"**

#### 2.2 Get Connection String
1. In your Neon project dashboard
2. Click **"Connection Details"**
3. Copy the **"Connection string"**
4. Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

#### 2.3 Database Tables (Already Created!)
Your Neon database should already have these 7 tables:
- ✅ `users` - Authentication and tokens
- ✅ `accounts` - Platform accounts
- ✅ `campaigns` - Campaign data and metrics
- ✅ `ad_groups` - Ad groups
- ✅ `keywords` - Keyword performance
- ✅ `alerts` - User notifications
- ✅ `optimization_rules` - Automation rules

**To verify tables exist:**
```sql
-- Run in Neon SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

### **Phase 3: Amazon Seller Central Setup**

#### 3.1 Register Application
1. Go to [developer.amazonservices.com](https://developer.amazonservices.com)
2. Sign in with your Seller Central account
3. Click **"Register Application"**
4. Fill in details:
   - **App Name:** Amazon Ads Automation
   - **Description:** Automated Amazon advertising management
   - **Privacy Policy URL:** Your website or use template

#### 3.2 Configure OAuth Settings
**Redirect URIs:**
```
http://localhost:3000/api/auth/callback
```

**API Scopes (IMPORTANT):**
- ✅ `advertising::campaign_management`
- ✅ `advertising::audiences`

Both scopes are required!

#### 3.3 Get Credentials
After registration, you'll receive:
- **LWA Client ID:** `amzn1.application-oa2-client.xxxxx`
- **LWA Client Secret:** `xxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important:** Keep these secret!

#### 3.4 Request API Access
1. Submit for Amazon Advertising API approval
2. Usually takes 1-2 business days
3. You'll receive email confirmation

---

### **Phase 4: Configure Environment Variables**

#### 4.1 Create .env File
```bash
cd backend
cp .env.example .env
```

#### 4.2 Edit .env File
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

# Neon PostgreSQL Database (PASTE YOUR CONNECTION STRING)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/amazon_ads_db?sslmode=require

# Amazon LWA Credentials (FROM SELLER CENTRAL)
LWA_CLIENT_ID=amzn1.application-oa2-client.YOUR_CLIENT_ID
LWA_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
REDIRECT_URI=http://localhost:3000/api/auth/callback

# Amazon Ads API Scopes
AMAZON_ADS_API_SCOPE=advertising::campaign_management advertising::audiences

# JWT Secret (GENERATE RANDOM 32+ CHARACTERS)
JWT_SECRET=your_random_jwt_secret_key_minimum_32_characters_long
```

#### 4.3 Generate JWT Secret
```bash
# Method 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: Python
python -c "import secrets; print(secrets.token_hex(32))"

# Method 3: Online
# Visit: https://randomkeygen.com/
```

---

### **Phase 5: Start the Application**

#### 5.1 Start Backend Server
```bash
# Terminal 1 - Backend
cd amazon-ads-lwa-auth/backend
npm run dev
```

**Expected Output:**
```
[nodemon] starting `node server.js`
Attempting to connect to Neon PostgreSQL... (attempt 1/3)
✓ Neon PostgreSQL connected successfully
Server running on port 3000
```

#### 5.2 Start Frontend Server
```bash
# Terminal 2 - Frontend (NEW WINDOW)
cd amazon-ads-lwa-auth/frontend
python -m http.server 5500
```

**Expected Output:**
```
Serving HTTP on :: port 5500 (http://[::]:5500/) ...
```

#### 5.3 Open Browser
```
http://localhost:5500
```

You should see the **Amazon Ads Automation** login page! 🎉

---

## ✅ Testing the Setup

### **Test 1: Backend Health Check**
```bash
curl http://localhost:3000/api/auth/get-auth-url
```

Should return error (expected - needs POST request)

### **Test 2: Database Connection**
```bash
node -e "require('./backend/config/database').testConnection()"
```

Should show: `✓ Neon PostgreSQL connected successfully`

### **Test 3: Complete OAuth Flow**
1. Open `http://localhost:5500`
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Marketplace: NA (North America)
3. Click **"Login with Amazon"**
4. Authorize the app on Amazon
5. Should redirect back with dashboard

---

## 🔧 Common Issues & Solutions

### **Issue 1: Database Connection Timeout**

**Error:**
```
✗ Neon PostgreSQL connection error: Connection terminated due to connection timeout
```

**Solutions:**
1. Check `DATABASE_URL` in `.env` is correct
2. Verify Neon project is active (not suspended)
3. Check internet connection
4. Try using Neon's **pooled connection string** (has `-pooler` in hostname)

---

### **Issue 2: Module Not Found**

**Error:**
```
Error: Cannot find module 'uuid'
```

**Solution:**
```bash
cd backend
npm install
```

---

### **Issue 3: Port Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

---

### **Issue 4: CORS Errors**

**Error in Browser Console:**
```
Access to fetch at 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Restart backend server
3. Clear browser cache

---

### **Issue 5: Amazon OAuth Error**

**Error:**
```
The redirect URI does not match the ones configured
```

**Solution:**
1. Check Amazon Seller Central app settings
2. Verify redirect URI exactly matches:
   ```
   http://localhost:3000/api/auth/callback
   ```
3. No trailing slash!
4. HTTP not HTTPS for localhost

---

## 🎯 Next Steps After Setup

### **1. Sync Your Data**
1. Login successfully
2. Click **"Auto Sync"** button
3. Wait 10-30 seconds
4. Data populates in dashboard

### **2. Explore Features**
- 📊 **Dashboard**: View metrics summary
- 🎯 **Campaigns**: See all campaigns with performance
- 📋 **Ad Groups**: Browse ad groups
- 🔑 **Keywords**: Analyze keyword performance
- 👥 **Audiences**: View audience data
- 🔔 **Alerts**: Check notifications

### **3. Database Queries**
Explore your data in Neon SQL Editor:

```sql
-- View all users
SELECT id, email, name, marketplace, last_sync 
FROM users;

-- View campaigns
SELECT name, state, budget, impressions, clicks, spend, sales 
FROM campaigns 
WHERE "userId" = 1;

-- View keywords
SELECT "keywordText", "matchType", bid, impressions, clicks, spend 
FROM keywords 
WHERE "campaignId" IN (SELECT id FROM campaigns WHERE "userId" = 1);

-- Top performing campaigns
SELECT name, sales, spend, (sales/NULLIF(spend,0)) as roas
FROM campaigns 
WHERE "userId" = 1 
ORDER BY sales DESC 
LIMIT 10;
```

---

## 📊 Monitoring

### **Backend Logs**
Watch for:
- ✅ Database queries
- ✅ API calls to Amazon
- ✅ Token refreshes
- ⚠️ Errors

### **Database Health**
In Neon console:
- Check **Metrics** tab
- Monitor connection count
- Watch query performance

---

## 🚀 Production Deployment

### **Backend (Railway/Render)**
1. Connect GitHub repository
2. Set environment variables from `.env`
3. Update `REDIRECT_URI` to production URL
4. Update `FRONTEND_URL` to production URL

### **Frontend (Vercel/Netlify)**
1. Deploy `frontend` folder
2. Update `API_BASE_URL` in `frontend/js/auth.js`
3. Update Amazon Seller Central redirect URI

### **Database**
Neon is already serverless - no changes needed!

---

## 📚 Resources

- [Amazon Advertising API Docs](https://advertising.amazon.com/API/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Login with Amazon Guide](https://developer.amazon.com/docs/login-with-amazon/documentation-overview.html)
- [GitHub Repository](https://github.com/rakshit782/amazon-ads-lwa-auth)

---

## 🎉 Success Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5500
- [ ] Database connected to Neon
- [ ] Environment variables configured
- [ ] Amazon OAuth working
- [ ] Can login successfully
- [ ] Dashboard displays data
- [ ] Auto sync works
- [ ] Campaigns visible in UI
- [ ] Keywords visible in UI

---

## 💡 Tips

1. **Keep both terminals visible** - Monitor logs in real-time
2. **Use nodemon** - Backend auto-restarts on code changes
3. **Check browser console** - F12 for frontend errors
4. **Test with Postman** - Verify API endpoints
5. **Backup .env file** - Don't commit to Git!

---

## 🆘 Need Help?

1. Check this guide first
2. Review error messages in terminal
3. Check browser console (F12)
4. Verify all environment variables
5. Test database connection
6. Check Amazon Seller Central settings

---

**You're all set! Start automating your Amazon Ads! 🚀**