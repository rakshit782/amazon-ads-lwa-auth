const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Get LWA authorization URL
router.post('/get-auth-url', authController.getAuthUrl);

// OAuth callback endpoint
router.get('/callback', authController.handleCallback);

// Exchange code for tokens
router.post('/exchange-token', authController.exchangeToken);

// Get user profile
router.get('/profile', authMiddleware, authController.getProfile);

// Refresh access token
router.post('/refresh-token', authMiddleware, authController.refreshAccessToken);

module.exports = router;