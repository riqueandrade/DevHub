document.addEventListener('DOMContentLoaded', async () => {
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
                window.location.href = '/dashboard.html';
                return;
            } else {
                // Se o token não for válido, limpar o localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
    
    // Função para mostrar mensagens
    const showMessage = (message, type = 'danger') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const activeForm = document.querySelector('.tab-content.active form');
        activeForm.insertBefore(alertDiv, activeForm.firstChild);
        
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    };

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
            const { clientId } = await response.json();
            
            const redirectUri = window.location.origin + '/api/auth/google/callback';
            const scope = 'email profile';
            const responseType = 'code';
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
            
            window.location.href = authUrl;
        } catch (error) {
            showMessage('Erro ao iniciar login com Google');
        }
    };
});