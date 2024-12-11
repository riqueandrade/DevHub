require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const models = require('./models');

const UserController = require('./controllers/UserController');
const CourseController = require('./controllers/CourseController');
const StatsController = require('./controllers/StatsController');
const authMiddleware = require('./middlewares/auth');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Rota protegida para certificados
app.use('/certificates', authMiddleware, express.static(path.join(__dirname, 'certificates')));

// Rotas de Autenticaç����o
app.post('/api/auth/register', UserController.register);
app.post('/api/auth/login', UserController.login);
app.get('/api/auth/verify', UserController.verifyToken);
app.get('/api/auth/google/config', UserController.getGoogleConfig);
app.get('/api/auth/google/callback', UserController.googleCallback);

// Rotas protegidas
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/certificates', certificateRoutes);

// Rotas de Estatísticas
app.get('/api/user/stats', StatsController.getUserStats);

// Rota de verificação de saúde da API
app.get('/api/health', (req, res) => {
    res.json({ message: "API está funcionando!" });
});

// Rota específica para a página do curso
app.get('/course/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'course.html'));
});

// Rota específica para a página do certificado
app.get('/certificate/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'certificate.html'));
});

// Redirecionar todas as outras rotas para o index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Rota não encontrada' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Sincronizar banco de dados e iniciar servidor
sequelize.sync()
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Erro ao sincronizar banco de dados:', error);
    }); 