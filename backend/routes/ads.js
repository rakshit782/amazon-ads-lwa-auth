const express = require('express');
const router = express.Router();
const adsController = require('../controllers/adsController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get profiles
router.get('/profiles', adsController.getProfiles);

// Get campaigns
router.get('/campaigns', adsController.getCampaigns);

// Get ad groups
router.get('/ad-groups', adsController.getAdGroups);

// Get keywords
router.get('/keywords', adsController.getKeywords);

// Get audiences
router.get('/audiences', adsController.getAudiences);

// Get campaign metrics
router.get('/campaigns/metrics', adsController.getCampaignMetrics);

// Automate data fetch
router.post('/automate-sync', adsController.automateSync);

module.exports = router;