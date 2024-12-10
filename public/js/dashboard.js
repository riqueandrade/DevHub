document.addEventListener('DOMContentLoaded', async () => {
    // Função para verificar o token
    const verifyToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth.html';
            return false;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            return true;
        } catch (error) {
            console.error('Erro na verificação do token:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth.html';
            return false;
        }
    };

    // Verificar token inicialmente
    if (!await verifyToken()) {
        return;
    }

    // Verificar token a cada 5 minutos
    setInterval(verifyToken, 5 * 60 * 1000);

    // Carregar dados do usuário
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // Atualizar elementos da interface com dados do usuário
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }

        const userAvatarElement = document.getElementById('userAvatar');
        if (userAvatarElement && user.avatar_url) {
            userAvatarElement.src = user.avatar_url;
        }
    }

    // Handler do botão de logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth.html';
        });
    }
}); 