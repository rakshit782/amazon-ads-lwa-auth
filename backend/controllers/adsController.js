const axios = require('axios');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const AdGroup = require('../models/AdGroup');
const Keyword = require('../models/Keyword');
const Alert = require('../models/Alert');

// Marketplace API endpoints
const MARKETPLACE_CONFIG = {
  NA: { adsEndpoint: 'https://advertising-api.amazon.com' },
  EU: { adsEndpoint: 'https://advertising-api-eu.amazon.com' },
  FE: { adsEndpoint: 'https://advertising-api-fe.amazon.com' }
};

// Get valid access token (auto-refresh if expired)
const getValidAccessToken = async (user) => {
  console.log('\n🔑 [TOKEN] Checking token validity...');
  
  if (!user.access_token || !user.refresh_token) {
    console.log('❌ [TOKEN] No tokens found for user');
    throw new Error('Amazon account not connected. Please connect your Amazon account first.');
  }

  const now = new Date();
  const expiry = new Date(user.token_expiry);
  
  // Token expired - refresh it
  if (now >= expiry) {
    console.log('⏰ [TOKEN] Token expired, refreshing...');
    
    try {
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
      const newExpiry = new Date(Date.now() + expires_in * 1000);
      
      await User.updateAccessToken(user.id, access_token, newExpiry);
      console.log('✅ [TOKEN] Token refreshed successfully');
      
      return access_token;
    } catch (error) {
      console.error('❌ [TOKEN] Refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh Amazon token. Please reconnect your Amazon account.');
    }
  }
  
  console.log('✅ [TOKEN] Token still valid');
  return user.access_token;
};

// Get user's advertising profile
const getAdvertisingProfile = async (accessToken, adsEndpoint) => {
  console.log('\n📋 [PROFILE] Fetching advertising profiles...');
  
  try {
    const response = await axios.get(`${adsEndpoint}/v2/profiles`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Amazon-Advertising-API-ClientId': process.env.LWA_CLIENT_ID,
        'Content-Type': 'application/json'
      }
    });

    const profiles = response.data;
    console.log(`✅ [PROFILE] Found ${profiles.length} profile(s)`);
    
    // Return first profile (or specific profile based on marketplace)
    return profiles[0];
  } catch (error) {
    console.error('❌ [PROFILE] Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch advertising profile');
  }
};

