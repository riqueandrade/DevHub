document.addEventListener('DOMContentLoaded', async () => {
    // Limpar localStorage ao entrar na página de autenticação
    localStorage.clear();

    // Função para mostrar mensagens
    const showMessage = (message, type = 'danger') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.insertBefore(alertDiv, loginForm.firstChild);
        }
        
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    };

    // Verificar se usuário já está autenticado
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Verificar se o token ainda é válido
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                window.location.replace('/dashboard.html');
                return;
            } else {
                // Se o token não for válido, limpar o localStorage
                localStorage.clear();
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            localStorage.clear();
        }
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Função para trocar as tabs
    const switchTab = (tabId) => {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    };
    
    // Event listeners para as tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Verificar se há erro na URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        let errorMessage = 'Erro durante a autenticação';
        switch (error) {
            case 'google_auth_failed':
                errorMessage = 'Falha na autenticação com o Google';
                break;
            case 'auth_failed':
                errorMessage = 'Erro ao processar autenticação';
                break;
            case 'missing_data':
                errorMessage = 'Dados de autenticação incompletos';
                break;
            case 'invalid_user_data':
                errorMessage = 'Dados do usuário inválidos';
                break;
        }
        showMessage(errorMessage);
    }

    // Função para validar o formulário de registro
    const validateRegisterForm = () => {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem');
            return false;
        }
        
        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres');
            return false;
        }
        
        return true;
    };

    // Handler do formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }
            
            // Salvar token e dados do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Mostrar mensagem de sucesso e redirecionar
            showMessage('Login realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
            
        } catch (error) {
            showMessage(error.message);
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    });

    // Handler do formulário de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateRegisterForm()) return;
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao registrar');
            }
            
            // Salvar token e dados do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Mostrar mensagem de sucesso e redirecionar
            showMessage('Registro realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
            
        } catch (error) {
            showMessage(error.message);
            registerForm.classList.add('shake');
            setTimeout(() => registerForm.classList.remove('shake'), 500);
        }
    });

    // Função para lidar com o login do Google
    window.handleGoogleLogin = async () => {
        try {
            // Buscar configurações do Google do backend
            const response = await fetch('/api/auth/google/config');
            const { clientId, redirectUri } = await response.json();
            
            // Log temporário para debug
            console.log('=== Configurações do Google OAuth (Frontend) ===');
            console.log('Redirect URI recebido:', redirectUri);
            console.log('============================================');
            
            const scope = encodeURIComponent('email profile');
            const responseType = 'code';
            const prompt = 'select_account';
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}&prompt=${prompt}`;
            
            window.location.href = authUrl;
        } catch (error) {
            console.error('Erro ao iniciar login com Google:', error);
            showMessage('Erro ao iniciar login com Google');
        }
    };

    // Adicionar funcionalidade de mostrar/ocultar senha
    const showPasswordButtons = document.querySelectorAll('.show-password');
    showPasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
                button.title = 'Ocultar senha';
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
                button.title = 'Mostrar senha';
            }
        });
    });

    // Função para processar o login
    const processLogin = (data) => {
        console.log('Processando login:', {
            token: data.token ? data.token.substring(0, 10) + '...' : null,
            user: {
                ...data.user,
                onboarding_completed: data.user.onboarding_completed
            }
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Verificar se o usuário precisa completar o onboarding
        if (!data.user.onboarding_completed) {
            console.log('Redirecionando para onboarding');
            window.location.href = '/onboarding.html';
        } else {
            console.log('Redirecionando para dashboard');
            window.location.href = '/dashboard.html';
        }
    };
});