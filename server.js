require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const UserController = require('./controllers/UserController');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de Autenticação
app.post('/api/auth/register', UserController.register);
app.post('/api/auth/login', UserController.login);
app.get('/api/auth/verify', UserController.verifyToken);
app.get('/api/auth/google/config', UserController.getGoogleConfig);
app.get('/api/auth/google/callback', UserController.googleCallback);

// Rota de verificação de saúde da API
app.get('/api/health', (req, res) => {
    res.json({ message: "API está funcionando!" });
});

// Redirecionar todas as outras rotas para o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 