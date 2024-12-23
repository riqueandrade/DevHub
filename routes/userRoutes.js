const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/auth');

// Rotas públicas
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);
router.get('/verify', UserController.verifyToken);
router.get('/google/config', UserController.getGoogleConfig);
router.get('/google/callback', UserController.googleCallback);

// Rotas protegidas
router.use(authMiddleware);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/password', UserController.updatePassword);
router.get('/settings', UserController.getSettings);
router.put('/settings/notifications', UserController.updateNotifications);
router.put('/settings/privacy', UserController.updatePrivacy);
router.get('/certificates', UserController.getCertificates);
router.get('/certificates/:id/download', UserController.downloadCertificate);
router.get('/stats', UserController.getStats);
router.get('/activities', UserController.getActivities);
router.get('/achievements', UserController.getAchievements);
router.post('/onboarding', UserController.saveOnboarding);

module.exports = router; 