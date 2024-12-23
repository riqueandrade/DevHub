const User = require('../../models/User');
const Activity = require('../../models/Activity');

class SettingsController {
    async getSettings(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Retornar configurações do usuário
            const settings = {
                profile: {
                    name: user.name,
                    email: user.email,
                    avatar_url: user.avatar_url
                },
                notifications: {
                    email_notifications: user.email_notifications || false,
                    course_updates: user.course_updates || false,
                    promotional_emails: user.promotional_emails || false
                },
                privacy: {
                    profile_visibility: user.profile_visibility || false,
                    show_progress: user.show_progress || false,
                    show_certificates: user.show_certificates || false
                }
            };

            res.json(settings);
        } catch (error) {
            console.error('Erro ao obter configurações:', error);
            res.status(500).json({ error: 'Erro ao obter configurações do usuário' });
        }
    }

    async updateNotifications(req, res) {
        try {
            const userId = req.user.id;
            const { email_notifications, course_updates, promotional_emails } = req.body;

            const [updated] = await User.update(
                {
                    email_notifications,
                    course_updates,
                    promotional_emails
                },
                { where: { id: userId } }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Registrar atividade
            await Activity.createActivity({
                user_id: userId,
                type: 'settings_update',
                description: 'Configurações de notificação atualizadas'
            });

            res.json({ message: 'Configurações de notificação atualizadas com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar notificações:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações de notificação' });
        }
    }

    async updatePrivacy(req, res) {
        try {
            const userId = req.user.id;
            const { profile_visibility, show_progress, show_certificates } = req.body;

            const [updated] = await User.update(
                {
                    profile_visibility,
                    show_progress,
                    show_certificates
                },
                { where: { id: userId } }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Registrar atividade
            await Activity.createActivity({
                user_id: userId,
                type: 'settings_update',
                description: 'Configurações de privacidade atualizadas'
            });

            res.json({ message: 'Configurações de privacidade atualizadas com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar privacidade:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações de privacidade' });
        }
    }
}

module.exports = new SettingsController(); 