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
        // Carregar dados do localStorage primeiro
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            updateProfileUI(userData);
        }

        // Depois carregar dados atualizados do servidor
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
    profileAvatar.src = user.avatar_url || '/images/default-avatar.png';
    
    // Atualizar avatar no dropdown
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.src = user.avatar_url || '/images/default-avatar.png';
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
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) throw new Error('Erro ao fazer upload do avatar');

                const data = await response.json();
                
                // Atualizar avatar na interface
                profileAvatar.src = data.avatar_url;
                document.getElementById('userAvatar').src = data.avatar_url;

                // Atualizar dados no localStorage
                const userData = data.user;
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (error) {
                console.error('Erro no upload:', error);
                showError('Erro ao fazer upload do avatar');
            }
        }
    };
    input.click();
}

function showEditProfileForm() {
    document.getElementById('editProfileForm').style.display = 'block';
    document.getElementById('activityHistory').style.display = 'none';
    document.getElementById('changePasswordForm').style.display = 'none';
}

function showChangePasswordForm() {
    document.getElementById('changePasswordForm').style.display = 'block';
    document.getElementById('activityHistory').style.display = 'none';
    document.getElementById('editProfileForm').style.display = 'none';
}

function handleLogout() {
    // Limpar dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para a página de login
    window.location.href = '/auth.html';
} 