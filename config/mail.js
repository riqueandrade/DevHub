const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

class MailService {
    static async sendPasswordResetEmail(email, token) {
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password.html?token=${token}`;
        
        console.log('Enviando email de reset de senha:', {
            to: email,
            resetLink,
            baseUrl: process.env.APP_URL
        });

        const mailOptions = {
            from: `"DevHub" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Recuperação de Senha - DevHub',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f9fc; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                    <!-- Cabeçalho -->
                                    <tr>
                                        <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 8px 8px 0 0;">
                                            <img src="${baseUrl}/images/logo-white.svg" alt="DevHub Logo" style="width: 150px; height: auto;">
                                        </td>
                                    </tr>
                                    
                                    <!-- Conteúdo -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Recuperação de Senha</h1>
                                            
                                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                                                Olá,
                                            </p>
                                            
                                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                                                Recebemos uma solicitação para redefinir a senha da sua conta no DevHub. Se você não fez esta solicitação, pode ignorar este email com segurança.
                                            </p>
                                            
                                            <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin: 0 0 30px;">
                                                Para redefinir sua senha, clique no botão abaixo:
                                            </p>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${resetLink}" 
                                                           style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                                                                  color: #ffffff;
                                                                  text-decoration: none;
                                                                  padding: 12px 30px;
                                                                  border-radius: 6px;
                                                                  font-weight: 600;
                                                                  display: inline-block;
                                                                  text-transform: uppercase;
                                                                  font-size: 14px;
                                                                  letter-spacing: 0.5px;
                                                                  transition: all 0.3s ease;">
                                                            Redefinir Senha
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #4a5568; font-size: 14px; line-height: 24px; margin: 0 0 10px;">
                                                Por questões de segurança, este link expirará em 1 hora.
                                            </p>
                                            
                                            <p style="color: #4a5568; font-size: 14px; line-height: 24px; margin: 0;">
                                                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                                            </p>
                                            
                                            <p style="color: #6366f1; font-size: 14px; line-height: 24px; margin: 10px 0 0; word-break: break-all;">
                                                ${resetLink}
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Rodapé -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td align="center" style="padding-bottom: 20px;">
                                                        <img src="${baseUrl}/images/logo.svg" alt="DevHub" style="width: 100px; height: auto;">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="color: #718096; font-size: 14px; line-height: 21px;">
                                                        DevHub - Plataforma de Cursos
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding-top: 20px;">
                                                        <a href="${baseUrl}" style="color: #6366f1; text-decoration: none; font-size: 14px;">Visite nosso site</a>
                                                        <span style="color: #718096; padding: 0 10px;">|</span>
                                                        <a href="${baseUrl}/support" style="color: #6366f1; text-decoration: none; font-size: 14px;">Suporte</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Informações Legais -->
                                <table border="0" cellpadding="0" cellspacing="0" width="600">
                                    <tr>
                                        <td align="center" style="padding: 30px 0 0;">
                                            <p style="color: #718096; font-size: 12px; line-height: 18px; margin: 0;">
                                                Este é um email automático. Por favor, não responda.
                                            </p>
                                            <p style="color: #718096; font-size: 12px; line-height: 18px; margin: 10px 0 0;">
                                                &copy; ${new Date().getFullYear()} DevHub. Todos os direitos reservados.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email enviado:', info.response);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return false;
        }
    }
}

module.exports = MailService; 