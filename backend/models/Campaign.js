const { query } = require('../config/database');

class Campaign {
  // Find all campaigns for a user
  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM campaigns WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    return result.rows;
  }

  // Find campaign by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM campaigns WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Find by platform ID
  static async findByPlatformId(platformId) {
    const result = await query(
      'SELECT * FROM campaigns WHERE "platformId" = $1',
      [platformId]
    );
    return result.rows[0] || null;
  }

  // Create or update campaign
  static async upsert(campaignData) {
    const {
      id, userId, platformId, name, state, targetingType, budget, budgetType,
      startDate, endDate, premiumBidAdjustment, impressions, clicks, spend,
      sales, orders, acos, roas, ctr, cpc, cvr
    } = campaignData;

    const result = await query(
      `INSERT INTO campaigns (
        id, "userId", "platformId", name, state, "targetingType", budget, "budgetType",
        "startDate", "endDate", "premiumBidAdjustment", impressions, clicks, spend,
        sales, orders, acos, roas, ctr, cpc, cvr, "lastSyncAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        state = EXCLUDED.state,
        "targetingType" = EXCLUDED."targetingType",
        budget = EXCLUDED.budget,
        "budgetType" = EXCLUDED."budgetType",
        "startDate" = EXCLUDED."startDate",
        "endDate" = EXCLUDED."endDate",
        "premiumBidAdjustment" = EXCLUDED."premiumBidAdjustment",
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        spend = EXCLUDED.spend,
        sales = EXCLUDED.sales,
        orders = EXCLUDED.orders,
        acos = EXCLUDED.acos,
        roas = EXCLUDED.roas,
        ctr = EXCLUDED.ctr,
        cpc = EXCLUDED.cpc,
        cvr = EXCLUDED.cvr,
        "lastSyncAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [id, userId, platformId, name, state, targetingType, budget, budgetType,
       startDate, endDate, premiumBidAdjustment || false, impressions || 0, clicks || 0,
       spend || 0, sales || 0, orders || 0, acos, roas, ctr, cpc, cvr]
    );

    return result.rows[0];
  }

  // Update metrics
  static async updateMetrics(id, metrics) {
    const { impressions, clicks, spend, sales, orders, acos, roas, ctr, cpc, cvr } = metrics;
    
    const result = await query(
      `UPDATE campaigns 
       SET impressions = $1, clicks = $2, spend = $3, sales = $4, orders = $5,
           acos = $6, roas = $7, ctr = $8, cpc = $9, cvr = $10,
           "lastSyncAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [impressions, clicks, spend, sales, orders, acos, roas, ctr, cpc, cvr, id]
    );
    
    return result.rows[0];
  }

  // Get campaigns with metrics summary
  static async getMetricsSummary(userId) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_campaigns,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(spend) as total_spend,
        SUM(sales) as total_sales,
        SUM(orders) as total_orders,
        AVG(acos) as avg_acos,
        AVG(roas) as avg_roas
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