const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas do perfil
router.get('/me', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/password', UserController.updatePassword);
router.post('/avatar', UserController.uploadAvatar);

// Rotas de configurações
router.get('/settings', UserController.getSettings);
router.put('/settings/notifications', UserController.updateNotifications);
router.put('/settings/privacy', UserController.updatePrivacy);

// Rotas de estatísticas e atividades
router.get('/stats', UserController.getStats);
router.get('/activities', UserController.getActivities);
router.get('/achievements', UserController.getAchievements);
router.get('/certificates', UserController.getCertificates);
router.get('/certificates/:id/download', UserController.downloadCertificate);

module.exports = router; 