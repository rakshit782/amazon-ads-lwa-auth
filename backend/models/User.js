const { query } = require('../config/database');

class User {
  // Create users table if not exists
  static async createTable() {
    try {
      // Create table
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          marketplace VARCHAR(10) NOT NULL,
          region VARCHAR(10) NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          token_expiry TIMESTAMP,
          profile_id VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_sync TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes separately
      await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await query('CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users(profile_id)');
      
      console.log('✓ Users table ready');
    } catch (error) {
      console.error('Error creating users table:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Create new user
  static async create(userData) {
    const { email, name, marketplace, region, refreshToken, accessToken, tokenExpiry } = userData;
    
    const result = await query(
      `INSERT INTO users (email, name, marketplace, region, refresh_token, access_token, token_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [email, name, marketplace, region, refreshToken, accessToken, tokenExpiry]
    );
    
    return result.rows[0];
  }

  // Update user tokens
  static async updateTokens(email, refreshToken, accessToken, tokenExpiry) {
    const result = await query(
      `UPDATE users 
       SET refresh_token = $1, access_token = $2, token_expiry = $3, updated_at = CURRENT_TIMESTAMP
       WHERE email = $4
       RETURNING *`,
      [refreshToken, accessToken, tokenExpiry, email]
    );
    
    return result.rows[0];
  }

  // Update access token only
  static async updateAccessToken(id, accessToken, tokenExpiry) {
    const result = await query(
      `UPDATE users 
       SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [accessToken, tokenExpiry, id]
    );
    
    return result.rows[0];
  }

  // Update profile ID
  static async updateProfileId(id, profileId) {
    const result = await query(
      `UPDATE users 
       SET profile_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [profileId, id]
    );
    
    return result.rows[0];
  }

  // Update last sync time
  static async updateLastSync(id) {
    const result = await query(
      `UPDATE users 
       SET last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    return result.rows[0];
  }

  // Get user without sensitive token data
  static async getPublicProfile(id) {
    const result = await query(
      `SELECT id, email, name, marketplace, region, profile_id, is_active, created_at, last_sync
       FROM users WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  // Delete user
  static async delete(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;