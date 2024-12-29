require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const sequelize = require('./config/database');

// Importar controladores
const AuthController = require('./controllers/auth/AuthController');
const StatsController = require('./controllers/stats/StatsController');
const CertificateController = require('./controllers/certificates/CertificateController');
const authMiddleware = require('./middlewares/auth');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const catalogRoutes = require('./routes/catalogRoutes');

const app = express();
 
// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Aumentado para 50MB
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp'),
    debug: true
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Garantir que o diretório de uploads existe
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'lessons');
if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Rota específica para arquivos de aula
app.get('/uploads/lessons/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'uploads', 'lessons', req.params.filename);
    console.log('Tentando acessar arquivo:', {
        requestedFile: req.params.filename,
        fullPath: filePath
    });
    
    // Verificar se o arquivo existe
    if (!require('fs').existsSync(filePath)) {
        console.error('Arquivo não encontrado:', {
            requestedFile: req.params.filename,
            fullPath: filePath,
            existingFiles: require('fs').readdirSync(path.join(__dirname, 'public', 'uploads', 'lessons'))
        });
        return res.status(404).json({ 
            error: 'Arquivo não encontrado',
            message: 'O arquivo solicitado não está disponível no momento.',
            requestedFile: req.params.filename
        });
    }

    // Log do tipo do arquivo
    const mimeType = require('mime-types').lookup(filePath);
    console.log('Tipo do arquivo:', {
        file: req.params.filename,
        mimeType: mimeType
    });

    // Enviar o arquivo com o tipo MIME correto
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Erro ao enviar arquivo:', {
                error: err,
                file: req.params.filename,
                path: filePath
            });
            if (err.code === 'ENOENT') {
                res.status(404).json({ 
                    error: 'Arquivo não encontrado',
                    message: 'O arquivo solicitado não está disponível no momento.',
                    details: err.message
                });
            } else {
                res.status(500).json({ 
                    error: 'Erro ao carregar arquivo',
                    message: 'Ocorreu um erro ao tentar carregar o arquivo.',
                    details: err.message
                });
            }
        } else {
            console.log('Arquivo enviado com sucesso:', req.params.filename);
        }
    });
});

// Rota protegida para certificados
app.use('/certificates', authMiddleware, express.static(path.join(__dirname, 'certificates')));

// Rotas de Autenticação
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/verify', AuthController.verifyToken);
app.get('/api/auth/google/config', AuthController.getGoogleConfig);
app.get('/api/auth/google/callback', AuthController.googleCallback);

// Rotas protegidas
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/catalog', catalogRoutes);

// Rotas de certificados
app.get('/api/user/certificates', CertificateController.getCertificates);
app.get('/api/user/certificates/:id/download', CertificateController.downloadCertificate);

// Rotas de Estatísticas
app.get('/api/user/stats', StatsController.getStats);

// Rota de verificação de saúde da API
app.get('/api/health', (req, res) => {
    res.json({ message: "API está funcionando!" });
});

// Rotas específicas para a página do curso (devem vir antes da rota catch-all)
app.get('/course/:courseId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'course.html'));
});

app.get('/course/:courseId/module/:moduleId/lesson/:lessonId', (req, res) => {
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
    } else if (req.path.startsWith('/js/') || 
               req.path.startsWith('/css/') || 
               req.path.startsWith('/images/') || 
               req.path.startsWith('/uploads/')) {
        next();
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