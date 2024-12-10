const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/CourseController');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de cursos
router.get('/in-progress', CourseController.getInProgress);
router.get('/completed', CourseController.getCompleted);
router.get('/recommended', CourseController.getRecommended);
router.post('/enroll', CourseController.enroll);

module.exports = router; 