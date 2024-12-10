document.addEventListener('DOMContentLoaded', async () => {
    // Verifica autenticação
    if (!localStorage.getItem('token')) {
        window.location.href = '/auth.html';
        return;
    }

    // Carrega dados do usuário
    await loadUserData();

    // Event Listeners para os formulários
    setupFormListeners();
});

async function loadUserData() {
    try {
        const response = await fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/auth.html';
                return;
            }
            throw new Error('Erro ao carregar dados do usuário');
        }

        const userData = await response.json();

        // Preenche os campos do formulário de perfil
        document.getElementById('name').value = userData.name || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('avatarUrl').value = userData.avatar_url || '';

        // Atualiza avatar e nome no menu
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        userAvatar.src = userData.avatar_url || '/images/default-avatar.png';
        userName.textContent = userData.name;

        // Carrega preferências do usuário (se existirem)
        if (userData.preferences) {
            document.getElementById('emailNotifications').checked = userData.preferences.email_notifications;
            document.getElementById('courseUpdates').checked = userData.preferences.course_updates;
            document.getElementById('promotionalEmails').checked = userData.preferences.promotional_emails;
            document.getElementById('profileVisibility').checked = userData.preferences.profile_visibility;
            document.getElementById('showProgress').checked = userData.preferences.show_progress;
            document.getElementById('showCertificates').checked = userData.preferences.show_certificates;
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao carregar dados do usuário', 'danger');
    }
}

function setupFormListeners() {
    // Formulário de Perfil
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            avatar_url: document.getElementById('avatarUrl').value
        };

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao atualizar perfil');

            showAlert('Perfil atualizado com sucesso!', 'success');
            await loadUserData(); // Recarrega os dados para atualizar a interface
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao atualizar perfil', 'danger');
        }
    });

    // Formulário de Senha
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showAlert('As senhas não coincidem', 'danger');
            return;
        }

        try {
            const response = await fetch('/api/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (!response.ok) throw new Error('Erro ao atualizar senha');

            showAlert('Senha atualizada com sucesso!', 'success');
            passwordForm.reset();
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao atualizar senha', 'danger');
        }
    });

    // Formulário de Notificações
    const notificationsForm = document.getElementById('notificationsForm');
    notificationsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email_notifications: document.getElementById('emailNotifications').checked,
            course_updates: document.getElementById('courseUpdates').checked,
            promotional_emails: document.getElementById('promotionalEmails').checked
        };

        try {
            const response = await fetch('/api/users/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao atualizar notificações');

            showAlert('Preferências de notificação atualizadas!', 'success');
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao atualizar notificações', 'danger');
        }
    });

    // Formulário de Privacidade
    const privacyForm = document.getElementById('privacyForm');
    privacyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            profile_visibility: document.getElementById('profileVisibility').checked,
            show_progress: document.getElementById('showProgress').checked,
            show_certificates: document.getElementById('showCertificates').checked
        };

        try {
            const response = await fetch('/api/users/privacy', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao atualizar privacidade');

            showAlert('Configurações de privacidade atualizadas!', 'success');
        } catch (error) {
            console.error('Erro:', error);
            showAlert('Erro ao atualizar privacidade', 'danger');
        }
    });
}

function showAlert(message, type) {
    // Remove alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Cria novo alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4`;
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Adiciona o alerta ao corpo do documento
    document.body.appendChild(alertDiv);

    // Remove o alerta após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 