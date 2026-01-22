# 🚀 Production Setup Guide - Vercel Deployment

## 📋 Current Status

Your app is deployed on Vercel! Let's configure it for real Amazon account testing.

---

## 🔧 Step 1: Get Your Vercel URL

### Find Your Deployment URL:

1. **Go to:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Find your project:** `amazon-ads-lwa-auth` (or similar)
3. **Copy the URL:** 
   ```
   https://amazon-ads-lwa-auth.vercel.app
   OR
   https://your-custom-domain.vercel.app
   ```

**📝 Write it down:** `_______________________________`

---

## 🔑 Step 2: Configure Amazon Login with Amazon (LWA)

### 2A: Go to Amazon Developer Console

1. **Visit:** [developer.amazon.com/loginwithamazon/console](https://developer.amazon.com/loginwithamazon/console)
2. **Sign in** with your Amazon account
3. **Click:** "Login with Amazon"

### 2B: Create/Update Security Profile

**If you already have a profile:**
- Click on your existing profile
- Skip to Step 2C

**If creating new:**
1. Click **"Create a New Security Profile"**
2. Fill in:
   - **Security Profile Name:** `Amazon Ads Automation`
   - **Security Profile Description:** `Multi-tenant Amazon Advertising automation platform`
   - **Consent Privacy Notice URL:** Your Vercel URL (e.g., `https://your-app.vercel.app`)
3. Click **"Save"**

### 2C: Configure Web Settings

1. Click **"Web Settings"** next to your Security Profile
2. Click **"Edit"**

3. **Add Allowed Origins:**
   ```
   https://your-app.vercel.app
   ```
   
4. **Add Allowed Return URLs:**
   ```
   https://your-app.vercel.app/api/auth/callback
   ```

5. **Click "Save"**

### 2D: Get Your Credentials

1. On the Security Profile page, you'll see:
   - **Client ID:** `amzn1.application-oa2-client.xxxxxxxxxxxxxxxxxxxxx`
   - **Client Secret:** Click **"Show Secret"**

2. **Copy both values** - you'll need them next!

---

## ⚙️ Step 3: Configure Vercel Environment Variables

### 3A: Go to Vercel Project Settings

1. **Visit:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project:** `amazon-ads-lwa-auth`
3. **Click:** Settings → Environment Variables

### 3B: Add Required Variables

Add each variable by clicking **"Add New"**:

#### **1. DATABASE_URL**
```
Key: DATABASE_URL
Value: postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
```
*(Get this from your Neon dashboard)*

#### **2. LWA_CLIENT_ID**
```
Key: LWA_CLIENT_ID
Value: amzn1.application-oa2-client.xxxxxxxxxxxxxxxxxxxxx
```
*(From Step 2D above)*

#### **3. LWA_CLIENT_SECRET**
```
Key: LWA_CLIENT_SECRET
Value: YOUR_CLIENT_SECRET_FROM_AMAZON
```
*(From Step 2D - click "Show Secret")*

#### **4. JWT_SECRET**
```
Key: JWT_SECRET
Value: YOUR_RANDOM_32_CHAR_SECRET
```

**Generate JWT Secret:**
```bash
# Run in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use:
openssl rand -hex 32
```

#### **5. REDIRECT_URI**
```
Key: REDIRECT_URI
Value: https://your-app.vercel.app/api/auth/callback
```
*(Replace with YOUR actual Vercel URL)*

#### **6. FRONTEND_URL**
```
Key: FRONTEND_URL
Value: https://your-app.vercel.app
```
*(Replace with YOUR actual Vercel URL)*

#### **7. AMAZON_ADS_API_SCOPE**
```
Key: AMAZON_ADS_API_SCOPE
Value: advertising::campaign_management advertising::audiences
```

#### **8. NODE_ENV**
```
Key: NODE_ENV
Value: production
```

### 3C: Environment Scope

For each variable, select:
- ✅ **Production**
- ✅ **Preview** (optional)
- ✅ **Development** (optional)

---

## 🔄 Step 4: Redeploy

After adding environment variables:

### Method A: Automatic (via Git Push)
```bash
cd F:\amazon-ads-lwa-auth
git pull origin main
git push origin main
# Vercel auto-deploys!
```

### Method B: Manual Redeploy
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click "..." on latest deployment
4. Click "Redeploy"

### Method C: Via CLI
```bash
vercel --prod
```

**⏰ Wait 2-3 minutes for deployment to complete**

---

## ✅ Step 5: Verify Deployment

### 5A: Check Deployment Status

1. **Visit:** Your Vercel deployment page
2. **Status should show:** ✅ Ready
3. **Build logs should show:** No errors

### 5B: Test Homepage

1. **Visit:** `https://your-app.vercel.app/login.html`
2. **Should see:** Beautiful login page
3. **No errors in browser console** (Press F12)

### 5C: Test Backend API

**Test in browser console (F12):**
```javascript
fetch('https://your-app.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)

// Should show:
// { status: 'ok', timestamp: ... }
```

---

## 🧪 Step 6: Test Amazon Connection

### 6A: Register Account

1. **Go to:** `https://your-app.vercel.app/login.html`
2. **Click:** "Register" tab
3. **Fill in:**
   - Name: Your Name
   - Email: your@email.com
   - Password: Choose strong password
   - Marketplace: NA (or EU/FE)
4. **Click "Register"**
5. **Should:** Redirect to dashboard

### 6B: Connect Amazon Account

1. **In Dashboard:** Click **"🛒 Connect Amazon Account"**
   - OR go to: `https://your-app.vercel.app/index.html`

2. **Should see:** Amazon login page

3. **Sign in** with your Amazon Seller/Vendor account

4. **Click "Allow"** to authorize the app

5. **Should redirect back** to your app with success message

### 6C: Verify Connection

**Check in profile page:**
1. Go to: `https://your-app.vercel.app/profile.html`
2. Should see: **"✅ Connected to Amazon Advertising"**
3. Should show your Profile ID

---

## 🔄 Step 7: Test Real-Time Sync

### 7A: Sync Your Data

1. **Go to:** `https://your-app.vercel.app/dashboard.html`
2. **Click:** **"🔄 Auto Sync"** button
3. **Wait:** 10-30 seconds
4. **Should see:** Loading indicator
5. **Should see:** Success message

### 7B: Verify Data Synced

**Dashboard should now show:**
- ✅ Real impression numbers
- ✅ Actual clicks from your campaigns
- ✅ Real spend data
- ✅ Actual sales figures
- ✅ Your campaign names in Campaigns tab
- ✅ Your keywords in Keywords tab

### 7C: Verify in Database

**Go to Neon Dashboard:**
1. Visit: [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Go to SQL Editor
4. Run:

```sql
-- Check your data
SELECT 
  (SELECT COUNT(*) FROM campaigns) as campaigns,
  (SELECT COUNT(*) FROM keywords) as keywords,
  (SELECT COUNT(*) FROM ad_groups) as ad_groups,
  (SELECT COALESCE(SUM(spend), 0) FROM campaigns) as total_spend,
  (SELECT COALESCE(SUM(sales), 0) FROM campaigns) as total_sales;
```

**Should show real numbers!** 🎉

---

## 🎯 Step 8: Verify Everything Works

### Checklist:

- [ ] ✅ Vercel deployment is live
- [ ] ✅ Login page loads (no errors)
- [ ] ✅ Can register new account
- [ ] ✅ Can login with credentials
- [ ] ✅ Dashboard loads
- [ ] ✅ "Connect Amazon" button works
- [ ] ✅ Amazon OAuth redirects correctly
- [ ] ✅ Successfully authorized Amazon account
- [ ] ✅ Profile shows "Connected" status
- [ ] ✅ "Auto Sync" button works
- [ ] ✅ Real campaigns appear in dashboard
- [ ] ✅ Keywords tab shows real data
- [ ] ✅ Metrics cards show real numbers
- [ ] ✅ Database contains synced data

---

## 🚨 Troubleshooting

### Problem 1: "Invalid Client ID"

**Error:** `The request has an invalid parameter: client_id`

**Solution:**
1. Check LWA_CLIENT_ID in Vercel env vars
2. Make sure it starts with `amzn1.application-oa2-client.`
3. Redeploy after fixing

---

### Problem 2: "Redirect URI Mismatch"

**Error:** `The redirect URI provided does not match...`

**Solution:**
1. Go to Amazon Developer Console
2. Check "Allowed Return URLs"
3. Must be: `https://your-app.vercel.app/api/auth/callback`
4. NO trailing slash!
5. Must match your ACTUAL Vercel URL

---

### Problem 3: "Database Connection Failed"

**Error:** `Failed to connect to database`

**Solution:**
1. Check DATABASE_URL in Vercel
2. Verify Neon database is active
3. Test connection from Neon SQL Editor
4. Make sure connection string includes `?sslmode=require`

---

### Problem 4: "Access Denied" After Amazon Login

**Error:** `You don't have permission to access this resource`

**Cause:** Your Amazon account needs API access

**Solution:**
1. Go to [advertising.amazon.com](https://advertising.amazon.com)
2. Sign in
3. Go to Account → API
4. Apply for API access
5. Wait for approval (1-2 business days)

---

### Problem 5: Sync Shows "No Data"

**Error:** Sync completes but dashboard still empty

**Solutions:**

A. **Check if you have campaigns:**
   - Go to [advertising.amazon.com](https://advertising.amazon.com)
   - Do you have active campaigns?
   - If not, create a test campaign

B. **Check API permissions:**
   - Your Amazon account needs API access
   - Go to Account Settings → API
   - Verify API is enabled

C. **Check backend logs:**
   - Go to Vercel Dashboard
   - Click "Functions"
   - Check recent logs for errors

---

## 📊 Monitoring Production

### View Backend Logs:

1. **Vercel Dashboard** → Your Project
2. Click **"Functions"** tab
3. Click on any function
4. See real-time logs

### Common Log Patterns:

**✅ Successful Sync:**
```
🔄 [SYNC] Starting automated sync...
✅ [SYNC] Fetched 8 campaigns from Amazon
✅ [SYNC] Sync completed successfully!
```

**❌ Token Expired (auto-refreshes):**
```
⏰ [TOKEN] Token expired, refreshing...
✅ [TOKEN] Token refreshed successfully
```

**❌ API Error:**
```
⚠️ [SYNC] Campaign sync error: 401 Unauthorized
```
*→ Reconnect Amazon account*

---

## 🎉 Success Criteria

Your production app is working when:

1. ✅ **You can register/login** on Vercel URL
2. ✅ **Amazon OAuth works** - redirects properly
3. ✅ **Profile shows connected** - has Profile ID
4. ✅ **Sync button works** - no errors
5. ✅ **Dashboard shows real data** - your actual campaigns
6. ✅ **Metrics are accurate** - matches Amazon Ads console
7. ✅ **Keywords visible** - real keywords from your account
8. ✅ **Database populated** - Neon has your data

---

## 🔗 Quick Links

- **Your App:** `https://your-app.vercel.app`
- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Amazon Developer Console:** [developer.amazon.com](https://developer.amazon.com/loginwithamazon/console)
- **Amazon Advertising:** [advertising.amazon.com](https://advertising.amazon.com)
- **Neon Console:** [console.neon.tech](https://console.neon.tech)

---

## 📞 Need Help?

If you encounter issues:

1. **Check Vercel logs** for errors
2. **Check browser console** (F12)
3. **Verify environment variables** are set
4. **Test each step** in this guide
5. **Check Amazon Developer Console** settings

---

**Ready to test? Let's do this!** 🚀

Start with **Step 1** above and tell me your Vercel URL!