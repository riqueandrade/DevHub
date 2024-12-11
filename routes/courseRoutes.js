const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/CourseController');
const authMiddleware = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas públicas (requerem apenas autenticação)
router.get('/in-progress', CourseController.getInProgress);
router.get('/completed', CourseController.getCompleted);
router.get('/recommended', CourseController.getRecommended);
router.post('/enroll', CourseController.enroll);

// Rotas de gerenciamento (requerem role de admin ou instrutor)
router.get('/manage', checkRole(['admin', 'instrutor']), CourseController.getManaged);
router.post('/', checkRole(['admin', 'instrutor']), CourseController.create);
router.put('/:id', checkRole(['admin', 'instrutor']), CourseController.update);
router.put('/:id/publish', checkRole(['admin', 'instrutor']), CourseController.publish);
router.put('/:id/archive', checkRole(['admin', 'instrutor']), CourseController.archive);
router.delete('/:id', checkRole(['admin', 'instrutor']), CourseController.delete);

module.exports = router; 