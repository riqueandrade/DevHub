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

        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        const price = parseFloat(urlParams.get('price'));

        if (!courseId || !price) {
            window.location.replace('/dashboard.html');
            return;
        }

        // Carregar detalhes do curso
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!courseResponse.ok) {
            throw new Error('Erro ao carregar dados do curso');
        }

        const course = await courseResponse.json();

        // Preencher detalhes do curso
        document.getElementById('courseInfo').innerHTML = `
            <div class="d-flex align-items-start">
                <img src="${course.thumbnail || '/images/course-placeholder.png'}" alt="${course.title}" class="course-thumbnail">
                <div class="ms-3">
                    <h4>${course.title}</h4>
                    <p class="mb-1">${course.description}</p>
                    <div class="course-meta">
                        <span class="badge bg-primary">${formatLevel(course.level)}</span>
                        <span class="ms-2"><i class="bi bi-clock"></i> ${formatDuration(course.duration)}</span>
                    </div>
                </div>
            </div>
        `;

        // Preencher valores
        document.getElementById('coursePrice').textContent = formatPrice(price);
        document.getElementById('totalPrice').textContent = formatPrice(price);

        // Preencher opções de parcelamento
        const installmentsSelect = document.getElementById('installments');
        const maxInstallments = price >= 100 ? 12 : 6;

        for (let i = 1; i <= maxInstallments; i++) {
            const installmentPrice = price / i;
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}x de ${formatPrice(installmentPrice)}${i === 1 ? ' à vista' : ''}`;
            installmentsSelect.appendChild(option);
        }

        // Handler do método de pagamento
        const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethodInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const creditCardFields = document.getElementById('creditCardFields');
                const pixField = document.getElementById('pixField');

                if (e.target.value === 'credit') {
                    creditCardFields.style.display = 'block';
                    pixField.style.display = 'none';
                } else {
                    creditCardFields.style.display = 'none';
                    pixField.style.display = 'block';
                    generatePixCode(courseId, price);
                }
            });
        });

        // Handler do formulário de pagamento
        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

            try {
                if (paymentMethod === 'credit') {
                    await processCreditCardPayment(courseId, price);
                } else {
                    await processPixPayment(courseId, price);
                }
            } catch (error) {
                showAlert(error.message || 'Erro ao processar pagamento', 'danger');
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao carregar dados. Tente novamente mais tarde.', 'danger');
    }
});

// Função para processar pagamento com cartão
async function processCreditCardPayment(courseId, price) {
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    const installments = document.getElementById('installments').value;

    // Validar campos
    if (!cardNumber || !expiryDate || !cvv || !cardName) {
        throw new Error('Preencha todos os campos do cartão');
    }

    // Simular processamento
    showAlert('Processando pagamento...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular sucesso (aqui você implementaria a integração real com gateway de pagamento)
    await enrollInCourse(courseId);
}

// Função para processar pagamento com PIX
async function processPixPayment(courseId, price) {
    // Simular processamento
    showAlert('Verificando pagamento PIX...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular sucesso (aqui você implementaria a verificação real do pagamento)
    await enrollInCourse(courseId);
}

// Função para gerar código PIX
async function generatePixCode(courseId, price) {
    // Simular geração de código PIX
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${courseId}${Date.now()}520400005303986540${price.toFixed(2)}5802BR5913DevHub Cursos6009Sao Paulo62070503***63046123`;

    document.querySelector('.pix-code').textContent = pixCode;
    // Aqui você implementaria a geração real do QR Code
}

// Função para copiar código PIX
function copyPixCode() {
    const pixCode = document.querySelector('.pix-code').textContent;
    navigator.clipboard.writeText(pixCode);
    showAlert('Código PIX copiado!', 'success');
}

// Função para matricular no curso
async function enrollInCourse(courseId) {
    try {
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao matricular no curso');
        }

        showAlert('Pagamento processado com sucesso! Redirecionando...', 'success');

        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = `/course/${courseId}`;
        }, 2000);
    } catch (error) {
        throw new Error('Erro ao matricular no curso: ' + error.message);
    }
}

// Funções auxiliares
function formatPrice(price) {
    return `R$ ${price.toFixed(2)}`;
}

function formatLevel(level) {
    const levels = {
        'iniciante': 'Iniciante',
        'intermediario': 'Intermediário',
        'avancado': 'Avançado'
    };
    return levels[level] || level;
}

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