// Verificar autenticação
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/auth.html';
}

// Configuração dos headers para requisições
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

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
                            <img src="${course.instructor.avatar}" class="instructor-avatar me-2" alt="${course.instructor.name}">
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
                            <img src="${course.instructor.avatar}" class="instructor-avatar me-2" alt="${course.instructor.name}">
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
                            <img src="${course.instructor.avatar}" class="instructor-avatar me-2" alt="${course.instructor.name}">
                            <span class="instructor-info">${course.instructor.name}</span>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="course-level">${course.level}</span>
                            <span class="course-duration">${course.duration} min</span>
                        </div>

                        <button onclick="enrollCourse(${course.id})" class="btn btn-primary btn-continue">
                            Matricular-se
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar cursos recomendados:', error);
    }
}

// Função para matricular em um curso
async function enrollCourse(courseId) {
    try {
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers,
            body: JSON.stringify({ courseId })
        });

        if (response.ok) {
            // Recarregar as listas de cursos
            await Promise.all([
                loadCoursesInProgress(),
                loadCoursesRecommended()
            ]);
        } else {
            const error = await response.json();
            alert(error.message || 'Erro ao se matricular no curso');
        }
    } catch (error) {
        console.error('Erro ao matricular no curso:', error);
        alert('Erro ao se matricular no curso');
    }
}

// Função de logout
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/auth.html';
});

// Carregar dados ao iniciar a página
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadCoursesInProgress(),
        loadCoursesCompleted(),
        loadCoursesRecommended()
    ]);
}); 