// Variáveis globais
let cleanCourseId;
let courseData;

// Extrair IDs do módulo e lição da URL
function extractIdsFromUrl() {
    const pathname = window.location.pathname;
    const moduleMatch = pathname.match(/\/module\/(\d+)/);
    const lessonMatch = pathname.match(/\/lesson\/(\d+)/);
    
    return {
        moduleId: moduleMatch ? parseInt(moduleMatch[1]) : null,
        lessonId: lessonMatch ? parseInt(lessonMatch[1]) : null
    };
}

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

        // Extrair o ID do curso usando regex para pegar apenas o número após /course/
        const courseIdMatch = pathname.match(/\/course\/(\d+)/);
        const courseId = courseIdMatch ? courseIdMatch[1] : null;
        console.log('ID do curso extraído:', courseId);

        if (!courseId) {
            console.error('ID do curso não encontrado na URL:', pathname);
            throw new Error('ID do curso não encontrado');
        }

        // Remover qualquer / extra no final do ID
        cleanCourseId = courseId;
        console.log('ID do curso limpo:', cleanCourseId);

        console.log('Carregando curso:', cleanCourseId);
        
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

        // Armazenar dados do curso globalmente
        courseData = course;

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

        // Renderizar módulos e configurar aulas
        course.modules.forEach((module, moduleIndex) => {
            console.log(`Módulo ${moduleIndex + 1}:`, module);

            if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach(lesson => {
                    totalLessons++;
                    if (lesson.completed) {
                        completedLessons++;
                    }

                    // Registrar primeira aula encontrada
                    if (!firstLesson) {
                        firstLesson = { moduleId: module.id, lessonId: lesson.id };
                        console.log('Primeira aula encontrada:', firstLesson);
                    }

                    // Registrar primeira aula não concluída
                    if (!firstUncompletedLesson && !lesson.completed) {
                        firstUncompletedLesson = { moduleId: module.id, lessonId: lesson.id };
                        console.log('Primeira aula não concluída encontrada:', firstUncompletedLesson);
                    }

                    console.log(`Aula ${lesson.id} do módulo ${module.id}:`, lesson);
                });
            }
        });

        // Atualizar progresso
        updateProgress(completedLessons, totalLessons);

        // Verificar se há IDs específicos na URL
        const { moduleId, lessonId } = extractIdsFromUrl();
        
        // Se houver IDs na URL, carregar essa aula específica
        if (moduleId && lessonId) {
            console.log('Carregando aula específica da URL:', { moduleId, lessonId });
            await loadLesson(moduleId, lessonId);
        }
        // Caso contrário, carregar a primeira aula não concluída ou a primeira aula
        else {
            const lessonToLoad = firstUncompletedLesson || firstLesson;
            if (lessonToLoad) {
                console.log('Aula que será carregada:', lessonToLoad);
                await loadLesson(lessonToLoad.moduleId, lessonToLoad.lessonId);
            }
        }

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
        console.log('Carregando aula:', { moduleId, lessonId, courseId: cleanCourseId });
        
        if (!courseData || !courseData.modules) {
            throw new Error('Dados do curso não disponíveis');
        }

        // Encontrar o módulo nos dados que já temos
        const module = courseData.modules.find(m => m.id === parseInt(moduleId));
        if (!module) {
            throw new Error('Módulo não encontrado');
        }

        // Encontrar a aula no módulo
        const lesson = module.lessons?.find(l => l.id === parseInt(lessonId));
        if (!lesson) {
            throw new Error('Aula não encontrada no módulo');
        }

        console.log('Dados da aula encontrados:', lesson);

        // Verificar e atualizar elementos do DOM
        const titleElement = document.getElementById('lessonTitle');
        const descriptionElement = document.getElementById('lessonDescription');
        const contentElement = document.getElementById('lessonContent');

        if (!titleElement || !descriptionElement || !contentElement) {
            console.error('Elementos da aula não encontrados:', {
                title: !!titleElement,
                description: !!descriptionElement,
                content: !!contentElement
            });
            throw new Error('Elementos da interface não encontrados');
        }

        // Atualizar interface com os dados da aula
        titleElement.textContent = lesson.title;
        descriptionElement.textContent = lesson.description;
        
        // Atualizar o conteúdo baseado no tipo
        updateLessonContent(lesson);
        
        // Atualizar navegação
        updateNavigation(moduleId, lessonId);
        
        // Marcar módulo como atual
        updateModulesList(moduleId);
        
        // Atualizar URL sem recarregar a página
        const newUrl = `/course/${cleanCourseId}/module/${moduleId}/lesson/${lessonId}`;
        window.history.pushState({ courseId: cleanCourseId, moduleId, lessonId }, '', newUrl);

        // Marcar aula atual na lista
        document.querySelectorAll('.lesson').forEach(item => {
            item.classList.remove('active');
        });
        const currentLesson = document.querySelector(`.lesson[onclick="loadLesson(${moduleId}, ${lessonId})"]`);
        if (currentLesson) {
            currentLesson.classList.add('active');
        }

        return lesson;
    } catch (error) {
        console.error('Erro ao carregar aula:', error);
        showAlert('Não foi possível carregar a aula. Por favor, tente novamente.', 'danger');
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

// Função para atualizar o conteúdo da aula
const updateLessonContent = (lesson) => {
    const contentElement = document.getElementById('lessonContent');
    if (!contentElement) return;

    if (!lesson.content_url) {
        contentElement.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Conteúdo da aula não disponível
            </div>
        `;
        return;
    }

    // Inferir tipo de conteúdo pela extensão do arquivo se não estiver definido
    let contentType = lesson.content_type;
    if (!contentType) {
        const fileExtension = lesson.content_url.split('.').pop().toLowerCase();
        switch (fileExtension) {
            case 'pdf':
                contentType = 'pdf';
                break;
            case 'mp4':
            case 'webm':
            case 'ogg':
                contentType = 'video';
                break;
            case 'txt':
            case 'md':
                contentType = 'texto';
                break;
            default:
                contentType = 'outro';
        }
    }

    // Função para mostrar erro
    const showError = (message) => {
        contentElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
                <br><br>
                <button class="btn btn-outline-danger" onclick="window.location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    };

    switch (contentType) {
        case 'video':
            contentElement.innerHTML = `
                <div class="ratio ratio-16x9 mb-4">
                    <iframe src="${lesson.content_url}" allowfullscreen></iframe>
                </div>
            `;
            break;
        case 'pdf':
            // Primeiro mostrar um loading
            contentElement.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-3">Carregando PDF...</p>
                </div>
            `;

            // Tentar carregar o PDF
            fetch(lesson.content_url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    contentElement.innerHTML = `
                        <div class="pdf-container">
                            <iframe 
                                src="${url}" 
                                type="application/pdf" 
                                width="100%" 
                                height="100%" 
                                frameborder="0"
                            ></iframe>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error('Erro ao carregar PDF:', error);
                    showError('Não foi possível carregar o conteúdo da aula. Por favor, tente novamente mais tarde.');
                });
            break;
        case 'texto':
            // Para arquivos de texto, vamos fazer uma requisição e exibir o conteúdo
            fetch(lesson.content_url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(text => {
                    contentElement.innerHTML = `
                        <div class="text-content">
                            <pre class="p-3 bg-dark text-light rounded">${text}</pre>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error('Erro ao carregar texto:', error);
                    showError('Não foi possível carregar o conteúdo da aula. Por favor, tente novamente mais tarde.');
                });
            break;
        default:
            contentElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    <a href="${lesson.content_url}" target="_blank" class="alert-link">
                        Clique aqui para baixar o conteúdo
                    </a>
                </div>
            `;
    }
};

// Função para lidar com erros no carregamento do PDF
function handlePDFError(iframe) {
    const container = iframe.closest('.pdf-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Não foi possível exibir o PDF diretamente.
                <br>
                <a href="${iframe.src}" target="_blank" class="alert-link">
                    Clique aqui para baixar o PDF
                </a>
            </div>
        `;
    }
}

