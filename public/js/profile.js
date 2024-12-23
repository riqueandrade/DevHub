// Elementos do DOM
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const totalCourses = document.getElementById('totalCourses');
const totalCertificates = document.getElementById('totalCertificates');
const totalHours = document.getElementById('totalHours');
const streakDays = document.getElementById('streakDays');
const userLevel = document.getElementById('userLevel');
const levelTitle = document.getElementById('levelTitle');
const levelProgress = document.getElementById('levelProgress');
const pointsToNextLevel = document.getElementById('pointsToNextLevel');
const achievementsList = document.getElementById('achievementsList');
const activitiesList = document.getElementById('activitiesList');

// Configuração inicial
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Carregar dados atualizados do servidor primeiro
        await loadUserProfile();
        await loadUserStats();
        await loadAchievements();
        await loadActivities();
        setupEventListeners();
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showError('Erro ao carregar informações do perfil');
    }
});

// Carregar perfil do usuário
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar perfil');

        const user = await response.json();
        // Atualizar localStorage com dados mais recentes
        localStorage.setItem('user', JSON.stringify(user));
        updateProfileUI(user);
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        throw error;
    }
}

// Carregar estatísticas do usuário
async function loadUserStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar estatísticas');

        const stats = await response.json();
        updateStatsUI(stats);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        throw error;
    }
}

// Carregar conquistas
async function loadAchievements() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/achievements', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar conquistas');

        const achievements = await response.json();
        updateAchievementsUI(achievements);
    } catch (error) {
        console.error('Erro ao carregar conquistas:', error);
        // Não lançar erro para não interromper o carregamento
    }
}

// Carregar atividades
async function loadActivities() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/activities', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar atividades');

        const activities = await response.json();
        updateActivitiesUI(activities);
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        // Não lançar erro para não interromper o carregamento
    }
}

// Atualizar UI do perfil
function updateProfileUI(user) {
    // Atualizar avatar principal
    profileAvatar.src = user.avatar_url || '/images/default-avatar.svg';

    // Atualizar avatar no dropdown
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.src = user.avatar_url || '/images/default-avatar.svg';
    }

    // Atualizar nome e email
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;

    // Atualizar nome no dropdown
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = user.name;
    }
}

// Atualizar UI das estatísticas
function updateStatsUI(stats) {
    totalCourses.textContent = stats.coursesInProgress || 0;
    totalCertificates.textContent = stats.certificates || 0;
    totalHours.textContent = `${stats.studyHours || 0}h`;
    streakDays.textContent = stats.streak || 0;

    // Atualizar nível
    const level = calculateLevel(stats.totalPoints || 0);
    userLevel.textContent = level.current;
    levelTitle.textContent = getLevelTitle(level.current);
    levelProgress.style.width = `${level.progress}%`;
    pointsToNextLevel.textContent = level.pointsToNext;
}

// Atualizar UI das conquistas
function updateAchievementsUI(achievements) {
    achievementsList.innerHTML = achievements.map(achievement => `
        <div class="achievement-item ${achievement.unlocked ? '' : 'achievement-locked'}">
            <i class="bi ${achievement.icon} achievement-icon"></i>
            <p>${achievement.name}</p>
        </div>
    `).join('');
}

// Atualizar UI das atividades
function updateActivitiesUI(activities) {
    activitiesList.innerHTML = activities.map(activity => `
        <div class="timeline-item">
            <div class="timeline-icon">
                <i class="bi ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="timeline-content">
                <p class="timeline-date">${formatDate(activity.created_at)}</p>
                <p>${activity.description}</p>
            </div>
        </div>
    `).join('');
}

// Funções auxiliares
function calculateLevel(points) {
    const basePoints = 100;
    const current = Math.floor(points / basePoints) + 1;
    const nextLevelPoints = current * basePoints;
    const progress = ((points % basePoints) / basePoints) * 100;
    const pointsToNext = nextLevelPoints - points;

    return { current, progress, pointsToNext };
}

function getLevelTitle(level) {
    const titles = {
        1: 'Iniciante',
        2: 'Aprendiz',
        3: 'Intermediário',
        4: 'Avançado',
        5: 'Expert'
    };
    return titles[level] || 'Mestre';
}

