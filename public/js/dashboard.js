document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const verifyToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token não encontrado');
            localStorage.clear();
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
                throw new Error('Token inválido');
            }

            return true;
        } catch (error) {
            console.error('Erro na verificação do token:', error);
            localStorage.clear();
            window.location.replace('/auth.html');
            return false;
        }
    };

    // Verificar token inicialmente
    if (!await verifyToken()) {
        return;
    }

    // Carregar dados do usuário
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.error('Dados do usuário não encontrados');
            localStorage.clear();
            window.location.replace('/auth.html');
            return;
        }

        const user = JSON.parse(userStr);
        if (!user || !user.name) {
            console.error('Dados do usuário inválidos');
            localStorage.clear();
            window.location.replace('/auth.html');
            return;
        }

        // Atualizar elementos da interface com dados do usuário
        document.getElementById('userName').textContent = user.name;
        document.getElementById('welcomeUserName').textContent = user.name.split(' ')[0];
        
        const userAvatar = document.getElementById('userAvatar');
        userAvatar.src = user.avatar_url || '/images/default-avatar.svg';
        userAvatar.alt = `Avatar de ${user.name}`;

        // Mostrar/ocultar link de gerenciamento de cursos
        const adminInstructorMenu = document.querySelector('.admin-instructor-only');
        if (user.role === 'admin' || user.role === 'instrutor') {
            adminInstructorMenu.style.display = 'block';
        }

        // Atualizar o cache
        localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        localStorage.clear();
        window.location.replace('/auth.html');
        return;
    }

    // Função para formatar duração
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
    };

    // Função para formatar nível
    const formatLevel = (level) => {
        const levels = {
            'iniciante': { text: 'Iniciante', class: 'bg-success' },
            'intermediario': { text: 'Intermediário', class: 'bg-warning' },
            'avancado': { text: 'Avançado', class: 'bg-danger' }
        };
        return levels[level] || { text: level, class: 'bg-secondary' };
    };

    // Função para criar card de curso
    const createCourseCard = (course, inProgress = false) => {
        const levelInfo = formatLevel(course.level);
        const duration = formatDuration(course.duration);
        const progress = course.progress || 0;
        const remainingTime = course.remainingTime ? formatDuration(course.remainingTime) : '--';
        
        // Validação do preço
        let price = 0;
        if (typeof course.price === 'number') {
            price = course.price;
        } else if (typeof course.price === 'string' && course.price.trim() !== '') {
            price = parseFloat(course.price);
            if (isNaN(price)) price = 0;
        }

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <article class="course-card" role="article">
                    <div class="course-header">
                        <img src="${course.thumbnail || '/images/course-placeholder.png'}" 
                             alt="${course.title}" 
                             class="course-thumbnail"
                             loading="lazy">
                        <span class="course-level badge ${levelInfo.class}">${levelInfo.text}</span>
                    </div>
                    <div class="course-body">
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-info">
                            ${inProgress ? `
                                <div class="progress" role="progressbar" aria-valuenow="${progress}" 
                                     aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-bar" style="width: ${progress}%">
                                        ${progress}% concluído
                                    </div>
                                </div>
                                <p class="remaining-time">Tempo restante: ${remainingTime}</p>
                            ` : `
                                <p class="course-description">${course.description}</p>
                            `}
                            <div class="course-meta">
                                <span class="duration" title="Duração do curso">
                                    <i class="bi bi-clock" aria-hidden="true"></i> ${duration}
                                </span>
                                <span class="level" title="Nível do curso">
                                    <i class="bi bi-bar-chart" aria-hidden="true"></i> ${levelInfo.text}
                                </span>
                                ${!inProgress ? `
                                    <span class="price" title="Preço do curso">
                                        <i class="bi bi-tag" aria-hidden="true"></i> 
                                        ${price > 0 ? `R$ ${price.toFixed(2)}` : 'Grátis'}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="course-footer">
                        ${inProgress ? `
                            <a href="/course/${course.id}" class="btn btn-primary w-100">
                                Continuar
                            </a>
                        ` : `
                            <button class="btn btn-primary w-100" 
                                    onclick="enrollCourse(${course.id}, ${price})"
                                    aria-label="${price > 0 ? `Comprar curso por R$ ${price.toFixed(2)}` : 'Começar curso gratuitamente'}">
                                ${price > 0 ? `Comprar por R$ ${price.toFixed(2)}` : 'Começar Agora'}
                            </button>
                        `}
                    </div>
                </article>
            </div>
        `;
    };

    // Função para mostrar mensagem de carregamento
    const showLoadingMessage = (element, message) => {
        element.innerHTML = `
            <div class="col-12">
                <div class="placeholder-message" role="status" aria-live="polite">
                    <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                    <p>${message}</p>
                </div>
            </div>
        `;
    };

    // Função para mostrar mensagem de erro
    const showErrorMessage = (element, message) => {
        element.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                    <p>${message}</p>
                    <button class="btn btn-outline-danger mt-3" onclick="window.location.reload()">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        `;
    };

    // Função para mostrar mensagem vazia
    const showEmptyMessage = (element, message, action = null) => {
        element.innerHTML = `
            <div class="col-12">
                <div class="placeholder-message" role="status">
                    <i class="bi bi-inbox" aria-hidden="true"></i>
                    <p>${message}</p>
                    ${action ? `
                        <a href="${action.url}" class="btn btn-primary mt-3">
                            ${action.text}
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    };

    // Carregar cursos em andamento
    const loadInProgressCourses = async () => {
        const cursosAndamentoElement = document.getElementById('cursosAndamento');
        showLoadingMessage(cursosAndamentoElement, 'Carregando seus cursos em andamento...');

        try {
            const response = await fetch('/api/courses/in-progress', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar cursos');

            const courses = await response.json();

            if (courses.length === 0) {
                showEmptyMessage(cursosAndamentoElement, 'Você ainda não começou nenhum curso', {
                    url: '/catalog.html',
                    text: 'Explorar Cursos'
                });
                return;
            }

            cursosAndamentoElement.innerHTML = courses.map(course => createCourseCard(course, true)).join('');
        } catch (error) {
            console.error('Erro ao carregar cursos em andamento:', error);
            showErrorMessage(cursosAndamentoElement, 'Erro ao carregar cursos em andamento. Tente novamente mais tarde.');
        }
    };

    // Carregar cursos recomendados
    const loadRecommendedCourses = async () => {
        const cursosRecomendadosElement = document.getElementById('cursosRecomendados');
        showLoadingMessage(cursosRecomendadosElement, 'Carregando recomendações personalizadas...');

        try {
            const response = await fetch('/api/courses/recommended', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar recomendações');

            const courses = await response.json();

            if (courses.length === 0) {
                showEmptyMessage(cursosRecomendadosElement, 'Nenhum curso recomendado no momento');
                return;
            }

            cursosRecomendadosElement.innerHTML = courses.map(course => createCourseCard(course)).join('');
        } catch (error) {
            console.error('Erro ao carregar cursos recomendados:', error);
            showErrorMessage(cursosRecomendadosElement, 'Erro ao carregar recomendações. Tente novamente mais tarde.');
        }
    };

    // Carregar estatísticas com animação
    const loadStats = async () => {
        try {
            const response = await fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar estatísticas');

            const stats = await response.json();
            
            // Função para animar número
            const animateNumber = (element, end, duration = 1000, prefix = '', suffix = '') => {
                const start = 0;
                const startTime = performance.now();
                
                const updateNumber = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const value = Math.floor(start + (end - start) * progress);
                    element.textContent = `${prefix}${value}${suffix}`;
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateNumber);
                    }
                };
                
                requestAnimationFrame(updateNumber);
            };

            // Animar estatísticas
            animateNumber(document.getElementById('totalCursos'), stats.coursesInProgress || 0);
            animateNumber(document.getElementById('horasEstudo'), stats.studyHours || 0, 1500, '', 'h');
            animateNumber(document.getElementById('certificados'), stats.certificates || 0);
            animateNumber(document.getElementById('sequencia'), stats.streak || 0);

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            const statElements = ['totalCursos', 'horasEstudo', 'certificados', 'sequencia'];
            statElements.forEach(id => {
                document.getElementById(id).textContent = '--';
            });
        }
    };

    // Carregar dados iniciais
    await Promise.all([
        loadInProgressCourses(),
        loadRecommendedCourses(),
        loadStats()
    ]);

    // Configurar logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.clear();
        window.location.replace('/auth.html');
    });
}); 