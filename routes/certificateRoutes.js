const express = require('express');
const router = express.Router();
const CertificateController = require('../controllers/CertificateController');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de certificados
router.get('/:id', CertificateController.getCertificate);
router.get('/:id/download', CertificateController.downloadCertificate);
router.get('/verify/:code', CertificateController.verifyCertificate);

module.exports = router; 