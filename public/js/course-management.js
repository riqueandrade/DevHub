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

        // Configurar handlers
        setupEventHandlers();
        
        // Carregar categorias
        await loadCategories();
        
        // Carregar cursos
        await loadCourses();
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        showAlert('Erro ao carregar dados. Tente novamente mais tarde.', 'danger');
    }
});

// Configurar handlers de eventos
function setupEventHandlers() {
    // Handler do formulário de novo curso
    document.getElementById('newCourseForm').addEventListener('submit', handleNewCourse);

    // Handler do logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.clear();
        window.location.replace('/auth.html');
    });

    // Handler do upload de thumbnail
    document.getElementById('courseThumbnail').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 5 * 1024 * 1024) { // 5MB
                showAlert('A imagem deve ter no máximo 5MB', 'danger');
                e.target.value = '';
            }
        }
    });
}

// Carregar categorias
async function loadCategories() {
    try {
        const response = await fetch('/api/catalog/categories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar categorias');

        const categories = await response.json();
        const options = categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        // Atualizar select do formulário de novo curso
        document.getElementById('courseCategory').innerHTML = options;
        
        // Atualizar select do formulário de edição
        document.getElementById('editCourseCategory').innerHTML = options;
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showAlert('Erro ao carregar categorias', 'danger');
    }
}

// Carregar cursos
async function loadCourses() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('/api/courses/instructor', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar cursos');

        const courses = await response.json();
        
        // Separar cursos por status
        const draftCourses = courses.filter(course => course.status === 'rascunho');
        const publishedCourses = courses.filter(course => course.status === 'publicado');
        const archivedCourses = courses.filter(course => course.status === 'arquivado');

        // Renderizar cursos
        renderCourses('draftCourses', draftCourses);
        renderCourses('publishedCourses', publishedCourses);
        renderCourses('archivedCourses', archivedCourses);
    } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        showAlert('Erro ao carregar cursos', 'danger');
    }
}

