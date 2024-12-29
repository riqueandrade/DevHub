// Verificar autenticação
const verifyAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth.html';
        return false;
    }
    return true;
};

// Estado do onboarding
let state = {
    currentStep: 1,
    totalSteps: 3,
    userData: {
        role: '',
        name: '',
        bio: '',
        avatar: null,
        interests: [],
        notifications: {
            email: true,
            courseUpdates: true,
            promotional: false
        }
    }
};

// Carregar dados iniciais do usuário
const loadUserData = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User data from localStorage:', user);
    
    if (user) {
        state.userData.name = user.name || '';
        state.userData.avatar = user.avatar || user.avatar_url || null;

        // Atualizar campos do formulário
        const nameInput = document.getElementById('name');
        if (nameInput) {
            nameInput.value = state.userData.name;
        }

        // Atualizar preview do avatar
        const avatarPreview = document.getElementById('avatarPreview');
        const avatarPlaceholder = document.querySelector('.avatar-placeholder');

        if (avatarPreview && state.userData.avatar) {
            console.log('Atualizando avatar preview...');
            avatarPreview.src = state.userData.avatar;
            avatarPreview.style.display = 'block';
            avatarPreview.classList.remove('d-none');
            
            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = 'none';
            }

            console.log('Avatar atualizado:', {
                src: avatarPreview.src,
                display: avatarPreview.style.display,
                isHidden: avatarPreview.classList.contains('d-none')
            });
        }

        console.log('Dados do usuário carregados:', {
            name: state.userData.name,
            avatar: state.userData.avatar
        });
    }
};

// Carregar categorias/interesses
const loadInterests = async () => {
    try {
        const response = await fetch('/api/catalog/categories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar categorias');

        const categories = await response.json();
        const interestsGrid = document.getElementById('interestsGrid');

        interestsGrid.innerHTML = categories.map(category => `
            <div class="interest-item" data-id="${category.id}">
                <i class="bi ${category.icon}"></i>
                <div>${category.name}</div>
            </div>
        `).join('');

        // Event listeners para seleção de interesses
        interestsGrid.querySelectorAll('.interest-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
                const categoryId = item.dataset.id;
                const index = state.userData.interests.indexOf(categoryId);

                if (index === -1) {
                    state.userData.interests.push(categoryId);
                } else {
                    state.userData.interests.splice(index, 1);
                }
            });
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
};

// Atualizar progresso
const updateProgress = () => {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 < state.currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === state.currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('completed', 'active');
        }
    });
};

// Mostrar formulário atual
const showCurrentForm = () => {
    document.querySelectorAll('form').forEach(form => form.classList.remove('active'));
    const currentForm = document.querySelector(`#${getFormId(state.currentStep)}`);
    currentForm.classList.add('active');
};

// Obter ID do formulário baseado no passo
const getFormId = (step) => {
    const forms = {
        1: 'accountTypeForm',
        2: 'basicInfoForm',
        3: 'preferencesForm'
    };
    return forms[step];
};

// Navegar para o próximo passo
const nextStep = () => {
    // Se estiver no passo 2 (informações básicas), atualizar os dados
    if (state.currentStep === 2) {
        state.userData.name = document.getElementById('name').value;
        state.userData.bio = document.getElementById('bio').value;
    }

    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        updateProgress();
        showCurrentForm();
    }
};

// Navegar para o passo anterior
const prevStep = () => {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateProgress();
        showCurrentForm();
    }
};

// Upload de avatar
const handleAvatarUpload = async (file) => {
    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Erro ao fazer upload do avatar');

        const data = await response.json();
        state.userData.avatar = data.avatar_url;
        document.getElementById('avatarPreview').src = data.avatar_url;
    } catch (error) {
        console.error('Erro no upload do avatar:', error);
        alert('Erro ao fazer upload da imagem');
    }
};

// Salvar dados do onboarding
const saveOnboarding = async () => {
    try {
        const response = await fetch('/api/user/onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(state.userData)
        });

        if (!response.ok) throw new Error('Erro ao salvar dados');

        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Erro ao salvar onboarding:', error);
        alert('Erro ao salvar suas informações');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!verifyAuth()) return;

    loadUserData();
    loadInterests();

    // Seleção do tipo de conta
    document.querySelectorAll('.account-type-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.account-type-option').forEach(opt =>
                opt.classList.remove('selected'));
            option.classList.add('selected');
            state.userData.role = option.dataset.role;
            document.querySelector('#accountTypeForm .next-step').disabled = false;
        });
    });

    // Upload de avatar
    document.getElementById('avatarInput').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleAvatarUpload(e.target.files[0]);
        }
    });

    // Atualizar bio quando o usuário digitar
    const bioInput = document.getElementById('bio');
    if (bioInput) {
        bioInput.addEventListener('input', (e) => {
            state.userData.bio = e.target.value;
        });
    }

    // Navegação entre passos
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', nextStep);
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', prevStep);
    });

    // Submissão do formulário final
    document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Atualizar configurações de notificação
        state.userData.notifications = {
            email: document.getElementById('emailNotifications').checked,
            courseUpdates: document.getElementById('courseUpdates').checked,
            promotional: document.getElementById('promotionalEmails').checked
        };

        await saveOnboarding();
    });

    updateProgress();
}); 