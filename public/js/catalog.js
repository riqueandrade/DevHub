// Verificar autenticação
const verifyAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth.html';
        return false;
    }
    return true;
};

// Estado global
let state = {
    courses: [],
    categories: [],
    filters: {
        search: '',
        categories: [],
        levels: [],
        price: []
    },
    sort: 'relevance',
    pagination: {
        page: 1,
        limit: 9,
        total: 0
    }
};

// Funções auxiliares
const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
};

const formatLevel = (level) => {
    const levels = {
        'iniciante': { text: 'Iniciante', class: 'bg-success' },
        'intermediario': { text: 'Intermediário', class: 'bg-warning' },
        'avancado': { text: 'Avançado', class: 'bg-danger' }
    };
    return levels[level] || { text: level, class: 'bg-secondary' };
};

// Carregar dados do usuário
const loadUserData = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar_url || '/images/default-avatar.png';
    }
};

// Carregar categorias
const loadCategories = async () => {
    try {
        const response = await fetch('/api/catalog/categories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar categorias');

        state.categories = await response.json();
        renderCategories();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showError('Erro ao carregar categorias');
    }
};

// Carregar cursos
const loadCourses = async () => {
    try {
        const queryParams = new URLSearchParams({
            page: state.pagination.page,
            limit: state.pagination.limit,
            sort: state.sort,
            search: state.filters.search,
            categories: state.filters.categories.join(','),
            levels: state.filters.levels.join(','),
            price: state.filters.price.join(',')
        });

        // Buscar cursos e matrículas do usuário
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
            fetch(`/api/catalog/courses?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }),
            fetch('/api/courses/enrollments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
        ]);

        if (!coursesResponse.ok) throw new Error('Erro ao carregar cursos');
        if (!enrollmentsResponse.ok) throw new Error('Erro ao carregar matrículas');

        const data = await coursesResponse.json();
        const enrollments = await enrollmentsResponse.json();

        // Criar um Set com os IDs dos cursos matriculados
        const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));

        // Adicionar informação de matrícula aos cursos
        state.courses = data.courses.map(course => ({
            ...course,
            isEnrolled: enrolledCourseIds.has(course.id)
        }));
        state.pagination.total = data.total;

        renderCourses();
        renderPagination();
        updateCoursesCount();
    } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        showError('Erro ao carregar cursos');
    }
};

// Renderizar categorias
const renderCategories = () => {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = state.categories.map(category => `
        <button class="list-group-item ${state.filters.categories.includes(category.id) ? 'active' : ''}"
                data-category-id="${category.id}">
            <i class="bi ${category.icon}"></i> ${category.name}
        </button>
    `).join('');

    // Event listeners
    categoriesList.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
            const categoryId = item.dataset.categoryId;
            const index = state.filters.categories.indexOf(categoryId);
            
            if (index === -1) {
                state.filters.categories.push(categoryId);
            } else {
                state.filters.categories.splice(index, 1);
            }

            item.classList.toggle('active');
            state.pagination.page = 1;
            loadCourses();
        });
    });
};

// Renderizar cursos
const renderCourses = () => {
    const coursesList = document.getElementById('coursesList');
    
    if (state.courses.length === 0) {
        coursesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Nenhum curso encontrado com os filtros selecionados.
                </div>
            </div>
        `;
        return;
    }

    coursesList.innerHTML = state.courses.map(course => {
        const levelInfo = formatLevel(course.level);
        const duration = formatDuration(course.duration);
        const price = typeof course.price === 'number' ? course.price : 0;

        // Determinar o botão correto baseado no status de matrícula
        let actionButton;
        if (course.isEnrolled) {
            actionButton = `
                <a href="/course/${course.id}" class="btn btn-primary w-100">
                    <i class="bi bi-play-circle"></i> Continuar Curso
                </a>`;
        } else {
            actionButton = `
                <button class="btn btn-primary w-100" onclick="enrollCourse(${course.id})">
                    ${price > 0 ? `<i class="bi bi-cart"></i> Comprar por R$ ${price.toFixed(2)}` : '<i class="bi bi-play-circle"></i> Começar Agora'}
                </button>`;
        }

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="course-card">
                    <div class="course-header">
                        <img src="${course.thumbnail || '/images/course-placeholder.png'}" 
                             alt="${course.title}" 
                             class="course-thumbnail">
                        <span class="course-level badge ${levelInfo.class}">
                            ${levelInfo.text}
                        </span>
                    </div>
                    <div class="course-body">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description}</p>
                        <div class="course-meta">
                            <span class="duration">
                                <i class="bi bi-clock"></i> ${duration}
                            </span>
                            <span class="instructor">
                                <i class="bi bi-person"></i> ${course.instructor.name}
                            </span>
                        </div>
                    </div>
                    <div class="course-footer">
                        ${actionButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Renderizar paginação
const renderPagination = () => {
    const totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let pages = [];
    const currentPage = state.pagination.page;

    // Sempre mostrar primeira página
    pages.push(1);

    // Adicionar páginas do meio
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
    }

    // Sempre mostrar última página
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    // Adicionar reticências onde necessário
    const withEllipsis = [];
    for (let i = 0; i < pages.length; i++) {
        if (i > 0 && pages[i] - pages[i-1] > 1) {
            withEllipsis.push('...');
        }
        withEllipsis.push(pages[i]);
    }

    pagination.innerHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" data-page="${currentPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
        ${withEllipsis.map(page => `
            <li class="page-item ${page === '...' ? 'disabled' : ''} ${page === currentPage ? 'active' : ''}">
                <button class="page-link" ${page !== '...' ? `data-page="${page}"` : ''}>
                    ${page}
                </button>
            </li>
        `).join('')}
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" data-page="${currentPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;

    // Event listeners
    pagination.querySelectorAll('.page-link').forEach(button => {
        button.addEventListener('click', (e) => {
            const page = parseInt(e.target.closest('.page-link').dataset.page);
            if (!isNaN(page)) {
                state.pagination.page = page;
                loadCourses();
            }
        });
    });
};

// Atualizar contador de cursos
const updateCoursesCount = () => {
    document.getElementById('coursesCount').textContent = state.pagination.total;
};

// Mostrar erro
const showError = (message) => {
    const coursesList = document.getElementById('coursesList');
    coursesList.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
            </div>
        </div>
    `;
};

// Matricular em um curso
const enrollCourse = async (courseId) => {
    try {
        // Buscar informações do curso
        const course = state.courses.find(c => c.id === courseId);
        if (!course) {
            throw new Error('Curso não encontrado');
        }

        // Se o curso for pago, redirecionar para a página de pagamento
        if (course.price > 0) {
            window.location.href = `/payment.html?courseId=${courseId}`;
            return;
        }

        // Se for gratuito, fazer a matrícula direta
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ courseId })
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 400 && error.error === 'Você já está matriculado neste curso') {
                window.location.href = '/course.html?id=' + courseId;
                return;
            }
            throw new Error(error.error || 'Erro ao matricular no curso');
        }

        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Erro ao matricular:', error);
        alert(error.message);
    }
};

// Função para ir para a página do curso
function goToCourse(courseId) {
    console.log('Redirecionando para o curso:', courseId);
    window.location.href = `/course/${courseId}`;
}

// Renderizar card do curso
function renderCourseCard(course) {
    const level = formatLevel(course.level);
    return `
        <div class="col">
            <div class="card h-100 course-card">
                <img src="${course.thumbnail || '/images/default-course.jpg'}" class="card-img-top" alt="${course.title}">
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text text-muted">${course.description}</p>
                    <div class="course-info">
                        <span class="badge ${level.class}">${level.text}</span>
                        <span class="duration"><i class="bi bi-clock"></i> ${formatDuration(course.duration)}</span>
                    </div>
                    <div class="instructor-info">
                        <img src="${course.instructor?.avatar_url || '/images/default-avatar.png'}" alt="${course.instructor?.name}" class="instructor-avatar">
                        <span class="instructor-name">${course.instructor?.name}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="price">${course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}</span>
                        <button class="btn btn-primary" onclick="goToCourse(${course.id})">Ver Curso</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (!verifyAuth()) return;

    // Busca
    document.getElementById('searchButton').addEventListener('click', () => {
        state.filters.search = document.getElementById('searchInput').value;
        state.pagination.page = 1;
        loadCourses();
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            state.filters.search = e.target.value;
            state.pagination.page = 1;
            loadCourses();
        }
    });

    // Ordenação
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.pagination.page = 1;
        loadCourses();
    });

    // Filtros de nível
    ['levelBeginner', 'levelIntermediate', 'levelAdvanced'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            const level = e.target.value;
            const index = state.filters.levels.indexOf(level);
            
            if (e.target.checked && index === -1) {
                state.filters.levels.push(level);
            } else if (!e.target.checked && index !== -1) {
                state.filters.levels.splice(index, 1);
            }

            state.pagination.page = 1;
            loadCourses();
        });
    });

    // Filtros de preço
    ['priceFree', 'pricePaid'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            const price = e.target.value;
            const index = state.filters.price.indexOf(price);
            
            if (e.target.checked && index === -1) {
                state.filters.price.push(price);
            } else if (!e.target.checked && index !== -1) {
                state.filters.price.splice(index, 1);
            }

            state.pagination.page = 1;
            loadCourses();
        });
    });

    // Limpar filtros
    document.getElementById('clearFilters').addEventListener('click', () => {
        state.filters = {
            search: '',
            categories: [],
            levels: [],
            price: []
        };
        state.sort = 'relevance';
        state.pagination.page = 1;

        // Limpar UI
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = 'relevance';
        document.querySelectorAll('.form-check-input').forEach(input => input.checked = false);
        document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active'));

        loadCourses();
    });

    // Logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
    });

    // Inicialização
    loadUserData();
    loadCategories();
    loadCourses();
}); 