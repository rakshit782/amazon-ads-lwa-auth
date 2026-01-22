const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { ROLES } = require('../models/User');
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

// MASTER Dashboard - see all brands and their data
exports.getMasterDashboard = async (req, res) => {
  try {
    // Get all ADMIN users (brands)
    const brands = await User.getByRole(ROLES.ADMIN);
    
    // Get aggregated metrics for all brands
    const allMetrics = [];
    
    for (const brand of brands) {
      const metrics = await Campaign.getMetricsSummary(brand.id.toString());
      const campaigns = await Campaign.findByUserId(brand.id.toString());
      
      allMetrics.push({
        brandId: brand.id,
        brandName: brand.name,
        brandEmail: brand.email,
        marketplace: brand.marketplace,
        lastSync: brand.last_sync,
        totalCampaigns: campaigns.length,
        metrics
      });
    }

    // Calculate overall totals
    const overallMetrics = {
      total_brands: brands.length,
      total_campaigns: allMetrics.reduce((sum, b) => sum + parseInt(b.metrics.total_campaigns || 0), 0),
      total_impressions: allMetrics.reduce((sum, b) => sum + parseInt(b.metrics.total_impressions || 0), 0),
      total_clicks: allMetrics.reduce((sum, b) => sum + parseInt(b.metrics.total_clicks || 0), 0),
      total_spend: allMetrics.reduce((sum, b) => sum + parseFloat(b.metrics.total_spend || 0), 0),
      total_sales: allMetrics.reduce((sum, b) => sum + parseFloat(b.metrics.total_sales || 0), 0),
      total_orders: allMetrics.reduce((sum, b) => sum + parseInt(b.metrics.total_orders || 0), 0)
    };

    res.json({
      role: ROLES.MASTER,
      brands: allMetrics,
      overallMetrics
    });
  } catch (error) {
    console.error('Master dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch master dashboard' });
  }
};

// Get all campaigns across all brands (MASTER only)
exports.getAllCampaigns = async (req, res) => {
  try {
    const brands = await User.getByRole(ROLES.ADMIN);
    const allCampaigns = [];

    for (const brand of brands) {
      const campaigns = await Campaign.findByUserId(brand.id.toString());
      allCampaigns.push(...campaigns.map(c => ({
        ...c,
        brandName: brand.name,
        brandEmail: brand.email
      })));
    }

    res.json({ campaigns: allCampaigns });
  } catch (error) {
    console.error('Get all campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

// Get all keywords across all brands (MASTER only)
exports.getAllKeywords = async (req, res) => {
  try {
    const brands = await User.getByRole(ROLES.ADMIN);
    const allKeywords = [];

    for (const brand of brands) {
      const campaigns = await Campaign.findByUserId(brand.id.toString());
      
      for (const campaign of campaigns) {
        const keywords = await Keyword.findByCampaignId(campaign.id);
        allKeywords.push(...keywords.map(kw => ({
          ...kw,
          brandName: brand.name,
          campaignName: campaign.name
        })));
      }
    }

    res.json({ keywords: allKeywords });
  } catch (error) {
    console.error('Get all keywords error:', error);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
};

// Get all brands overview (MASTER only)
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await User.getByRole(ROLES.ADMIN);
    
    const brandsWithStats = await Promise.all(brands.map(async (brand) => {
      const campaigns = await Campaign.findByUserId(brand.id.toString());
      const metrics = await Campaign.getMetricsSummary(brand.id.toString());
      
      return {
        id: brand.id,
        name: brand.name,
        email: brand.email,
        marketplace: brand.marketplace,
        isActive: brand.is_active,
        lastSync: brand.last_sync,
        createdAt: brand.created_at,
        totalCampaigns: campaigns.length,
        ...metrics
      };
    }));

    res.json({ brands: brandsWithStats });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

// Get advertising profiles and store in accounts table
exports.getProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // USER role cannot connect accounts
    if (user.role === ROLES.USER) {
      return res.status(403).json({ error: 'Read-only access. Cannot connect ad accounts.' });
    }

    const profiles = await makeAdsApiRequest(user, '/v2/profiles');
    
    if (profiles.length > 0 && !user.profile_id) {
      await User.updateProfileId(user.id, profiles[0].profileId.toString());
    }

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
    
    // If MASTER, can view specific brand's campaigns via query param
    let userId = user.id.toString();
    if (user.role === ROLES.MASTER && req.query.brandId) {
      userId = req.query.brandId;
    }
    
    const storedCampaigns = await Campaign.findByUserId(userId);
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
    
    let userId = user.id.toString();
    if (user.role === ROLES.MASTER && req.query.brandId) {
      userId = req.query.brandId;
    }

    const campaigns = await Campaign.findByUserId(userId);
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
    
    let userId = user.id.toString();
    if (user.role === ROLES.MASTER && req.query.brandId) {
      userId = req.query.brandId;
    }

    const campaigns = await Campaign.findByUserId(userId);
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
    
    if (user.role === ROLES.USER) {
      return res.status(403).json({ error: 'Read-only access. Cannot fetch audiences.' });
    }

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
    
    let userId = user.id.toString();
    if (user.role === ROLES.MASTER && req.query.brandId) {
      userId = req.query.brandId;
    }

    const summary = await Campaign.getMetricsSummary(userId);
    res.json({ metrics: summary });
  } catch (error) {
    console.error('Get metrics error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.response?.data });
  }
};

// Automate data synchronization - ADMIN and MASTER only
exports.automateSync = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
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
    
    // MASTER gets special dashboard
    if (user.role === ROLES.MASTER) {
      return exports.getMasterDashboard(req, res);
    }
    
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