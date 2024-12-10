const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas do perfil
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/password', UserController.updatePassword);
router.post('/avatar', UserController.uploadAvatar);
router.get('/stats', UserController.getStats);
router.get('/activities', UserController.getActivities);

module.exports = router; 