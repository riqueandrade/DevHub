# DevHub

DevHub é uma plataforma de aprendizado para desenvolvedores, oferecendo cursos, certificações e acompanhamento de progresso.

## 🚀 Funcionalidades

- 👤 Sistema de autenticação (Local e Google)
- 📚 Catálogo de cursos
- 📊 Dashboard personalizado
- 📈 Sistema de progresso e conquistas
- 📜 Certificados de conclusão
- 📱 Interface responsiva
- 🔔 Sistema de atividades

## 🛠️ Tecnologias

- **Backend:**
  - Node.js
  - Express
  - Sequelize (MySQL)
  - JWT para autenticação
  - Google OAuth2

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (Vanilla)
  - Bootstrap 5

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- MySQL
- NPM ou Yarn

## ⚙️ Configuração

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd DevHub
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
PORT=3000
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=devhub
JWT_SECRET=seu_jwt_secret
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

4. Inicie o servidor:
```bash
npm start
```

## 📁 Estrutura do Projeto

```
DevHub/
├── config/           # Configurações do projeto
├── controllers/      # Controladores da aplicação
├── models/          # Modelos do banco de dados
├── middlewares/     # Middlewares da aplicação
├── routes/          # Rotas da API
├── public/          # Arquivos estáticos
│   ├── css/         # Estilos CSS
│   ├── js/          # Scripts JavaScript
│   └── images/      # Imagens
├── uploads/         # Uploads de usuários
└── database/        # Arquivos do banco de dados
```

## 🔒 Autenticação

O sistema suporta dois métodos de autenticação:
- Login tradicional com email/senha
- Login com Google (OAuth2)

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/verify` - Verificação de token
- `GET /api/auth/google/config` - Configuração do Google OAuth
- `GET /api/auth/google/callback` - Callback do Google OAuth

### Usuário
- `GET /api/user/me` - Dados do perfil
- `GET /api/user/stats` - Estatísticas do usuário
- `GET /api/user/activities` - Atividades do usuário
- `GET /api/user/achievements` - Conquistas do usuário

### Cursos
- `GET /api/courses/in-progress` - Cursos em andamento
- `GET /api/courses/recommended` - Cursos recomendados

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
