# Creating MASTER Account

## 🔒 SECURITY: MASTER Role Protection

The MASTER role is **strictly protected** and **cannot be created via:**
- Registration API
- Amazon OAuth
- Any application endpoint

MASTER accounts can **only** be created directly in the database.

---

## Method 1: Create MASTER After Registration

### Step 1: Register Normally
1. Go to your app: `https://amazon-ads-lwa-auth.vercel.app/`
2. Click "Sign Up"
3. Enter your details
4. You'll be registered as ADMIN

### Step 2: Promote to MASTER

**In Neon Console SQL Editor:**
```sql
UPDATE users 
SET role = 'MASTER' 
WHERE email = 'your-email@example.com';
```

**Verify:**
```sql
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'your-email@example.com';
```

Expected output:
```
 id | email                    | name         | role   | created_at
----+--------------------------+--------------+--------+------------
  1 | your-email@example.com   | Your Name    | MASTER | 2026-01-23...
```

---

## Method 2: Insert MASTER Directly

### Step 1: Generate Password Hash

**Option A: Use online bcrypt tool**
- Visit: https://bcrypt-generator.com/
- Enter your password
- Rounds: 10
- Copy the hash (starts with `$2a$10$`)

**Option B: Use Node.js**
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

### Step 2: Insert MASTER User

**In Neon Console SQL Editor:**
```sql
INSERT INTO users (
  email, 
  name, 
  password, 
  role, 
  marketplace, 
  region, 
  is_active, 
  created_at, 
  updated_at
)
VALUES (
  'master@yourdomain.com',
  'Master Admin',
  '$2a$10$YourBcryptHashHere',  -- Replace with your hash
  'MASTER',
  'NA',
  'na',
  true,
  NOW(),
  NOW()
);
```

### Step 3: Verify

```sql
SELECT * FROM users WHERE role = 'MASTER';
```

---

## Testing MASTER Access

### Step 1: Login

**Browser Console (F12):**
```javascript
fetch('https://amazon-ads-lwa-auth.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'master@yourdomain.com',
    password: 'your-password'
  })
})
.then(r => r.json())
.then(d => {
  console.log('Login Response:', d);
  localStorage.setItem('authToken', d.token);
});
```

### Step 2: Verify Token Has MASTER Role

```javascript
fetch('https://amazon-ads-lwa-auth.vercel.app/api/auth/profile', {
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(d => console.log('Profile:', d));
```

Expected response:
```json
{
  "user": {
    "id": 1,
    "email": "master@yourdomain.com",
    "name": "Master Admin",
    "role": "MASTER",
    "marketplace": "NA"
  }
}
```

---

## Security Features

### ✅ What's Protected:

1. **Registration Blocked:**
   ```javascript
   // If someone tries to register as MASTER
   POST /api/auth/register
   { "role": "MASTER" }
   
   // Response: 403 Forbidden
   { "error": "MASTER role can only be created directly in database" }
   ```

2. **Creation Blocked:**
   ```javascript
   // In User.create() model
   if (role === 'MASTER') {
     throw new Error('MASTER role cannot be created via application code');
   }
   ```

3. **Deletion Protected:**
   ```javascript
   // MASTER accounts cannot be deleted via API
   DELETE /api/auth/delete-account
   // Response: 403 Forbidden
   ```

---

## Multiple MASTER Accounts?

**Generally not recommended**, but if needed:

```sql
-- Create additional MASTER
INSERT INTO users (email, name, password, role, marketplace, region, is_active, created_at, updated_at)
VALUES (
  'master2@yourdomain.com',
  'Master Admin 2',
  '$2a$10$Hash',
  'MASTER',
  'NA',
  'na',
  true,
  NOW(),
  NOW()
);
```

**Best Practice:** Have only 1 MASTER, use ADMIN for others.

---

## Demoting MASTER

If you need to demote a MASTER to ADMIN:

```sql
UPDATE users 
SET role = 'ADMIN', organization_name = 'Organization Name'
WHERE id = 1;
```

---
## Quick Reference

| Action | Method |
|--------|--------|
| Create MASTER | SQL INSERT or UPDATE only |
| Register ADMIN | App registration (default) |
| Register USER | Created by ADMIN |
| Login | All roles use same endpoint |
| Delete MASTER | SQL DELETE only |

---

## Troubleshooting

### Issue: "Invalid email or password"

**Check password hash:**
```sql
SELECT email, password FROM users WHERE email = 'master@yourdomain.com';
```

Password should start with `$2a$10$`

### Issue: "User not found"

**Check if user exists:**
```sql
SELECT * FROM users WHERE role = 'MASTER';
```

### Issue: Role shows as ADMIN, not MASTER

**Update role:**
```sql
UPDATE users SET role = 'MASTER' WHERE email = 'your-email@example.com';
```

---

## Next Steps

After creating MASTER:
1. ✅ Login to verify
2. ✅ Test profile endpoint
3. ✅ Let others register as ADMIN (automatic)
4. ✅ Build MASTER dashboard to view all ADMINs