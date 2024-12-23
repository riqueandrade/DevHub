const User = require('../../models/User');
const Activity = require('../../models/Activity');
const Enrollment = require('../../models/Enrollment');
const Certificate = require('../../models/Certificate');

class StatsController {
    async getStats(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const studyHours = await user.getStudyHours();
            const coursesInProgress = await Enrollment.count({
                where: {
                    user_id: userId,
                    status: 'em_andamento'
                }
            });

            const coursesCompleted = await Enrollment.count({
                where: {
                    user_id: userId,
                    status: 'concluido'
                }
            });

            const certificates = await Certificate.count({
                where: { user_id: userId }
            });

            res.json({
                studyHours,
                coursesInProgress,
                coursesCompleted,
                certificates
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        }
    }

    async getActivities(req, res) {
        try {
            const userId = req.user.id;
            const activities = await Activity.findByUser(userId);
            res.json(activities);
        } catch (error) {
            console.error('Erro ao buscar atividades:', error);
            res.status(500).json({ error: 'Erro ao buscar atividades' });
        }
    }

    async getAchievements(req, res) {
        try {
            const userId = req.user.id;

            // Buscar dados necessários
            const [coursesCompleted, certificatesCount, activitiesCount] = await Promise.all([
                Enrollment.count({
                    where: {
                        user_id: userId,
                        status: 'concluido'
                    }
                }),
                Certificate.count({
                    where: { user_id: userId }
                }),
                Activity.count({
                    where: {
                        user_id: userId,
                        type: 'lesson_complete'
                    }
                })
            ]);

            // Definir conquistas
            const achievements = [
                {
                    id: 'first_course',
                    name: 'Primeiro Curso',
                    description: 'Completou seu primeiro curso',
                    icon: 'bi-trophy',
                    unlocked: coursesCompleted >= 1
                },
                {
                    id: 'course_master',
                    name: 'Mestre dos Cursos',
                    description: 'Completou 5 cursos',
                    icon: 'bi-mortarboard',
                    unlocked: coursesCompleted >= 5
                },
                {
                    id: 'certified',
                    name: 'Certificado',
                    description: 'Obteve seu primeiro certificado',
                    icon: 'bi-award',
                    unlocked: certificatesCount >= 1
                },
                {
                    id: 'study_beginner',
                    name: 'Iniciante Dedicado',
                    description: 'Completou 10 aulas',
                    icon: 'bi-book',
                    unlocked: activitiesCount >= 10
                },
                {
                    id: 'study_master',
                    name: 'Mestre do Estudo',
                    description: 'Completou 50 aulas',
                    icon: 'bi-book-half',
                    unlocked: activitiesCount >= 50
                }
            ];

            res.json(achievements);
        } catch (error) {
            console.error('Erro ao buscar conquistas:', error);
            res.status(500).json({ error: 'Erro ao buscar conquistas' });
        }
    }
}

module.exports = new StatsController(); 