const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

// Importar controladores
const AuthController = require('../controllers/auth/AuthController');
const ProfileController = require('../controllers/profile/ProfileController');
const StatsController = require('../controllers/stats/StatsController');
const CertificateController = require('../controllers/certificates/CertificateController');
const SettingsController = require('../controllers/settings/SettingsController');

// Rotas públicas de autenticação
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify', AuthController.verifyToken);
router.get('/google/config', AuthController.getGoogleConfig);
router.get('/google/callback', AuthController.googleCallback);

// Rotas protegidas
router.use(authMiddleware);

// Rotas de perfil
router.get('/me', ProfileController.getMe);
router.post('/avatar', ProfileController.uploadAvatar);
router.get('/profile', ProfileController.getProfile);
router.put('/profile', ProfileController.updateProfile);
router.put('/password', ProfileController.updatePassword);
router.post('/onboarding', ProfileController.saveOnboarding);

// Rotas de configurações
router.get('/settings', SettingsController.getSettings);
router.put('/settings/notifications', SettingsController.updateNotifications);
router.put('/settings/privacy', SettingsController.updatePrivacy);

// Rotas de certificados
router.get('/certificates', CertificateController.getCertificates);
router.get('/certificates/:id/download', CertificateController.downloadCertificate);

// Rotas de estatísticas e conquistas
router.get('/stats', StatsController.getStats);
router.get('/activities', StatsController.getActivities);
router.get('/achievements', StatsController.getAchievements);

module.exports = router; 