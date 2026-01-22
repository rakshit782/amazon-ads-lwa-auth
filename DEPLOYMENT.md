# 🚀 Deployment Guide - Vercel

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rakshit782/amazon-ads-lwa-auth)

---

## Manual Deployment Steps

### 1. Prerequisites
- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository connected
- Environment variables ready

### 2. Deploy to Vercel

#### Via Vercel Dashboard:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** (leave empty)
   - **Output Directory:** frontend

#### Via Vercel CLI:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd amazon-ads-lwa-auth
vercel
```

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NODE_ENV=production

DATABASE_URL=your_neon_connection_string

LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
LWA_CLIENT_SECRET=your_client_secret

REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
FRONTEND_URL=https://your-app.vercel.app

AMAZON_ADS_API_SCOPE=advertising::campaign_management advertising::audiences

JWT_SECRET=your_random_jwt_secret_32_characters
```

### 4. Update Amazon Seller Central

1. Go to Amazon Developer Console
2. Update your app's **Allowed Return URLs:**
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
3. Add to **Allowed Origins:**
   ```
   https://your-app.vercel.app
   ```

### 5. Deploy!

```bash
vercel --prod
```

Your app will be live at: `https://your-app.vercel.app`

---

## Testing Production

1. Visit: `https://your-app.vercel.app/login.html`
2. Register new account
3. Login
4. Connect Amazon account
5. Sync data

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with new domain
5. Update Amazon Seller Central URLs

---

## Monitoring

- **Logs:** Vercel Dashboard → Deployments → View Function Logs
- **Analytics:** Vercel Dashboard → Analytics
- **Database:** Neon Console → Metrics

---

## Rollback

If something goes wrong:
1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

---

## Environment-Specific URLs

### Development (Local)
- Frontend: `http://localhost:5500`
- Backend: `http://localhost:3000`
- Redirect: `http://localhost:3000/api/auth/callback`

### Production (Vercel)
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.vercel.app/api`
- Redirect: `https://your-app.vercel.app/api/auth/callback`

---

## Troubleshooting

### Issue: 500 Error
**Check:** Vercel Function Logs for detailed error
**Common:** Missing environment variables

### Issue: Database Connection Timeout
**Fix:** Use Neon's **pooled connection string**
- Hostname contains `-pooler`
- Example: `ep-xxx-pooler.region.aws.neon.tech`

### Issue: CORS Errors
**Fix:** Verify `FRONTEND_URL` matches your Vercel domain exactly

---

## Success! 🎉

Your Amazon Ads Automation platform is now live on Vercel!