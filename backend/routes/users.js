const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roleCheck');

// Public routes
router.post('/login', userController.login);

// Protected routes - require authentication
router.use(authMiddleware);

// MASTER only routes
router.post('/register', requireRole(ROLES.MASTER), userController.register);
router.get('/all', requireRole(ROLES.MASTER), userController.getAllUsers);
router.get('/role/:role', requireRole(ROLES.MASTER), userController.getUsersByRole);
router.put('/:userId/role', requireRole(ROLES.MASTER), userController.updateUserRole);
router.put('/:userId/status', requireRole(ROLES.MASTER), userController.toggleUserStatus);

// All authenticated users
router.post('/change-password', userController.changePassword);

module.exports = router;