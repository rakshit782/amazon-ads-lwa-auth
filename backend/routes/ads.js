const express = require('express');
const router = express.Router();
const adsController = require('../controllers/adsController');
const authMiddleware = require('../middleware/auth');
const { requireWrite, allowRead, requireRole, ROLES } = require('../middleware/roleCheck');

// All routes require authentication
router.use(authMiddleware);

// MASTER Dashboard - see all brands data
router.get('/master/dashboard', requireRole(ROLES.MASTER), adsController.getMasterDashboard);
router.get('/master/all-campaigns', requireRole(ROLES.MASTER), adsController.getAllCampaigns);
router.get('/master/all-keywords', requireRole(ROLES.MASTER), adsController.getAllKeywords);
router.get('/master/brands', requireRole(ROLES.MASTER), adsController.getAllBrands);

// Regular Dashboard - user's own data (all roles can read)
router.get('/dashboard', allowRead, adsController.getDashboard);

// Read operations - all authenticated users (USER, ADMIN, MASTER)
router.get('/profiles', allowRead, adsController.getProfiles);
router.get('/campaigns', allowRead, adsController.getCampaigns);
router.get('/ad-groups', allowRead, adsController.getAdGroups);
router.get('/keywords', allowRead, adsController.getKeywords);
router.get('/audiences', allowRead, adsController.getAudiences);
router.get('/campaigns/metrics', allowRead, adsController.getCampaignMetrics);
router.get('/alerts', allowRead, adsController.getAlerts);

// Write operations - ADMIN and MASTER only (USER cannot modify)
router.post('/automate-sync', requireWrite, adsController.automateSync);
router.put('/alerts/:id/read', requireWrite, adsController.markAlertRead);

module.exports = router;