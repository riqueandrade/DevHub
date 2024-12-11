let courseId;

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação e permissões
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/auth.html');
        return;
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || (user.role !== 'admin' && user.role !== 'instrutor')) {
            window.location.replace('/dashboard.html');
            return;
        }

        // Carregar dados do usuário
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar_url || '/images/default-avatar.png';

        // Obter ID do curso da URL
        const urlParams = new URLSearchParams(window.location.search);
        courseId = urlParams.get('id');
        if (!courseId) {
            window.location.replace('/course-management.html');
            return;
        }

        // Configurar handlers
        setupEventHandlers();
        
        // Carregar dados do curso
        await loadCourseData();
        
        // Carregar módulos e aulas
        await loadModules();
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        showAlert('Erro ao carregar dados. Tente novamente mais tarde.', 'danger');
    }
});

// Configurar handlers de eventos
function setupEventHandlers() {
    // Handler do formulário de novo módulo
    const newModuleForm = document.getElementById('newModuleForm');
    if (newModuleForm) {
        newModuleForm.addEventListener('submit', handleNewModule);
    }

    // Handler do formulário de nova aula
    const newLessonForm = document.getElementById('newLessonForm');
    if (newLessonForm) {
        newLessonForm.addEventListener('submit', handleNewLesson);
    }

    // Handler do formulário de edição de módulo
    const editModuleForm = document.getElementById('editModuleForm');
    if (editModuleForm) {
        editModuleForm.addEventListener('submit', handleEditModule);
    }

    // Handler do formulário de edição de aula
    const editLessonForm = document.getElementById('editLessonForm');
    if (editLessonForm) {
        editLessonForm.addEventListener('submit', handleEditLesson);
    }

    // Handler do logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear();
            window.location.replace('/auth.html');
        });
    }

    // Configurar modais
    setupModals();

    // Atualizar campos de conteúdo quando o tipo mudar
    const contentTypeSelect = document.getElementById('contentType');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', function() {
            updateFileInput(this.value, false);
        });
    }

    const editContentTypeSelect = document.getElementById('editContentType');
    if (editContentTypeSelect) {
        editContentTypeSelect.addEventListener('change', function() {
            updateFileInput(this.value, true);
        });
    }
}

// Configurar modais
function setupModals() {
    // Configurar modal de nova aula
    const newLessonModal = document.getElementById('newLessonModal');
    if (newLessonModal) {
        const bsModal = new bootstrap.Modal(newLessonModal);
        
        newLessonModal.addEventListener('show.bs.modal', function() {
            // Resetar formulário
            const form = document.getElementById('newLessonForm');
            if (form) {
                form.reset();
            }
            
            // Configurar tipo de conteúdo padrão
            const contentTypeSelect = document.getElementById('contentType');
            if (contentTypeSelect) {
                contentTypeSelect.value = 'pdf';
            }
        });

        newLessonModal.addEventListener('shown.bs.modal', function() {
            // Configurar event listeners após o modal estar completamente visível
            const contentTypeSelect = document.getElementById('contentType');
            if (contentTypeSelect) {
                updateFileInput('pdf', false);
                contentTypeSelect.addEventListener('change', function() {
                    updateFileInput(this.value, false);
                });
            }
        });
    }

    // Configurar modal de edição de aula
    const editLessonModal = document.getElementById('editLessonModal');
    if (editLessonModal) {
        editLessonModal.addEventListener('shown.bs.modal', function() {
            const editContentTypeSelect = document.getElementById('editContentType');
            if (editContentTypeSelect) {
                updateFileInput(editContentTypeSelect.value, true);
                editContentTypeSelect.addEventListener('change', function() {
                    updateFileInput(this.value, true);
                });
            }
        });
    }
}

