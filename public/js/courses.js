// Verificar autenticação e token
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/auth.html';
}

// Configuração dos headers para requisições
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// Carregar dados do usuário
async function loadUserData() {
    try {
        // Primeiro tenta usar os dados em cache
        const cachedUser = JSON.parse(localStorage.getItem('user'));
        if (cachedUser) {
            console.log('Dados do cache:', cachedUser);
            document.getElementById('userAvatar').src = cachedUser.avatar_url || cachedUser.avatar || '/images/default-avatar.png';
            document.getElementById('userName').textContent = cachedUser.name;
        }

        // Depois atualiza com dados do servidor
        const response = await fetch('/api/user/me', { headers });
        if (!response.ok) throw new Error('Erro ao carregar perfil');
        
        const user = await response.json();
        console.log('Dados do servidor:', user);
        document.getElementById('userAvatar').src = user.avatar_url || user.avatar || '/images/default-avatar.png';
        document.getElementById('userName').textContent = user.name;
        
        // Atualiza o cache
        localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Função de logout
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/auth.html';
});

// Carregar cursos em andamento
async function loadCoursesInProgress() {
    try {
        const response = await fetch('/api/courses/in-progress', { headers });
        const courses = await response.json();

        const container = document.getElementById('coursesInProgress');
        
        if (courses.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-journal-x"></i>
                        <p>Você ainda não está matriculado em nenhum curso</p>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="col-md-4">
                <div class="card course-card">
                    <span class="course-status status-in-progress">Em andamento</span>
                    <img src="${course.thumbnail}" class="card-img-top" alt="${course.title}">
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        
                        <div class="d-flex align-items-center mb-3">
                            <img src="${course.instructor.avatar_url}" class="instructor-avatar me-2" alt="${course.instructor.name}">
                            <span class="instructor-info">${course.instructor.name}</span>
                        </div>

                        <div class="progress mb-3">
                            <div class="progress-bar" role="progressbar" style="width: ${course.progress}%">
                                ${course.progress}%
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="course-level">${course.level}</span>
                            <span class="course-duration">${course.duration} min</span>
                        </div>

                        ${course.remainingDays > 0 ? 
                            `<p class="remaining-time mb-3">
                                <i class="bi bi-clock"></i> ${course.remainingDays} dias restantes
                            </p>` : ''}

                        <a href="/course/${course.id}" class="btn btn-primary btn-continue">
                            Continuar Curso
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar cursos em andamento:', error);
    }
}

// Carregar cursos concluídos
async function loadCoursesCompleted() {
    try {
        const response = await fetch('/api/courses/completed', { headers });
        const courses = await response.json();

        const container = document.getElementById('coursesCompleted');
        
        if (courses.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-journal-check"></i>
                        <p>Você ainda não concluiu nenhum curso</p>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="col-md-4">
                <div class="card course-card">
                    <span class="course-status status-completed">Concluído</span>
                    <img src="${course.thumbnail}" class="card-img-top" alt="${course.title}">
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        
                        <div class="d-flex align-items-center mb-3">
                            <img src="${course.instructor.avatar_url}" class="instructor-avatar me-2" alt="${course.instructor.name}">
                            <span class="instructor-info">${course.instructor.name}</span>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="course-level">${course.level}</span>
                            <span class="course-duration">${course.duration} min</span>
                        </div>

                        <div class="d-flex gap-2">
                            <a href="/course/${course.id}" class="btn btn-outline-primary flex-grow-1">
                                Revisar Curso
                            </a>
                            <a href="/certificate/${course.id}" class="btn btn-success flex-grow-1">
                                Ver Certificado
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar cursos concluídos:', error);
    }
}

// Função para mostrar alertas
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Carregar cursos recomendados
async function loadCoursesRecommended() {
    try {
        const response = await fetch('/api/courses/recommended', { headers });
        const courses = await response.json();

        const container = document.getElementById('coursesRecommended');
        
        if (courses.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-journal-plus"></i>
                        <p>Não há cursos recomendados no momento</p>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="col-md-4">
                <div class="card course-card">
                    <img src="${course.thumbnail}" class="card-img-top" alt="${course.title}">
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        
                        <div class="d-flex align-items-center mb-3">
                            <img src="${course.instructor.avatar_url}" class="instructor-avatar me-2" alt="${course.instructor.name}">
                            <span class="instructor-info">${course.instructor.name}</span>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="course-level">${course.level}</span>
                            <span class="course-duration">${course.duration} min</span>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="course-price">${course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}</span>
                            <button onclick="enrollCourse(${course.id}, ${course.price})" class="btn btn-primary">
                                ${course.price > 0 ? 'Comprar' : 'Matricular-se'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar cursos recomendados:', error);
        showAlert('Erro ao carregar cursos recomendados', 'danger');
    }
}

// Função para matricular em um curso
async function enrollCourse(courseId, price) {
    try {
        // Se o curso for pago, redireciona para a página de pagamento
        if (price > 0) {
            window.location.href = `/payment.html?courseId=${courseId}&price=${price}`;
            return;
        }

        // Se for gratuito, realiza a matrícula diretamente
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ courseId })
        });

        if (response.ok) {
            showAlert('Matrícula realizada com sucesso!', 'success');
            // Recarregar as listas de cursos
            await Promise.all([
                loadCoursesInProgress(),
                loadCoursesRecommended()
            ]);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Erro ao se matricular no curso', 'danger');
        }
    } catch (error) {
        console.error('Erro ao matricular no curso:', error);
        showAlert('Erro ao se matricular no curso', 'danger');
    }
}

// Função para ir para a página do curso
function goToCourse(courseId) {
    window.location.href = `/course/${courseId}`;
}

// Renderizar card do curso
function renderCourseCard(course) {
    const progress = course.progress || 0;
    return `
        <div class="col">
            <div class="card h-100 course-card">
                <img src="${course.thumbnail || '/images/default-course.jpg'}" class="card-img-top" alt="${course.title}">
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text text-muted">${course.description}</p>
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" style="width: ${progress}%" 
                             aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                            ${progress}%
                        </div>
                    </div>
                    <button class="btn btn-primary w-100" onclick="goToCourse(${course.id})">
                        Continuar Curso
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadUserData(),
        loadCoursesInProgress(),
        loadCoursesCompleted(),
        loadCoursesRecommended()
    ]);
}); 