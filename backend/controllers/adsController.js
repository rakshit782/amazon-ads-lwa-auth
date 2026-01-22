const axios = require('axios');
const User = require('../models/User');

const MARKETPLACE_CONFIG = {
  NA: { adsEndpoint: 'https://advertising-api.amazon.com' },
  EU: { adsEndpoint: 'https://advertising-api-eu.amazon.com' },
  FE: { adsEndpoint: 'https://advertising-api-fe.amazon.com' }
};

// Helper to get valid access token
const getValidAccessToken = async (user) => {
  if (new Date() >= new Date(user.token_expiry)) {
    // Token expired, refresh it
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

// Get advertising profiles
exports.getProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const profiles = await makeAdsApiRequest(user, '/v2/profiles');
    
    // Save first profile ID if not set
    if (profiles.length > 0 && !user.profile_id) {
      await User.updateProfileId(user.id, profiles[0].profileId.toString());
    }

    res.json({ profiles });
  } catch (error) {
    console.error('Get profiles error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch profiles', details: error.response?.data });
  }
};

// Get campaigns
exports.getCampaigns = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const campaigns = await makeAdsApiRequest(user, '/v2/sp/campaigns');
    
    res.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch campaigns', details: error.response?.data });
  }
};

// Get ad groups
exports.getAdGroups = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const adGroups = await makeAdsApiRequest(user, '/v2/sp/adGroups');
    
    res.json({ adGroups });
  } catch (error) {
    console.error('Get ad groups error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch ad groups', details: error.response?.data });
  }
};

// Get keywords
exports.getKeywords = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const keywords = await makeAdsApiRequest(user, '/v2/sp/keywords');
    
    res.json({ keywords });
  } catch (error) {
    console.error('Get keywords error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch keywords', details: error.response?.data });
  }
};

// Get audiences (NEW - using audiences scope)
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

// Get campaign metrics
exports.getCampaignMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { startDate, endDate } = req.query;
    
    const reportBody = {
      reportDate: startDate || new Date().toISOString().split('T')[0],
      metrics: ['impressions', 'clicks', 'cost', 'sales', 'orders']
    };

    const metrics = await makeAdsApiRequest(user, '/v2/sp/campaigns/report', 'POST', reportBody);
    
    res.json({ metrics });
  } catch (error) {
    console.error('Get metrics error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.response?.data });
  }
};

// Automate data synchronization (including audiences)
exports.automateSync = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Fetch all data including audiences
    const [profiles, campaigns, adGroups, keywords, audiences] = await Promise.all([
      makeAdsApiRequest(user, '/v2/profiles'),
      makeAdsApiRequest(user, '/v2/sp/campaigns'),
      makeAdsApiRequest(user, '/v2/sp/adGroups'),
      makeAdsApiRequest(user, '/v2/sp/keywords'),
      makeAdsApiRequest(user, '/v2/stores/audiences').catch(() => [])
    ]);

    await User.updateLastSync(user.id);

    res.json({
      success: true,
      data: {
        profiles: profiles.length,
        campaigns: campaigns.length,
        adGroups: adGroups.length,
        keywords: keywords.length,
        audiences: audiences.length || 0
      },
      lastSync: new Date()
    });
  } catch (error) {
    console.error('Automate sync error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to sync data', details: error.response?.data });
  }
};