// Get dashboard summary
exports.getDashboard = async (req, res) => {
  try {
    console.log('\n📊 [DASHBOARD] Loading dashboard for user:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get metrics from database
    const metrics = await Campaign.getMetricsSummary(user.id);
    
    console.log('✅ [DASHBOARD] Dashboard loaded');
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        marketplace: user.marketplace,
        last_sync: user.last_sync
      },
      metrics: metrics || {
        total_campaigns: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_spend: 0,
        total_sales: 0,
        total_orders: 0,
        avg_acos: 0,
        avg_roas: 0
      }
    });
  } catch (error) {
    console.error('❌ [DASHBOARD] Error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// Get campaigns
exports.getCampaigns = async (req, res) => {
  try {
    console.log('\n📊 [CAMPAIGNS] Fetching campaigns for user:', req.userId);
    
    const campaigns = await Campaign.findByUserId(req.userId);
    
    console.log(`✅ [CAMPAIGNS] Found ${campaigns.length} campaigns`);
    res.json({ campaigns });
  } catch (error) {
    console.error('❌ [CAMPAIGNS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

// Get ad groups
exports.getAdGroups = async (req, res) => {
  try {
    console.log('\n📁 [AD_GROUPS] Fetching ad groups for user:', req.userId);
    
    const adGroups = await AdGroup.findByUserId(req.userId);
    
    console.log(`✅ [AD_GROUPS] Found ${adGroups.length} ad groups`);
    res.json({ adGroups });
  } catch (error) {
    console.error('❌ [AD_GROUPS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch ad groups' });
  }
};

// Get keywords
exports.getKeywords = async (req, res) => {
  try {
    console.log('\n🔑 [KEYWORDS] Fetching keywords for user:', req.userId);
    
    const keywords = await Keyword.findByUserId(req.userId);
    
    console.log(`✅ [KEYWORDS] Found ${keywords.length} keywords`);
    res.json({ keywords });
  } catch (error) {
    console.error('❌ [KEYWORDS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
};

// Get alerts
exports.getAlerts = async (req, res) => {
  try {
    console.log('\n🔔 [ALERTS] Fetching alerts for user:', req.userId);
    
    const alerts = await Alert.findByUserId(req.userId);
    const unreadCount = alerts.filter(a => !a.isRead).length;
    
    console.log(`✅ [ALERTS] Found ${alerts.length} alerts (${unreadCount} unread)`);
    res.json({ alerts, unreadCount });
  } catch (error) {
    console.error('❌ [ALERTS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Auto-sync from Amazon Ads API
exports.automateSync = async (req, res) => {
  try {
    console.log('\n🔄 [SYNC] Starting automated sync for user:', req.userId);
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(user);
    
    // Get marketplace config
    const config = MARKETPLACE_CONFIG[user.marketplace];
    if (!config) {
      throw new Error('Invalid marketplace configuration');
    }

    // Get advertising profile
    const profile = await getAdvertisingProfile(accessToken, config.adsEndpoint);
    
    // Update user's profile ID
    if (profile && profile.profileId) {
      await User.updateProfileId(user.id, profile.profileId.toString());
      console.log('✅ [SYNC] Profile ID updated:', profile.profileId);
    }

    let syncedData = {
      campaigns: 0,
      adGroups: 0,
      keywords: 0
    };

    // Sync Campaigns
    console.log('\n📊 [SYNC] Syncing campaigns...');
    try {
      const campaignsResponse = await axios.get(`${config.adsEndpoint}/v2/sp/campaigns`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Amazon-Advertising-API-ClientId': process.env.LWA_CLIENT_ID,
          'Amazon-Advertising-API-Scope': profile.profileId,
          'Content-Type': 'application/json'
        }
      });

      const campaigns = campaignsResponse.data;
      console.log(`✅ [SYNC] Fetched ${campaigns.length} campaigns from Amazon`);

      for (const campaign of campaigns) {
        await Campaign.upsert({
          userId: user.id,
          platformId: campaign.campaignId.toString(),
          name: campaign.name,
          state: campaign.state,
          budget: campaign.budget || 0,
          budgetType: campaign.budgetType || 'daily',
          startDate: campaign.startDate ? new Date(campaign.startDate) : new Date()
        });
        syncedData.campaigns++;
      }
    } catch (error) {
      console.error('⚠️ [SYNC] Campaign sync error:', error.response?.data || error.message);
    }

    // Sync Ad Groups
    console.log('\n📁 [SYNC] Syncing ad groups...');
    try {
      const adGroupsResponse = await axios.get(`${config.adsEndpoint}/v2/sp/adGroups`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Amazon-Advertising-API-ClientId': process.env.LWA_CLIENT_ID,
          'Amazon-Advertising-API-Scope': profile.profileId,
          'Content-Type': 'application/json'
        }
      });

      const adGroups = adGroupsResponse.data;
      console.log(`✅ [SYNC] Fetched ${adGroups.length} ad groups from Amazon`);

      for (const adGroup of adGroups) {
        // Find corresponding campaign in our database
        const campaign = await Campaign.findByPlatformId(adGroup.campaignId.toString());
        if (campaign) {
          await AdGroup.upsert({
            userId: user.id,
            campaignId: campaign.id,
            platformId: adGroup.adGroupId.toString(),
            name: adGroup.name,
            state: adGroup.state,
            defaultBid: adGroup.defaultBid || 0
          });
          syncedData.adGroups++;
        }
      }
    } catch (error) {
      console.error('⚠️ [SYNC] Ad group sync error:', error.response?.data || error.message);
    }

    // Sync Keywords
    console.log('\n🔑 [SYNC] Syncing keywords...');
    try {
      const keywordsResponse = await axios.get(`${config.adsEndpoint}/v2/sp/keywords`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Amazon-Advertising-API-ClientId': process.env.LWA_CLIENT_ID,
          'Amazon-Advertising-API-Scope': profile.profileId,
          'Content-Type': 'application/json'
        }
      });

      const keywords = keywordsResponse.data;
      console.log(`✅ [SYNC] Fetched ${keywords.length} keywords from Amazon`);

      for (const keyword of keywords) {
        const campaign = await Campaign.findByPlatformId(keyword.campaignId.toString());
        if (campaign) {
          await Keyword.upsert({
            userId: user.id,
            campaignId: campaign.id,
            platformId: keyword.keywordId.toString(),
            keywordText: keyword.keywordText,
            matchType: keyword.matchType,
            state: keyword.state,
            bid: keyword.bid || 0
          });
          syncedData.keywords++;
        }
      }
    } catch (error) {
      console.error('⚠️ [SYNC] Keyword sync error:', error.response?.data || error.message);
    }

    // Update last sync timestamp
    await User.updateLastSync(user.id);

    console.log('\n✅ [SYNC] Sync completed successfully!');
    console.log(`   📊 Campaigns: ${syncedData.campaigns}`);
    console.log(`   📁 Ad Groups: ${syncedData.adGroups}`);
    console.log(`   🔑 Keywords: ${syncedData.keywords}`);

    res.json({
      success: true,
      message: 'Data synced successfully',
      data: syncedData
    });

  } catch (error) {
    console.error('❌ [SYNC] Sync failed:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to sync data',
      details: error.response?.data
    });
  }
};

// Get audiences
exports.getAudiences = async (req, res) => {
  try {
    console.log('\n👥 [AUDIENCES] Fetching audiences...');
    
    // Audiences require special API access
    // For now, return empty array or fetch from database if stored
    res.json({ 
      audiences: [],
      message: 'Audiences API requires additional permissions'
    });
  } catch (error) {
    console.error('❌ [AUDIENCES] Error:', error);
    res.status(500).json({ error: 'Failed to fetch audiences' });
  }
};