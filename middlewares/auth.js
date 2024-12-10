const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Verificar se o token foi fornecido
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        // Extrair o token do header
        const [, token] = authHeader.split(' ');

        try {
            // Verificar se o token é válido
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Buscar usuário
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }

            // Adicionar usuário à requisição
            req.user = user;
            
            return next();
        } catch (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}; 