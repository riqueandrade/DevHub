const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const { Op } = require('sequelize');

class CourseController {
    async getInProgress(req, res) {
        try {
            const userId = req.user.id;

            const enrollments = await Enrollment.findAll({
                where: {
                    user_id: userId,
                    status: 'ativo'
                },
                include: [{
                    model: Course,
                    attributes: ['id', 'title', 'thumbnail', 'duration', 'level']
                }],
                order: [['enrolled_at', 'DESC']]
            });

            const courses = await Promise.all(enrollments.map(async (enrollment) => {
                const progress = await LessonProgress.getProgress(enrollment.id);
                
                return {
                    id: enrollment.Course.id,
                    title: enrollment.Course.title,
                    thumbnail: enrollment.Course.thumbnail,
                    duration: enrollment.Course.duration,
                    level: enrollment.Course.level,
                    progress: progress,
                    remainingTime: this.calculateRemainingTime(enrollment.Course.duration, progress)
                };
            }));

            res.json(courses);
        } catch (error) {
            console.error('Erro ao buscar cursos em andamento:', error);
            res.status(500).json({ error: 'Erro ao buscar cursos em andamento' });
        }
    }

    async getRecommended(req, res) {
        try {
            const userId = req.user.id;

            // Buscar cursos que o usuário ainda não está matriculado
            const enrolledCourseIds = await Enrollment.findAll({
                where: { user_id: userId },
                attributes: ['course_id']
            }).then(enrollments => enrollments.map(e => e.course_id));

            const recommendedCourses = await Course.findAll({
                where: {
                    id: { [Op.notIn]: enrolledCourseIds },
                    status: 'publicado'
                },
                limit: 6,
                order: [['created_at', 'DESC']]
            });

            res.json(recommendedCourses.map(course => ({
                id: course.id,
                title: course.title,
                thumbnail: course.thumbnail,
                duration: course.duration,
                level: course.level,
                progress: 0
            })));
        } catch (error) {
            console.error('Erro ao buscar cursos recomendados:', error);
            res.status(500).json({ error: 'Erro ao buscar cursos recomendados' });
        }
    }

    calculateRemainingTime(totalDuration, progress) {
        if (!totalDuration || progress === undefined) return null;
        const remaining = Math.ceil(totalDuration * (1 - progress / 100));
        return `${remaining}min restantes`;
    }
}

module.exports = new CourseController(); 