function getActivityIcon(type) {
    const icons = {
        'course_start': 'bi-play-circle',
        'course_complete': 'bi-check-circle',
        'lesson_complete': 'bi-book',
        'certificate_earned': 'bi-award',
        'profile_update': 'bi-person'
    };
    return icons[type] || 'bi-circle';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showError(message) {
    // Implementar lógica de exibição de erro
    console.error(message);
}

// Event Listeners
function setupEventListeners() {
    // Upload de avatar
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    uploadAvatarBtn.addEventListener('click', handleAvatarUpload);

    // Edição de perfil
    const editProfileBtn = document.getElementById('editProfileBtn');
    editProfileBtn.addEventListener('click', showEditProfileForm);

    // Alteração de senha
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    changePasswordBtn.addEventListener('click', showChangePasswordForm);

    // Logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

// Handlers
async function handleAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Log do arquivo selecionado
        console.log('Arquivo selecionado:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        // Validar tipo do arquivo
        if (!file.type.startsWith('image/')) {
            showError('Por favor, selecione uma imagem válida');
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('A imagem deve ter no máximo 5MB');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            // Log do FormData
            console.log('FormData entries:');
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const token = localStorage.getItem('token');
            console.log('Token presente:', !!token);

            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Status da resposta:', response.status);
            console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Resposta do servidor:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { message: errorText };
                }
                
                console.error('Detalhes do erro:', errorData);
                throw new Error(errorData.message || errorData.error || 'Erro ao fazer upload do avatar');
            }

            const data = await response.json();
            console.log('Resposta do servidor:', data);
            
            // Atualizar avatar na interface
            if (profileAvatar) {
                profileAvatar.src = data.avatar_url + '?t=' + new Date().getTime();
                console.log('Avatar principal atualizado');
            }
            
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.src = data.avatar_url + '?t=' + new Date().getTime();
                console.log('Avatar do menu atualizado');
            }

            // Atualizar dados no localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, avatar_url: data.avatar_url };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('Dados do usuário atualizados no localStorage');

            showSuccess('Avatar atualizado com sucesso!');
        } catch (error) {
            console.error('Detalhes completos do erro:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            showError(error.message || 'Erro ao fazer upload do avatar');
        }
    };

    input.click();
}

function showEditProfileForm() {
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        const modal = new bootstrap.Modal(editProfileModal);
        
        // Preencher o formulário com os dados atuais do usuário
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            const nameInput = editProfileModal.querySelector('#editName');
            const emailInput = editProfileModal.querySelector('#editEmail');
            const bioInput = editProfileModal.querySelector('#editBio');
            
            if (nameInput) nameInput.value = userData.name || '';
            if (emailInput) emailInput.value = userData.email || '';
            if (bioInput) bioInput.value = userData.bio || '';
        }
        
        modal.show();
    } else {
        console.error('Modal de edição não encontrado');
        showError('Erro ao abrir formulário de edição');
    }
}

function showChangePasswordForm() {
    const changePasswordModal = document.getElementById('changePasswordModal');
    if (changePasswordModal) {
        const modal = new bootstrap.Modal(changePasswordModal);
        modal.show();
    } else {
        console.error('Modal de alteração de senha não encontrado');
        showError('Erro ao abrir formulário de alteração de senha');
    }
}

function handleLogout() {
    // Limpar dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirecionar para a página de login
    window.location.href = '/auth.html';
}

// Adicionar handler para salvar alterações do perfil
document.addEventListener('DOMContentLoaded', () => {
    // Handler para edição de perfil
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(editProfileForm);
                const token = localStorage.getItem('token');
                
                const response = await fetch('/api/user/update', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: formData.get('name'),
                        email: formData.get('email'),
                        bio: formData.get('bio')
                    })
                });

                if (!response.ok) throw new Error('Erro ao atualizar perfil');

                const updatedUser = await response.json();
                
                // Atualizar localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Atualizar UI
                updateProfileUI(updatedUser);
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                if (modal) modal.hide();
                
                // Mostrar mensagem de sucesso
                showSuccess('Perfil atualizado com sucesso!');
                
            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                showError('Erro ao atualizar perfil');
            }
        });
    }

    // Handler para alteração de senha
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(changePasswordForm);
                const newPassword = formData.get('newPassword');
                const confirmPassword = formData.get('confirmPassword');
                
                if (newPassword !== confirmPassword) {
                    throw new Error('As senhas não coincidem');
                }
                
                const token = localStorage.getItem('token');
                const response = await fetch('/api/user/change-password', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        currentPassword: formData.get('currentPassword'),
                        newPassword: newPassword
                    })
                });

                if (!response.ok) throw new Error('Erro ao alterar senha');
                
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                if (modal) modal.hide();
                
                // Limpar formulário
                changePasswordForm.reset();
                
                // Mostrar mensagem de sucesso
                showSuccess('Senha alterada com sucesso!');
                
            } catch (error) {
                console.error('Erro ao alterar senha:', error);
                showError(error.message || 'Erro ao alterar senha');
            }
        });
    }
});

function showSuccess(message) {
    const successToast = document.createElement('div');
    successToast.className = 'toast align-items-center text-white bg-success border-0';
    successToast.setAttribute('role', 'alert');
    successToast.setAttribute('aria-live', 'assertive');
    successToast.setAttribute('aria-atomic', 'true');
    
    successToast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(successToast);
    const toast = new bootstrap.Toast(successToast);
    toast.show();
    
    successToast.addEventListener('hidden.bs.toast', () => {
        successToast.remove();
    });
} 