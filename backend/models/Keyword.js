const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Keyword {
  // Find by user ID
  static async findByUserId(userId) {
    const result = await query(
      `SELECT k.*, c.name as campaign_name 
       FROM keywords k
       LEFT JOIN campaigns c ON k."campaignId" = c.id
       WHERE k."userId" = $1 
       ORDER BY k."createdAt" DESC`,
      [userId]
    );
    return result.rows;
  }

  // Find by campaign ID
  static async findByCampaignId(campaignId) {
    const result = await query(
      'SELECT * FROM keywords WHERE "campaignId" = $1',
      [campaignId]
    );
    return result.rows;
  }

  // Upsert keyword
  static async upsert(keywordData) {
    const {
      userId,
      campaignId,
      platformId,
      keywordText,
      matchType,
      state,
      bid,
      impressions = 0,
      clicks = 0,
      spend = 0,
      sales = 0
    } = keywordData;

    const id = uuidv4();
    const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
    const cpc = clicks > 0 ? (spend / clicks) : 0;
    const acos = sales > 0 ? (spend / sales * 100) : 0;

    const result = await query(
      `INSERT INTO keywords (
        id, "userId", "campaignId", "platformId", "keywordText", "matchType",
        state, bid, impressions, clicks, spend, sales, ctr, cpc, acos,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("platformId") 
      DO UPDATE SET
        "keywordText" = EXCLUDED."keywordText",
        "matchType" = EXCLUDED."matchType",
        state = EXCLUDED.state,
        bid = EXCLUDED.bid,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [id, userId, campaignId, platformId, keywordText, matchType, state, bid, impressions, clicks, spend, sales, ctr, cpc, acos]
    );

    return result.rows[0];
  }
}

module.exports = Keyword;