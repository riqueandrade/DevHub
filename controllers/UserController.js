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
const { Op } = require('sequelize');
const Enrollment = require('../models/Enrollment');

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

            // Hash da senha antes de criar o usuário
            const hashedPassword = await bcrypt.hash(password, 8);

            const user = await User.create({ 
                name, 
                email, 
                password: hashedPassword,
                type: 'user'
            });
            
            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                avatar_url: user.avatar_url
            };

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            return res.json({ user: userWithoutPassword, token });
        } catch (error) {
            console.error('Erro no registro:', error);
            return res.status(400).json({ error: 'Erro ao registrar usuário' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log('Tentativa de login:', { email });

            const user = await User.findOne({ where: { email } });
            if (!user) {
                console.log('Usuário não encontrado:', email);
                return res.status(400).json({ error: 'Usuário não encontrado' });
            }

            console.log('Usuário encontrado:', {
                id: user.id,
                email: user.email,
                hasPassword: !!user.password
            });

            // Verificar se o usuário tem senha (pode ser um usuário do Google)
            if (!user.password) {
                console.log('Usuário sem senha (Google):', email);
                return res.status(400).json({ error: 'Este email está vinculado a uma conta Google. Por favor, faça login com o Google.' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            console.log('Verificação de senha:', {
                inputPassword: password,
                hashedPassword: user.password,
                isValid: validPassword
            });

            if (!validPassword) {
                return res.status(400).json({ error: 'Senha inválida' });
            }

            const userWithoutPassword = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                avatar_url: user.avatar_url
            };

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            console.log('Login bem-sucedido:', {
                userId: user.id,
                email: user.email
            });

            return res.json({ user: userWithoutPassword, token });
        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(400).json({ error: 'Erro ao fazer login' });
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
            await Activity.createActivity({
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

            // Validar tamanho (max 5MB)
            if (avatar.size > 5 * 1024 * 1024) {
                return res.status(400).json({ error: 'Imagem deve ter no máximo 5MB' });
            }

            // Gerar nome único para o arquivo
            const fileName = `avatar_${userId}_${Date.now()}${path.extname(avatar.name)}`;
            const uploadPath = path.join(__dirname, '../public/uploads/avatars', fileName);

            // Criar diretório se não existir
            const dir = path.dirname(uploadPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Mover arquivo
            await avatar.mv(uploadPath);

            // Atualizar usuário
            const avatarUrl = `/uploads/avatars/${fileName}`;
            await User.update(
                { avatar_url: avatarUrl },
                { where: { id: userId } }
            );

            // Registrar atividade
            await Activity.createActivity({
                user_id: userId,
                type: 'profile_update',
                description: 'Atualizou sua foto de perfil'
            });

            // Atualizar dados do usuário no localStorage
            const user = await User.findByPk(userId);
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                avatar_url: avatarUrl
            };

            res.json({ 
                avatar_url: avatarUrl,
                user: userData
            });
        } catch (error) {
            console.error('Erro no upload de avatar:', error);
            res.status(500).json({ error: 'Erro no upload de avatar' });
        }
    }

    // Obter estatísticas do usuário
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

    // Obter histórico de atividades
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

    async getCertificates(req, res) {
        try {
            const userId = req.user.id;
            const { Certificate, Course } = require('../models');

            const certificates = await Certificate.findAll({
                where: { user_id: userId },
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['title']
                }],
                order: [['issued_at', 'DESC']]
            });

            const formattedCertificates = certificates.map(cert => ({
                id: cert.id,
                course_title: cert.course?.title || 'Curso não encontrado',
                certificate_url: cert.certificate_url,
                issued_at: cert.issued_at
            }));

            res.json(formattedCertificates);
        } catch (error) {
            console.error('Erro ao buscar certificados:', error);
            res.status(500).json({ error: 'Erro ao buscar certificados' });
        }
    }
}

module.exports = new UserController(); 