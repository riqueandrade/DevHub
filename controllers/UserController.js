const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            
            const userExists = await User.findOne({ where: { email } });
            if (userExists) {
                return res.status(400).json({ error: 'Usuário já existe' });
            }

            const user = await User.create({ name, email, password });
            user.password = undefined;

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            return res.json({ user, token });
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

            user.password = undefined;

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            return res.json({ user, token });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new UserController(); 