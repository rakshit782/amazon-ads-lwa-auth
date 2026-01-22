const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Campaign {
  // Find by user ID
  static async findByUserId(userId) {
    const result = await query(
      `SELECT * FROM campaigns WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
      [userId]
    );
    return result.rows;
  }

  // Find by platform ID
  static async findByPlatformId(platformId) {
    const result = await query(
      'SELECT * FROM campaigns WHERE "platformId" = $1',
      [platformId]
    );
    return result.rows[0] || null;
  }

  // Upsert campaign
  static async upsert(campaignData) {
    const {
      userId,
      platformId,
      name,
      state,
      budget,
      budgetType,
      startDate,
      impressions = 0,
      clicks = 0,
      spend = 0,
      sales = 0,
      orders = 0
    } = campaignData;

    const id = uuidv4();
    const acos = sales > 0 ? (spend / sales * 100) : 0;
    const roas = spend > 0 ? (sales / spend) : 0;
    const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
    const cpc = clicks > 0 ? (spend / clicks) : 0;
    const conversionRate = clicks > 0 ? (orders / clicks * 100) : 0;

    const result = await query(
      `INSERT INTO campaigns (
        id, "userId", "platformId", name, state, budget, "budgetType",
        "startDate", impressions, clicks, spend, sales, orders,
        acos, roas, ctr, cpc, "conversionRate",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("platformId") 
      DO UPDATE SET
        name = EXCLUDED.name,
        state = EXCLUDED.state,
        budget = EXCLUDED.budget,
        "budgetType" = EXCLUDED."budgetType",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        id, userId, platformId, name, state, budget, budgetType,
        startDate, impressions, clicks, spend, sales, orders,
        acos, roas, ctr, cpc, conversionRate
      ]
    );

    return result.rows[0];
  }

  // Get metrics summary
  static async getMetricsSummary(userId) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_campaigns,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(sales), 0) as total_sales,
        COALESCE(SUM(orders), 0) as total_orders,
        COALESCE(AVG(acos), 0) as avg_acos,
        COALESCE(AVG(roas), 0) as avg_roas
      FROM campaigns 
      WHERE "userId" = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Delete campaign
  static async delete(id) {
    await query('DELETE FROM campaigns WHERE id = $1', [id]);
  }
}

module.exports = Campaign;