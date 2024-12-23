const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

class MailService {
    static async sendPasswordResetEmail(email, token) {
        const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${token}`;
        
        const mailOptions = {
            from: `"DevHub" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Recuperação de Senha - DevHub',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Recuperação de Senha</h2>
                    <p>Você solicitou a recuperação de senha da sua conta no DevHub.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #6366f1; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Redefinir Senha
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Se você não solicitou a recuperação de senha, ignore este email.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Este link expirará em 1 hora por motivos de segurança.
                    </p>
                    <hr style="border: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        DevHub - Plataforma de Cursos
                    </p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return false;
        }
    }
}

module.exports = MailService; 