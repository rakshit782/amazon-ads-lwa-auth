-- Add role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to ADMIN role (they connected their accounts)
UPDATE users SET role = 'ADMIN' WHERE role IS NULL OR role = 'USER';

-- Set first user as MASTER (change email to your actual email)
-- UPDATE users SET role = 'MASTER' WHERE email = 'your-email@example.com';

COMMENT ON COLUMN users.role IS 'User role: MASTER (owner), ADMIN (brand manager), USER (read-only)';
COMMENT ON COLUMN users.password IS 'Hashed password for email/password login';
COMMENT ON COLUMN users.brand_name IS 'Brand/Company name for ADMIN users';