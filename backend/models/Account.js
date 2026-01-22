const { query } = require('../config/database');

class Account {
  // Find all accounts for a user
  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM accounts WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    return result.rows;
  }

  // Find account by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Find account by platform and user
  static async findByPlatformAndUser(platform, userId) {
    const result = await query(
      'SELECT * FROM accounts WHERE platform = $1 AND "userId" = $2',
      [platform, userId]
    );
    return result.rows[0] || null;
  }

  // Create new account
  static async create(accountData) {
    const { id, userId, platform, profileId, accessToken, refreshToken, tokenExpiresAt, scope } = accountData;
    
    const result = await query(
      `INSERT INTO accounts (id, "userId", platform, "profileId", "accessToken", "refreshToken", "tokenExpiresAt", scope, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, platform, profileId, accessToken, refreshToken, tokenExpiresAt, scope]
    );
    
    return result.rows[0];
  }

  // Update account tokens
  static async updateTokens(id, accessToken, refreshToken, tokenExpiresAt) {
    const result = await query(
      `UPDATE accounts 
       SET "accessToken" = $1, "refreshToken" = $2, "tokenExpiresAt" = $3, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [accessToken, refreshToken, tokenExpiresAt, id]
    );
    
    return result.rows[0];
  }

  // Delete account
  static async delete(id) {
    await query('DELETE FROM accounts WHERE id = $1', [id]);
  }
}

module.exports = Account;