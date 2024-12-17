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
        document.getElementById('welcomeUserName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar_url || '/images/default-avatar.png';

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
        console.log('Dados completos do curso:', course);

        const levelInfo = formatLevel(course.level);
        const duration = formatDuration(course.duration);
        const progress = course.progress || 0;
        const remainingTime = course.remainingTime ? formatDuration(course.remainingTime) : '--';
        
        // Validação mais rigorosa do preço
        let price = 0;
        if (typeof course.price === 'number') {
            price = course.price;
        } else if (typeof course.price === 'string' && course.price.trim() !== '') {
            price = parseFloat(course.price);
            if (isNaN(price)) price = 0;
        }

        console.log('Curso:', course.title);
        console.log('Preço original:', course.price, typeof course.price);
        console.log('Preço processado:', price, typeof price);

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="course-card">
                    <div class="course-header">
                        <img src="${course.thumbnail || '/images/course-placeholder.png'}" alt="${course.title}" class="course-thumbnail">
                        <span class="course-level badge ${levelInfo.class}">${levelInfo.text}</span>
                    </div>
                    <div class="course-body">
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-info">
                            ${inProgress ? `
                                <div class="progress mb-3">
                                    <div class="progress-bar" role="progressbar" style="width: ${progress}%">
                                        ${progress}% concluído
                                    </div>
                                </div>
                                <p class="remaining-time">Tempo restante: ${remainingTime}</p>
                            ` : `
                                <p class="course-description">${course.description}</p>
                            `}
                            <div class="course-meta">
                                <span class="duration"><i class="bi bi-clock"></i> ${duration}</span>
                                <span class="level"><i class="bi bi-bar-chart"></i> ${levelInfo.text}</span>
                                ${!inProgress ? `<span class="price"><i class="bi bi-tag"></i> ${price > 0 ? `R$ ${price.toFixed(2)}` : 'Grátis'}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="course-footer">
                        ${inProgress ? `
                            <a href="/course/${course.id}" class="btn btn-primary w-100">Continuar</a>
                        ` : `
                            <button class="btn btn-primary w-100" onclick="enrollCourse(${course.id}, ${price})">
                                ${price > 0 ? `Comprar por R$ ${price.toFixed(2)}` : 'Começar Agora'}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    };

    // Carregar cursos em andamento
    const loadInProgressCourses = async () => {
        try {
            const response = await fetch('/api/courses/in-progress', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar cursos');

            const courses = await response.json();
            console.log('Cursos em andamento recebidos:', courses);

            const cursosAndamentoElement = document.getElementById('cursosAndamento');

            if (courses.length === 0) {
                cursosAndamentoElement.innerHTML = `
                    <div class="col-12">
                        <div class="placeholder-message">
                            <i class="bi bi-play-circle"></i>
                            <p>Você ainda não começou nenhum curso</p>
                            <a href="#catalogo" class="btn btn-primary">Explorar Cursos</a>
                        </div>
                    </div>
                `;
                return;
            }

            cursosAndamentoElement.innerHTML = courses.map(course => createCourseCard(course, true)).join('');
        } catch (error) {
            console.error('Erro ao carregar cursos em andamento:', error);
            document.getElementById('cursosAndamento').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Erro ao carregar cursos em andamento. Tente novamente mais tarde.
                    </div>
                </div>
            `;
        }
    };

    // Carregar cursos recomendados
    const loadRecommendedCourses = async () => {
        try {
            const response = await fetch('/api/courses/recommended', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar recomendações');

            const courses = await response.json();
            console.log('Cursos recomendados recebidos:', courses);

            const cursosRecomendadosElement = document.getElementById('cursosRecomendados');

            if (courses.length === 0) {
                cursosRecomendadosElement.innerHTML = `
                    <div class="col-12">
                        <div class="placeholder-message">
                            <i class="bi bi-lightning"></i>
                            <p>Nenhum curso recomendado no momento</p>
                        </div>
                    </div>
                `;
                return;
            }

            cursosRecomendadosElement.innerHTML = courses.map(course => createCourseCard(course)).join('');
        } catch (error) {
            console.error('Erro ao carregar cursos recomendados:', error);
            document.getElementById('cursosRecomendados').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Erro ao carregar recomendações. Tente novamente mais tarde.
                    </div>
                </div>
            `;
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
            
            document.getElementById('totalCursos').textContent = stats.coursesInProgress || 0;
            document.getElementById('horasEstudo').textContent = `${stats.studyHours || 0}h`;
            document.getElementById('certificados').textContent = stats.certificates || 0;
            document.getElementById('sequencia').textContent = stats.streak || 0;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    // Handler do logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
    });

    // Função para matricular em um curso
    window.enrollCourse = async function(courseId, price) {
        try {
            console.log('Matrícula - ID do curso:', courseId);
            console.log('Matrícula - Preço:', price);

            // Garantir que o preço é um número
            const coursePrice = parseFloat(price);
            
            // Se o curso for pago, redirecionar para a página de pagamento
            if (!isNaN(coursePrice) && coursePrice > 0) {
                window.location.replace(`/payment.html?courseId=${courseId}&price=${coursePrice.toFixed(2)}`);
                return;
            }

            // Se for gratuito, fazer a matrícula direta
            const response = await fetch('/api/courses/enroll', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao se matricular no curso');
            }

            // Mostrar mensagem de sucesso
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
            alertDiv.innerHTML = `
                ${data.message || 'Matrícula realizada com sucesso!'}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(alertDiv);

            // Remover alerta após 5 segundos
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);

            // Recarregar os cursos
            await loadInProgressCourses();
            await loadRecommendedCourses();
            await loadStats();
        } catch (error) {
            console.error('Erro ao matricular no curso:', error);
            
            // Mostrar mensagem de erro
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
            alertDiv.innerHTML = `
                ${error.message || 'Erro ao se matricular no curso. Tente novamente.'}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.appendChild(alertDiv);

            // Remover alerta após 5 segundos
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    };

    // Carregar dados iniciais
    loadInProgressCourses();
    loadRecommendedCourses();
    loadStats();

    // Verificar token periodicamente
    setInterval(verifyToken, 5 * 60 * 1000);
}); 