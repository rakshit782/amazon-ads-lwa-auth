const { query } = require('../config/database');

class AdGroup {
  // Find all ad groups for a campaign
  static async findByCampaignId(campaignId) {
    const result = await query(
      'SELECT * FROM ad_groups WHERE "campaignId" = $1 ORDER BY "createdAt" DESC',
      [campaignId]
    );
    return result.rows;
  }

  // Find ad group by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM ad_groups WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Find by platform ID
  static async findByPlatformId(platformId) {
    const result = await query(
      'SELECT * FROM ad_groups WHERE "platformId" = $1',
      [platformId]
    );
    return result.rows[0] || null;
  }

  // Create or update ad group
  static async upsert(adGroupData) {
    const {
      id, campaignId, platformId, name, state, defaultBid,
      impressions, clicks, spend, sales, orders
    } = adGroupData;

    const result = await query(
      `INSERT INTO ad_groups (
        id, "campaignId", "platformId", name, state, "defaultBid",
        impressions, clicks, spend, sales, orders,
        "lastSyncAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        state = EXCLUDED.state,
        "defaultBid" = EXCLUDED."defaultBid",
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        spend = EXCLUDED.spend,
        sales = EXCLUDED.sales,
        orders = EXCLUDED.orders,
        "lastSyncAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [id, campaignId, platformId, name, state, defaultBid,
       impressions || 0, clicks || 0, spend || 0, sales || 0, orders || 0]
    );

    return result.rows[0];
  }

  // Update metrics
  static async updateMetrics(id, metrics) {
    const { impressions, clicks, spend, sales, orders } = metrics;
    
    const result = await query(
      `UPDATE ad_groups 
       SET impressions = $1, clicks = $2, spend = $3, sales = $4, orders = $5,
           "lastSyncAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [impressions, clicks, spend, sales, orders, id]
    );
    
    return result.rows[0];
  }

  // Delete ad group
  static async delete(id) {
    await query('DELETE FROM ad_groups WHERE id = $1', [id]);
  }
}

module.exports = AdGroup;