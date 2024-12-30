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
        
        // Configurar modais
        setupModals();
        
        // Carregar módulos iniciais
        await loadModules();
        
        // Configurar formulário de novo módulo
        const newModuleForm = document.getElementById('newModuleForm');
        if (newModuleForm) {
            newModuleForm.addEventListener('submit', handleNewModule);
        }
        
        // Configurar formulário de nova aula
        const newLessonForm = document.getElementById('newLessonForm');
        if (newLessonForm) {
            newLessonForm.addEventListener('submit', handleNewLesson);
        }
        
        // Configurar select de tipo de conteúdo para nova aula
        const contentTypeSelect = document.getElementById('contentType');
        if (contentTypeSelect) {
            contentTypeSelect.addEventListener('change', function() {
                updateFileInput(this.value, false);
            });
        }
        
        // Configurar select de tipo de conteúdo para edição de aula
        const editContentTypeSelect = document.getElementById('editContentType');
        if (editContentTypeSelect) {
            editContentTypeSelect.addEventListener('change', function() {
                updateFileInput(this.value, true);
            });
        }
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        showAlert('Erro ao carregar a página', 'danger');
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
        // Configurar formulário de nova aula
        const newLessonForm = document.getElementById('newLessonForm');
        if (newLessonForm) {
            newLessonForm.addEventListener('submit', handleNewLesson);
        }
    }

    // Configurar modal de edição de aula
    const editLessonModal = document.getElementById('editLessonModal');
    if (editLessonModal) {
        const editLessonForm = document.getElementById('editLessonForm');
        if (editLessonForm) {
            editLessonForm.addEventListener('submit', handleEditLesson);
        }
    }
}

// Atualizar configurações do input de arquivo
function updateFileInput(contentType, isEdit = false) {
    const prefix = isEdit ? 'edit' : '';
    
    // Elementos do formulário
    const fileGroup = document.getElementById(`${prefix}contentFileGroup`);
    const urlGroup = document.getElementById(`${prefix}contentUrlGroup`);
    const fileInput = document.getElementById(`${prefix}contentFile`);

    if (!fileGroup || !fileInput) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    // Alternar visibilidade dos grupos
    if (contentType === 'video') {
        if (urlGroup) urlGroup.style.display = 'block';
        fileGroup.style.display = 'none';
        fileInput.removeAttribute('required');
    } else {
        if (urlGroup) urlGroup.style.display = 'none';
        fileGroup.style.display = 'block';
        if (!isEdit) {
            fileInput.setAttribute('required', 'required');
        }
    }

    // Atualizar mensagem de ajuda e tipos de arquivo aceitos
    const fileHelp = fileGroup.querySelector('.text-muted');
    if (fileHelp) {
        let helpText = '';
        let acceptTypes = '';
        
        switch (contentType) {
            case 'pdf':
                helpText = isEdit ? 
                    'Selecione um novo arquivo PDF apenas se desejar substituir o atual (máx. 50MB)' :
                    'Selecione um arquivo PDF (máx. 50MB)';
                acceptTypes = '.pdf';
                break;
            case 'slides':
                helpText = isEdit ?
                    'Selecione um novo arquivo PowerPoint apenas se desejar substituir o atual (máx. 50MB)' :
                    'Selecione um arquivo PowerPoint (máx. 50MB)';
                acceptTypes = '.ppt,.pptx';
                break;
            case 'documento':
                helpText = isEdit ?
                    'Selecione um novo arquivo Word ou Excel apenas se desejar substituir o atual (máx. 50MB)' :
                    'Selecione um arquivo Word ou Excel (máx. 50MB)';
                acceptTypes = '.doc,.docx,.xls,.xlsx';
                break;
            case 'video':
                helpText = isEdit ?
                    'Selecione um novo arquivo de vídeo apenas se desejar substituir o atual (máx. 50MB)' :
                    'Selecione um arquivo de vídeo (máx. 50MB)';
                acceptTypes = '.mp4,.webm,.ogg';
                break;
            case 'texto':
                helpText = isEdit ?
                    'Selecione um novo arquivo de texto apenas se desejar substituir o atual (máx. 50MB)' :
                    'Selecione um arquivo de texto (máx. 50MB)';
                acceptTypes = '.txt,.doc,.docx';
                break;
            default:
                helpText = isEdit ?
                    'Selecione um novo arquivo apenas se desejar substituir o atual (máx. 50MB)' :
                    'Selecione um arquivo (máx. 50MB)';
                acceptTypes = '';
        }
        
        fileHelp.textContent = helpText;
        fileInput.accept = acceptTypes;
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
    } else {
        console.error('Input moduleId não encontrado');
        return;
    }

    // Resetar formulário
    const form = document.getElementById('newLessonForm');
    if (form) {
        form.reset();
    }

    // Criar e mostrar o modal
    const modal = new bootstrap.Modal(modalElement);
    
    // Aguardar o modal estar completamente visível antes de inicializar os campos
    modalElement.addEventListener('shown.bs.modal', function onModalShown() {
        // Configurar tipo de conteúdo padrão e campos relacionados
        const contentTypeSelect = document.getElementById('contentType');
        if (contentTypeSelect) {
            // Remover listeners antigos para evitar duplicação
            const newListener = function() {
                updateFileInput(this.value, false);
            };
            contentTypeSelect.removeEventListener('change', newListener);
            contentTypeSelect.addEventListener('change', newListener);
            
            // Definir valor padrão e atualizar campos
            contentTypeSelect.value = 'pdf';
            updateFileInput('pdf', false);
        }
        
        // Remover o listener após a execução
        modalElement.removeEventListener('shown.bs.modal', onModalShown);
    });

    modal.show();
}

