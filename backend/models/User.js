const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.findByEmail] Error:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.findById] Error:', error);
      throw error;
    }
  }

  // Create new user (role-based)
  static async create(userData) {
    try {
      const { 
        email, password, name, marketplace, region, 
        role = 'USER', // Default to USER
        createdBy = null, 
        parentAdminId = null,
        organizationName = null,
        refreshToken, accessToken, tokenExpiry 
      } = userData;
      
      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const query = `
        INSERT INTO users (
          email, name, password, role, marketplace, region,
          created_by, parent_admin_id, organization_name,
          refresh_token, access_token, token_expiry,
          is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const values = [
        email,
        name,
        hashedPassword,
        role,
        marketplace,
        region,
        createdBy,
        parentAdminId,
        organizationName,
        refreshToken || null,
        accessToken || null,
        tokenExpiry || null,
        true, // is_active
        new Date(),
        new Date()
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.create] Error:', error);
      throw error;
    }
  }

  // Get all users created by an ADMIN
  static async getUsersByAdmin(adminId) {
    try {
      const query = `
        SELECT id, email, name, role, marketplace, is_active, created_at
        FROM users
        WHERE parent_admin_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [adminId]);
      return result.rows;
    } catch (error) {
      console.error('❌ [User.getUsersByAdmin] Error:', error);
      throw error;
    }
  }

  // Get all ADMINs (for MASTER view)
  static async getAllAdmins() {
    try {
      const query = `
        SELECT id, email, name, organization_name, marketplace, is_active, created_at,
               (SELECT COUNT(*) FROM brands WHERE admin_id = users.id) as brand_count,
               (SELECT COUNT(*) FROM users u WHERE u.parent_admin_id = users.id) as user_count
        FROM users
        WHERE role = 'ADMIN'
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ [User.getAllAdmins] Error:', error);
      throw error;
    }
  }

  // Update user tokens (for Amazon OAuth)
  static async updateTokens(email, refreshToken, accessToken, tokenExpiry) {
    try {
      const query = `
        UPDATE users 
        SET refresh_token = $1, access_token = $2, token_expiry = $3, updated_at = $4
        WHERE email = $5
        RETURNING *
      `;
      const values = [refreshToken, accessToken, tokenExpiry, new Date(), email];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.updateTokens] Error:', error);
      throw error;
    }
  }

  // Update access token
  static async updateAccessToken(userId, accessToken, tokenExpiry) {
    try {
      const query = `
        UPDATE users 
        SET access_token = $1, token_expiry = $2, updated_at = $3
        WHERE id = $4
        RETURNING *
      `;
      const values = [accessToken, tokenExpiry, new Date(), userId];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.updateAccessToken] Error:', error);
      throw error;
    }
  }

  // Update profile
  static async updateProfile(userId, { name, organizationName }) {
    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (organizationName !== undefined) {
        updates.push(`organization_name = $${paramCount++}`);
        values.push(organizationName);
      }

      updates.push(`updated_at = $${paramCount++}`);
      values.push(new Date());

      values.push(userId);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.updateProfile] Error:', error);
      throw error;
    }
  }

  // Update password
  static async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const query = `
        UPDATE users 
        SET password = $1, updated_at = $2
        WHERE id = $3
        RETURNING *
      `;
      const values = [hashedPassword, new Date(), userId];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.updatePassword] Error:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ [User.verifyPassword] Error:', error);
      throw error;
    }
  }

  // Check if user can access brand
  static async canAccessBrand(userId, brandId) {
    try {
      const query = 'SELECT user_can_access_brand($1, $2) as can_access';
      const result = await pool.query(query, [userId, brandId]);
      return result.rows[0].can_access;
    } catch (error) {
      console.error('❌ [User.canAccessBrand] Error:', error);
      throw error;
    }
  }

  // Disconnect Amazon
  static async disconnectAmazon(userId) {
    try {
      const query = `
        UPDATE users 
        SET refresh_token = NULL, access_token = NULL, token_expiry = NULL, profile_id = NULL, updated_at = $1
        WHERE id = $2
        RETURNING *
      `;
      const values = [new Date(), userId];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [User.disconnectAmazon] Error:', error);
      throw error;
    }
  }

  // Delete account
  static async deleteAccount(userId) {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await pool.query(query, [userId]);
      return true;
    } catch (error) {
      console.error('❌ [User.deleteAccount] Error:', error);
      throw error;
    }
  }
}

module.exports = User;