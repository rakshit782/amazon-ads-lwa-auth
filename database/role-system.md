# Role-Based Access Control System

## Overview

This system implements a 3-tier role hierarchy for managing Amazon Ads campaigns across multiple brands.

## Roles

### 🔱 MASTER (Super Admin)
- **Who:** App owner/developer
- **Access:** Everything - all users, all brands, all data
- **Can:**
  - View all ADMINs and their stats
  - View all brands across all ADMINs
  - Access any campaign data
  - Create/edit/delete any resource
  - Manage system settings
- **Cannot:** Be deleted by others

### 👑 ADMIN (Brand Manager)
- **Who:** Agency or brand manager
- **Access:** Their brands and their team
- **Can:**
  - Connect multiple Amazon brand accounts
  - Create/manage campaigns for their brands
  - Create USER accounts for their team
  - Grant/revoke USER access to specific brands
  - View all data for their brands
  - Manage their users
- **Cannot:** 
  - Access other ADMINs' brands
  - See MASTER data
  - Modify other ADMINs' settings

### 👤 USER (Viewer/Operator)
- **Who:** Team member created by ADMIN
- **Access:** Only brands granted by their ADMIN
- **Can:**
  - View campaigns for assigned brands
  - View analytics for assigned brands
  - Edit campaigns (if permission granted)
- **Cannot:** 
  - Create new brands
  - Create other users
  - Access brands not assigned to them
  - See other ADMINs' data

## Database Schema

### Users Table
```sql
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  password TEXT,
  role VARCHAR(20),  -- 'MASTER', 'ADMIN', 'USER'
  created_by INTEGER REFERENCES users(id),
  parent_admin_id INTEGER REFERENCES users(id),  -- For USER: their ADMIN
  organization_name VARCHAR(255),  -- For ADMIN
  ...
)
```

### Brands Table
```sql
brands (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  brand_name VARCHAR(255),
  platform VARCHAR(50) DEFAULT 'AMAZON',
  marketplace VARCHAR(10),
  access_token TEXT,
  refresh_token TEXT,
  ...
)
```

### User Brand Access Table
```sql
user_brand_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  brand_id INTEGER REFERENCES brands(id),
  admin_id INTEGER REFERENCES users(id),
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  ...
)
```

## Use Cases

### Scenario 1: Marketing Agency

**Setup:**
- ADMIN: Agency account
- Brands: Client A, Client B, Client C
- USERS: Account Manager 1, Account Manager 2

**Access:**
- Agency ADMIN manages all 3 clients
- Account Manager 1 can view Client A and Client B only
- Account Manager 2 can view and edit Client C only

### Scenario 2: Multi-Brand Company

**Setup:**
- ADMIN: Company account
- Brands: Brand X, Brand Y, Brand Z
- USERS: Marketing Team Member 1, Marketing Team Member 2

**Access:**
- Company ADMIN manages all brands
- Team Member 1 can view Brand X and Brand Y
- Team Member 2 can edit Brand Z campaigns

## Setup Instructions

### Step 1: Run Migration

```sql
-- Run database/migrations/002_role_based_system.sql in Neon Console
```

### Step 2: Create MASTER User

```sql
-- After running migration, create your MASTER account
INSERT INTO users (email, name, password, role, marketplace, region, is_active, created_at, updated_at)
VALUES (
  'your-email@example.com',  -- Your email
  'Master Admin',  -- Your name
  '$2a$10$YourBcryptHashHere',  -- Generate via registration or bcrypt tool
  'MASTER',
  'NA',
  'na',
  true,
  NOW(),
  NOW()
);
```

### Step 3: Register First ADMIN

1. Go to your app
2. Register with email/password
3. System creates as USER by default
4. As MASTER, promote to ADMIN:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## API Usage

### Register ADMIN (by MASTER)
```javascript
POST /api/auth/register
{
  "email": "admin@agency.com",
  "password": "password123",
  "name": "Agency Admin",
  "role": "ADMIN",  // Only MASTER can set this
  "organizationName": "Digital Marketing Agency",
  "marketplace": "NA"
}
```

### Create USER (by ADMIN)
```javascript
POST /api/users/create
Headers: { Authorization: Bearer <admin-token> }
{
  "email": "user@agency.com",
  "password": "password123",
  "name": "Team Member",
  "role": "USER"
}
```

### Connect Brand (by ADMIN)
```javascript
POST /api/brands/create
Headers: { Authorization: Bearer <admin-token> }
{
  "brandName": "Client Brand A",
  "marketplace": "NA",
  "region": "na"
}
```

### Grant Brand Access (by ADMIN)
```javascript
POST /api/brands/:brandId/grant-access
Headers: { Authorization: Bearer <admin-token> }
{
  "userId": 123,
  "canView": true,
  "canEdit": false
}
```

## Permission Matrix

| Action | MASTER | ADMIN | USER |
|--------|--------|-------|------|
| View all brands | ✅ | ❌ | ❌ |
| View own brands | ✅ | ✅ | ✅* |
| Create brand | ✅ | ✅ | ❌ |
| Edit brand | ✅ | ✅ (own) | ✅* |
| Delete brand | ✅ | ✅ (own) | ❌ |
| Create ADMIN | ✅ | ❌ | ❌ |
| Create USER | ✅ | ✅ | ❌ |
| Grant access | ✅ | ✅ (own brands) | ❌ |
| View campaigns | ✅ | ✅ (own) | ✅* |
| Edit campaigns | ✅ | ✅ (own) | ✅* |

*Only if access granted by ADMIN

## Security Features

1. **Row-Level Security:** Users can only access their permitted data
2. **Cascade Delete:** Deleting ADMIN removes their brands and users
3. **Audit Logs:** All actions tracked for compliance
4. **Token-based Auth:** JWT with role embedded
5. **Database Functions:** Automatic permission checking

## Testing

### Test as MASTER
```sql
SELECT * FROM users WHERE role = 'MASTER';
```

### Test as ADMIN
```sql
SELECT * FROM brands WHERE admin_id = <your-admin-id>;
SELECT * FROM users WHERE parent_admin_id = <your-admin-id>;
```

### Test as USER
```sql
SELECT * FROM user_brand_access WHERE user_id = <your-user-id>;
SELECT user_can_access_brand(<your-user-id>, <brand-id>);
```