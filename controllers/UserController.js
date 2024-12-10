const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

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
}

module.exports = new UserController(); 