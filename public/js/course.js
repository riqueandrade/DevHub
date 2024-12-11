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
        const courseId = window.location.pathname.split('/').pop();
        
        // Carregar dados do curso
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!courseResponse.ok) {
            throw new Error('Erro ao carregar dados do curso');
        }

        const course = await courseResponse.json();
        console.log('Dados do curso:', course); // Debug

        // Atualizar informações do curso
        document.getElementById('courseTitle').textContent = course.title;
        document.getElementById('totalDuration').textContent = formatDuration(course.duration);

        // Carregar módulos e aulas
        const moduleList = document.getElementById('moduleList');
        moduleList.innerHTML = ''; // Limpar placeholders

        if (!course.modules || !Array.isArray(course.modules)) {
            throw new Error('Estrutura de módulos inválida');
        }

        let totalLessons = 0;
        let completedLessons = 0;

        course.modules.forEach((module, moduleIndex) => {
            if (!module.lessons || !Array.isArray(module.lessons)) {
                console.warn(`Módulo ${moduleIndex} não tem aulas ou estrutura inválida`);
                return;
            }

            const moduleElement = document.createElement('div');
            moduleElement.className = 'module-item';
            
            const moduleContent = `
                <div class="module-title">
                    <i class="bi bi-folder"></i>
                    Módulo ${moduleIndex + 1}: ${module.title}
                </div>
                <ul class="lesson-list">
                    ${module.lessons.map((lesson, lessonIndex) => {
                        totalLessons++;
                        if (lesson.completed) completedLessons++;
                        return `
                            <li class="lesson-item ${lesson.completed ? 'completed' : ''}" 
                                data-module="${moduleIndex}" 
                                data-lesson="${lessonIndex}"
                                onclick="loadLesson(${moduleIndex}, ${lessonIndex})">
                                <i class="bi ${lesson.completed ? 'bi-check-circle-fill' : 'bi-play-circle'}"></i>
                                ${lesson.title}
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
            
            moduleElement.innerHTML = moduleContent;
            moduleList.appendChild(moduleElement);
        });

        // Atualizar progresso
        if (totalLessons > 0) {
            const progress = (completedLessons / totalLessons) * 100;
            document.getElementById('courseProgress').style.width = `${progress}%`;
            document.getElementById('completionStatus').textContent = `${Math.round(progress)}% Concluído`;
        }

        // Carregar primeira aula não completada ou primeira aula
        if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
            let firstIncomplete = null;

            // Procurar primeira aula não completada
            for (let i = 0; i < course.modules.length; i++) {
                const module = course.modules[i];
                for (let j = 0; j < module.lessons.length; j++) {
                    if (!module.lessons[j].completed) {
                        firstIncomplete = { moduleIndex: i, lessonIndex: j };
                        break;
                    }
                }
                if (firstIncomplete) break;
            }

            // Se todas estiverem completas, carregar a última
            if (!firstIncomplete) {
                const lastModule = course.modules[course.modules.length - 1];
                firstIncomplete = {
                    moduleIndex: course.modules.length - 1,
                    lessonIndex: lastModule.lessons.length - 1
                };
            }

            // Carregar a aula
            loadLesson(firstIncomplete.moduleIndex, firstIncomplete.lessonIndex);
        }

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao carregar dados. Tente novamente mais tarde.', 'danger');
    }
});

// Função para carregar uma aula
async function loadLesson(moduleIndex, lessonIndex) {
    try {
        const token = localStorage.getItem('token');
        const courseId = window.location.pathname.split('/').pop();

        // Remover classe active de todas as aulas
        document.querySelectorAll('.lesson-item').forEach(item => {
            item.classList.remove('active');
        });

        // Adicionar classe active na aula selecionada
        const selectedLesson = document.querySelector(`[data-module="${moduleIndex}"][data-lesson="${lessonIndex}"]`);
        if (selectedLesson) {
            selectedLesson.classList.add('active');
        }

        // Carregar conteúdo da aula
        const lessonResponse = await fetch(`/api/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!lessonResponse.ok) {
            throw new Error('Erro ao carregar aula');
        }

        const lesson = await lessonResponse.json();

        // Atualizar conteúdo da aula
        const lessonContent = document.getElementById('lessonContent');
        lessonContent.innerHTML = `
            <h2>${lesson.title}</h2>
            <div class="lesson-video mb-4">
                ${lesson.videoUrl ? `
                    <div class="ratio ratio-16x9">
                        <iframe src="${lesson.videoUrl}" allowfullscreen></iframe>
                    </div>
                ` : ''}
            </div>
            <div class="lesson-description">
                ${lesson.content}
            </div>
        `;

        // Atualizar botões de navegação
        updateNavigationButtons(moduleIndex, lessonIndex);

        // Marcar aula como concluída após 5 segundos
        setTimeout(() => markLessonAsCompleted(moduleIndex, lessonIndex), 5000);

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao carregar aula. Tente novamente mais tarde.', 'danger');
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
        const courseId = window.location.pathname.split('/').pop();

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