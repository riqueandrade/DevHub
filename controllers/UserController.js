const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const Activity = require('../models/Activity');
const Course = require('../models/Course');
const Certificate = require('../models/Certificate');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Enrollment = require('../models/Enrollment');
const axios = require('axios');

// Log temporário para debug
console.log('=== Configurações do Google OAuth ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
console.log('====================================');

const googleClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
});

class UserController {
    constructor() {
        // Criar diretório de uploads se não existir
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Diretório de avatares criado:', uploadDir);
        }

        // Vincular métodos ao contexto this
        this.googleCallback = this.googleCallback.bind(this);
        this.downloadAndSaveAvatar = this.downloadAndSaveAvatar.bind(this);
    }

    // Função para baixar e salvar avatar
    async downloadAndSaveAvatar(avatarUrl) {
        try {
            if (!avatarUrl) return null;

            // Garantir que o diretório existe
            const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Diretório de avatares criado:', uploadDir);
            }

            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            
            const filename = `${uuidv4()}.jpg`;
            const filepath = path.join(uploadDir, filename);
            
            fs.writeFileSync(filepath, buffer);
            console.log('Avatar salvo com sucesso:', filepath);
            
            return `/uploads/avatars/${filename}`;
        } catch (error) {
            console.error('Erro ao baixar avatar:', error);
            return null;
        }
    }

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
                role: user.role,
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
                role: user.role,
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
                role: user.role,
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
            const { tokens } = await googleClient.getToken(code);
            const ticket = await googleClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            let user = await User.findOne({ where: { google_id: payload.sub } });
            let isNewUser = false;

            if (!user) {
                // Novo usuário
                isNewUser = true;
                user = await User.create({
                    name: payload.name,
                    email: payload.email,
                    google_id: payload.sub,
                    avatar_url: payload.picture,
                    onboarding_completed: false // Novo usuário precisa fazer onboarding
                });
            } else {
                // Usuário existente - garantir que onboarding_completed está definido
                if (user.onboarding_completed === null) {
                    await user.update({ onboarding_completed: true });
                }
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Redirecionar com flag isNewUser apenas para novos usuários
            const redirectUrl = `/auth-callback.html?token=${token}&isNewUser=${isNewUser}`;
            console.log('Redirecionando para:', redirectUrl, {
                isNewUser,
                userId: user.id,
                onboarding_completed: user.onboarding_completed
            });
            
            res.redirect(redirectUrl);
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
                clientId: process.env.GOOGLE_CLIENT_ID,
                redirectUri: process.env.GOOGLE_REDIRECT_URI
            });
        } catch (error) {
            console.error('Erro ao obter configurações do Google:', error);
            res.status(500).json({ error: 'Erro ao obter configurações do Google' });
        }
    }

    // Obter dados do perfil do usuário
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

    // Atualizar perfil do usuário
    async updateProfile(req, res) {
        try {
            const { name, bio } = req.body;
            const user = await User.findByPk(req.user.id);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            await user.update({ name, bio });

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
            const user = await User.findByPk(req.user.id);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            // Verificar tipo do arquivo
            if (!avatar.mimetype.startsWith('image/')) {
                return res.status(400).json({ error: 'Arquivo deve ser uma imagem' });
            }

            // Criar diretório de uploads se não existir
            const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
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
            await user.update({ avatar_url: avatarUrl });

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
                certificate_url: `/api/user/certificates/${cert.id}/download`,
                issued_at: cert.issued_at
            }));

            res.json(formattedCertificates);
        } catch (error) {
            console.error('Erro ao buscar certificados:', error);
            res.status(500).json({ error: 'Erro ao buscar certificados' });
        }
    }

    async downloadCertificate(req, res) {
        try {
            const userId = req.user.id;
            const certificateId = req.params.id;
            const { Certificate, Course, User, Enrollment } = require('../models');

            const certificate = await Certificate.findOne({
                where: { 
                    id: certificateId,
                    user_id: userId
                },
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['title', 'duration', 'level']
                }, {
                    model: User,
                    as: 'user',
                    attributes: ['name']
                }]
            });

            if (!certificate) {
                return res.status(404).json({ error: 'Certificado não encontrado' });
            }

            // Buscar informações da matrícula
            const enrollment = await Enrollment.findOne({
                where: {
                    user_id: userId,
                    course_id: certificate.course_id
                }
            });

            if (!enrollment) {
                return res.status(404).json({ error: 'Matrícula não encontrada' });
            }

            // Criar diretório de certificados se não existir
            const certificatesDir = path.join(__dirname, '..', 'public', 'certificates');
            if (!fs.existsSync(certificatesDir)) {
                fs.mkdirSync(certificatesDir, { recursive: true });
            }

            // Gerar certificado se não existir
            const filePath = path.join(certificatesDir, `certificate_${certificate.id}.pdf`);
            
            // Criar um novo documento PDF
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margin: 0
            });

            // Pipe o PDF para o arquivo
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Definir cores
            const primaryColor = '#1B1464';    // Azul escuro
            const accentColor = '#0652DD';     // Azul médio
            const goldColor = '#FFD700';       // Dourado
            const textColor = '#2C2C2C';       // Quase preto

            // Adicionar fundo branco
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill('#FFFFFF');

            // Adicionar borda dourada dupla
            const borderWidth = 15;
            const innerBorderWidth = 10;
            
            doc.rect(borderWidth, borderWidth, doc.page.width - (2 * borderWidth), doc.page.height - (2 * borderWidth))
               .lineWidth(3)
               .stroke(goldColor);

            doc.rect(borderWidth + innerBorderWidth, borderWidth + innerBorderWidth, 
                    doc.page.width - (2 * (borderWidth + innerBorderWidth)), 
                    doc.page.height - (2 * (borderWidth + innerBorderWidth)))
               .lineWidth(1)
               .stroke(goldColor);

            // Adicionar elementos decorativos nos cantos
            const cornerSize = 30;
            // Superior esquerdo
            doc.moveTo(borderWidth, borderWidth + cornerSize)
               .lineTo(borderWidth, borderWidth)
               .lineTo(borderWidth + cornerSize, borderWidth)
               .lineWidth(3)
               .stroke(goldColor);

            // Superior direito
            doc.moveTo(doc.page.width - borderWidth - cornerSize, borderWidth)
               .lineTo(doc.page.width - borderWidth, borderWidth)
               .lineTo(doc.page.width - borderWidth, borderWidth + cornerSize)
               .stroke(goldColor);

            // Inferior esquerdo
            doc.moveTo(borderWidth, doc.page.height - borderWidth - cornerSize)
               .lineTo(borderWidth, doc.page.height - borderWidth)
               .lineTo(borderWidth + cornerSize, doc.page.height - borderWidth)
               .stroke(goldColor);

            // Inferior direito
            doc.moveTo(doc.page.width - borderWidth - cornerSize, doc.page.height - borderWidth)
               .lineTo(doc.page.width - borderWidth, doc.page.height - borderWidth)
               .lineTo(doc.page.width - borderWidth, doc.page.height - borderWidth - cornerSize)
               .stroke(goldColor);

            // Adicionar logo DevHub
            const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, doc.page.width / 2 - 50, 40, { width: 100 });
            } else {
                doc.font('Helvetica-Bold')
                   .fontSize(30)
                   .fillColor(primaryColor)
                   .text('DevHub', 0, 40, {
                       width: doc.page.width,
                       align: 'center',
                       paragraphGap: 0,
                       indent: 0,
                       lineGap: 0
                   });
            }

            // Título principal
            doc.font('Helvetica-Bold')
               .fontSize(60)
               .fillColor(primaryColor)
               .text('CERTIFICADO', 0, 120, { align: 'center' });

            // Texto principal
            const centerY = doc.page.height / 2 - 80;

            doc.font('Helvetica')
               .fontSize(16)
               .fillColor(textColor)
               .text('Certificamos que', 0, centerY, { align: 'center' });

            // Nome do aluno
            doc.font('Helvetica-Bold')
               .fontSize(40)
               .fillColor(primaryColor)
               .text(certificate.user.name, 0, centerY + 40, { align: 'center' });

            // Descrição do curso
            doc.font('Helvetica')
               .fontSize(16)
               .fillColor(textColor)
               .text('concluiu com êxito o curso online', 0, centerY + 100, { align: 'center' });

            // Nome do curso
            doc.font('Helvetica-Bold')
               .fontSize(30)
               .fillColor(accentColor)
               .text(certificate.course.title.toUpperCase(), 0, centerY + 130, { align: 'center' });

            // Informações adicionais em uma tabela centralizada
            const infoY = centerY + 190;
            const infoStyle = {
                font: 'Helvetica',
                fontSize: 14,
                color: textColor
            };

            // Formatar datas
            const dataInicio = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
            const dataFim = enrollment.completed_at ? new Date(enrollment.completed_at) : new Date();

            // Criar uma tabela centralizada com as informações
            const tableWidth = 800;
            const tableX = (doc.page.width - tableWidth) / 2;
            const columnWidth = tableWidth / 3;

            // Função auxiliar para adicionar célula da tabela
            function addTableCell(label, value, x, y) {
                doc.font(infoStyle.font)
                   .fontSize(infoStyle.fontSize)
                   .fillColor(infoStyle.color)
                   .text(label, x, y, { width: columnWidth, align: 'center' });

                doc.font('Helvetica-Bold')
                   .text(value, x, y + 20, { width: columnWidth, align: 'center' });
            }

            // Adicionar células da tabela
            addTableCell(
                'Carga Horária',
                `${Math.ceil(certificate.course.duration / 60)} horas`,
                tableX,
                infoY
            );

            addTableCell(
                'Nível',
                certificate.course.level.charAt(0).toUpperCase() + certificate.course.level.slice(1),
                tableX + columnWidth,
                infoY
            );

            addTableCell(
                'Período',
                `${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`,
                tableX + (2 * columnWidth),
                infoY
            );

            // Assinatura
            const lineY = doc.page.height - 100;
            
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor(primaryColor)
               .text('Henrique de Andrade Reynaud', doc.page.width / 2 - 150, lineY, { 
                   width: 300,
                   align: 'center'
               });

            doc.font('Helvetica')
               .fontSize(12)
               .fillColor(textColor)
               .text('Diretor de Ensino', doc.page.width / 2 - 150, lineY + 20, { 
                   width: 300,
                   align: 'center'
               });

            // Linha decorativa para assinatura
            doc.moveTo(doc.page.width / 2 - 150, lineY + 50)
               .lineTo(doc.page.width / 2 + 150, lineY + 50)
               .lineWidth(1)
               .stroke(goldColor);

            // Data de emissão (à esquerda)
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(textColor)
               .text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 
                     50, 
                     doc.page.height - 30);

            // ID do certificado (à direita)
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(textColor)
               .text(`Certificado Nº ${certificate.id.toString().padStart(6, '0')}`, 
                     doc.page.width - 200, 
                     doc.page.height - 30);

            // Finalizar o PDF
            doc.end();

            // Esperar o stream terminar antes de enviar o arquivo
            stream.on('finish', () => {
                res.download(filePath, `Certificado - ${certificate.course.title}.pdf`);
            });

        } catch (error) {
            console.error('Erro ao baixar certificado:', error);
            res.status(500).json({ error: 'Erro ao baixar certificado' });
        }
    }

    // Obter configurações do usuário
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

    // Atualizar configurações de notificações
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

    // Atualizar configurações de privacidade
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

    // Salvar dados do onboarding
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

            // Registrar interesses (se necessário, criar tabela de interesses)
            // TODO: Implementar lógica de interesses quando necessário

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

module.exports = new UserController(); 