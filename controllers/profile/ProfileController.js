const User = require('../../models/User');
const Activity = require('../../models/Activity');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class ProfileController {
    constructor() {
        // Criar diretório de uploads se não existir
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Diretório de avatares criado:', uploadDir);
        }
    }

    async getMe(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'avatar_url', 'role', 'bio', 'created_at']
            });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            return res.json(user);
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({ error: 'Erro ao buscar usuário' });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await User.findByPk(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url || user.avatar,
                bio: user.bio
            };

            res.json(userWithoutPassword);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, bio } = req.body;
            const user = await User.findByPk(req.user.id);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const updatedData = { name, bio };
            await user.update(updatedData);

            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url || user.avatar,
                bio: user.bio
            };

            res.json(userWithoutPassword);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    }

    async uploadAvatar(req, res) {
        try {
            if (!req.files || !req.files.avatar) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const avatar = req.files.avatar;
            const userId = req.user.id;

            // Verificar tipo do arquivo
            if (!avatar.mimetype.startsWith('image/')) {
                return res.status(400).json({ error: 'Arquivo deve ser uma imagem' });
            }

            // Criar diretório de uploads se não existir
            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Gerar nome único para o arquivo
            const filename = `${uuidv4()}${path.extname(avatar.name)}`;
            const filepath = path.join(uploadDir, filename);

            // Salvar arquivo
            await avatar.mv(filepath);

            // Atualizar URL do avatar no banco
            const avatarUrl = `/uploads/avatars/${filename}`;
            await User.update(
                { avatar_url: avatarUrl },
                { where: { id: userId } }
            );

            res.json({ avatar_url: avatarUrl });
        } catch (error) {
            console.error('Erro ao fazer upload do avatar:', error);
            res.status(500).json({ error: 'Erro ao fazer upload do avatar' });
        }
    }

    async updatePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Verificar senha atual
            const isValidPassword = await user.checkPassword(currentPassword);
            if (!isValidPassword) {
                return res.status(400).json({ error: 'Senha atual incorreta' });
            }

            // Atualizar senha
            await User.update(
                { password: newPassword },
                { where: { id: userId }, individualHooks: true }
            );

            // Registrar atividade
            await Activity.createActivity({
                user_id: userId,
                type: 'profile_update',
                description: 'Senha alterada'
            });

            res.json({ message: 'Senha atualizada com sucesso' });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({ error: 'Erro ao alterar senha' });
        }
    }

    async saveOnboarding(req, res) {
        try {
            const userId = req.user.id;
            const { role, name, bio, interests, notifications } = req.body;

            console.log('Salvando dados do onboarding:', {
                userId,
                role,
                name,
                bio,
                interests,
                notifications
            });

            // Validar role
            if (!['aluno', 'instrutor'].includes(role)) {
                return res.status(400).json({ error: 'Tipo de conta inválido' });
            }

            // Atualizar usuário
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            await user.update({
                role,
                name,
                bio,
                email_notifications: notifications.email,
                course_updates: notifications.courseUpdates,
                promotional_emails: notifications.promotional,
                onboarding_completed: true
            });

            // Registrar atividade
            await Activity.create({
                user_id: userId,
                type: 'profile_update',
                description: 'Completou o perfil inicial'
            });

            // Retornar usuário atualizado
            const updatedUser = await User.findByPk(userId, {
                attributes: { exclude: ['password'] }
            });

            console.log('Onboarding concluído com sucesso:', updatedUser);
            res.json(updatedUser);
        } catch (error) {
            console.error('Erro ao salvar dados do onboarding:', error);
            res.status(500).json({ error: 'Erro ao salvar dados do onboarding' });
        }
    }
}

module.exports = new ProfileController(); 