const { query } = require('../config/database');

class Alert {
  // Find all alerts for a user
  static async findByUserId(userId, isRead = null) {
    let queryText = 'SELECT * FROM alerts WHERE "userId" = $1';
    const params = [userId];
    
    if (isRead !== null) {
      queryText += ' AND "isRead" = $2';
      params.push(isRead);
    }
    
    queryText += ' ORDER BY "createdAt" DESC';
    
    const result = await query(queryText, params);
    return result.rows;
  }

  // Find alert by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM alerts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Create new alert
  static async create(alertData) {
    const { id, userId, campaignId, type, severity, message, metadata } = alertData;
    
    const result = await query(
      `INSERT INTO alerts (id, "userId", "campaignId", type, severity, message, "isRead", metadata, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, false, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, campaignId, type, severity, message, JSON.stringify(metadata || {})]
    );
    
    return result.rows[0];
  }

  // Mark alert as read
  static async markAsRead(id) {
    const result = await query(
      'UPDATE alerts SET "isRead" = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Mark all alerts as read for user
  static async markAllAsRead(userId) {
    await query(
      'UPDATE alerts SET "isRead" = true WHERE "userId" = $1',
      [userId]
    );
  }

  // Delete alert
  static async delete(id) {
    await query('DELETE FROM alerts WHERE id = $1', [id]);
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM alerts WHERE "userId" = $1 AND "isRead" = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Alert;