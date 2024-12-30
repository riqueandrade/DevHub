const { Course, Module, Lesson, User, Enrollment, LessonProgress } = require('../models');

// Obter curso com dados de matrícula e progresso
exports.getCourseWithProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // Buscar curso com módulos, aulas e instrutor
        const course = await Course.findByPk(courseId, {
            include: [
                {
                    model: Module,
                    as: 'modules',
                    include: [{
                        model: Lesson,
                        as: 'lessons',
                        attributes: ['id', 'title', 'description', 'duration', 'content_type', 'content_url']
                    }]
                },
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }
            ]
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Buscar matrícula do usuário
        const enrollment = await Enrollment.findOne({
            where: {
                course_id: courseId,
                user_id: userId
            }
        });

        if (!enrollment) {
            return res.status(403).json({ error: 'Você não está matriculado neste curso' });
        }

        // Buscar progresso das aulas
        const lessonProgress = await LessonProgress.findAll({
            where: {
                enrollment_id: enrollment.id
            }
        });

        // Mapear progresso para as aulas
        const progressMap = new Map(
            lessonProgress.map(progress => [progress.lesson_id, progress])
        );

        // Adicionar informações de progresso às aulas
        course.modules = course.modules.map(module => {
            module.lessons = module.lessons.map(lesson => {
                const progress = progressMap.get(lesson.id);
                return {
                    ...lesson.toJSON(),
                    completed: progress?.status === 'concluido' || false,
                    timeWatched: progress?.time_watched || 0
                };
            });
            return module;
        });

        // Adicionar enrollment_id ao objeto do curso
        const courseWithEnrollment = {
            ...course.toJSON(),
            enrollment_id: enrollment.id
        };

        res.json(courseWithEnrollment);
    } catch (error) {
        console.error('Erro ao buscar curso:', error);
        res.status(500).json({ error: 'Erro ao buscar curso' });
    }
}; 