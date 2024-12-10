const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const Activity = require('../models/Activity');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const googleClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/api/auth/google/callback'
});

class UserController {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            
            const userExists = await User.findOne({ where: { email } });
            if (userExists) {
                return res.status(400).json({ error: 'Usuário já existe' });
            }

            const user = await User.create({ 
                name, 
                email, 
                password,
                type: 'user'
            });
            
            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type
            };

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            return res.json({ user: userWithoutPassword, token });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(400).json({ error: 'Usuário não encontrado' });
            }

            const validPassword = await user.checkPassword(password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Senha inválida' });
            }

            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type
            };

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            return res.json({ user: userWithoutPassword, token });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async googleLogin(req, res) {
        try {
            const { name, email, google_id, avatar_url } = req.body;

            let user = await User.findOne({ where: { email } });

            if (!user) {
                // Criar novo usuário se não existir
                user = await User.create({
                    name,
                    email,
                    google_id,
                    avatar_url,
                    type: 'user'
                });
            } else if (!user.google_id) {
                // Atualizar usuário existente com dados do Google
                await user.update({
                    google_id,
                    avatar_url
                });
            }

            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                avatar_url: user.avatar_url
            };

            const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            return res.json({ user: userWithoutPassword, token: jwtToken });
        } catch (error) {
            console.error('Erro no login Google:', error);
            return res.status(400).json({ error: 'Erro na autenticação com Google' });
        }
    }

    async googleCallback(req, res) {
        try {
            const { code } = req.query;

            // Obter tokens do Google
            const { tokens } = await googleClient.getToken(code);
            const ticket = await googleClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const { name, email, sub: google_id, picture: avatar_url } = ticket.getPayload();

            // Buscar ou criar usuário
            let user = await User.findOne({ where: { email } });
            
            if (!user) {
                // Criar novo usuário
                user = await User.create({
                    name,
                    email,
                    google_id,
                    avatar_url,
                    type: 'user'
                });
            } else if (!user.google_id) {
                // Atualizar usuário existente com dados do Google
                await user.update({
                    google_id,
                    avatar_url
                });
            }

            // Gerar token JWT
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            // Preparar dados do usuário
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                avatar_url: user.avatar_url
            };

            // Redirecionar para uma página intermediária que salvará os dados
            res.redirect(`/auth-callback.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
        } catch (error) {
            console.error('Erro no callback do Google:', error);
            res.redirect('/auth.html?error=google_auth_failed');
        }
    }

    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Token não fornecido' });
            }

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verificar se o usuário ainda existe
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }

            res.json({ valid: true });
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            res.status(401).json({ error: 'Token inválido' });
        }
    }

    async getGoogleConfig(req, res) {
        try {
            res.json({
                clientId: process.env.GOOGLE_CLIENT_ID
            });
        } catch (error) {
            console.error('Erro ao obter configurações do Google:', error);
            res.status(500).json({ error: 'Erro ao obter configurações do Google' });
        }
    }

    // Obter dados do perfil do usuário
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findByPk(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Remover campos sensíveis
            const userData = user.toJSON();
            delete userData.password;
            res.json(userData);
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
            res.status(500).json({ error: 'Erro ao obter perfil do usuário' });
        }
    }

    // Atualizar perfil do usuário
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email, bio } = req.body;

            // Verificar se o email já está em uso
            if (email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser && existingUser.id !== userId) {
                    return res.status(400).json({ error: 'Email já está em uso' });
                }
            }

            // Atualizar usuário
            const [updated] = await User.update(
                {
                    name: name || undefined,
                    email: email || undefined,
                    bio: bio || undefined
                },
                { where: { id: userId } }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Buscar usuário atualizado
            const updatedUser = await User.findByPk(userId);

            // Registrar atividade
            await Activity.create({
                user_id: userId,
                type: 'profile_update',
                description: 'Perfil atualizado'
            });

            // Remover campos sensíveis
            const userData = updatedUser.toJSON();
            delete userData.password;
            res.json(userData);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ error: 'Erro ao atualizar perfil do usuário' });
        }
    }

    // Alterar senha
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
            await Activity.create({
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

    // Upload de avatar
    async uploadAvatar(req, res) {
        try {
            if (!req.files || !req.files.avatar) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const avatar = req.files.avatar;
            const userId = req.user.id;

            // Validar tipo de arquivo
            if (!avatar.mimetype.startsWith('image/')) {
                return res.status(400).json({ error: 'Arquivo deve ser uma imagem' });
            }

            // Gerar nome único para o arquivo
            const fileName = `${uuidv4()}${path.extname(avatar.name)}`;
            const uploadPath = path.join(__dirname, '../public/uploads/avatars', fileName);

            // Criar diretório se não existir
            const dir = path.dirname(uploadPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Mover arquivo
            await avatar.mv(uploadPath);

            // Atualizar URL do avatar no banco de dados
            const avatarUrl = `/uploads/avatars/${fileName}`;
            await User.update(
                { avatar_url: avatarUrl },
                { where: { id: userId } }
            );

            // Registrar atividade
            await Activity.create({
                user_id: userId,
                type: 'profile_update',
                description: 'Avatar atualizado'
            });

            res.json({ avatar_url: avatarUrl });
        } catch (error) {
            console.error('Erro ao fazer upload do avatar:', error);
            res.status(500).json({ error: 'Erro ao fazer upload do avatar' });
        }
    }

    // Obter estatísticas do usuário
    async getStats(req, res) {
        try {
            const userId = req.user.id;

            // Obter número de cursos em andamento
            const coursesInProgress = await Course.countInProgress(userId);

            // Obter número de certificados
            const certificates = await Certificate.countByUser(userId);

            res.json({
                coursesInProgress,
                certificates
            });
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas do usuário' });
        }
    }

    // Obter histórico de atividades
    async getActivities(req, res) {
        try {
            const userId = req.user.id;
            const activities = await Activity.findByUser(userId);
            res.json(activities);
        } catch (error) {
            console.error('Erro ao obter atividades:', error);
            res.status(500).json({ error: 'Erro ao obter histórico de atividades' });
        }
    }
}

module.exports = new UserController(); 