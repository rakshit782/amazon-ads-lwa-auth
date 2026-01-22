const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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

// Helper function to get auth endpoint
const getAuthEndpoint = (marketplace) => {
  return MARKETPLACE_CONFIG[marketplace]?.authEndpoint || MARKETPLACE_CONFIG.NA.authEndpoint;
};

// Helper function to get token endpoint
const getTokenEndpoint = (marketplace) => {
  return MARKETPLACE_CONFIG[marketplace]?.tokenEndpoint || MARKETPLACE_CONFIG.NA.tokenEndpoint;
};

// Generate JWT token
const generateJWT = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ==================== EMAIL/PASSWORD AUTHENTICATION ====================

// Register new user
exports.register = async (req, res) => {
  try {
    console.log('\n📝 [REGISTER] New user registration...');
    const { email, password, name, marketplace = 'NA', role: requestedRole, organizationName } = req.body;

    if (!email || !password || !name) {
      console.log('❌ [REGISTER] Missing required fields');
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      console.log('❌ [REGISTER] Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // 🔒 SECURITY: Block MASTER role creation via API
    if (requestedRole === 'MASTER') {
      console.log('❌ [REGISTER] Attempted MASTER role creation blocked');
      return res.status(403).json({ 
        error: 'Forbidden: MASTER role can only be created directly in database' 
      });
    }

    console.log('🔍 [REGISTER] Checking if user exists...');
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ [REGISTER] User already exists:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    console.log('🔄 [REGISTER] Creating new user...');
    const config = MARKETPLACE_CONFIG[marketplace];
    
    // Default role is ADMIN for public registration
    const userRole = 'ADMIN';
    
    const user = await User.create({
      email,
      password,
      name,
      marketplace,
      region: config.region,
      role: userRole,
      organizationName: organizationName || null
    });

    console.log('✅ [REGISTER] User created successfully!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);

    const token = generateJWT(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully as ADMIN',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        marketplace: user.marketplace,
        organizationName: user.organization_name
      }
    });
  } catch (error) {
    console.error('❌ [REGISTER] Error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    console.log('\n🔐 [LOGIN] User login attempt...');
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ [LOGIN] Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('🔍 [LOGIN] Looking up user:', email);
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ [LOGIN] User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('🔍 [LOGIN] Verifying password...');
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Invalid password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      console.log('❌ [LOGIN] User account is inactive');
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    console.log('✅ [LOGIN] Login successful!');
    console.log('   User ID:', user.id);
    console.log('   Role:', user.role);

    const token = generateJWT(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        marketplace: user.marketplace,
        organizationName: user.organization_name,
        hasAmazonAuth: !!(user.refresh_token && user.access_token)
      }
    });
  } catch (error) {
    console.error('❌ [LOGIN] Error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    console.log('\n👤 [PROFILE] Getting user profile for ID:', req.userId);
    const user = await User.findById(req.userId);
    
    if (!user) {
      console.log('❌ [PROFILE] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ [PROFILE] User profile retrieved:', user.email);
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        marketplace: user.marketplace,
        region: user.region,
        organizationName: user.organization_name,
        profile_id: user.profile_id,
        is_active: user.is_active,
        last_sync: user.last_sync,
        created_at: user.created_at,
        hasAmazonAuth: !!(user.refresh_token && user.access_token)
      }
    });
  } catch (error) {
    console.error('❌ [PROFILE] Error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, organizationName } = req.body;
    
    if (!name && !organizationName) {
      return res.status(400).json({ error: 'Name or organization name is required' });
    }

    await User.updateProfile(req.userId, { name, organizationName });
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('❌ [UPDATE_PROFILE] Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const user = await User.findById(req.userId);
    const isValid = await User.verifyPassword(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await User.updatePassword(req.userId, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ [CHANGE_PASSWORD] Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Disconnect Amazon
exports.disconnectAmazon = async (req, res) => {
  try {
    await User.disconnectAmazon(req.userId);
    res.json({ success: true, message: 'Amazon account disconnected' });
  } catch (error) {
    console.error('❌ [DISCONNECT] Error:', error);
    res.status(500).json({ error: 'Failed to disconnect Amazon account' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // 🔒 SECURITY: Prevent MASTER account deletion
    if (user.role === 'MASTER') {
      return res.status(403).json({ 
        error: 'Forbidden: MASTER account cannot be deleted via API' 
      });
    }

    await User.deleteAccount(req.userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ [DELETE_ACCOUNT] Error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// ==================== AMAZON OAUTH ====================

// Generate Amazon authorization URL
exports.getAuthUrl = async (req, res) => {
  try {
    console.log('\n📝 [AUTH] Generating authorization URL...');
    const { email, name, marketplace = 'NA', organizationName } = req.body;

    if (!email || !name) {
      console.log('❌ [AUTH] Missing required fields');
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const config = MARKETPLACE_CONFIG[marketplace];
    const authEndpoint = getAuthEndpoint(marketplace);
    
    const authUrl = `${authEndpoint}?` + new URLSearchParams({
      client_id: process.env.LWA_CLIENT_ID,
      scope: process.env.AMAZON_ADS_API_SCOPE,
      response_type: 'code',
      redirect_uri: process.env.REDIRECT_URI,
      state: JSON.stringify({ 
        email, 
        name, 
        marketplace, 
        region: config.region,
        organizationName: organizationName || null
      })
    });

    console.log('✅ [AUTH] Authorization URL generated successfully');
    console.log('   Marketplace:', marketplace);
    console.log('   Email:', email);

    res.json({ authUrl });
  } catch (error) {
    console.error('❌ [AUTH] Error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
};

// Handle OAuth callback
exports.handleCallback = async (req, res) => {
  try {
    console.log('\n📥 [CALLBACK] OAuth callback received');
    const { code, state } = req.query;

    if (!code) {
      console.log('❌ [CALLBACK] No authorization code received');
      return res.redirect(`${process.env.FRONTEND_URL}/error.html?error=no_code`);
    }

    console.log('✅ [CALLBACK] Code received:', code.substring(0, 20) + '...');
    
    const stateData = JSON.parse(state);
    console.log('✅ [CALLBACK] State data:', stateData);

    res.redirect(`${process.env.FRONTEND_URL}/callback.html?code=${code}&state=${encodeURIComponent(state)}`);
  } catch (error) {
    console.error('❌ [CALLBACK] Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/error.html?error=callback_failed`);
  }
};

// Exchange authorization code for tokens
exports.exchangeToken = async (req, res) => {
  try {
    console.log('\n🔄 [EXCHANGE] Starting token exchange...');
    const { code, state } = req.body;

    if (!code || !state) {
      console.log('❌ [EXCHANGE] Missing code or state');
      return res.status(400).json({ error: 'Code and state are required' });
    }

    const stateData = JSON.parse(state);
    const { email, name, marketplace, region, organizationName } = stateData;

    console.log('🔄 [EXCHANGE] Calling Amazon token endpoint...');
    const tokenEndpoint = getTokenEndpoint(marketplace);
    
    const tokenResponse = await axios.post(
      tokenEndpoint,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.LWA_CLIENT_ID,
        client_secret: process.env.LWA_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('✅ [EXCHANGE] Token response received from Amazon');
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log('✅ [EXCHANGE] Tokens extracted');

    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    console.log('🔄 [DATABASE] Checking if user exists...');
    let user = await User.findByEmail(email);

    if (user) {
      console.log('🔄 [DATABASE] Updating existing user tokens...');
      user = await User.updateTokens(email, refresh_token, access_token, tokenExpiry);
    } else {
      console.log('🔄 [DATABASE] Creating new user with ADMIN role...');
      user = await User.create({
        email,
        name,
        marketplace,
        region,
        role: 'ADMIN', // Default role for Amazon OAuth
        organizationName: organizationName || null,
        refreshToken: refresh_token,
        accessToken: access_token,
        tokenExpiry
      });
    }

    console.log('✅ [DATABASE] User tokens updated successfully');
    console.log('   Role:', user.role);

    const token = generateJWT(user.id);

    console.log('✅ [EXCHANGE] Token exchange complete!');
    res.json({
      success: true,
      message: 'Successfully authenticated with Amazon',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        marketplace: user.marketplace,
        organizationName: user.organization_name
      }
    });
  } catch (error) {
    console.error('❌ [EXCHANGE] Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to exchange token',
      details: error.response?.data || error.message 
    });
  }
};

// Refresh access token
exports.refreshAccessToken = async (req, res) => {
  try {
    console.log('\n🔄 [REFRESH] Starting token refresh...');
    const user = await User.findById(req.userId);

    if (!user || !user.refresh_token) {
      console.log('❌ [REFRESH] No refresh token found');
      return res.status(401).json({ error: 'No refresh token available' });
    }

    const tokenEndpoint = getTokenEndpoint(user.marketplace);
    
    const tokenResponse = await axios.post(
      tokenEndpoint,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.refresh_token,
        client_id: process.env.LWA_CLIENT_ID,
        client_secret: process.env.LWA_CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in } = tokenResponse.data;
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    await User.updateAccessToken(user.id, access_token, tokenExpiry);

    console.log('✅ [REFRESH] Access token refreshed successfully');
    res.json({ 
      success: true,
      accessToken: access_token,
      expiresAt: tokenExpiry
    });
  } catch (error) {
    console.error('❌ [REFRESH] Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

module.exports = {
  register: exports.register,
  login: exports.login,
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  changePassword: exports.changePassword,
  disconnectAmazon: exports.disconnectAmazon,
  deleteAccount: exports.deleteAccount,
  getAuthUrl: exports.getAuthUrl,
  handleCallback: exports.handleCallback,
  exchangeToken: exports.exchangeToken,
  refreshAccessToken: exports.refreshAccessToken
};