// Atualizar configurações do input de arquivo
function updateFileInput(contentType, isEdit = false) {
    const prefix = isEdit ? 'edit' : '';
    const modalId = isEdit ? 'editLessonModal' : 'newLessonModal';
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        console.error('Modal não encontrado');
        return;
    }

    const fileInput = modal.querySelector('#contentFile');
    const fileHelp = modal.querySelector('#contentFileGroup .text-muted');

    if (!fileInput || !fileHelp) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    // Atualizar mensagem de ajuda e tipos de arquivo aceitos
    switch (contentType) {
        case 'pdf':
            fileHelp.textContent = 'Selecione um arquivo PDF (máx. 50MB)';
            fileInput.accept = '.pdf';
            break;
        case 'slides':
            fileHelp.textContent = 'Selecione um arquivo PowerPoint (máx. 50MB)';
            fileInput.accept = '.ppt,.pptx';
            break;
        case 'documento':
            fileHelp.textContent = 'Selecione um arquivo Word ou Excel (máx. 50MB)';
            fileInput.accept = '.doc,.docx,.xls,.xlsx';
            break;
        case 'video':
            fileHelp.textContent = 'Selecione um arquivo de vídeo (máx. 50MB)';
            fileInput.accept = '.mp4,.webm,.ogg';
            break;
        case 'texto':
            fileHelp.textContent = 'Selecione um arquivo de texto (máx. 50MB)';
            fileInput.accept = '.txt,.doc,.docx';
            break;
        default:
            fileHelp.textContent = 'Selecione um arquivo (máx. 50MB)';
            fileInput.accept = '';
    }
}

// Abrir modal de nova aula
function openNewLessonModal(moduleId) {
    const modalElement = document.getElementById('newLessonModal');
    if (!modalElement) {
        console.error('Modal não encontrado');
        return;
    }

    // Definir o ID do módulo
    const moduleIdInput = document.getElementById('moduleId');
    if (moduleIdInput) {
        moduleIdInput.value = moduleId;
        console.log('Module ID definido:', moduleId);
    } else {
        console.error('Input moduleId não encontrado');
        return;
    }

    // Resetar formulário
    const form = document.getElementById('newLessonForm');
    if (form) {
        form.reset();
    }

    // Configurar tipo de conteúdo padrão
    const contentTypeSelect = document.getElementById('contentType');
    if (contentTypeSelect) {
        contentTypeSelect.value = 'pdf';
        updateFileInput('pdf', false);
    }

    // Mostrar o modal
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modal.show();
}

// Abrir modal de edição de aula
function editLesson(lessonId, moduleId) {
    const modal = new bootstrap.Modal(document.getElementById('editLessonModal'));

    // Buscar dados da aula
    fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
        .then(response => response.json())
        .then(lesson => {
            document.getElementById('editLessonId').value = lessonId;
            document.getElementById('editLessonModuleId').value = moduleId;
            document.getElementById('editLessonTitle').value = lesson.title;
            document.getElementById('editLessonDescription').value = lesson.description;
            document.getElementById('editContentType').value = lesson.content_type;
            document.getElementById('editLessonDuration').value = lesson.duration;

            // Configurar campos baseado no tipo de conteúdo
            toggleContentFields(lesson.content_type, true);

            // Se for vídeo, preencher URL
            if (lesson.content_type === 'video') {
                document.getElementById('editContentUrl').value = lesson.content_url;
            }

            modal.show();
        })
        .catch(error => {
            console.error('Erro ao carregar dados da aula:', error);
            showAlert('Erro ao carregar dados da aula', 'danger');
        });
}

