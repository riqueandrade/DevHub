const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/CourseController');
const authMiddleware = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de gerenciamento (requerem role de admin ou instrutor)
router.get('/manage', checkRole(['admin', 'instrutor']), CourseController.getManaged);
router.post('/', checkRole(['admin', 'instrutor']), CourseController.create);

// Rotas públicas (requerem apenas autenticação)
router.get('/in-progress', CourseController.getInProgress);
router.get('/completed', CourseController.getCompleted);
router.get('/recommended', CourseController.getRecommended);
router.get('/enrollments', CourseController.getEnrollments);
router.post('/enroll', CourseController.enroll);

// Rotas com parâmetros
router.get('/:id', authMiddleware, CourseController.getCourse);
router.put('/:id', checkRole(['admin', 'instrutor']), CourseController.update);
router.post('/:id/thumbnail', checkRole(['admin', 'instrutor']), CourseController.uploadThumbnail);
router.put('/:id/publish', checkRole(['admin', 'instrutor']), CourseController.publish);
router.put('/:id/archive', checkRole(['admin', 'instrutor']), CourseController.archive);
router.delete('/:id', checkRole(['admin', 'instrutor']), CourseController.delete);

// Rotas de módulos
router.get('/:courseId/modules', checkRole(['admin', 'instrutor']), CourseController.getModules);
router.post('/:courseId/modules', checkRole(['admin', 'instrutor']), CourseController.createModule);
router.put('/:courseId/modules/:moduleId', checkRole(['admin', 'instrutor']), CourseController.updateModule);
router.delete('/:courseId/modules/:moduleId', checkRole(['admin', 'instrutor']), CourseController.deleteModule);
router.put('/:courseId/modules/reorder', checkRole(['admin', 'instrutor']), CourseController.reorderModules);

// Rotas de aulas
router.get('/:courseId/modules/:moduleIndex/lessons/:lessonIndex', CourseController.getLesson);
router.post('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/complete', CourseController.completeLesson);
router.get('/:courseId/modules/:moduleId/lessons', checkRole(['admin', 'instrutor']), CourseController.getLessons);
router.post('/:courseId/modules/:moduleId/lessons', checkRole(['admin', 'instrutor']), CourseController.uploadFile, CourseController.createLesson);
router.put('/:courseId/modules/:moduleId/lessons/:lessonId', checkRole(['admin', 'instrutor']), CourseController.uploadFile, CourseController.updateLesson);
router.delete('/:courseId/modules/:moduleId/lessons/:lessonId', checkRole(['admin', 'instrutor']), CourseController.deleteLesson);
router.put('/:courseId/modules/:moduleId/lessons/reorder', checkRole(['admin', 'instrutor']), CourseController.reorderLessons);

module.exports = router; 