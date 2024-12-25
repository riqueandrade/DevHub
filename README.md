# DevHub

DevHub é uma plataforma de aprendizado para desenvolvedores, oferecendo cursos, certificações e acompanhamento de progresso.

## 🚀 Funcionalidades

- 👤 Sistema de autenticação (Local e Google)
- 📚 Catálogo de cursos com diferentes níveis
- 📊 Dashboard personalizado com estatísticas
- 📈 Sistema de progresso e conquistas
- 📜 Certificados de conclusão personalizados
- 📱 Interface responsiva e moderna
- 🔔 Sistema de atividades e notificações
- 👨‍🏫 Área do instrutor para gerenciar cursos
- 🎯 Sistema de níveis e conquistas
- 💼 Perfil personalizado com bio e avatar

## 🛠️ Tecnologias

- **Backend:**
  - Node.js (v18.x)
  - Express (v4.18.x)
  - Sequelize (v6.35.x)
  - PostgreSQL (v14+)
  - JWT para autenticação
  - Google OAuth2
  - Multer para upload de arquivos
  - PDFKit para geração de certificados
  - Nodemailer para envio de emails

- **Frontend:**
  - HTML5
  - CSS3 com design moderno
  - JavaScript (ES6+)
  - Bootstrap 5.3
  - Bootstrap Icons
  - Vanilla JS (sem frameworks)

## 💻 Requisitos do Sistema

### Hardware Recomendado
- Processador: 2 cores ou superior
- RAM: 4GB ou superior
- Armazenamento: 1GB de espaço livre

### Software Necessário
- Node.js (v14 ou superior)
- PostgreSQL (v14 ou superior)
- NPM (v8 ou superior) ou Yarn
- Sistema Operacional: Windows 10+, macOS 10.15+, ou Linux

## ⚙️ Configuração

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/DevHub.git
cd DevHub
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=devhub
DB_PORT=5432

# Autenticação
JWT_SECRET=seu_jwt_secret
JWT_EXPIRATION=24h

# Google OAuth2
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./public/uploads
```

### Desenvolvimento

1. Inicie o servidor em modo desenvolvimento:
```bash
npm run dev
```

2. Acesse a aplicação:
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
DevHub/
├── config/           # Configurações do projeto e banco de dados
├── controllers/      # Controladores da aplicação
│   ├── auth/        # Controladores de autenticação
│   ├── profile/     # Controladores de perfil
│   └── ...
├── models/          # Modelos do banco de dados
├── middlewares/     # Middlewares da aplicação
├── routes/          # Rotas da API
├── public/          # Arquivos estáticos
│   ├── css/         # Estilos CSS por página
│   ├── js/          # Scripts JavaScript por página
│   ├── images/      # Imagens e ícones
│   └── uploads/     # Uploads de usuários
├── database/        # Scripts SQL e migrations
└── certificates/    # Certificados gerados
```

## 🔒 Autenticação

O sistema suporta dois métodos de autenticação:
- Login tradicional com email/senha (JWT)
- Login com Google (OAuth2)

### Recursos de Segurança
- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Proteção contra CSRF
- Validação de dados
- Upload seguro de arquivos
- Controle de acesso baseado em roles

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/verify` - Verificação de token
- `GET /api/auth/google/config` - Configuração do Google OAuth
- `GET /api/auth/google/callback` - Callback do Google OAuth

### Usuário
- `GET /api/user/me` - Dados do perfil
- `GET /api/user/profile` - Perfil completo
- `PUT /api/user/profile` - Atualizar perfil
- `POST /api/user/avatar` - Upload de avatar
- `PUT /api/user/password` - Alterar senha
- `GET /api/user/stats` - Estatísticas
- `GET /api/user/activities` - Atividades
- `GET /api/user/achievements` - Conquistas

### Cursos
- `GET /api/courses` - Listar cursos
- `GET /api/courses/:id` - Detalhes do curso
- `POST /api/courses` - Criar curso (instrutor)
- `PUT /api/courses/:id` - Atualizar curso (instrutor)
- `GET /api/courses/in-progress` - Cursos em andamento
- `GET /api/courses/recommended` - Cursos recomendados

### Certificados
- `GET /api/certificates` - Listar certificados
- `GET /api/certificates/:id/download` - Download do certificado

## ❗ Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco de dados**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no arquivo .env
   - Verifique se o banco de dados existe

2. **Erro no login com Google**
   - Verifique as credenciais do Google OAuth
   - Confirme a URL de callback no Console do Google

3. **Uploads não funcionam**
   - Verifique as permissões da pasta uploads
   - Confirme o limite de upload no .env

## 📋 FAQ

**P: Como resetar minha senha?**
R: Use a opção "Esqueci minha senha" na tela de login.

**P: Como me tornar instrutor?**
R: Complete seu perfil e solicite upgrade na página de configurações.

**P: Quanto tempo os certificados ficam disponíveis?**
R: Os certificados ficam disponíveis permanentemente em sua conta.

## 👥 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

📱 WhatsApp: [47988231069](https://wa.me/5547988231069)
📧 Email: henriquereynaud7@gmail.com
🌐 LinkedIn: [Henrique Reynaud](https://www.linkedin.com/in/henrique-reynaud/)