// Funções de manipulação de formulário
async function handleNewLesson(event) {
    event.preventDefault();
    
    try {
        const moduleId = document.getElementById('moduleId').value;
        console.log('Module ID no envio:', moduleId);
        
        if (!moduleId) {
            throw new Error('ID do módulo não encontrado');
        }

        // Validar campos obrigatórios
        const title = document.getElementById('lessonTitle').value.trim();
        const description = document.getElementById('lessonDescription').value.trim();
        const contentType = document.getElementById('contentType').value;
        const duration = document.getElementById('lessonDuration').value;
        
        // Validar campos vazios ou inválidos
        if (!title) {
            throw new Error('O título é obrigatório');
        }
        if (!description) {
            throw new Error('A descrição é obrigatória');
        }
        if (!contentType) {
            throw new Error('O tipo de conteúdo é obrigatório');
        }
        if (!duration || duration < 1) {
            throw new Error('A duração deve ser maior que zero');
        }

        // Validar arquivo
        const contentFile = document.getElementById('contentFile').files[0];
        if (!contentFile) {
            throw new Error('Por favor, selecione um arquivo');
        }

        // Criar FormData com dados sanitizados
        const formData = new FormData();
        formData.append('module_id', moduleId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content_type', contentType);
        formData.append('duration', duration);
        formData.append('content_file', contentFile);

        console.log('Dados do formulário:', {
            moduleId,
            title,
            description,
            contentType,
            duration,
            fileName: contentFile.name
        });

        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const responseData = await response.json();
            console.error('Erro na resposta:', responseData);
            throw new Error(responseData.error || 'Erro ao criar aula');
        }

        const responseData = await response.json();
        console.log('Aula criada com sucesso:', responseData);

        // Fechar modal e atualizar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('newLessonModal'));
        modal.hide();
        await loadModules();
        showAlert('Aula criada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        showAlert(error.message || 'Erro ao criar aula', 'danger');
    }
}

async function handleEditLesson(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const lessonId = form.querySelector('#editLessonId').value;
        const moduleId = form.querySelector('#editLessonModuleId').value;
        const title = form.querySelector('#editLessonTitle').value;
        const description = form.querySelector('#editLessonDescription').value;
        const contentType = form.querySelector('#editContentType').value;
        const duration = form.querySelector('#editLessonDuration').value;
        const contentFile = form.querySelector('#editContentFile').files[0];

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content_type', contentType);
        formData.append('duration', duration);

        if (contentFile) {
            formData.append('content_file', contentFile);
        }

        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar aula');
        }

        // Fechar modal e recarregar módulos
        const modal = bootstrap.Modal.getInstance(document.getElementById('editLessonModal'));
        modal.hide();
        await loadModules();
        showAlert('Aula atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        showAlert(error.message || 'Erro ao atualizar aula', 'danger');
    }
}

// Função para exibir alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Remover o alerta após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Inicializar Sortable.js para drag & drop
function initializeSortable() {
    // Sortable para módulos
    new Sortable(document.getElementById('modulesList'), {
        animation: 150,
        handle: '.module-card',
        onEnd: async function (evt) {
            const moduleOrder = Array.from(document.querySelectorAll('.module-card'))
                .map(card => card.dataset.moduleId);

            try {
                const response = await fetch(`/api/courses/${courseId}/modules/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ moduleOrder })
                });

                if (!response.ok) throw new Error('Erro ao reordenar módulos');
            } catch (error) {
                console.error('Erro ao reordenar módulos:', error);
                showAlert('Erro ao reordenar módulos', 'danger');
                loadModules(); // Recarregar ordem original em caso de erro
            }
        }
    });

    // Sortable para aulas dentro de cada módulo
    document.querySelectorAll('.lessons-list').forEach(list => {
        new Sortable(list, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: async function (evt) {
                const moduleId = evt.target.dataset.moduleId;
                const lessonOrder = Array.from(evt.target.querySelectorAll('.lesson-item'))
                    .map(item => item.dataset.lessonId);

                try {
                    const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/reorder`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ lessonOrder })
                    });

                    if (!response.ok) throw new Error('Erro ao reordenar aulas');
                } catch (error) {
                    console.error('Erro ao reordenar aulas:', error);
                    showAlert('Erro ao reordenar aulas', 'danger');
                    loadModules(); // Recarregar ordem original em caso de erro
                }
            }
        });
    });
}

// Funções de ação
async function editModule(moduleId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados do módulo');

        const module = await response.json();
        document.getElementById('editModuleId').value = module.id;
        document.getElementById('editModuleTitle').value = module.title;
        document.getElementById('editModuleDescription').value = module.description;

        const modal = new bootstrap.Modal(document.getElementById('editModuleModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar módulo:', error);
        showAlert(error.message, 'danger');
    }
}

async function deleteModule(moduleId) {
    if (!confirm('Tem certeza que deseja excluir este módulo? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir módulo');

        await loadModules();
        showAlert('Módulo excluído com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao excluir módulo:', error);
        showAlert(error.message, 'danger');
    }
}

