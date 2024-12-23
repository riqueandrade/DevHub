const { Course, Enrollment, LessonProgress, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Função auxiliar para calcular progresso
async function calculateProgress(enrollmentId) {
    const total = await LessonProgress.count({
        where: { enrollment_id: enrollmentId }
    });

    const completed = await LessonProgress.count({
        where: {
            enrollment_id: enrollmentId,
            status: 'concluido'
        }
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
}

// Obter cursos em andamento do usuário
exports.getInProgress = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrollments = await Enrollment.findAll({
            where: {
                user_id: userId,
                status: 'em_andamento'
            },
            include: [{
                model: Course,
                as: 'course',
                include: [{
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }]
            }]
        });

        const coursesInProgress = await Promise.all(enrollments.map(async (enrollment) => {
            const progress = await calculateProgress(enrollment.id);

            return {
                id: enrollment.course.id,
                title: enrollment.course.title,
                description: enrollment.course.description,
                thumbnail: enrollment.course.thumbnail,
                instructor: enrollment.course.instructor,
                progress,
                enrollmentId: enrollment.id,
                level: enrollment.course.level,
                duration: enrollment.course.duration
            };
        }));

        res.json(coursesInProgress);
    } catch (error) {
        console.error('Erro ao buscar cursos em andamento:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos em andamento' });
    }
};

// Obter cursos concluídos do usuário
exports.getCompleted = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrollments = await Enrollment.findAll({
            where: {
                user_id: userId,
                status: 'concluido'
            },
            include: [{
                model: Course,
                as: 'course',
                include: [{
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }]
            }]
        });

        const coursesCompleted = enrollments.map(enrollment => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            thumbnail: enrollment.course.thumbnail,
            instructor: enrollment.course.instructor,
            level: enrollment.course.level,
            duration: enrollment.course.duration,
            completedAt: enrollment.updated_at
        }));

        res.json(coursesCompleted);
    } catch (error) {
        console.error('Erro ao buscar cursos concluídos:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos concluídos' });
    }
};

// Obter cursos recomendados
exports.getRecommended = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar cursos que o usuário ainda não está matriculado
        const courses = await Course.findAll({
            where: {
                id: {
                    [Op.notIn]: sequelize.literal(`(
                        SELECT course_id 
                        FROM enrollments 
                        WHERE user_id = ${userId}
                    )`)
                },
                status: 'publicado'
            },
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar_url']
            }],
            limit: 5,
            order: sequelize.random()
        });

        res.json(courses);
    } catch (error) {
        console.error('Erro ao buscar cursos recomendados:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos recomendados' });
    }
};

// Matricular usuário em um curso
exports.enrollInCourse = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se já está matriculado
        const existingEnrollment = await Enrollment.findOne({
            where: {
                user_id: userId,
                course_id: courseId
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'Usuário já matriculado neste curso' });
        }

        // Criar matrícula
        const enrollment = await Enrollment.create({
            user_id: userId,
            course_id: courseId,
            status: 'em_andamento',
            progress: 0
        });

        res.json({
            message: 'Matrícula realizada com sucesso',
            enrollment
        });
    } catch (error) {
        console.error('Erro ao matricular no curso:', error);
        res.status(500).json({ error: 'Erro ao matricular no curso' });
    }
};

// Atualizar progresso da aula
exports.updateLessonProgress = async (req, res) => {
    try {
        const { enrollmentId, lessonId } = req.params;
        const { status, timeWatched } = req.body;
        const userId = req.user.id;

        // Verificar se a matrícula pertence ao usuário
        const enrollment = await Enrollment.findOne({
            where: {
                id: enrollmentId,
                user_id: userId
            }
        });

        if (!enrollment) {
            return res.status(404).json({ error: 'Matrícula não encontrada' });
        }

        // Atualizar ou criar progresso da aula
        const [progress, created] = await LessonProgress.findOrCreate({
            where: {
                enrollment_id: enrollmentId,
                lesson_id: lessonId
            },
            defaults: {
                status,
                time_watched: timeWatched || 0
            }
        });

        if (!created) {
            await progress.update({
                status,
                time_watched: timeWatched || progress.time_watched
            });
        }

        // Calcular progresso geral do curso
        const courseProgress = await calculateProgress(enrollmentId);

        // Atualizar status da matrícula se necessário
        if (courseProgress === 100 && enrollment.status !== 'concluido') {
            await enrollment.update({ status: 'concluido' });
        }

        res.json({
            message: 'Progresso atualizado com sucesso',
            progress,
            courseProgress
        });
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
        res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
}; 