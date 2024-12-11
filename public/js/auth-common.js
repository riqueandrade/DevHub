// Função para verificar autenticação
async function verifyAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/auth.html');
        return false;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.clear();
            window.location.replace('/auth.html');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        localStorage.clear();
        window.location.replace('/auth.html');
        return false;
    }
}

// Função para fazer logout
function logout() {
    localStorage.clear();
    window.location.replace('/auth.html');
}

// Função para mostrar alertas
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Adiciona o alerta no topo da página
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }

    // Remove o alerta após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 