// Renderizar cursos
function renderCourses(containerId, courses) {
    const container = document.getElementById(containerId);
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-placeholder">
                    <i class="bi bi-journal-text"></i>
                    <p>Nenhum curso encontrado nesta categoria</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="col-md-6 col-lg-4">
            <div class="course-card">
                <div class="course-header">
                    <img src="${course.thumbnail || '/images/course-placeholder.png'}" alt="${course.title}" class="course-thumbnail">
                    <span class="course-level badge ${getLevelClass(course.level)}">${formatLevel(course.level)}</span>
                </div>
                <div class="course-body">
                    <h3 class="course-title">${course.title}</h3>
                    <div class="course-info">
                        <p class="mb-2">${course.description}</p>
                        <div class="course-meta">
                            <span><i class="bi bi-clock"></i> ${formatDuration(course.duration)}</span>
                            <span><i class="bi bi-currency-dollar"></i> ${formatPrice(course.price)}</span>
                        </div>
                    </div>
                </div>
                <div class="course-footer">
                    <div class="action-buttons">
                        <div class="action-group">
                            <button class="btn btn-sm btn-info btn-icon" onclick="manageCourseContent(${course.id})">
                                <i class="bi bi-collection"></i> Conteúdo
                            </button>
                            <button class="btn btn-sm btn-primary btn-icon" onclick="editCourse(${course.id})">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                        </div>
                        <div class="action-group">
                            ${course.status === 'rascunho' ? `
                                <button class="btn btn-sm btn-success btn-icon" onclick="publishCourse(${course.id})">
                                    <i class="bi bi-cloud-upload"></i> Publicar
                                </button>
                            ` : ''}
                            ${course.status === 'publicado' ? `
                                <button class="btn btn-sm btn-warning btn-icon" onclick="archiveCourse(${course.id})">
                                    <i class="bi bi-archive"></i> Arquivar
                                </button>
                            ` : ''}
                            ${course.status === 'arquivado' ? `
                                <button class="btn btn-sm btn-success btn-icon" onclick="unarchiveCourse(${course.id})">
                                    <i class="bi bi-archive"></i> Desarquivar
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteCourse(${course.id})">
                                <i class="bi bi-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Funções auxiliares de formatação
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
}

function formatPrice(price) {
    return price > 0 ? `R$ ${price.toFixed(2)}` : 'Grátis';
}

function formatLevel(level) {
    const levels = {
        'iniciante': 'Iniciante',
        'intermediario': 'Intermediário',
        'avancado': 'Avançado'
    };
    return levels[level] || level;
}

function getLevelClass(level) {
    const classes = {
        'iniciante': 'bg-success',
        'intermediario': 'bg-warning',
        'avancado': 'bg-danger'
    };
    return classes[level] || 'bg-secondary';
}

// Handler do formulário de novo curso
async function handleNewCourse(e) {
    e.preventDefault();

    // Desabilitar o botão de submit durante o processo
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        // Coletar dados do formulário
        const title = document.getElementById('courseTitle').value.trim();
        const description = document.getElementById('courseDescription').value.trim();
        const category_id = document.getElementById('courseCategory').value;
        const level = document.getElementById('courseLevel').value;
        const duration = document.getElementById('courseDuration').value;
        const price = document.getElementById('coursePrice').value;
        const thumbnailInput = document.getElementById('courseThumbnail');

        // Validar campos obrigatórios
        if (!title || !description || !category_id || !level || !duration) {
            showAlert('Todos os campos são obrigatórios', 'danger');
            submitButton.disabled = false;
            return;
        }

        // Criar dados para envio
        const data = {
            title,
            description,
            category_id,
            level,
            duration,
            price: price || '0'
        };

        // Enviar requisição
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar curso');
        }

        const courseData = await response.json();
        console.log('Curso criado:', courseData);

        // Se houver thumbnail, fazer upload em seguida
        if (thumbnailInput.files && thumbnailInput.files[0]) {
            const file = thumbnailInput.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showAlert('A imagem deve ter no máximo 5MB', 'danger');
                return;
            }

            const formData = new FormData();
            formData.append('thumbnail', file);

            console.log('Enviando thumbnail para o curso:', courseData.course.id);
            const uploadResponse = await fetch(`/api/courses/${courseData.course.id}/thumbnail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                showAlert('Curso criado, mas houve um erro ao fazer upload da imagem', 'warning');
            }
        }

        // Fechar modal e recarregar cursos
        const modal = bootstrap.Modal.getInstance(document.getElementById('newCourseModal'));
        if (modal) {
            modal.hide();
        }
        e.target.reset();
        await loadCourses();
        
        showAlert('Curso criado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar curso:', error);
        showAlert(error.message || 'Erro ao criar curso. Tente novamente.', 'danger');
    } finally {
        submitButton.disabled = false;
    }
}

// Funções de ação dos cursos
async function editCourse(courseId) {
    try {
        // Buscar dados do curso
        const response = await fetch(`/api/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao carregar dados do curso');
        }

        const course = await response.json();

        // Preencher o formulário de edição
        document.getElementById('editCourseId').value = course.id;
        document.getElementById('editCourseTitle').value = course.title;
        document.getElementById('editCourseDescription').value = course.description;
        document.getElementById('editCourseCategory').value = course.category_id;
        document.getElementById('editCourseLevel').value = course.level;
        document.getElementById('editCourseDuration').value = course.duration;
        document.getElementById('editCoursePrice').value = course.price || 0;

        // Mostrar o modal de edição
        const editModal = new bootstrap.Modal(document.getElementById('editCourseModal'));
        editModal.show();
    } catch (error) {
        console.error('Erro ao carregar curso para edição:', error);
        showAlert(error.message || 'Erro ao carregar dados do curso', 'danger');
    }
}

async function publishCourse(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/publish`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao publicar curso');

        await loadCourses();
        showAlert('Curso publicado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao publicar curso:', error);
        showAlert('Erro ao publicar curso', 'danger');
    }
}

async function archiveCourse(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/archive`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao arquivar curso');

        await loadCourses();
        showAlert('Curso arquivado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao arquivar curso:', error);
        showAlert('Erro ao arquivar curso', 'danger');
    }
}

async function unarchiveCourse(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/unarchive`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao desarquivar curso');

        await loadCourses();
        showAlert('Curso desarquivado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao desarquivar curso:', error);
        showAlert('Erro ao desarquivar curso', 'danger');
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir curso');

        await loadCourses();
        showAlert('Curso excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir curso:', error);
        showAlert('Erro ao excluir curso', 'danger');
    }
}

