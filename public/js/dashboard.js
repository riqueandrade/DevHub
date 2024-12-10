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
        const welcomeUserNameElement = document.getElementById('welcomeUserName');
        if (userNameElement) userNameElement.textContent = user.name;
        if (welcomeUserNameElement) welcomeUserNameElement.textContent = user.name;

        const userAvatarElement = document.getElementById('userAvatar');
        if (userAvatarElement) {
            if (user.avatar_url) {
                userAvatarElement.src = user.avatar_url;
            } else {
                // Usar avatar com inicial do nome se não tiver avatar
                userAvatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
            }
        }
    }

    // Função para carregar estatísticas
    const loadStats = async () => {
        try {
            const response = await fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar estatísticas');

            const stats = await response.json();

            // Atualizar estatísticas na interface
            document.getElementById('totalCursos').textContent = stats.coursesInProgress || 0;
            document.getElementById('horasEstudo').textContent = `${stats.studyHours || 0}h`;
            document.getElementById('certificados').textContent = stats.certificates || 0;
            document.getElementById('sequencia').textContent = stats.streak || 0;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    // Função para criar card de curso
    const createCourseCard = (course) => {
        return `
            <div class="col-md-4 col-sm-6 mb-4">
                <div class="course-card">
                    <img src="${course.thumbnail || '/images/course-placeholder.jpg'}" 
                         alt="${course.title}" 
                         class="course-thumbnail">
                    <div class="course-info">
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-progress">
                            <div class="progress">
                                <div class="progress-bar" 
                                     role="progressbar" 
                                     style="width: ${course.progress}%" 
                                     aria-valuenow="${course.progress}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100"></div>
                            </div>
                            <div class="d-flex justify-content-between mt-2">
                                <small>${course.progress}% concluído</small>
                                <small>${course.remainingTime || 'Tempo restante: --'}</small>
                            </div>
                        </div>
                        <div class="course-meta">
                            <span><i class="bi bi-clock"></i> ${course.duration || '--'}</span>
                            <span><i class="bi bi-bar-chart"></i> ${course.level || 'Iniciante'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // Função para carregar cursos em andamento
    const loadInProgressCourses = async () => {
        try {
            const response = await fetch('/api/courses/in-progress', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar cursos');

            const courses = await response.json();
            const container = document.getElementById('cursosAndamento');

            if (courses.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="placeholder-message">
                            <i class="bi bi-journal-text"></i>
                            <p>Você ainda não começou nenhum curso</p>
                            <a href="#catalogo" class="btn btn-primary mt-3">Explorar Cursos</a>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = courses.map(createCourseCard).join('');
        } catch (error) {
            console.error('Erro ao carregar cursos em andamento:', error);
        }
    };

    // Função para carregar cursos recomendados
    const loadRecommendedCourses = async () => {
        try {
            const response = await fetch('/api/courses/recommended', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar recomendações');

            const courses = await response.json();
            const container = document.getElementById('cursosRecomendados');

            if (courses.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="placeholder-message">
                            <i class="bi bi-stars"></i>
                            <p>Nenhuma recomendação disponível no momento</p>
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = courses.map(createCourseCard).join('');
        } catch (error) {
            console.error('Erro ao carregar cursos recomendados:', error);
        }
    };

    // Handler do botão de logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth.html';
        });
    }

    // Carregar dados iniciais
    await Promise.all([
        loadStats(),
        loadInProgressCourses(),
        loadRecommendedCourses()
    ]);
}); 