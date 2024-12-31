const { Course, Module, Lesson, User, Activity, Enrollment, CourseRating } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Registrar atividade do curso
exports.registerActivity = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { type, details } = req.body;
        const userId = req.user.id;

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Registrar atividade
        const activity = await Activity.create({
            user_id: userId,
            course_id: courseId,
            type,
            details
        });

        res.status(201).json({
            message: 'Atividade registrada com sucesso',
            activity
        });
    } catch (error) {
        console.error('Erro ao registrar atividade:', error);
        res.status(500).json({ error: 'Erro ao registrar atividade' });
    }
};

// Obter atividades do curso
exports.getCourseActivities = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para visualizar atividades deste curso' });
        }

        // Buscar atividades
        const activities = await Activity.findAll({
            where: { course_id: courseId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar_url']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json(activities);
    } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
};

// Obter estatísticas do curso
exports.getCourseStats = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para visualizar estatísticas deste curso' });
        }

        // Calcular estatísticas
        const totalModules = await Module.count({ where: { course_id: courseId } });
        const totalLessons = await Lesson.count({
            include: [{
                model: Module,
                as: 'module',
                where: { course_id: courseId }
            }]
        });

        const totalEnrollments = await Enrollment.count({ where: { course_id: courseId } });
        const completedEnrollments = await Enrollment.count({
            where: {
                course_id: courseId,
                status: 'concluido'
            }
        });

        // Calcular taxa de conclusão
        const completionRate = totalEnrollments > 0
            ? Math.round((completedEnrollments / totalEnrollments) * 100)
            : 0;

        // Buscar atividades recentes
        const recentActivities = await Activity.findAll({
            where: { course_id: courseId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar_url']
            }],
            order: [['created_at', 'DESC']],
            limit: 5
        });

        res.json({
            totalModules,
            totalLessons,
            totalEnrollments,
            completedEnrollments,
            completionRate,
            recentActivities
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};

// Avaliar curso
exports.rateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se o usuário está matriculado
        const enrollment = await Enrollment.findOne({
            where: {
                course_id: courseId,
                user_id: userId
            }
        });

        if (!enrollment) {
            return res.status(403).json({ error: 'Você precisa estar matriculado para avaliar o curso' });
        }

        // Criar ou atualizar avaliação
        const [courseRating, created] = await CourseRating.findOrCreate({
            where: {
                course_id: courseId,
                user_id: userId
            },
            defaults: {
                rating,
                comment
            }
        });

        if (!created) {
            await courseRating.update({
                rating,
                comment
            });
        }

        // Atualizar média de avaliações do curso
        const averageRating = await CourseRating.findOne({
            where: { course_id: courseId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'average']
            ]
        });

        await course.update({
            average_rating: averageRating.getDataValue('average')
        });

        res.json({
            message: created ? 'Avaliação criada com sucesso' : 'Avaliação atualizada com sucesso',
            courseRating
        });
    } catch (error) {
        console.error('Erro ao avaliar curso:', error);
        res.status(500).json({ error: 'Erro ao avaliar curso' });
    }
};

// Obter avaliações do curso
exports.getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Buscar avaliações
        const { count, rows: ratings } = await CourseRating.findAndCountAll({
            where: { course_id: courseId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar_url']
            }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            ratings,
            total: count,
            pages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
};

// Obter detalhes do curso para pagamento
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findByPk(courseId, {
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar_url']
            }]
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se o curso está publicado
        if (course.status !== 'publicado') {
            return res.status(403).json({ error: 'Este curso não está disponível para compra' });
        }

        res.json(course);
    } catch (error) {
        console.error('Erro ao buscar detalhes do curso:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do curso' });
    }
};