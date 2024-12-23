document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage('Token de recuperação não encontrado', 'danger');
        setTimeout(() => window.location.href = '/auth.html', 3000);
        return;
    }

    // Função para mostrar mensagens
    function showMessage(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const authContent = document.querySelector('.auth-content');
        authContent.insertBefore(alertDiv, resetPasswordForm);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Handler para mostrar/ocultar senha
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

    // Handler para o formulário de reset de senha
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validar senhas
        if (newPassword !== confirmPassword) {
            showMessage('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            const response = await fetch('/api/user/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao redefinir senha');
            }

            showMessage('Senha redefinida com sucesso!', 'success');
            setTimeout(() => window.location.href = '/auth.html', 2000);

        } catch (error) {
            console.error('Erro:', error);
            showMessage(error.message);
            resetPasswordForm.classList.add('shake');
            setTimeout(() => resetPasswordForm.classList.remove('shake'), 500);
        }
    });
}); 