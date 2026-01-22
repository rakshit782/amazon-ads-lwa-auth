const pool = require('../config/database');

class Brand {
  // Create new brand
  static async create(brandData) {
    try {
      const { 
        adminId, brandName, platform = 'AMAZON', marketplace, region,
        profileId, accessToken, refreshToken, tokenExpiry 
      } = brandData;

      const query = `
        INSERT INTO brands (
          admin_id, brand_name, platform, marketplace, region,
          profile_id, access_token, refresh_token, token_expiry,
          is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        adminId,
        brandName,
        platform,
        marketplace,
        region,
        profileId || null,
        accessToken || null,
        refreshToken || null,
        tokenExpiry || null,
        true,
        new Date(),
        new Date()
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [Brand.create] Error:', error);
      throw error;
    }
  }

  // Get brands by admin ID
  static async getByAdminId(adminId) {
    try {
      const query = `
        SELECT * FROM brands
        WHERE admin_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [adminId]);
      return result.rows;
    } catch (error) {
      console.error('❌ [Brand.getByAdminId] Error:', error);
      throw error;
    }
  }

  // Get all brands (for MASTER)
  static async getAll() {
    try {
      const query = `
        SELECT b.*, u.name as admin_name, u.email as admin_email
        FROM brands b
        JOIN users u ON b.admin_id = u.id
        ORDER BY b.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ [Brand.getAll] Error:', error);
      throw error;
    }
  }

  // Get brands accessible by USER
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT b.*, uba.can_view, uba.can_edit
        FROM brands b
        JOIN user_brand_access uba ON b.id = uba.brand_id
        WHERE uba.user_id = $1
        ORDER BY b.brand_name
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('❌ [Brand.getByUserId] Error:', error);
      throw error;
    }
  }

  // Update brand tokens
  static async updateTokens(brandId, accessToken, refreshToken, tokenExpiry) {
    try {
      const query = `
        UPDATE brands
        SET access_token = $1, refresh_token = $2, token_expiry = $3, updated_at = $4
        WHERE id = $5
        RETURNING *
      `;
      const values = [accessToken, refreshToken, tokenExpiry, new Date(), brandId];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [Brand.updateTokens] Error:', error);
      throw error;
    }
  }

  // Grant user access to brand
  static async grantAccess(userId, brandId, adminId, canView = true, canEdit = false) {
    try {
      const query = `
        INSERT INTO user_brand_access (user_id, brand_id, admin_id, can_view, can_edit, granted_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, brand_id) 
        DO UPDATE SET can_view = $4, can_edit = $5, granted_at = $6
        RETURNING *
      `;
      const values = [userId, brandId, adminId, canView, canEdit, new Date()];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [Brand.grantAccess] Error:', error);
      throw error;
    }
  }

  // Revoke user access to brand
  static async revokeAccess(userId, brandId) {
    try {
      const query = 'DELETE FROM user_brand_access WHERE user_id = $1 AND brand_id = $2';
      await pool.query(query, [userId, brandId]);
      return true;
    } catch (error) {
      console.error('❌ [Brand.revokeAccess] Error:', error);
      throw error;
    }
  }

  // Delete brand
  static async delete(brandId) {
    try {
      const query = 'DELETE FROM brands WHERE id = $1';
      await pool.query(query, [brandId]);
      return true;
    } catch (error) {
      console.error('❌ [Brand.delete] Error:', error);
      throw error;
    }
  }
}

module.exports = Brand;