const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Alert {
  // Find by user ID
  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM alerts WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    return result.rows;
  }

  // Create alert
  static async create(alertData) {
    const { userId, type, severity, message } = alertData;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO alerts (id, "userId", type, severity, message, "isRead", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, type, severity, message]
    );

    return result.rows[0];
  }

  // Mark as read
  static async markAsRead(id) {
    await query(
      'UPDATE alerts SET "isRead" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  // Mark all as read for user
  static async markAllAsRead(userId) {
    await query(
      'UPDATE alerts SET "isRead" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1',
      [userId]
    );
  }
}

module.exports = Alert;