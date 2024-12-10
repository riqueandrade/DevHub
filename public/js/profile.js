document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
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

    // Elementos do DOM
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const totalCourses = document.getElementById('totalCourses');
    const totalCertificates = document.getElementById('totalCertificates');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const activityHistory = document.getElementById('activityHistory');
    const activitiesList = document.getElementById('activitiesList');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const logoutButton = document.getElementById('logoutButton');

    // Carregar dados do usuário
    const loadUserData = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Atualizar elementos da interface com dados do usuário
            const userNameElement = document.getElementById('userName');
            if (userNameElement) userNameElement.textContent = user.name;

            const userAvatarElement = document.getElementById('userAvatar');
            if (userAvatarElement) {
                userAvatarElement.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
            }

            // Atualizar elementos do perfil
            profileName.textContent = user.name;
            profileEmail.textContent = user.email;
            profileAvatar.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&size=150`;

            // Preencher formulário de edição
            document.getElementById('editName').value = user.name;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editBio').value = user.bio || '';
        }
    };

    // Carregar estatísticas
    const loadStats = async () => {
        try {
            const response = await fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar estatísticas');

            const stats = await response.json();
            totalCourses.textContent = stats.coursesInProgress || 0;
            totalCertificates.textContent = stats.certificates || 0;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    // Carregar histórico de atividades
    const loadActivities = async () => {
        try {
            const response = await fetch('/api/user/activities', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar atividades');

            const activities = await response.json();
            activitiesList.innerHTML = activities.length ? activities.map(activity => `
                <div class="timeline-item">
                    <div class="timeline-icon">
                        <i class="bi ${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="timeline-content">
                        <p class="timeline-date">${formatDate(activity.created_at)}</p>
                        <p>${activity.description}</p>
                    </div>
                </div>
            `).join('') : '<p class="text-center">Nenhuma atividade recente</p>';
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            activitiesList.innerHTML = '<p class="text-center text-danger">Erro ao carregar atividades</p>';
        }
    };

    // Funções auxiliares
    const getActivityIcon = (type) => {
        const icons = {
            course_start: 'bi-play-circle',
            course_complete: 'bi-check-circle',
            lesson_complete: 'bi-book',
            certificate: 'bi-award',
            profile_update: 'bi-person'
        };
        return icons[type] || 'bi-circle';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Event Handlers
    editProfileBtn.addEventListener('click', () => {
        editProfileForm.style.display = 'block';
        changePasswordForm.style.display = 'none';
        activityHistory.style.display = 'none';
    });

    changePasswordBtn.addEventListener('click', () => {
        changePasswordForm.style.display = 'block';
        editProfileForm.style.display = 'none';
        activityHistory.style.display = 'none';
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        editProfileForm.style.display = 'none';
        activityHistory.style.display = 'block';
        loadUserData(); // Recarregar dados originais
    });

    document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
        changePasswordForm.style.display = 'none';
        activityHistory.style.display = 'block';
    });

    // Handler do formulário de edição
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                bio: document.getElementById('editBio').value
            };

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao atualizar perfil');

            const updatedUser = await response.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            loadUserData();
            editProfileForm.style.display = 'none';
            activityHistory.style.display = 'block';
            
            // Mostrar mensagem de sucesso
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        }
    });

    // Handler do formulário de senha
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                throw new Error('As senhas não coincidem');
            }

            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) throw new Error('Erro ao alterar senha');

            changePasswordForm.style.display = 'none';
            activityHistory.style.display = 'block';
            document.getElementById('passwordForm').reset();
            
            // Mostrar mensagem de sucesso
            alert('Senha alterada com sucesso!');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            alert(error.message || 'Erro ao alterar senha. Tente novamente.');
        }
    });

    // Handler do upload de avatar
    uploadAvatarBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const formData = new FormData();
                formData.append('avatar', file);

                const response = await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!response.ok) throw new Error('Erro ao fazer upload do avatar');

                const { avatar_url } = await response.json();
                const user = JSON.parse(localStorage.getItem('user'));
                user.avatar_url = avatar_url;
                localStorage.setItem('user', JSON.stringify(user));
                
                loadUserData();
            } catch (error) {
                console.error('Erro ao fazer upload do avatar:', error);
                alert('Erro ao fazer upload do avatar. Tente novamente.');
            }
        };
        input.click();
    });

    // Handler do logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
    });

    // Carregar dados iniciais
    loadUserData();
    loadStats();
    loadActivities();

    // Verificar token periodicamente
    setInterval(verifyToken, 5 * 60 * 1000);
}); 