async function deleteLesson(lessonId, moduleId) {
    if (!confirm('Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir aula');

        await loadModules();
        showAlert('Aula excluída com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        showAlert(error.message, 'danger');
    }
}

// Função para criar nova aula
function createLesson(moduleId) {
    const modal = document.getElementById('newLessonModal');
    const form = document.getElementById('newLessonForm');
    const contentTypeSelect = document.getElementById('contentType');
    const contentUrlDiv = document.getElementById('contentUrlDiv');
    const contentFileDiv = document.getElementById('contentFileDiv');

    // Limpar listeners anteriores
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Resetar o formulário
    newForm.reset();
    
    // Configurar o ID do módulo
    document.getElementById('moduleId').value = moduleId;

    // Configurar a exibição dos campos baseado no tipo de conteúdo
    function updateContentFields() {
        const contentType = contentTypeSelect.value;
        if (contentType === 'video') {
            contentUrlDiv.style.display = 'block';
            contentFileDiv.style.display = 'none';
            document.getElementById('contentFile').value = '';
        } else {
            contentUrlDiv.style.display = 'none';
            contentFileDiv.style.display = 'block';
            document.getElementById('contentUrl').value = '';
        }
    }

    // Atualizar campos quando o tipo de conteúdo mudar
    contentTypeSelect.addEventListener('change', updateContentFields);
    
    // Configurar estado inicial dos campos
    updateContentFields();

    // Configurar o evento de submit do formulário
    newForm.addEventListener('submit', handleNewLesson);

    // Abrir o modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

async function handleEditModule(e) {
    e.preventDefault();
    const moduleId = document.getElementById('editModuleId').value;

    try {
        const formData = {
            title: document.getElementById('editModuleTitle').value,
            description: document.getElementById('editModuleDescription').value
        };

        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao atualizar módulo');

        await loadModules();
        bootstrap.Modal.getInstance(document.getElementById('editModuleModal')).hide();
        showAlert('Módulo atualizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao atualizar módulo:', error);
        showAlert(error.message, 'danger');
    }
}

// Carregar dados do curso
async function loadCourseData() {
    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados do curso');

        const course = await response.json();
        document.getElementById('courseTitle').textContent = course.title;
        document.getElementById('courseDescription').textContent = course.description;
    } catch (error) {
        console.error('Erro ao carregar dados do curso:', error);
        showAlert('Erro ao carregar dados do curso', 'danger');
    }
}

// Carregar módulos e aulas
async function loadModules() {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar módulos');

        const modules = await response.json();
        renderModules(modules);
        initializeSortable();
    } catch (error) {
        console.error('Erro ao carregar módulos:', error);
        showAlert('Erro ao carregar módulos', 'danger');
    }
}

