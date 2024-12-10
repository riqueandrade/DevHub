document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o usuário está logado
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth.html';
        return;
    }

    // Elementos da interface
    const userNameElement = document.getElementById('userName');
    const welcomeUserNameElement = document.getElementById('welcomeUserName');
    const userAvatarElement = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const continueWatchingElement = document.getElementById('continueWatching');
    const recommendedCoursesElement = document.getElementById('recommendedCourses');

    // Carregar dados do usuário
    const loadUserData = () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            userNameElement.textContent = userData.name;
            welcomeUserNameElement.textContent = userData.name;
            
            // Se tiver avatar, mostrar; senão, usar inicial do nome
            if (userData.avatar_url) {
                userAvatarElement.src = userData.avatar_url;
            } else {
                userAvatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=2563eb&color=fff`;
            }
        }
    };

    // Função de logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    // Event listeners
    logoutBtn.addEventListener('click', handleLogout);

    // Carregar dados iniciais
    loadUserData();

    // TODO: Implementar carregamento de cursos em andamento e recomendados
    // Por enquanto, vamos manter os placeholders
}); 