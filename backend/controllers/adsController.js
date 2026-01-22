const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Account = require('../models/Account');
const Campaign = require('../models/Campaign');
const AdGroup = require('../models/AdGroup');
const Keyword = require('../models/Keyword');
const Alert = require('../models/Alert');

const MARKETPLACE_CONFIG = {
  NA: { adsEndpoint: 'https://advertising-api.amazon.com' },
  EU: { adsEndpoint: 'https://advertising-api-eu.amazon.com' },
  FE: { adsEndpoint: 'https://advertising-api-fe.amazon.com' }
};

// Helper to get valid access token
const getValidAccessToken = async (user) => {
  if (new Date() >= new Date(user.token_expiry)) {
    const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.refresh_token,
        client_id: process.env.LWA_CLIENT_ID,
        client_secret: process.env.LWA_CLIENT_SECRET
      }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = tokenResponse.data;
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);
    
    await User.updateAccessToken(user.id, access_token, tokenExpiry);
    return access_token;
  }
  return user.access_token;
};

// Helper for API requests
const makeAdsApiRequest = async (user, endpoint, method = 'GET', data = null) => {
  const accessToken = await getValidAccessToken(user);
  const config = MARKETPLACE_CONFIG[user.marketplace];
  
  const options = {
    method,
    url: `${config.adsEndpoint}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Amazon-Advertising-API-ClientId': process.env.LWA_CLIENT_ID,
      'Content-Type': 'application/json'
    }
  };

  if (user.profile_id) {
    options.headers['Amazon-Advertising-API-Scope'] = user.profile_id;
  }

  if (data) {
    options.data = data;
  }

  const response = await axios(options);
  return response.data;
};

// Get advertising profiles and store in accounts table
exports.getProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const profiles = await makeAdsApiRequest(user, '/v2/profiles');
    
    // Save first profile ID if not set
    if (profiles.length > 0 && !user.profile_id) {
      await User.updateProfileId(user.id, profiles[0].profileId.toString());
    }

    // Store in accounts table
    for (const profile of profiles) {
      const existing = await Account.findByPlatformAndUser('amazon', user.id.toString());
      if (!existing) {
        await Account.create({
          id: uuidv4(),
          userId: user.id.toString(),
          platform: 'amazon',
          profileId: profile.profileId.toString(),
          accessToken: user.access_token,
          refreshToken: user.refresh_token,
          tokenExpiresAt: user.token_expiry,
          scope: process.env.AMAZON_ADS_API_SCOPE
        });
      }
    }

    res.json({ profiles });
  } catch (error) {
    console.error('Get profiles error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch profiles', details: error.response?.data });
  }
};

// Get campaigns and store in database
exports.getCampaigns = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const campaigns = await makeAdsApiRequest(user, '/v2/sp/campaigns');
    
    // Store campaigns in database
    for (const campaign of campaigns) {
      await Campaign.upsert({
        id: uuidv4(),
        userId: user.id.toString(),
        platformId: campaign.campaignId.toString(),
        name: campaign.name,
        state: campaign.state,
        targetingType: campaign.targetingType,
        budget: campaign.budget,
        budgetType: campaign.budgetType,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        premiumBidAdjustment: campaign.premiumBidAdjustment || false,
        impressions: 0,
        clicks: 0,
        spend: 0,
        sales: 0,
        orders: 0
      });
    }

    // Get campaigns from database
    const storedCampaigns = await Campaign.findByUserId(user.id.toString());
    
    res.json({ campaigns: storedCampaigns });
  } catch (error) {
    console.error('Get campaigns error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch campaigns', details: error.response?.data });
  }
};

// Get ad groups and store in database
exports.getAdGroups = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const adGroups = await makeAdsApiRequest(user, '/v2/sp/adGroups');
    
    // Store ad groups in database
    for (const adGroup of adGroups) {
      const campaign = await Campaign.findByPlatformId(adGroup.campaignId.toString());
      
      if (campaign) {
        await AdGroup.upsert({
          id: uuidv4(),
          campaignId: campaign.id,
          platformId: adGroup.adGroupId.toString(),
          name: adGroup.name,
          state: adGroup.state,
          defaultBid: adGroup.defaultBid,
          impressions: 0,
          clicks: 0,
          spend: 0,
          sales: 0,
          orders: 0
        });
      }
    }

    // Return all ad groups for user's campaigns
    const campaigns = await Campaign.findByUserId(user.id.toString());
    let storedAdGroups = [];
    for (const campaign of campaigns) {
      const groups = await AdGroup.findByCampaignId(campaign.id);
      storedAdGroups.push(...groups);
    }
    
    res.json({ adGroups: storedAdGroups });
  } catch (error) {
    console.error('Get ad groups error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch ad groups', details: error.response?.data });
  }
};

// Get keywords and store in database
exports.getKeywords = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const keywords = await makeAdsApiRequest(user, '/v2/sp/keywords');
    
    // Store keywords in database
    for (const keyword of keywords) {
      const campaign = await Campaign.findByPlatformId(keyword.campaignId.toString());
      const adGroup = keyword.adGroupId ? await AdGroup.findByPlatformId(keyword.adGroupId.toString()) : null;
      
      if (campaign) {
        await Keyword.upsert({
          id: uuidv4(),
          campaignId: campaign.id,
          adGroupId: adGroup?.id || null,
          platformId: keyword.keywordId.toString(),
          keywordText: keyword.keywordText,
          matchType: keyword.matchType,
          state: keyword.state,
          bid: keyword.bid,
          impressions: 0,
          clicks: 0,
          spend: 0,
          sales: 0,
          orders: 0
        });
      }
    }

    // Return all keywords for user's campaigns
    const campaigns = await Campaign.findByUserId(user.id.toString());
    let storedKeywords = [];
    for (const campaign of campaigns) {
      const kws = await Keyword.findByCampaignId(campaign.id);
      storedKeywords.push(...kws);
    }
    
    res.json({ keywords: storedKeywords });
  } catch (error) {
    console.error('Get keywords error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch keywords', details: error.response?.data });
  }
};

// Get audiences
exports.getAudiences = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const audiences = await makeAdsApiRequest(user, '/v2/stores/audiences');
    
    res.json({ audiences });
  } catch (error) {
    console.error('Get audiences error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch audiences', details: error.response?.data });
  }
};

// Get campaign metrics from database
exports.getCampaignMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const summary = await Campaign.getMetricsSummary(user.id.toString());
    
    res.json({ metrics: summary });
  } catch (error) {
    console.error('Get metrics error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.response?.data });
  }
};

// Automate data synchronization - comprehensive sync
exports.automateSync = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Fetch all data from Amazon
    const [profiles, campaigns, adGroups, keywords] = await Promise.all([
      makeAdsApiRequest(user, '/v2/profiles'),
      makeAdsApiRequest(user, '/v2/sp/campaigns'),
      makeAdsApiRequest(user, '/v2/sp/adGroups'),
      makeAdsApiRequest(user, '/v2/sp/keywords')
    ]);

    let syncedCounts = {
      profiles: profiles.length,
      campaigns: 0,
      adGroups: 0,
      keywords: 0
    };

    // Sync campaigns
    for (const campaign of campaigns) {
      await Campaign.upsert({
        id: uuidv4(),
        userId: user.id.toString(),
        platformId: campaign.campaignId.toString(),
        name: campaign.name,
        state: campaign.state,
        targetingType: campaign.targetingType,
        budget: campaign.budget,
        budgetType: campaign.budgetType,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        premiumBidAdjustment: campaign.premiumBidAdjustment || false,
        impressions: 0,
        clicks: 0,
        spend: 0,
        sales: 0,
        orders: 0
      });
      syncedCounts.campaigns++;
    }

    // Sync ad groups
    for (const adGroup of adGroups) {
      const campaign = await Campaign.findByPlatformId(adGroup.campaignId.toString());
      if (campaign) {
        await AdGroup.upsert({
          id: uuidv4(),
          campaignId: campaign.id,
          platformId: adGroup.adGroupId.toString(),
          name: adGroup.name,
          state: adGroup.state,
          defaultBid: adGroup.defaultBid,
          impressions: 0,
          clicks: 0,
          spend: 0,
          sales: 0,
          orders: 0
        });
        syncedCounts.adGroups++;
      }
    }

    // Sync keywords
    for (const keyword of keywords) {
      const campaign = await Campaign.findByPlatformId(keyword.campaignId.toString());
      if (campaign) {
        await Keyword.upsert({
          id: uuidv4(),
          campaignId: campaign.id,
          adGroupId: null,
          platformId: keyword.keywordId.toString(),
          keywordText: keyword.keywordText,
          matchType: keyword.matchType,
          state: keyword.state,
          bid: keyword.bid,
          impressions: 0,
          clicks: 0,
          spend: 0,
          sales: 0,
          orders: 0
        });
        syncedCounts.keywords++;
      }
    }

    await User.updateLastSync(user.id);

    res.json({
      success: true,
      data: syncedCounts,
      lastSync: new Date()
    });
  } catch (error) {
    console.error('Automate sync error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to sync data', details: error.response?.data });
  }
};

// Get dashboard summary
exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const [campaigns, metrics, alerts] = await Promise.all([
      Campaign.findByUserId(user.id.toString()),
      Campaign.getMetricsSummary(user.id.toString()),
      Alert.findByUserId(user.id.toString(), false)
    ]);

    res.json({
      user: await User.getPublicProfile(user.id),
      campaigns: campaigns.slice(0, 5),
      metrics,
      unreadAlerts: alerts.length
    });
  } catch (error) {
    console.error('Get dashboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// Get alerts
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.findByUserId(req.userId.toString());
    const unreadCount = await Alert.getUnreadCount(req.userId.toString());
    
    res.json({ alerts, unreadCount });
  } catch (error) {
    console.error('Get alerts error:', error.message);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Mark alert as read
exports.markAlertRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.markAsRead(id);
    
    res.json({ alert });
  } catch (error) {
    console.error('Mark alert read error:', error.message);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};