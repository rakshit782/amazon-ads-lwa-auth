-- ============================================
-- MULTI-TENANT ROLE-BASED ACCESS CONTROL
-- ============================================

-- Step 1: Add role column with proper enum if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'USER';

-- Step 2: Add organization/team management columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Step 3: Create brands table for ADMIN to manage multiple brands
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL DEFAULT 'AMAZON',
  marketplace VARCHAR(10) NOT NULL,
  region VARCHAR(10) NOT NULL,
  profile_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(admin_id, brand_name, platform)
);

-- Step 4: Create user_brand_access table for USER permissions
CREATE TABLE IF NOT EXISTS user_brand_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Step 5: Update campaigns to link with brands
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Step 6: Update keywords to link with brands
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE;

-- Step 7: Update ad_groups to link with brands
ALTER TABLE ad_groups ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_parent_admin ON users(parent_admin_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_brands_admin_id ON brands(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_user_id ON user_brand_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_brand_id ON user_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_admin_id ON user_brand_access(admin_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_admin_id ON campaigns(admin_id);

-- Step 9: Add role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('MASTER', 'ADMIN', 'USER'));

-- Step 10: Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Step 11: Create function to check user access to brand
CREATE OR REPLACE FUNCTION user_can_access_brand(p_user_id INTEGER, p_brand_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role VARCHAR(20);
  v_admin_id INTEGER;
  v_has_access BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  -- MASTER can access everything
  IF v_user_role = 'MASTER' THEN
    RETURN TRUE;
  END IF;
  
  -- ADMIN can access their own brands
  IF v_user_role = 'ADMIN' THEN
    SELECT COUNT(*) > 0 INTO v_has_access
    FROM brands
    WHERE id = p_brand_id AND admin_id = p_user_id;
    RETURN v_has_access;
  END IF;
  
  -- USER can access brands granted by their ADMIN
  IF v_user_role = 'USER' THEN
    SELECT COUNT(*) > 0 INTO v_has_access
    FROM user_brand_access
    WHERE user_id = p_user_id AND brand_id = p_brand_id;
    RETURN v_has_access;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Add comments for documentation
COMMENT ON TABLE users IS 'Main users table with role-based access control';
COMMENT ON TABLE brands IS 'Brands managed by ADMINs - each ADMIN can manage multiple brands';
COMMENT ON TABLE user_brand_access IS 'Grants USER access to specific brands managed by ADMIN';
COMMENT ON COLUMN users.role IS 'MASTER=owner, ADMIN=brand manager, USER=viewer';
COMMENT ON COLUMN users.parent_admin_id IS 'For USER role: which ADMIN created this user';
COMMENT ON COLUMN users.created_by IS 'Who created this user account';

-- Step 13: Sample data structure (commented out - uncomment to use)
/*
-- Create MASTER user (run this manually with your details)
INSERT INTO users (email, name, password, role, marketplace, region, is_active, created_at, updated_at)
VALUES (
  'master@example.com', 
  'Master Admin', 
  '$2a$10$...', -- Use bcrypt hash
  'MASTER', 
  'NA', 
  'na', 
  true, 
  NOW(), 
  NOW()
);
*/