// Função para salvar edição do curso
async function saveCourseEdit() {
    try {
        const courseId = document.getElementById('editCourseId').value;
        const data = {
            title: document.getElementById('editCourseTitle').value.trim(),
            description: document.getElementById('editCourseDescription').value.trim(),
            category_id: document.getElementById('editCourseCategory').value,
            level: document.getElementById('editCourseLevel').value,
            duration: document.getElementById('editCourseDuration').value,
            price: document.getElementById('editCoursePrice').value || '0'
        };

        // Validar campos obrigatórios
        if (!data.title || !data.description || !data.category_id || !data.level || !data.duration) {
            showAlert('Todos os campos são obrigatórios', 'danger');
            return;
        }

        // Enviar requisição de atualização
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar curso');
        }

        // Upload de nova thumbnail se houver
        const thumbnailInput = document.getElementById('editCourseThumbnail');
        if (thumbnailInput.files && thumbnailInput.files[0]) {
            const file = thumbnailInput.files[0];
            
            // Validar tamanho do arquivo
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Arquivo muito grande. Máximo 5MB');
            }

            // Validar tipo do arquivo
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Apenas imagens são permitidas (jpg, jpeg, png, gif)');
            }

            // Criar FormData e adicionar o arquivo
            const formData = new FormData();
            formData.append('thumbnail', file);

            console.log('Enviando thumbnail:', {
                courseId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            });

            try {
                const uploadResponse = await fetch(`/api/courses/${courseId}/thumbnail`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                const uploadResult = await uploadResponse.json();

                if (!uploadResponse.ok) {
                    throw new Error(uploadResult.error || 'Erro ao fazer upload da thumbnail');
                }

                console.log('Upload realizado com sucesso:', uploadResult);

                if (!uploadResult.thumbnail) {
                    throw new Error('Caminho da thumbnail não retornado pelo servidor');
                }
            } catch (error) {
                console.error('Erro no upload da thumbnail:', error);
                throw error;
            }
        }

        // Fechar modal e recarregar cursos
        const modal = bootstrap.Modal.getInstance(document.getElementById('editCourseModal'));
        modal.hide();
        await loadCourses();
        showAlert('Curso atualizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        showAlert(error.message || 'Erro ao atualizar curso', 'danger');
    }
}

// Função para mostrar alertas
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.role = 'alert';
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

// Função para gerenciar conteúdo do curso
function manageCourseContent(courseId) {
    window.location.href = `/course-content.html?id=${courseId}`;
}

// Função para ir para a página do curso
function goToCourse(courseId) {
    window.location.href = `/course/${courseId}`;
}

// Renderizar card do curso
function renderCourseCard(course) {
    const level = formatLevel(course.level);
    const status = formatStatus(course.status);
    return `
        <div class="col">
            <div class="card h-100 course-card">
                <img src="${course.thumbnail || '/images/default-course.jpg'}" class="card-img-top" alt="${course.title}">
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text text-muted">${course.description}</p>
                    <div class="course-info">
                        <span class="badge ${level.class}">${level.text}</span>
                        <span class="badge ${status.class}">${status.text}</span>
                        <span class="duration"><i class="bi bi-clock"></i> ${formatDuration(course.duration)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-outline-primary" onclick="goToCourse(${course.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" onclick="editCourse(${course.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteCourse(${course.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
} 