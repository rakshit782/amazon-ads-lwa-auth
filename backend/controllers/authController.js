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

// Register new user
exports.register = async (req, res) => {
  try {
    console.log('\n📝 [REGISTER] New user registration...');
    const { email, password, name, marketplace = 'NA' } = req.body;

    if (!email || !password || !name) {
      console.log('❌ [REGISTER] Missing required fields');
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      console.log('❌ [REGISTER] Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    console.log('🔍 [REGISTER] Checking if user exists...');
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ [REGISTER] User already exists:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    console.log('🔄 [REGISTER] Creating new user...');
    const config = MARKETPLACE_CONFIG[marketplace];
    const user = await User.create({
      email,
      password,
      name,
      marketplace,
      region: config.region,
      role: 'USER'
    });

    console.log('✅ [REGISTER] User created successfully!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);

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
        marketplace: user.marketplace,
        region: user.region,
        profile_id: user.profile_id,
        is_active: user.is_active,
        last_sync: user.last_sync,
        created_at: user.created_at,
        refresh_token: user.refresh_token,
        access_token: user.access_token
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
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await User.updateProfile(req.userId, { name });
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
    await User.deleteAccount(req.userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ [DELETE_ACCOUNT] Error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// ... (Keep all other Amazon OAuth methods from previous version)
// getAuthUrl, handleCallback, exchangeToken, refreshAccessToken