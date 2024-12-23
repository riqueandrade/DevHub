const nodemailer = require('nodemailer');

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
    }

    async sendPasswordResetEmail(email, resetToken) {
        try {
            const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: process.env.MAIL_FROM,
                to: email,
                subject: 'Recuperação de Senha - DevHub',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1B1464;">Recuperação de Senha</h2>
                        <p>Você solicitou a recuperação de senha da sua conta no DevHub.</p>
                        <p>Clique no botão abaixo para redefinir sua senha:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #1B1464; 
                                      color: white; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 4px;
                                      display: inline-block;">
                                Redefinir Senha
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            Se você não solicitou a recuperação de senha, ignore este email.
                        </p>
                        <p style="color: #666; font-size: 14px;">
                            Este link expira em 1 hora.
                        </p>
                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            DevHub - Plataforma de Ensino Online
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email de recuperação:', error);
            return false;
        }
    }

    async sendWelcomeEmail(email, name) {
        try {
            const mailOptions = {
                from: process.env.MAIL_FROM,
                to: email,
                subject: 'Bem-vindo ao DevHub!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1B1464;">Bem-vindo ao DevHub!</h2>
                        <p>Olá ${name},</p>
                        <p>Estamos muito felizes em ter você conosco! O DevHub é a sua plataforma para aprender e evoluir na área de desenvolvimento.</p>
                        <h3 style="color: #0652DD;">Próximos Passos:</h3>
                        <ul>
                            <li>Complete seu perfil</li>
                            <li>Explore nossos cursos</li>
                            <li>Comece sua jornada de aprendizado</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL}/dashboard" 
                               style="background-color: #1B1464; 
                                      color: white; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 4px;
                                      display: inline-block;">
                                Acessar Plataforma
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            Se tiver alguma dúvida, nossa equipe de suporte está sempre pronta para ajudar.
                        </p>
                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            DevHub - Plataforma de Ensino Online
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email de boas-vindas:', error);
            return false;
        }
    }

    async sendCertificateEmail(email, name, courseName, certificateUrl) {
        try {
            const mailOptions = {
                from: process.env.MAIL_FROM,
                to: email,
                subject: `Seu Certificado do Curso ${courseName} - DevHub`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1B1464;">Parabéns, ${name}!</h2>
                        <p>Você concluiu com sucesso o curso "${courseName}".</p>
                        <p>Seu certificado está disponível para download.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL}${certificateUrl}" 
                               style="background-color: #1B1464; 
                                      color: white; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 4px;
                                      display: inline-block;">
                                Baixar Certificado
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            Continue sua jornada de aprendizado com nossos outros cursos!
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.APP_URL}/courses" 
                               style="color: #0652DD; 
                                      text-decoration: none;">
                                Ver Mais Cursos
                            </a>
                        </div>
                        <hr style="border: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            DevHub - Plataforma de Ensino Online
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email do certificado:', error);
            return false;
        }
    }
}

module.exports = new MailService(); 