// Abrir modal de edição de aula
async function editLesson(lessonId, moduleId) {
    try {
        console.log('Editando aula:', { lessonId, moduleId, courseId });
        
        if (!courseId || !moduleId || !lessonId) {
            throw new Error('IDs inválidos para edição da aula');
        }

        // Buscar dados atualizados dos módulos
        const response = await fetch(`/api/courses/${courseId}/modules`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados dos módulos');
        }

        const modules = await response.json();
        
        // Encontrar o módulo e a aula
        const module = modules.find(m => m.id === parseInt(moduleId));
        if (!module) {
            throw new Error('Módulo não encontrado');
        }

        const lesson = module.lessons.find(l => l.id === parseInt(lessonId));
        if (!lesson) {
            throw new Error('Aula não encontrada');
        }

        console.log('Dados da aula encontrados:', lesson);

        // Abrir o modal
        const modalElement = document.getElementById('editLessonModal');
        if (!modalElement) {
            throw new Error('Modal de edição não encontrado');
        }

        const modal = new bootstrap.Modal(modalElement);

        // Aguardar o modal estar completamente visível antes de manipular os elementos
        modalElement.addEventListener('shown.bs.modal', function onModalShown() {
            // Preencher campos do formulário
            const fields = {
                'editLessonId': lessonId,
                'editLessonModuleId': moduleId,
                'editLessonTitle': lesson.title || '',
                'editLessonDescription': lesson.description || '',
                'editContentType': lesson.content_type || 'pdf',
                'editLessonDuration': lesson.duration || ''
            };

            // Preencher cada campo e verificar se existe
            Object.entries(fields).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                } else {
                    console.error(`Elemento não encontrado: ${id}`);
                }
            });

            // Configurar campos baseado no tipo de conteúdo
            updateFileInput(lesson.content_type || 'pdf', true);

            // Se for vídeo, preencher URL
            if (lesson.content_type === 'video' && lesson.content_url) {
                const urlInput = document.getElementById('editContentUrl');
                if (urlInput) {
                    urlInput.value = lesson.content_url;
                }
            }

            // Mostrar o arquivo atual se existir
            if (lesson.content_url && lesson.content_type !== 'video') {
                const fileHelp = document.querySelector('#editContentFileGroup .text-muted');
                if (fileHelp) {
                    fileHelp.innerHTML = `
                        Arquivo atual: <a href="${lesson.content_url}" target="_blank">${lesson.content_url.split('/').pop()}</a>
                        <br>
                        Selecione um novo arquivo apenas se desejar substituir o atual (máx. 50MB)
                    `;
                }
            }

            // Remover o listener após a primeira execução
            modalElement.removeEventListener('shown.bs.modal', onModalShown);
        });

        modal.show();

    } catch (error) {
        console.error('Erro detalhado ao carregar dados da aula:', error);
        showAlert(`Não foi possível carregar a aula. ${error.message}`, 'danger');
    }
}

