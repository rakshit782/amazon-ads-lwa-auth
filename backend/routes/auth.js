const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Email/Password Authentication Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Amazon OAuth Routes
router.post('/get-auth-url', authController.getAuthUrl);
router.get('/callback', authController.handleCallback);
router.post('/exchange-token', authController.exchangeToken);

// Protected Routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/update-profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/disconnect-amazon', authenticateToken, authController.disconnectAmazon);
router.delete('/delete-account', authenticateToken, authController.deleteAccount);
router.post('/refresh-token', authenticateToken, authController.refreshAccessToken);

module.exports = router;