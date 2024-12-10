const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/CatalogController');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas do catálogo
router.get('/courses', CatalogController.getCourses);
router.get('/categories', CatalogController.getCategories);

module.exports = router; 