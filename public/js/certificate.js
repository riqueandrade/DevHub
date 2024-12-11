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
        const courseId = window.location.pathname.split('/certificate/')[1];
        
        if (!courseId) {
            throw new Error('ID do curso não encontrado');
        }

        // Carregar dados do certificado
        const response = await fetch(`/api/certificates/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar certificado');
        }

        const certificate = await response.json();

        // Preencher dados do certificado
        document.getElementById('studentName').textContent = certificate.student_name;
        document.getElementById('courseName').textContent = certificate.course_name;
        document.getElementById('courseDuration').textContent = Math.ceil(certificate.course_duration / 60);
        document.getElementById('completionDate').textContent = formatDate(certificate.completion_date);
        document.getElementById('instructorName').textContent = certificate.instructor_name;
        document.getElementById('instructorSignature').src = certificate.instructor_signature || '/images/default-signature.png';
        document.getElementById('certificateCode').textContent = certificate.code;

        // Configurar botões
        setupDownloadButton();
        setupShareButton();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao carregar certificado. Tente novamente mais tarde.', 'danger');
    }
});

// Função para baixar o certificado
function setupDownloadButton() {
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.addEventListener('click', async () => {
        try {
            const courseId = window.location.pathname.split('/certificate/')[1];
            const token = localStorage.getItem('token');

            // Mostrar indicador de carregamento
            downloadButton.disabled = true;
            downloadButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Gerando PDF...';

            // Fazer requisição para o backend
            const response = await fetch(`/api/certificates/${courseId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar certificado');
            }

            // Criar blob do PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Criar link temporário para download
            const a = document.createElement('a');
            a.href = url;
            a.download = `Certificado - ${document.getElementById('courseName').textContent}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Limpar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Erro ao baixar certificado:', error);
            showAlert('Erro ao baixar certificado. Tente novamente.', 'danger');
        } finally {
            // Restaurar botão
            downloadButton.disabled = false;
            downloadButton.innerHTML = '<i class="bi bi-download"></i> Baixar Certificado';
        }
    });
}

// Função para compartilhar o certificado
function setupShareButton() {
    const shareButton = document.getElementById('shareButton');
    shareButton.addEventListener('click', async () => {
        try {
            const courseId = window.location.pathname.split('/certificate/')[1];
            const shareUrl = `${window.location.origin}/verify/${courseId}`;
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Certificado DevHub',
                    text: 'Confira meu certificado da DevHub!',
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                showAlert('Link copiado para a área de transferência!', 'success');
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            showAlert('Erro ao compartilhar certificado.', 'danger');
        }
    });
}

// Função para formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Função para mostrar alertas
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