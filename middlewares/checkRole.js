const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }

        next();
    };
};

module.exports = checkRole; 