const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const CourseController = require('../controllers/CourseController');
const CourseManagementController = require('../controllers/CourseManagementController');
const CourseViewController = require('../controllers/CourseViewController');
const ModuleController = require('../controllers/ModuleController');
const LessonController = require('../controllers/LessonController');
const MediaController = require('../controllers/MediaController');
const EnrollmentController = require('../controllers/EnrollmentController');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rotas de matrícula e progresso (devem vir antes das rotas com :courseId)
router.get('/enrollments', EnrollmentController.getAllEnrollments);
router.get('/in-progress', EnrollmentController.getInProgress);
router.get('/completed', EnrollmentController.getCompleted);
router.get('/recommended', EnrollmentController.getRecommended);
router.post('/enroll', EnrollmentController.enrollInCourse);

// Rotas de gerenciamento de cursos
router.post('/', CourseManagementController.createCourse);
router.get('/instructor', CourseManagementController.getInstructorCourses);
router.get('/published', CourseManagementController.getPublishedCourses);
router.get('/:courseId/view', CourseViewController.getCourseWithProgress);
router.get('/:courseId/details', CourseController.getCourseDetails);
router.get('/:courseId', CourseManagementController.getCourse);
router.put('/:courseId', CourseManagementController.updateCourse);
router.put('/:courseId/archive', CourseManagementController.archiveCourse);
router.put('/:courseId/unarchive', CourseManagementController.unarchiveCourse);
router.put('/:courseId/publish', CourseManagementController.publishCourse);
router.delete('/:courseId', CourseManagementController.deleteCourse);

// Rotas de upload de mídia
router.post('/:id/thumbnail', MediaController.uploadCourseThumbnail);

// Rotas de módulos
router.post('/:courseId/modules', ModuleController.createModule);
router.get('/:courseId/modules', ModuleController.getModules);
router.get('/modules/:moduleId', ModuleController.getModule);
router.put('/modules/:moduleId', ModuleController.updateModule);
router.delete('/modules/:moduleId', ModuleController.deleteModule);
router.put('/:courseId/modules/reorder', ModuleController.reorderModules);

// Rotas de aulas
router.post('/:courseId/modules/:moduleId/lessons', LessonController.createLesson);
router.put('/lessons/:lessonId', LessonController.updateLesson);
router.delete('/lessons/:lessonId', LessonController.deleteLesson);
router.post('/lessons/:lessonId/video', LessonController.uploadVideo);
router.put('/:courseId/modules/:moduleId/lessons/reorder', LessonController.reorderLessons);

// Rotas de matrícula e progresso
router.post('/:courseId/enroll', EnrollmentController.enrollInCourse);
router.put('/enrollments/:enrollmentId/lessons/:lessonId/progress', EnrollmentController.updateLessonProgress);

// Rotas de atividades e estatísticas
router.post('/:courseId/activities', CourseController.registerActivity);
router.get('/:courseId/activities', CourseController.getCourseActivities);
router.get('/:courseId/stats', CourseController.getCourseStats);

// Rotas de avaliações
router.post('/:courseId/ratings', CourseController.rateCourse);
router.get('/:courseId/ratings', CourseController.getCourseRatings);

module.exports = router; 