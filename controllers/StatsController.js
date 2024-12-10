const { sequelize } = require('../models/User');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Lesson = require('../models/Lesson');
const { Op } = require('sequelize');

class StatsController {
    constructor() {
        this.getUserStats = this.getUserStats.bind(this);
        this.calculateStreak = this.calculateStreak.bind(this);
    }

    async getUserStats(req, res) {
        try {
            const userId = req.user.id;

            // Cursos em andamento
            const coursesInProgress = await Enrollment.count({
                where: {
                    user_id: userId,
                    status: 'ativo'
                }
            });

            // Total de horas de estudo
            const studyHours = await LessonProgress.findOne({
                attributes: [[sequelize.fn('SUM', sequelize.col('Lesson.duration')), 'total_hours']],
                raw: true,
                include: [
                    {
                        model: Lesson,
                        attributes: [],
                        required: true
                    },
                    {
                        model: Enrollment,
                        attributes: [],
                        required: true,
                        where: { user_id: userId }
                    }
                ],
                where: {
                    status: 'concluido'
                }
            });

            // Certificados obtidos
            const certificates = await Enrollment.count({
                where: {
                    user_id: userId,
                    status: 'concluido'
                }
            });

            // Dias seguidos de estudo (streak)
            const streak = await this.calculateStreak(userId);

            res.json({
                coursesInProgress,
                studyHours: Math.ceil((studyHours?.total_hours || 0) / 60),
                certificates,
                streak
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }
    }

    async calculateStreak(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const progressHistory = await LessonProgress.findAll({
                attributes: ['completed_at'],
                include: [{
                    model: Enrollment,
                    attributes: [],
                    required: true,
                    where: { user_id: userId }
                }],
                where: {
                    completed_at: {
                        [Op.not]: null
                    }
                },
                order: [['completed_at', 'DESC']]
            });

            if (progressHistory.length === 0) return 0;

            let streak = 0;
            let currentDate = today;

            for (const progress of progressHistory) {
                const progressDate = new Date(progress.completed_at);
                progressDate.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((currentDate - progressDate) / (1000 * 60 * 60 * 24));

                if (diffDays <= 1) {
                    streak++;
                    currentDate = progressDate;
                } else {
                    break;
                }
            }

            return streak;
        } catch (error) {
            console.error('Erro ao calcular streak:', error);
            return 0;
        }
    }
}

module.exports = new StatsController(); 