// Funções de manipulação de formulário
async function handleNewLesson(event) {
    event.preventDefault();
    
    try {
        const moduleId = document.getElementById('moduleId').value;
        
        if (!moduleId) {
            throw new Error('ID do módulo não encontrado');
        }

        // Validar campos obrigatórios
        const title = document.getElementById('lessonTitle').value.trim();
        const description = document.getElementById('lessonDescription').value.trim();
        const contentType = document.getElementById('contentType').value;
        const duration = document.getElementById('lessonDuration').value;
        const contentFile = document.getElementById('contentFile').files[0];
        
        // Validar campos
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
        if (!contentFile) {
            throw new Error('Por favor, selecione um arquivo');
        }

        // Validar tipo de arquivo
        const allowedMimeTypes = {
            'pdf': ['application/pdf'],
            'slides': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
            'documento': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            'video': ['video/mp4', 'video/webm', 'video/ogg'],
            'texto': ['text/plain']
        };

        if (allowedMimeTypes[contentType] && !allowedMimeTypes[contentType].includes(contentFile.type)) {
            throw new Error(`Tipo de arquivo inválido para ${contentType}`);
        }

        // Criar FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content_type', contentType);
        formData.append('duration', duration);
        formData.append('content_file', contentFile);

        const url = `/api/courses/${courseId}/modules/${moduleId}/lessons`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const responseData = await response.json();
            throw new Error(responseData.error || 'Erro ao criar aula');
        }

        const responseData = await response.json();

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

// Manipular edição de aula
async function handleEditLesson(event) {
    event.preventDefault();
    
    try {
        const lessonId = document.getElementById('editLessonId').value;
        const moduleId = document.getElementById('editLessonModuleId').value;
        const title = document.getElementById('editLessonTitle').value;
        const description = document.getElementById('editLessonDescription').value;
        const duration = parseInt(document.getElementById('editLessonDuration').value);
        const contentType = document.getElementById('editContentType').value;

        console.log('Dados do formulário:', {
            lessonId,
            moduleId,
            title,
            description,
            duration,
            contentType
        });

        // Criar FormData para envio do arquivo
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('duration', duration);
        formData.append('content_type', contentType);
        formData.append('moduleId', moduleId);

        // Adicionar arquivo se houver
        const fileInput = document.getElementById('editContentFile');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            console.log('Arquivo selecionado:', {
                name: file.name,
                type: file.type,
                size: file.size
            });

            // Verificar o tipo de arquivo
            const allowedTypes = {
                'pdf': ['application/pdf'],
                'slides': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
                'documento': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                'video': ['video/mp4', 'video/webm', 'video/ogg'],
                'texto': ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            };

            if (allowedTypes[contentType] && !allowedTypes[contentType].includes(file.type)) {
                throw new Error(`Tipo de arquivo inválido para ${contentType}. Tipos permitidos: ${allowedTypes[contentType].join(', ')}`);
            }

            formData.append('content_file', file);
        } else {
            console.log('Nenhum arquivo selecionado');
        }

        // URL correta para atualização da aula
        const url = `/api/courses/lessons/${lessonId}`;
        console.log('Enviando requisição para:', url);
        console.log('FormData entries:', [...formData.entries()].map(([key, value]) => {
            if (value instanceof File) {
                return [key, { name: value.name, type: value.type, size: value.size }];
            }
            return [key, value];
        }));

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData,
            credentials: 'include'
        });

        // Tentar ler a resposta como texto primeiro
        const responseText = await response.text();
        console.log('Resposta do servidor:', responseText);
        
        let result;
        try {
            // Tentar converter para JSON se possível
            result = JSON.parse(responseText);
        } catch {
            // Se não for JSON, usar o texto como está
            result = responseText;
        }

        if (!response.ok) {
            console.error('Resposta de erro:', {
                status: response.status,
                statusText: response.statusText,
                result
            });
            throw new Error(typeof result === 'object' ? result.error : result || `Erro ao atualizar aula: ${response.statusText}`);
        }

        console.log('Aula atualizada:', result);

        // Fechar modal e atualizar lista
        const modal = bootstrap.Modal.getInstance(document.getElementById('editLessonModal'));
        modal.hide();

        // Recarregar a página para mostrar as alterações
        window.location.reload();

    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        showAlert(error.message || 'Erro ao atualizar aula. Por favor, tente novamente.', 'danger');
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
        const response = await fetch(`/api/courses/modules/${moduleId}`, {
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
        const response = await fetch(`/api/courses/modules/${moduleId}`, {
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

        const response = await fetch(`/api/courses/modules/${moduleId}`, {
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

    container.innerHTML = modules.map(module => {
        return `
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
                                    ${getLessonIcon(lesson.content_type || 'documento')}
                                </div>
                                <div class="lesson-details">
                                    <h4>${lesson.title}</h4>
                                    <div class="lesson-meta">
                                        <span><i class="bi bi-clock"></i> ${lesson.duration} min</span>
                                        <span><i class="bi bi-${getLessonTypeIcon(lesson.content_type || 'documento')}"></i> ${formatContentType(lesson.content_type || 'documento')}</span>
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
        `;
    }).join('');
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
    return types[contentType] || 'Documento';
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

// Reordenar módulos
async function handleModuleReorder() {
    try {
        const modulesList = document.getElementById('modulesList');
        const moduleOrder = Array.from(modulesList.children).map(module =>
            ({
                id: module.dataset.moduleId,
                order_number: Array.from(modulesList.children).indexOf(module) + 1
            })
        );

        const response = await fetch(`/api/courses/${courseId}/modules/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ moduleOrders: moduleOrder })
        });

        if (!response.ok) {
            throw new Error('Erro ao reordenar módulos');
        }

        showAlert('Módulos reordenados com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao reordenar módulos:', error);
        showAlert('Erro ao reordenar módulos', 'danger');
    }
}

// Reordenar aulas
async function handleLessonReorder(moduleId) {
    try {
        const list = document.querySelector(`#module-${moduleId} .lesson-list`);
        const lessonOrder = Array.from(list.children).map(lesson =>
            ({
                id: lesson.dataset.lessonId,
                order_number: Array.from(list.children).indexOf(lesson) + 1
            })
        );

        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ lessonOrders: lessonOrder })
        });

        if (!response.ok) {
            throw new Error('Erro ao reordenar aulas');
        }

        showAlert('Aulas reordenadas com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao reordenar aulas:', error);
        showAlert('Erro ao reordenar aulas', 'danger');
    }
}

// Reordenar módulos após drag and drop
async function handleModuleDrop(evt) {
    evt.preventDefault();
    const modulesList = document.getElementById('modulesList');
    const moduleOrder = Array.from(modulesList.children).map(module =>
        ({
            id: module.dataset.moduleId,
            order_number: Array.from(modulesList.children).indexOf(module) + 1
        })
    );

    try {
        const response = await fetch(`/api/courses/${courseId}/modules/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ moduleOrders: moduleOrder })
        });

        if (!response.ok) {
            throw new Error('Erro ao reordenar módulos');
        }

        showAlert('Módulos reordenados com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao reordenar módulos:', error);
        showAlert('Erro ao reordenar módulos', 'danger');
    }
}

// Reordenar aulas após drag and drop
async function handleLessonDrop(evt, moduleId) {
    evt.preventDefault();
    const list = document.querySelector(`#module-${moduleId} .lesson-list`);
    const lessonOrder = Array.from(list.children).map(lesson =>
        ({
            id: lesson.dataset.lessonId,
            order_number: Array.from(list.children).indexOf(lesson) + 1
        })
    );

    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ lessonOrders: lessonOrder })
        });

        if (!response.ok) {
            throw new Error('Erro ao reordenar aulas');
        }

        showAlert('Aulas reordenadas com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao reordenar aulas:', error);
        showAlert('Erro ao reordenar aulas', 'danger');
    }
}