// Função para atualizar a navegação
const updateNavigation = (currentModuleId, currentLessonId) => {
    const prevButton = document.getElementById('prevLesson');
    const nextButton = document.getElementById('nextLesson');

    if (!courseData || !courseData.modules) return;

    let prevLesson = null;
    let nextLesson = null;
    let foundCurrent = false;

    // Encontrar aulas anterior e próxima
    courseData.modules.forEach(module => {
        module.lessons.forEach(lesson => {
            if (foundCurrent) {
                if (!nextLesson) {
                    nextLesson = { moduleId: module.id, lessonId: lesson.id };
                }
            }
            if (module.id === parseInt(currentModuleId) && lesson.id === parseInt(currentLessonId)) {
                foundCurrent = true;
            }
            if (!foundCurrent) {
                prevLesson = { moduleId: module.id, lessonId: lesson.id };
            }
        });
    });

    // Atualizar botões de navegação
    if (prevLesson) {
        prevButton.disabled = false;
        prevButton.onclick = () => loadLesson(prevLesson.moduleId, prevLesson.lessonId);
    } else {
        prevButton.disabled = true;
    }

    if (nextLesson) {
        nextButton.disabled = false;
        nextButton.onclick = () => loadLesson(nextLesson.moduleId, nextLesson.lessonId);
    } else {
        nextButton.disabled = true;
    }
};

// Função para atualizar a lista de módulos
const updateModulesList = (currentModuleId) => {
    document.querySelectorAll('.module').forEach(moduleElement => {
        const moduleHeader = moduleElement.querySelector('.module-header');
        const moduleContent = moduleElement.querySelector(`#module${currentModuleId}`);
        
        if (moduleContent) {
            moduleContent.classList.add('show');
        }
    });
};

// Handler para navegação do browser (botão voltar/avançar)
window.addEventListener('popstate', (event) => {
    if (event.state) {
        const { moduleId, lessonId } = event.state;
        if (moduleId && lessonId) {
            loadLesson(moduleId, lessonId).catch(error => {
                console.error('Erro ao carregar aula:', error);
                showAlert('Erro ao carregar aula', 'danger');
            });
        }
    }
}); 