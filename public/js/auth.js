document.addEventListener('DOMContentLoaded', async () => {
    // Limpar localStorage ao entrar na página de autenticação
    localStorage.clear();

    // Função para mostrar mensagens
    const showMessage = (message, type = 'danger') => {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        const form = document.querySelector('form.active') || document.getElementById('loginForm');
        form.insertBefore(alertDiv, form.firstChild);
        
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    };

    // Função para mostrar/ocultar loading
    const toggleLoading = (show = true) => {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.toggle('d-none', !show);
    };

    // Função para mostrar/ocultar loading do botão
    const toggleButtonLoading = (button, loading = true) => {
        const spinner = button.querySelector('.spinner-border');
        const text = button.querySelector('.button-text');
        
        spinner.classList.toggle('d-none', !loading);
        text.classList.toggle('d-none', loading);
        button.disabled = loading;
    };

    // Validação de força de senha
    const validatePasswordStrength = (password) => {
        const requirements = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        const strengthMeter = document.querySelector('.strength-meter-fill');
        const requirementsList = document.querySelectorAll('.password-requirements li');
        
        let strength = 0;
        Object.entries(requirements).forEach(([key, valid]) => {
            const requirement = document.querySelector(`[data-requirement="${key}"]`);
            const icon = requirement.querySelector('i');
            
            if (valid) {
                requirement.classList.add('valid');
                icon.classList.replace('bi-x-circle', 'bi-check-circle');
                icon.classList.replace('text-danger', 'text-success');
                strength++;
            } else {
                requirement.classList.remove('valid');
                icon.classList.replace('bi-check-circle', 'bi-x-circle');
                icon.classList.replace('text-success', 'text-danger');
            }
        });

        strengthMeter.setAttribute('data-strength', strength);
        return Object.values(requirements).every(Boolean);
    };

    // Verificar se usuário já está autenticado
    const token = localStorage.getItem('token');
    if (token) {
        try {
            toggleLoading(true);
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                window.location.replace('/dashboard.html');
                return;
            } else {
                localStorage.clear();
            }
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            localStorage.clear();
        } finally {
            toggleLoading(false);
        }
    }

    // Setup dos formulários e tabs
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Função para trocar as tabs
    const switchTab = (tabId) => {
        tabBtns.forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        
        tabContents.forEach(content => {
            const isActive = content.id === tabId;
            content.classList.toggle('active', isActive);
            content.setAttribute('aria-hidden', !isActive);
        });
    };
    
    // Event listeners para as tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Validação em tempo real da senha
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', (e) => {
            validatePasswordStrength(e.target.value);
        });
    }

    // Função para executar o reCAPTCHA
    const executeRecaptcha = async (action) => {
        try {
            return await grecaptcha.execute('6LcMLaQqAAAAAA74GSdlgf5WawpLWoxFbgevu6ZO', { action });
        } catch (error) {
            console.error('Erro ao executar reCAPTCHA:', error);
            throw new Error('Erro na verificação de segurança');
        }
    };

    // Handler do formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const button = loginForm.querySelector('button[type="submit"]');
        
        try {
            toggleButtonLoading(button, true);
            
            // Executar reCAPTCHA
            const recaptchaToken = await executeRecaptcha('login');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    recaptchaToken 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Login realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
            
        } catch (error) {
            showMessage(error.message);
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        } finally {
            toggleButtonLoading(button, false);
        }
    });

    // Handler do formulário de registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const button = registerForm.querySelector('button[type="submit"]');
        
        try {
            toggleButtonLoading(button, true);
            
            // Validações
            if (password !== confirmPassword) {
                throw new Error('As senhas não coincidem');
            }
            
            if (!validatePasswordStrength(password)) {
                throw new Error('A senha não atende aos requisitos mínimos');
            }
            
            // Executar reCAPTCHA
            const recaptchaToken = await executeRecaptcha('register');
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password,
                    recaptchaToken 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao registrar');
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Registro realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = '/onboarding.html', 1500);
            
        } catch (error) {
            showMessage(error.message);
            registerForm.classList.add('shake');
            setTimeout(() => registerForm.classList.remove('shake'), 500);
        } finally {
            toggleButtonLoading(button, false);
        }
    });

    // Função para lidar com o login do Google
    window.handleGoogleLogin = async () => {
        try {
            toggleLoading(true);
            const response = await fetch('/api/auth/google/config');
            const { clientId, redirectUri } = await response.json();
            
            const scope = encodeURIComponent('email profile');
            const responseType = 'code';
            const prompt = 'select_account';
            
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}&prompt=${prompt}`;
            
            window.location.href = authUrl;
        } catch (error) {
            console.error('Erro ao iniciar login com Google:', error);
            showMessage('Erro ao iniciar login com Google');
            toggleLoading(false);
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
                icon.classList.replace('bi-eye', 'bi-eye-slash');
                button.setAttribute('aria-label', 'Ocultar senha');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
                button.setAttribute('aria-label', 'Mostrar senha');
            }
        });
    });

    // Verificar URL para erros ou redirecionamentos
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
});