# Database Setup Guide

## Step 1: Run Migration SQL

You need to add the `password` and `role` columns to your existing `users` table.

### Option A: Using Neon Console

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "SQL Editor"
4. Copy and paste the following SQL:

```sql
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'ADMIN';

-- Update existing users to have ADMIN role
UPDATE users SET role = 'ADMIN' WHERE role IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

5. Click "Run"

### Option B: Using psql Command Line

```bash
# Connect to your Neon database
psql "postgresql://user:password@host/database?sslmode=require"

# Run the migration
\i database/migrations/001_add_password_role.sql
```

## Step 2: Verify Migration

Run this query to verify:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('password', 'role');
```

Expected output:
```
 column_name | data_type | is_nullable | column_default
-------------+-----------+-------------+----------------
 password    | text      | YES         | 
 role        | varchar   | YES         | 'ADMIN'
```

## Step 3: Test Registration

After running the migration:

1. Go to your app URL
2. Try registering a new user
3. Check the database:

```sql
SELECT id, email, name, role, marketplace, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see your new user with `role = 'ADMIN'`!

## Troubleshooting

### Error: "column does not exist"

If you get errors about missing columns, run the migration SQL again.

### Error: "password hash failed"

Make sure the `password` column is type `TEXT`, not `VARCHAR`.

### Check Current Schema

```sql
\d users
```

This shows all columns in the users table.

## Complete Users Table Schema

After migration, your users table should have:

```sql
id               | SERIAL PRIMARY KEY
email            | VARCHAR(255) UNIQUE NOT NULL
name             | VARCHAR(255) NOT NULL
password         | TEXT                          -- NEW!
role             | VARCHAR(20) DEFAULT 'ADMIN'   -- NEW!
marketplace      | VARCHAR(10) NOT NULL
region           | VARCHAR(10) NOT NULL
refresh_token    | TEXT
access_token     | TEXT
token_expiry     | TIMESTAMP
profile_id       | VARCHAR(255)
is_active        | BOOLEAN DEFAULT true
created_at       | TIMESTAMP DEFAULT NOW()
updated_at       | TIMESTAMP DEFAULT NOW()
last_sync        | TIMESTAMP
```

## Need Help?

If you're stuck, share:
1. The exact error message
2. The output of `\d users`
3. Your Neon project region