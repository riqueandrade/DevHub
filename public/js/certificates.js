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
    certificates: [],
    filters: {
        search: '',
        sort: 'date_desc'
    },
    pagination: {
        page: 1,
        limit: 9,
        total: 0
    }
};

// Funções auxiliares
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Mostrar mensagem de erro
const showError = (message) => {
    const certificatesList = document.getElementById('certificatesList');
    certificatesList.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                ${message}
            </div>
        </div>
    `;
};

// Carregar dados do usuário
const loadUserData = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').src = user.avatar_url || '/images/default-avatar.png';
    }
};

// Carregar certificados
const loadCertificates = async () => {
    try {
        const queryParams = new URLSearchParams({
            page: state.pagination.page,
            limit: state.pagination.limit,
            sort: state.filters.sort,
            search: state.filters.search
        });

        const response = await fetch(`/api/certificates?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar certificados');

        const data = await response.json();
        state.certificates = data.certificates;
        state.pagination.total = data.total;

        renderCertificates();
        renderPagination();
    } catch (error) {
        console.error('Erro ao carregar certificados:', error);
        showError('Erro ao carregar certificados');
    }
};

// Renderizar certificados
const renderCertificates = () => {
    const certificatesList = document.getElementById('certificatesList');
    
    if (state.certificates.length === 0) {
        certificatesList.innerHTML = `
            <div class="col-12">
                <div class="placeholder-message">
                    <i class="bi bi-award"></i>
                    <p>Nenhum certificado encontrado</p>
                </div>
            </div>
        `;
        return;
    }

    certificatesList.innerHTML = state.certificates.map(certificate => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="certificate-card">
                <div class="certificate-preview">
                    <img src="${certificate.preview_url || '/images/certificate-placeholder.png'}" 
                         alt="Certificado ${certificate.course.title}">
                </div>
                <div class="certificate-body">
                    <h3 class="certificate-title">${certificate.course.title}</h3>
                    <div class="certificate-meta">
                        <span>
                            <i class="bi bi-calendar"></i>
                            ${formatDate(certificate.created_at)}
                        </span>
                        <span>
                            <i class="bi bi-person"></i>
                            ${certificate.course.instructor.name}
                        </span>
                    </div>
                    <div class="certificate-actions">
                        <button class="btn btn-primary w-100" onclick="viewCertificate(${certificate.id})">
                            <i class="bi bi-eye"></i> Visualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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
                loadCertificates();
            }
        });
    });
};

// Visualizar certificado
const viewCertificate = async (certificateId) => {
    try {
        const response = await fetch(`/api/certificates/${certificateId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar certificado');

        const certificate = await response.json();
        
        // Atualizar modal
        document.getElementById('certificatePreview').src = certificate.preview_url;
        
        // Configurar botão de download
        const downloadButton = document.getElementById('downloadButton');
        downloadButton.onclick = () => window.open(certificate.pdf_url, '_blank');

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('certificateModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao visualizar certificado:', error);
        showError('Erro ao visualizar certificado');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!verifyAuth()) return;

    loadUserData();
    loadCertificates();

    // Busca
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    const handleSearch = () => {
        state.filters.search = searchInput.value;
        state.pagination.page = 1;
        loadCertificates();
    };

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    searchButton.addEventListener('click', handleSearch);

    // Ordenação
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        state.pagination.page = 1;
        loadCertificates();
    });

    // Logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
    });
}); 