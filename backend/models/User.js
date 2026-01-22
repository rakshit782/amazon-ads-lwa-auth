const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

// User Roles
const ROLES = {
  MASTER: 'MASTER',   // Owner - sees all brands and data
  ADMIN: 'ADMIN',     // Brand owner - manages their own ad accounts
  USER: 'USER'        // Read-only - views data only
};

class User {
  // Find user by ID
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  // Create new user
  static async create(userData) {
    const {
      email,
      name,
      password,
      role = ROLES.USER, // Default role
      marketplace,
      region,
      refreshToken,
      accessToken,
      tokenExpiry
    } = userData;

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const result = await query(
      `INSERT INTO users (
        email, name, password, role, marketplace, region, 
        refresh_token, access_token, token_expiry, 
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        email,
        name,
        hashedPassword,
        role,
        marketplace,
        region,
        refreshToken,
        accessToken,
        tokenExpiry
      ]
    );

    return result.rows[0];
  }

  // Update tokens
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
      'UPDATE users SET profile_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [profileId, id]
    );

    return result.rows[0];
  }

  // Update last sync timestamp
  static async updateLastSync(id) {
    const result = await query(
      'UPDATE users SET last_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    return result.rows[0];
  }

  // Get public profile (without sensitive data)
  static async getPublicProfile(id) {
    const result = await query(
      `SELECT id, email, name, role, marketplace, region, profile_id, 
              is_active, last_sync, created_at 
       FROM users WHERE id = $1`,
      [id]
    );

    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    if (!hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [hashedPassword, id]
    );
    return result.rows[0];
  }

  // Update role (MASTER only)
  static async updateRole(id, newRole) {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error('Invalid role');
    }
    
    const result = await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newRole, id]
    );
    return result.rows[0];
  }

  // Get all users (MASTER only)
  static async getAll() {
    const result = await query(
      `SELECT id, email, name, role, marketplace, is_active, last_sync, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  // Get users by role
  static async getByRole(role) {
    const result = await query(
      `SELECT id, email, name, role, marketplace, is_active, last_sync, created_at 
       FROM users 
       WHERE role = $1
       ORDER BY created_at DESC`,
      [role]
    );
    return result.rows;
  }

  // Activate/Deactivate user
  static async setActiveStatus(id, isActive) {
    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    return result.rows[0];
  }

  // Check if user has permission
  static hasPermission(userRole, requiredRole) {
    const hierarchy = {
      MASTER: 3,
      ADMIN: 2,
      USER: 1
    };
    
    return hierarchy[userRole] >= hierarchy[requiredRole];
  }

  // Check if user can modify resource
  static canModify(userRole, resourceOwnerId, userId) {
    // MASTER can modify anything
    if (userRole === ROLES.MASTER) return true;
    
    // ADMIN can only modify their own resources
    if (userRole === ROLES.ADMIN && resourceOwnerId === userId) return true;
    
    // USER cannot modify anything
    return false;
  }
}

module.exports = User;
module.exports.ROLES = ROLES;