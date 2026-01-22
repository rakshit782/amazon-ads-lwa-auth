const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

// ==================== EMAIL/PASSWORD AUTHENTICATION ====================

// Register new user with email/password
exports.register = async (req, res) => {
  try {
    console.log('\n📝 [REGISTER] New user registration...');
    const { email, password, name, marketplace = 'NA' } = req.body;

    // Validation
    if (!email || !password || !name) {
      console.log('❌ [REGISTER] Missing required fields');
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      console.log('❌ [REGISTER] Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    console.log('🔍 [REGISTER] Checking if user exists...');
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ [REGISTER] User already exists:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    console.log('🔄 [REGISTER] Creating new user...');
    const config = MARKETPLACE_CONFIG[marketplace];
    const user = await User.create({
      email,
      password, // Will be hashed in User.create()
      name,
      marketplace,
      region: config.region,
      role: 'USER'
    });

    console.log('✅ [REGISTER] User created successfully!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);

    // Generate JWT
    const token = generateJWT(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        marketplace: user.marketplace
      }
    });
  } catch (error) {
    console.error('❌ [REGISTER] Error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
};

// Login with email/password
exports.login = async (req, res) => {
  try {
    console.log('\n🔐 [LOGIN] User login attempt...');
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('❌ [LOGIN] Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    console.log('🔍 [LOGIN] Looking up user:', email);
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ [LOGIN] User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    console.log('🔍 [LOGIN] Verifying password...');
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Invalid password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ [LOGIN] User account is inactive');
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    console.log('✅ [LOGIN] Login successful!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);

    // Generate JWT
    const token = generateJWT(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        marketplace: user.marketplace,
        hasAmazonAuth: !!(user.refresh_token && user.access_token)
      }
    });
  } catch (error) {
    console.error('❌ [LOGIN] Error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};

// ==================== AMAZON OAUTH AUTHENTICATION ====================

// Get authorization URL with audiences scope
exports.getAuthUrl = async (req, res) => {
  try {
    console.log('\n📝 [AUTH] Generating authorization URL...');
    const { marketplace, email, name } = req.body;

    if (!marketplace || !email || !name) {
      console.log('❌ [AUTH] Missing required fields:', { marketplace, email, name });
      return res.status(400).json({ error: 'Marketplace, email, and name are required' });
    }

    const config = MARKETPLACE_CONFIG[marketplace];
    if (!config) {
      console.log('❌ [AUTH] Invalid marketplace:', marketplace);
      return res.status(400).json({ error: 'Invalid marketplace' });
    }

    // Create state parameter with user info
    const state = Buffer.from(JSON.stringify({ email, name, marketplace })).toString('base64');
    console.log('✅ [AUTH] State created:', state.substring(0, 50) + '...');

    // Include audiences scope in the authorization URL
    const scopes = process.env.AMAZON_ADS_API_SCOPE || 'advertising::campaign_management advertising::audiences';
    
    const authUrl = `${config.authEndpoint}?client_id=${process.env.LWA_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&state=${state}`;

    console.log('✅ [AUTH] Authorization URL generated successfully');
    res.json({ authUrl, state });
  } catch (error) {
    console.error('❌ [AUTH] Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
};

// Handle OAuth callback
exports.handleCallback = async (req, res) => {
  console.log('\n📥 [CALLBACK] OAuth callback received');
  const { code, state } = req.query;

  if (!code) {
    console.log('❌ [CALLBACK] No authorization code received');
    return res.redirect(`${process.env.FRONTEND_URL}?error=authorization_failed`);
  }

  console.log('✅ [CALLBACK] Code received:', code.substring(0, 20) + '...');
  console.log('✅ [CALLBACK] State received:', state.substring(0, 50) + '...');

  try {
    // Decode state to get user info
    const userInfo = JSON.parse(Buffer.from(state, 'base64').toString());
    console.log('✅ [CALLBACK] User info decoded:', { email: userInfo.email, name: userInfo.name, marketplace: userInfo.marketplace });
    
    // Redirect to frontend with code and state
    const redirectUrl = `${process.env.FRONTEND_URL}?code=${code}&state=${state}`;
    console.log('✅ [CALLBACK] Redirecting to frontend:', redirectUrl.substring(0, 80) + '...');
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ [CALLBACK] Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=callback_failed`);
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

    console.log('✅ [EXCHANGE] Code received:', code.substring(0, 20) + '...');
    console.log('✅ [EXCHANGE] State received:', state.substring(0, 50) + '...');

    // Decode state
    const userInfo = JSON.parse(Buffer.from(state, 'base64').toString());
    console.log('✅ [EXCHANGE] Decoded user info:', userInfo);
    
    const config = MARKETPLACE_CONFIG[userInfo.marketplace];
    console.log('✅ [EXCHANGE] Using marketplace config:', userInfo.marketplace);

    // Exchange code for tokens
    console.log('🔄 [EXCHANGE] Calling Amazon token endpoint...');
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

    console.log('✅ [EXCHANGE] Token response received from Amazon');
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log('✅ [EXCHANGE] Tokens extracted:', {
      access_token: access_token ? access_token.substring(0, 20) + '...' : 'missing',
      refresh_token: refresh_token ? refresh_token.substring(0, 20) + '...' : 'missing',
      expires_in
    });

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);
    console.log('✅ [EXCHANGE] Token expiry calculated:', tokenExpiry);

    // Save or update user in database
    console.log('🔄 [DATABASE] Checking if user exists...');
    let user = await User.findByEmail(userInfo.email);
    
    if (user) {
      console.log('✅ [DATABASE] User exists, updating tokens...');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      
      // Update existing user
      user = await User.updateTokens(
        userInfo.email,
        refresh_token,
        access_token,
        tokenExpiry
      );
      console.log('✅ [DATABASE] User tokens updated successfully');
      console.log('   Updated user ID:', user.id);
    } else {
      console.log('✅ [DATABASE] User does not exist, creating new user...');
      
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
      console.log('✅ [DATABASE] New user created successfully!');
      console.log('   New user ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Marketplace:', user.marketplace);
    }

    // Verify user was saved
    const verifyUser = await User.findById(user.id);
    if (verifyUser) {
      console.log('✅ [VERIFY] User verified in database:');
      console.log('   ID:', verifyUser.id);
      console.log('   Email:', verifyUser.email);
      console.log('   Has refresh_token:', !!verifyUser.refresh_token);
      console.log('   Has access_token:', !!verifyUser.access_token);
      console.log('   Token expiry:', verifyUser.token_expiry);
    } else {
      console.log('❌ [VERIFY] ERROR: User not found after save!');
    }

    // Generate JWT for our app
    const appToken = generateJWT(user.id);
    console.log('✅ [EXCHANGE] JWT generated for user:', user.id);

    console.log('✅ [EXCHANGE] Token exchange complete! Sending response to frontend...');
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
    console.error('❌ [EXCHANGE] Token exchange error:', error.response?.data || error.message);
    console.error('❌ [EXCHANGE] Full error:', error);
    res.status(500).json({ error: 'Failed to exchange token', details: error.response?.data || error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('\n👤 [PROFILE] Getting user profile for ID:', req.userId);
    const user = await User.getPublicProfile(req.userId);
    
    if (!user) {
      console.log('❌ [PROFILE] User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ [PROFILE] User profile retrieved:', user.email);
    res.json({ user });
  } catch (error) {
    console.error('❌ [PROFILE] Error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Refresh access token
exports.refreshAccessToken = async (req, res) => {
  try {
    console.log('\n🔄 [REFRESH] Refreshing access token for user:', req.userId);
    const user = await User.findById(req.userId);
    
    if (!user || !user.refresh_token) {
      console.log('❌ [REFRESH] No refresh token available');
      return res.status(400).json({ error: 'No refresh token available' });
    }

    const config = MARKETPLACE_CONFIG[user.marketplace];

    console.log('🔄 [REFRESH] Calling Amazon token endpoint...');
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
    console.log('✅ [REFRESH] Token refreshed successfully');

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('❌ [REFRESH] Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};