const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getTokenEndpoint, getAuthEndpoint } = require('../utils/amazonAds');

// Marketplace endpoints
const MARKETPLACE_CONFIG = {
  NA: {
    region: 'na',
    authEndpoint: 'https://www.amazon.com/ap/oa',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    adsEndpoint: 'https://advertising-api.amazon.com'
  },
  EU: {
    region: 'eu',
    authEndpoint: 'https://eu.account.amazon.com/ap/oa',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    adsEndpoint: 'https://advertising-api-eu.amazon.com'
  },
  FE: {
    region: 'fe',
    authEndpoint: 'https://apac.account.amazon.com/ap/oa',
    tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    adsEndpoint: 'https://advertising-api-fe.amazon.com'
  }
};

// Generate JWT token
const generateJWT = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Get authorization URL with audiences scope
exports.getAuthUrl = async (req, res) => {
  try {
    const { marketplace, email, name } = req.body;

    if (!marketplace || !email || !name) {
      return res.status(400).json({ error: 'Marketplace, email, and name are required' });
    }

    const config = MARKETPLACE_CONFIG[marketplace];
    if (!config) {
      return res.status(400).json({ error: 'Invalid marketplace' });
    }

    // Create state parameter with user info
    const state = Buffer.from(JSON.stringify({ email, name, marketplace })).toString('base64');

    // Include audiences scope in the authorization URL
    const scopes = process.env.AMAZON_ADS_API_SCOPE || 'advertising::campaign_management advertising::audiences';
    
    const authUrl = `${config.authEndpoint}?client_id=${process.env.LWA_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&state=${state}`;

    res.json({ authUrl, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
};

// Handle OAuth callback
exports.handleCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=authorization_failed`);
  }

  try {
    // Decode state to get user info
    const userInfo = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Redirect to frontend with code and state
    res.redirect(`${process.env.FRONTEND_URL}?code=${code}&state=${state}`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=callback_failed`);
  }
};

// Exchange authorization code for tokens
exports.exchangeToken = async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ error: 'Code and state are required' });
    }

    // Decode state
    const userInfo = JSON.parse(Buffer.from(state, 'base64').toString());
    const config = MARKETPLACE_CONFIG[userInfo.marketplace];

    // Exchange code for tokens
    const tokenResponse = await axios.post(config.tokenEndpoint, 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.LWA_CLIENT_ID,
        client_secret: process.env.LWA_CLIENT_SECRET
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Save or update user in database
    let user = await User.findByEmail(userInfo.email);
    
    if (user) {
      // Update existing user
      user = await User.updateTokens(
        userInfo.email,
        refresh_token,
        access_token,
        tokenExpiry
      );
    } else {
      // Create new user
      user = await User.create({
        email: userInfo.email,
        name: userInfo.name,
        marketplace: userInfo.marketplace,
        region: config.region,
        refreshToken: refresh_token,
        accessToken: access_token,
        tokenExpiry: tokenExpiry
      });
    }

    // Generate JWT for our app
    const appToken = generateJWT(user.id);

    res.json({
      success: true,
      token: appToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        marketplace: user.marketplace
      }
    });
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token', details: error.response?.data });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.getPublicProfile(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Refresh access token
exports.refreshAccessToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.refresh_token) {
      return res.status(400).json({ error: 'No refresh token available' });
    }

    const config = MARKETPLACE_CONFIG[user.marketplace];

    const tokenResponse = await axios.post(config.tokenEndpoint,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.refresh_token,
        client_id: process.env.LWA_CLIENT_ID,
        client_secret: process.env.LWA_CLIENT_SECRET
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in } = tokenResponse.data;
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    await User.updateAccessToken(user.id, access_token, tokenExpiry);

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};