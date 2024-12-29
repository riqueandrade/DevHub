const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const Activity = require('../../models/Activity');
const MailService = require('../../config/mail');

const googleClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
});

class AuthController {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            const userExists = await User.findOne({ where: { email } });
            if (userExists) {
                return res.status(400).json({ error: 'Usuário já existe' });
            }

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

            if (!user.password) {
                console.log('Usuário sem senha (Google):', email);
                return res.status(400).json({ error: 'Este email está vinculado a uma conta Google. Por favor, faça login com o Google.' });
            }

            const validPassword = await bcrypt.compare(password, user.password);

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
                user = await User.create({
                    name,
                    email,
                    google_id,
                    avatar_url,
                    role: 'aluno'
                });
            } else if (!user.google_id) {
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
            console.log('Iniciando Google Callback:', { query: req.query });
            const { code } = req.query;
            
            if (!code) {
                console.error('Código de autorização não fornecido');
                return res.redirect('/auth.html?error=missing_code');
            }

            console.log('Obtendo tokens do Google...');
            const { tokens } = await googleClient.getToken(code);
            console.log('Tokens obtidos:', { 
                hasAccessToken: !!tokens.access_token,
                hasIdToken: !!tokens.id_token
            });

            console.log('Verificando ID token...');
            const ticket = await googleClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            console.log('Payload do token:', { 
                sub: payload.sub,
                email: payload.email,
                name: payload.name
            });

            let user = await User.findOne({ where: { google_id: payload.sub } });
            let isNewUser = false;

            if (!user) {
                console.log('Criando novo usuário...');
                isNewUser = true;
                user = await User.create({
                    name: payload.name,
                    email: payload.email,
                    google_id: payload.sub,
                    avatar_url: payload.picture,
                    role: 'aluno',
                    onboarding_completed: false
                });
                console.log('Novo usuário criado:', { userId: user.id });
            } else {
                console.log('Usuário existente encontrado:', { userId: user.id });
                if (user.onboarding_completed === null) {
                    await user.update({ onboarding_completed: true });
                }
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            const redirectUrl = `/auth-callback.html?token=${token}&isNewUser=${isNewUser}`;
            console.log('Redirecionando para:', redirectUrl, {
                isNewUser,
                userId: user.id,
                onboarding_completed: user.onboarding_completed
            });
            
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Erro detalhado no callback do Google:', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                details: error.details
            });
            res.redirect('/auth.html?error=google_auth_failed');
        }
    }

    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Token não fornecido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const resetToken = jwt.sign(
                { id: user.id, type: 'password_reset' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            await User.update(
                { reset_token: resetToken },
                { where: { id: user.id } }
            );

            const emailSent = await MailService.sendPasswordResetEmail(email, resetToken);

            if (!emailSent) {
                return res.status(500).json({ error: 'Erro ao enviar email de recuperação' });
            }

            await Activity.createActivity({
                user_id: user.id,
                type: 'password_reset_request',
                description: 'Solicitação de recuperação de senha'
            });

            res.json({ message: 'Email de recuperação enviado com sucesso' });
        } catch (error) {
            console.error('Erro na recuperação de senha:', error);
            res.status(500).json({ error: 'Erro ao processar recuperação de senha' });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (error) {
                return res.status(400).json({ error: 'Token inválido ou expirado' });
            }

            if (decoded.type !== 'password_reset') {
                return res.status(400).json({ error: 'Token inválido' });
            }

            const user = await User.findOne({
                where: {
                    id: decoded.id,
                    reset_token: token
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'Token inválido ou já utilizado' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 8);

            await User.update(
                {
                    password: hashedPassword,
                    reset_token: null
                },
                { where: { id: user.id } }
            );

            await Activity.createActivity({
                user_id: user.id,
                type: 'password_reset',
                description: 'Senha redefinida com sucesso'
            });

            res.json({ message: 'Senha redefinida com sucesso' });
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            res.status(500).json({ error: 'Erro ao redefinir senha' });
        }
    }
}

module.exports = new AuthController(); 