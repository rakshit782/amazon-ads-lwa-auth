const { query } = require('../config/database');

class OptimizationRule {
  // Find all rules for a user
  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM optimization_rules WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    return result.rows;
  }

  // Find enabled rules for a user
  static async findEnabledByUserId(userId) {
    const result = await query(
      'SELECT * FROM optimization_rules WHERE "userId" = $1 AND enabled = true',
      [userId]
    );
    return result.rows;
  }

  // Find rule by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM optimization_rules WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Create new rule
  static async create(ruleData) {
    const { id, userId, name, type, enabled, conditions, actions } = ruleData;
    
    const result = await query(
      `INSERT INTO optimization_rules (id, "userId", name, type, enabled, conditions, actions, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, name, type, enabled || false, JSON.stringify(conditions), JSON.stringify(actions)]
    );
    
    return result.rows[0];
  }

  // Update rule
  static async update(id, ruleData) {
    const { name, type, enabled, conditions, actions } = ruleData;
    
    const result = await query(
      `UPDATE optimization_rules 
       SET name = $1, type = $2, enabled = $3, conditions = $4, actions = $5, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, type, enabled, JSON.stringify(conditions), JSON.stringify(actions), id]
    );
    
    return result.rows[0];
  }

  // Update last run timestamp
  static async updateLastRun(id) {
    const result = await query(
      'UPDATE optimization_rules SET "lastRunAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Toggle rule enabled status
  static async toggle(id) {
    const result = await query(
      'UPDATE optimization_rules SET enabled = NOT enabled, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Delete rule
  static async delete(id) {
    await query('DELETE FROM optimization_rules WHERE id = $1', [id]);
  }
}

module.exports = OptimizationRule;