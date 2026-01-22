const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AdGroup {
  // Find by user ID
  static async findByUserId(userId) {
    const result = await query(
      `SELECT ag.*, c.name as campaign_name 
       FROM ad_groups ag
       LEFT JOIN campaigns c ON ag."campaignId" = c.id
       WHERE ag."userId" = $1 
       ORDER BY ag."createdAt" DESC`,
      [userId]
    );
    return result.rows;
  }

  // Find by campaign ID
  static async findByCampaignId(campaignId) {
    const result = await query(
      'SELECT * FROM ad_groups WHERE "campaignId" = $1',
      [campaignId]
    );
    return result.rows;
  }

  // Upsert ad group
  static async upsert(adGroupData) {
    const {
      userId,
      campaignId,
      platformId,
      name,
      state,
      defaultBid,
      impressions = 0,
      clicks = 0,
      spend = 0,
      sales = 0
    } = adGroupData;

    const id = uuidv4();

    const result = await query(
      `INSERT INTO ad_groups (
        id, "userId", "campaignId", "platformId", name, state, "defaultBid",
        impressions, clicks, spend, sales,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("platformId") 
      DO UPDATE SET
        name = EXCLUDED.name,
        state = EXCLUDED.state,
        "defaultBid" = EXCLUDED."defaultBid",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [id, userId, campaignId, platformId, name, state, defaultBid, impressions, clicks, spend, sales]
    );

    return result.rows[0];
  }
}

module.exports = AdGroup;