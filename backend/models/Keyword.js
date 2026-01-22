const { query } = require('../config/database');

class Keyword {
  // Find all keywords for a campaign
  static async findByCampaignId(campaignId) {
    const result = await query(
      'SELECT * FROM keywords WHERE "campaignId" = $1 ORDER BY spend DESC',
      [campaignId]
    );
    return result.rows;
  }

  // Find all keywords for an ad group
  static async findByAdGroupId(adGroupId) {
    const result = await query(
      'SELECT * FROM keywords WHERE "adGroupId" = $1 ORDER BY spend DESC',
      [adGroupId]
    );
    return result.rows;
  }

  // Find keyword by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM keywords WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Create or update keyword
  static async upsert(keywordData) {
    const {
      id, campaignId, adGroupId, platformId, keywordText, matchType, state, bid,
      impressions, clicks, spend, sales, orders, acos, ctr, cpc, cvr
    } = keywordData;

    const result = await query(
      `INSERT INTO keywords (
        id, "campaignId", "adGroupId", "platformId", "keywordText", "matchType",
        state, bid, impressions, clicks, spend, sales, orders,
        acos, ctr, cpc, cvr, "lastSyncAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        "keywordText" = EXCLUDED."keywordText",
        "matchType" = EXCLUDED."matchType",
        state = EXCLUDED.state,
        bid = EXCLUDED.bid,
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        spend = EXCLUDED.spend,
        sales = EXCLUDED.sales,
        orders = EXCLUDED.orders,
        acos = EXCLUDED.acos,
        ctr = EXCLUDED.ctr,
        cpc = EXCLUDED.cpc,
        cvr = EXCLUDED.cvr,
        "lastSyncAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [id, campaignId, adGroupId, platformId, keywordText, matchType, state, bid,
       impressions || 0, clicks || 0, spend || 0, sales || 0, orders || 0,
       acos, ctr, cpc, cvr]
    );

    return result.rows[0];
  }

  // Get top performing keywords
  static async getTopPerformers(campaignId, limit = 10) {
    const result = await query(
      `SELECT * FROM keywords 
       WHERE "campaignId" = $1 AND sales > 0
       ORDER BY sales DESC, acos ASC
       LIMIT $2`,
      [campaignId, limit]
    );
    return result.rows;
  }

  // Delete keyword
  static async delete(id) {
    await query('DELETE FROM keywords WHERE id = $1', [id]);
  }
}

module.exports = Keyword;