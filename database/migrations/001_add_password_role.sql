-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'ADMIN';

-- Update existing users to have ADMIN role
UPDATE users SET role = 'ADMIN' WHERE role IS NULL;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add index on role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);