// Renderizar módulos e aulas
function renderModules(modules) {
    const container = document.getElementById('modulesList');

    if (modules.length === 0) {
        container.innerHTML = `
            <div class="empty-placeholder">
                <i class="bi bi-collection"></i>
                <p>Nenhum módulo encontrado. Clique em "Novo Módulo" para começar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = modules.map(module => `
        <div class="module-card" data-module-id="${module.id}">
            <div class="module-header">
                <h3 class="module-title">
                    <i class="bi bi-collection"></i>
                    ${module.title}
                </h3>
                <div class="module-actions">
                    <button class="btn btn-sm btn-primary btn-icon" onclick="editModule(${module.id})">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-success btn-icon" onclick="openNewLessonModal(${module.id})">
                        <i class="bi bi-plus-lg"></i> Nova Aula
                    </button>
                    <button class="btn btn-sm btn-danger btn-icon" onclick="deleteModule(${module.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <p class="module-description">${module.description}</p>
            <ul class="lessons-list" data-module-id="${module.id}">
                ${module.lessons.map(lesson => `
                    <li class="lesson-item" data-lesson-id="${lesson.id}">
                        <div class="lesson-info">
                            <div class="lesson-icon">
                                ${getLessonIcon(lesson.content_type)}
                            </div>
                            <div class="lesson-details">
                                <h4>${lesson.title}</h4>
                                <div class="lesson-meta">
                                    <span><i class="bi bi-clock"></i> ${lesson.duration} min</span>
                                    <span><i class="bi bi-${getLessonTypeIcon(lesson.content_type)}"></i> ${formatContentType(lesson.content_type)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="lesson-actions">
                            <button class="btn btn-sm btn-primary btn-icon" onclick="editLesson(${lesson.id}, ${module.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteLesson(${lesson.id}, ${module.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                            <i class="bi bi-grip-vertical drag-handle"></i>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// Funções auxiliares
function getLessonIcon(contentType) {
    const icons = {
        'video': '<i class="bi bi-play-circle"></i>',
        'texto': '<i class="bi bi-file-text"></i>',
        'quiz': '<i class="bi bi-question-circle"></i>',
        'slides': '<i class="bi bi-file-earmark-slides"></i>',
        'documento': '<i class="bi bi-file-earmark-word"></i>',
        'pdf': '<i class="bi bi-file-earmark-pdf"></i>'
    };
    return icons[contentType] || '<i class="bi bi-file"></i>';
}

function getLessonTypeIcon(contentType) {
    const icons = {
        'video': 'play-circle',
        'texto': 'file-text',
        'quiz': 'question-circle',
        'slides': 'file-earmark-slides',
        'documento': 'file-earmark-word',
        'pdf': 'file-earmark-pdf'
    };
    return icons[contentType] || 'file';
}

function formatContentType(contentType) {
    const types = {
        'video': 'Vídeo',
        'texto': 'Texto',
        'quiz': 'Quiz',
        'slides': 'Slides',
        'documento': 'Documento',
        'pdf': 'PDF'
    };
    return types[contentType] || contentType;
}

// Funções de manipulação de módulos
async function handleNewModule(e) {
    e.preventDefault();

    try {
        const formData = {
            title: document.getElementById('moduleTitle').value,
            description: document.getElementById('moduleDescription').value
        };

        const response = await fetch(`/api/courses/${courseId}/modules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Erro ao criar módulo');

        await loadModules();
        bootstrap.Modal.getInstance(document.getElementById('newModuleModal')).hide();
        e.target.reset();
        showAlert('Módulo criado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao criar módulo:', error);
        showAlert(error.message, 'danger');
    }
}

// Função para inicializar o Sortable
function initializeSortable() {
    const modulesList = document.getElementById('modulesList');
    const lessonLists = document.querySelectorAll('.lessons-list');

    // Sortable para módulos
    if (modulesList) {
        new Sortable(modulesList, {
            animation: 150,
            handle: '.module-header',
            onEnd: async function (evt) {
                const moduleOrder = Array.from(modulesList.children).map(module =>
                    module.getAttribute('data-module-id')
                );

                try {
                    const response = await fetch(`/api/courses/${courseId}/modules/reorder`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ moduleOrder })
                    });

                    if (!response.ok) throw new Error('Erro ao reordenar módulos');
                } catch (error) {
                    console.error('Erro ao reordenar módulos:', error);
                    showAlert('Erro ao reordenar módulos', 'danger');
                }
            }
        });
    }

    // Sortable para aulas
    lessonLists.forEach(list => {
        new Sortable(list, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: async function (evt) {
                const moduleId = list.getAttribute('data-module-id');
                const lessonOrder = Array.from(list.children).map(lesson =>
                    lesson.getAttribute('data-lesson-id')
                );

                try {
                    const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/reorder`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ lessonOrder })
                    });

                    if (!response.ok) throw new Error('Erro ao reordenar aulas');
                } catch (error) {
                    console.error('Erro ao reordenar aulas:', error);
                    showAlert('Erro ao reordenar aulas', 'danger');
                }
            }
        });
    });
}

function initializeFormHandlers() {
    // Formulário de nova aula
    const newLessonForm = document.getElementById('newLessonForm');
    if (newLessonForm) {
        newLessonForm.addEventListener('submit', handleNewLesson);
        console.log('Event listener adicionado ao formulário de nova aula');
    } else {
        console.error('Formulário de nova aula não encontrado');
    }

    // Select de tipo de conteúdo
    const contentTypeSelect = document.getElementById('contentType');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', function() {
            updateFileInput(this.value, false);
        });
        console.log('Event listener adicionado ao select de tipo de conteúdo');
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initializeFormHandlers();
    loadCourseData();
    loadModules();
});
