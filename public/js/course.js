// Variáveis globais
let cleanCourseId;

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/auth.html');
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            window.location.replace('/auth.html');
            return;
        }

        // Carregar dados do usuário
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar_url || '/images/default-avatar.png';

        // Obter ID do curso da URL
        const pathname = window.location.pathname;
        console.log('URL do curso:', pathname);
        
        const courseId = pathname.split('/course/')[1];
        console.log('ID do curso extraído:', courseId);
        
        if (!courseId) {
            console.error('ID do curso não encontrado na URL:', pathname);
            throw new Error('ID do curso não encontrado');
        }

        // Remover qualquer / extra no final do ID
        cleanCourseId = courseId.replace(/\/$/, '');
        console.log('ID do curso limpo:', cleanCourseId);

        console.log('Carregando curso:', courseId);
        
        // Carregar dados do curso
        const courseResponse = await fetch(`/api/courses/${cleanCourseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!courseResponse.ok) {
            const errorData = await courseResponse.json();
            throw new Error(errorData.error || 'Erro ao carregar dados do curso');
        }

        const course = await courseResponse.json();
        console.log('Dados do curso:', course);

        // Atualizar informações do curso
        document.getElementById('courseTitle').textContent = course.title;
        document.getElementById('totalDuration').textContent = formatDuration(course.duration);

        // Carregar módulos e aulas
        const moduleList = document.getElementById('moduleList');
        moduleList.innerHTML = ''; // Limpar placeholders

        if (!course.modules || !Array.isArray(course.modules)) {
            throw new Error('Estrutura de módulos inválida');
        }

        console.log('Estrutura dos módulos:', course.modules);

        let totalLessons = 0;
        let completedLessons = 0;

        // Encontrar a primeira aula não concluída ou a primeira aula do curso
        let firstUncompletedLesson = null;
        let firstLesson = null;

        course.modules.forEach((module, moduleIndex) => {
            console.log(`Módulo ${moduleIndex + 1}:`, module);
            
            if (!module.lessons || !Array.isArray(module.lessons)) {
                console.warn(`Módulo ${moduleIndex + 1} não possui aulas válidas`);
                return;
            }

            module.lessons.forEach((lesson, lessonIndex) => {
                console.log(`Aula ${lessonIndex + 1} do módulo ${moduleIndex + 1}:`, lesson);
                
                if (!firstLesson) {
                    firstLesson = { moduleId: module.id, lessonId: lesson.id };
                    console.log('Primeira aula encontrada:', firstLesson);
                }
                if (!lesson.completed && !firstUncompletedLesson) {
                    firstUncompletedLesson = { moduleId: module.id, lessonId: lesson.id };
                    console.log('Primeira aula não concluída encontrada:', firstUncompletedLesson);
                }
                totalLessons++;
                if (lesson.completed) completedLessons++;
            });
        });

        // Carregar a primeira aula não concluída ou a primeira aula do curso
        const lessonToLoad = firstUncompletedLesson || firstLesson;
        console.log('Aula que será carregada:', lessonToLoad);
        if (lessonToLoad) {
            await loadLesson(lessonToLoad.moduleId, lessonToLoad.lessonId);
        }

        // Atualizar progresso
        updateProgress(completedLessons, totalLessons);

        // Renderizar módulos
        course.modules.forEach((module, moduleIndex) => {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'module';
            moduleElement.innerHTML = `
                <div class="module-header" data-bs-toggle="collapse" data-bs-target="#module${module.id}">
                    <h3>
                        <i class="bi bi-chevron-down"></i>
                        ${module.title}
                    </h3>
                    <span class="badge bg-primary">${module.lessons.length} aulas</span>
                </div>
                <div id="module${module.id}" class="collapse ${moduleIndex === 0 ? 'show' : ''}">
                    <div class="lesson-list">
                        ${module.lessons.map((lesson, lessonIndex) => `
                            <div class="lesson ${lesson.completed ? 'completed' : ''}" 
                                 onclick="loadLesson(${module.id}, ${lesson.id})">
                                <i class="bi ${lesson.completed ? 'bi-check-circle-fill' : 'bi-play-circle'}"></i>
                                <span>${lesson.title}</span>
                                <span class="duration">${formatDuration(lesson.duration)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            moduleList.appendChild(moduleElement);
        });

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao carregar dados. Tente novamente mais tarde.', 'danger');
    }
});

// Carregar aula
const loadLesson = async (moduleId, lessonId) => {
    try {
        console.log(`Carregando aula: módulo ${moduleId}, aula ${lessonId}`);
        console.log('URL da requisição:', `/api/courses/${cleanCourseId}/lessons/${lessonId}`);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${cleanCourseId}/lessons/${lessonId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro na resposta da API:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error('Erro ao carregar aula');
        }

        const lesson = await response.json();
        console.log('Dados da aula:', lesson);

        // Atualizar conteúdo da aula
        document.getElementById('lessonTitle').textContent = lesson.title;
        
        // Renderizar conteúdo baseado no tipo
        document.getElementById('lessonContent').innerHTML = renderLessonContent(lesson);

        // Atualizar aula ativa na lista
        document.querySelectorAll('.lesson').forEach(item => {
            item.classList.remove('active');
        });
        
        const lessonElement = document.querySelector(`.lesson[onclick="loadLesson(${moduleId}, ${lessonId})"]`);
        if (lessonElement) {
            lessonElement.classList.add('active');
        } else {
            console.warn('Elemento da aula não encontrado no DOM');
        }

        // Atualizar URL sem recarregar a página
        const newUrl = `/course/${cleanCourseId}/lessons/${lessonId}`;
        window.history.pushState({ moduleId, lessonId }, '', newUrl);
    } catch (error) {
        console.error('Erro ao carregar aula:', error);
        throw error;
    }
};

// Função para renderizar o conteúdo da aula baseado no tipo
function renderLessonContent(lesson) {
    if (!lesson.content_type || !lesson.content_url) {
        return `<div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Conteúdo da aula não disponível
        </div>`;
    }

    switch (lesson.content_type) {
        case 'video':
            return `
                <div class="ratio ratio-16x9 mb-4">
                    <iframe src="${lesson.content_url}" allowfullscreen></iframe>
                </div>
            `;
        case 'pdf':
            return `
                <div class="pdf-viewer mb-4">
                    <embed src="${lesson.content_url}" type="application/pdf" width="100%" height="600px">
                </div>
            `;
        case 'text':
            return `
                <div class="text-content mb-4">
                    ${lesson.content_url}
                </div>
            `;
        case 'html':
            return `
                <div class="html-content mb-4">
                    ${lesson.content_url}
                </div>
            `;
        default:
            return `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Tipo de conteúdo não suportado: ${lesson.content_type}
                </div>
            `;
    }
}

// Função para atualizar botões de navegação
function updateNavigationButtons(currentModule, currentLesson) {
    const prevButton = document.getElementById('prevLesson');
    const nextButton = document.getElementById('nextLesson');

    prevButton.onclick = null;
    nextButton.onclick = null;

    // Verificar se existe aula anterior
    if (currentLesson > 0) {
        prevButton.disabled = false;
        prevButton.onclick = () => loadLesson(currentModule, currentLesson - 1);
    } else if (currentModule > 0) {
        const prevModuleLessons = document.querySelectorAll(`[data-module="${currentModule - 1}"]`);
        if (prevModuleLessons.length > 0) {
            prevButton.disabled = false;
            prevButton.onclick = () => loadLesson(currentModule - 1, prevModuleLessons.length - 1);
        } else {
            prevButton.disabled = true;
        }
    } else {
        prevButton.disabled = true;
    }

    // Verificar se existe próxima aula
    const nextModuleLessons = document.querySelectorAll(`[data-module="${currentModule}"]`);
    if (currentLesson < nextModuleLessons.length - 1) {
        nextButton.disabled = false;
        nextButton.onclick = () => loadLesson(currentModule, currentLesson + 1);
    } else {
        const nextModuleLessons = document.querySelectorAll(`[data-module="${currentModule + 1}"]`);
        if (nextModuleLessons.length > 0) {
            nextButton.disabled = false;
            nextButton.onclick = () => loadLesson(currentModule + 1, 0);
        } else {
            nextButton.disabled = true;
        }
    }
}

// Função para marcar aula como concluída
async function markLessonAsCompleted(moduleIndex, lessonIndex) {
    try {
        const token = localStorage.getItem('token');
        const courseId = window.location.pathname.split('/course/')[1];

        if (!courseId) {
            throw new Error('ID do curso não encontrado');
        }

        const response = await fetch(`/api/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao marcar aula como concluída');
        }

        // Atualizar interface
        const lessonItem = document.querySelector(`[data-module="${moduleIndex}"][data-lesson="${lessonIndex}"]`);
        if (lessonItem) {
            lessonItem.classList.add('completed');
            lessonItem.querySelector('i').className = 'bi bi-check-circle-fill';
        }

        // Atualizar progresso
        const totalLessons = document.querySelectorAll('.lesson-item').length;
        const completedLessons = document.querySelectorAll('.lesson-item.completed').length;
        const progress = (completedLessons / totalLessons) * 100;
        
        document.getElementById('courseProgress').style.width = `${progress}%`;
        document.getElementById('completionStatus').textContent = `${Math.round(progress)}% Concluído`;

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao marcar aula como concluída', 'danger');
    }
}

// Funções auxiliares
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
}

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

// Handler do logout
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/auth.html';
});

// Atualizar progresso do curso
const updateProgress = (completed, total) => {
    if (total > 0) {
        const progress = (completed / total) * 100;
        document.getElementById('courseProgress').style.width = `${progress}%`;
        document.getElementById('courseProgress').setAttribute('aria-valuenow', progress);
        document.getElementById('completionStatus').textContent = `${completed} de ${total} aulas concluídas (${Math.round(progress)}%)`;
    }
}; 