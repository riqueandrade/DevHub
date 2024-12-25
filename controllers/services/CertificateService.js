const { Course, User, Enrollment } = require('../../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');

class CertificateService {
    async getCertificateData(userId, courseId) {
        const enrollment = await this.findEnrollment(userId, courseId);
        if (!enrollment) {
            throw new Error('Certificado não encontrado');
        }

        const student = await User.findByPk(userId);
        const certificateCode = `${courseId}-${userId}-${Date.now()}`;

        return {
            code: certificateCode,
            student_name: student.name,
            course_name: enrollment.course.title,
            course_duration: enrollment.course.duration,
            completion_date: enrollment.updated_at,
            instructor_name: enrollment.course.instructor.name,
            instructor_signature: enrollment.course.instructor.avatar_url
        };
    }

    async findEnrollment(userId, courseId) {
        return await Enrollment.findOne({
            where: {
                user_id: userId,
                course_id: courseId,
                status: 'concluido'
            },
            include: [{
                model: Course,
                as: 'course',
                include: [{
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }]
            }]
        });
    }

    async generatePDF(enrollment, student, doc) {
        // Configurações do documento
        const primaryColor = '#2563eb';
        const accentColor = '#7c3aed';
        const bgColor = '#1e293b';

        // Adicionar fundo
        this.addBackground(doc, bgColor);
        
        // Adicionar decorações
        this.addDecorations(doc);
        
        // Adicionar conteúdo
        this.addContent(doc, student, enrollment, accentColor);
        
        // Adicionar assinaturas
        this.addSignatures(doc, enrollment);

        // Finalizar documento
        doc.end();
    }

    addBackground(doc, bgColor) {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgColor);
    }

    addDecorations(doc) {
        // Padrão de fundo
        doc.save();
        doc.strokeColor('white');
        doc.fillColor('white');
        doc.opacity(0.03);

        // Linhas diagonais
        const spacing = 40;
        for (let i = -doc.page.height; i < doc.page.width + doc.page.height; i += spacing) {
            doc.moveTo(i, 0)
               .lineTo(i + doc.page.height, doc.page.height)
               .stroke();
        }

        // Círculos decorativos
        const cornerRadius = 200;
        doc.circle(0, 0, cornerRadius).fill();
        doc.circle(doc.page.width, 0, cornerRadius).fill();
        doc.circle(0, doc.page.height, cornerRadius).fill();
        doc.circle(doc.page.width, doc.page.height, cornerRadius).fill();

        doc.restore();

        // Bordas
        this.addBorders(doc);
    }

    addBorders(doc) {
        const margin = 40;
        const borderSpacing = 5;

        // Borda externa
        doc.roundedRect(margin, margin, doc.page.width - (2 * margin), doc.page.height - (2 * margin), 16)
           .strokeOpacity(0.2)
           .strokeColor('white')
           .lineWidth(2)
           .stroke();

        // Borda interna
        doc.roundedRect(margin + borderSpacing, margin + borderSpacing, 
                       doc.page.width - (2 * (margin + borderSpacing)), 
                       doc.page.height - (2 * (margin + borderSpacing)), 12)
           .strokeOpacity(0.1)
           .stroke();
    }

    addContent(doc, student, enrollment, accentColor) {
        // Título
        doc.font('Helvetica-Bold')
           .fontSize(48)
           .fillColor('white')
           .opacity(0.9)
           .text('CERTIFICADO DE CONCLUSÃO', 0, 120, { align: 'center' });

        // Ornamento do título
        this.addTitleOrnament(doc);

        // Conteúdo principal
        const centerY = doc.page.height / 2 - 80;

        doc.font('Helvetica')
           .fontSize(16)
           .fillColor('white')
           .opacity(0.8)
           .text('Certificamos que', 0, centerY, { align: 'center' });

        // Nome do aluno
        doc.font('Helvetica-Bold')
           .fontSize(32)
           .opacity(1)
           .fillColor('white')
           .text(student.name.toUpperCase(), 0, centerY + 40, { align: 'center' });

        // Descrição e nome do curso
        doc.font('Helvetica')
           .fontSize(16)
           .opacity(0.8)
           .text('concluiu com sucesso o curso', 0, centerY + 100, { align: 'center' });

        doc.font('Helvetica-Bold')
           .fontSize(28)
           .fillColor(accentColor)
           .text(enrollment.course.title.toUpperCase(), 0, centerY + 130, { align: 'center' });

        // Informações adicionais
        const infoY = centerY + 190;
        doc.font('Helvetica')
           .fontSize(14)
           .fillColor('white')
           .opacity(0.8)
           .text(`Carga Horária: ${Math.ceil(enrollment.course.duration / 60)} horas`, 0, infoY, { align: 'center' })
           .text(`Concluído em: ${new Date(enrollment.updated_at).toLocaleDateString('pt-BR')}`, 0, infoY + 25, { align: 'center' });
    }

    addTitleOrnament(doc) {
        const centerX = doc.page.width / 2;
        const ornamentY = 190;
        const ornamentWidth = 200;

        doc.save();
        doc.opacity(0.2);
        
        // Linha central
        doc.moveTo(centerX - ornamentWidth/2, ornamentY)
           .lineTo(centerX + ornamentWidth/2, ornamentY)
           .lineWidth(2)
           .stroke();

        // Detalhes decorativos
        const detailSize = 10;
        doc.circle(centerX - ornamentWidth/2, ornamentY, detailSize).fill();
        doc.circle(centerX + ornamentWidth/2, ornamentY, detailSize).fill();
        doc.circle(centerX, ornamentY, detailSize).fill();

        doc.restore();
    }

    addSignatures(doc, enrollment) {
        const signatureY = doc.page.height - 180;
        const signatureWidth = 200;
        const gap = 150;
        const signLineY = signatureY + 40;

        // Nome do instrutor
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .opacity(1)
           .fillColor('white')
           .text(enrollment.course.instructor.name, doc.page.width / 2 - signatureWidth - gap, signatureY, { 
               width: signatureWidth,
               align: 'center'
           });

        // Linha e ornamento
        doc.save();
        doc.opacity(0.2);
        doc.moveTo(doc.page.width/2 - signatureWidth - gap, signLineY)
           .lineTo(doc.page.width/2 - gap, signLineY)
           .lineWidth(1)
           .stroke();
        doc.circle(doc.page.width/2 - signatureWidth/2 - gap, signLineY, 4).fill();
        doc.restore();

        // Título do instrutor
        doc.font('Helvetica')
           .fontSize(12)
           .opacity(0.8)
           .text('Instrutor', doc.page.width/2 - signatureWidth - gap, signLineY + 10, {
               width: signatureWidth,
               align: 'center'
           });
    }
}

module.exports = new CertificateService(); 