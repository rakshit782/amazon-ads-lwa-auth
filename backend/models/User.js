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

  // Create new user
  static async create(userData) {
    try {
      const { email, password, name, marketplace, region, refreshToken, accessToken, tokenExpiry } = userData;
      
      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const query = `
        INSERT INTO users (
          email, name, password, role, marketplace, region, 
          refresh_token, access_token, token_expiry, 
          is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        email,
        name,
        hashedPassword,
        'ADMIN', // Default role is ADMIN
        marketplace,
        region,
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
  static async updateProfile(userId, { name }) {
    try {
      const query = `
        UPDATE users 
        SET name = $1, updated_at = $2
        WHERE id = $3
        RETURNING *
      `;
      const values = [name, new Date(), userId];
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