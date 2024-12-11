const { Course, User, Enrollment } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Obter certificado
exports.getCertificate = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        // Buscar matrícula do curso
        const enrollment = await Enrollment.findOne({
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

        if (!enrollment) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }

        // Buscar dados do aluno
        const student = await User.findByPk(userId);

        // Gerar código único do certificado
        const certificateCode = `${courseId}-${userId}-${Date.now()}`;

        // Formatar dados do certificado
        const certificate = {
            code: certificateCode,
            student_name: student.name,
            course_name: enrollment.course.title,
            course_duration: enrollment.course.duration,
            completion_date: enrollment.updated_at,
            instructor_name: enrollment.course.instructor.name,
            instructor_signature: enrollment.course.instructor.avatar_url
        };

        res.json(certificate);
    } catch (error) {
        console.error('Erro ao buscar certificado:', error);
        res.status(500).json({ error: 'Erro ao buscar certificado' });
    }
};

// Download do certificado
exports.downloadCertificate = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        // Buscar matrícula e dados do curso
        const enrollment = await Enrollment.findOne({
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

        if (!enrollment) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }

        // Buscar dados do aluno
        const student = await User.findByPk(userId);

        // Criar PDF
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
            margin: 0
        });

        // Configurar headers para download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificado - ${enrollment.course.title}.pdf`);

        // Pipe PDF para a resposta
        doc.pipe(res);

        // Definir cores
        const primaryColor = '#2563eb';
        const accentColor = '#7c3aed';
        const bgColor = '#1e293b';

        // Adicionar fundo
        doc.rect(0, 0, doc.page.width, doc.page.height)
           .fill(bgColor);

        // Adicionar padrão de fundo elegante
        doc.save();
        doc.strokeColor('white');
        doc.fillColor('white');
        doc.opacity(0.03);

        // Padrão de linhas diagonais suaves
        const spacing = 40;
        for (let i = -doc.page.height; i < doc.page.width + doc.page.height; i += spacing) {
            doc.moveTo(i, 0)
               .lineTo(i + doc.page.height, doc.page.height)
               .stroke();
        }

        // Círculos decorativos nos cantos
        const cornerRadius = 200;
        doc.circle(0, 0, cornerRadius).fill();
        doc.circle(doc.page.width, 0, cornerRadius).fill();
        doc.circle(0, doc.page.height, cornerRadius).fill();
        doc.circle(doc.page.width, doc.page.height, cornerRadius).fill();

        doc.restore();

        // Container do certificado com borda dupla
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

        // Título principal
        doc.font('Helvetica-Bold')
           .fontSize(48)
           .fillColor('white')
           .opacity(0.9)
           .text('CERTIFICADO DE CONCLUSÃO', 0, 120, { align: 'center' });

        // Ornamento abaixo do título
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

        // Texto principal
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

        // Descrição do curso
        doc.font('Helvetica')
           .fontSize(16)
           .opacity(0.8)
           .text('concluiu com sucesso o curso', 0, centerY + 100, { align: 'center' });

        // Nome do curso
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

        // Assinaturas
        const signatureY = doc.page.height - 180;
        const signatureWidth = 200;
        const gap = 150;

        // Linha da assinatura do instrutor com ornamento
        const signLineY = signatureY + 40;
        
        // Nome do instrutor (acima da linha)
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .opacity(1)
           .fillColor('white')
           .text(enrollment.course.instructor.name, doc.page.width / 2 - signatureWidth - gap, signatureY, { 
               width: signatureWidth,
               align: 'center'
           });

        // Linha e ornamento do instrutor
        doc.save();
        doc.opacity(0.2);
        doc.moveTo(doc.page.width/2 - signatureWidth - gap, signLineY)
           .lineTo(doc.page.width/2 - gap, signLineY)
           .lineWidth(1)
           .stroke();
        doc.circle(doc.page.width/2 - signatureWidth/2 - gap, signLineY, 4).fill();
        doc.restore();

        // Título do instrutor (abaixo da linha)
        doc.font('Helvetica')
           .fontSize(12)
           .opacity(0.8)
           .text('Instrutor', doc.page.width / 2 - signatureWidth - gap, signLineY + 15, { 
               width: signatureWidth,
               align: 'center'
           });

        // Nome da plataforma
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .opacity(1)
           .fillColor('white')
           .text('DevHub', doc.page.width / 2 + gap, signatureY, { 
               width: signatureWidth,
               align: 'center'
           });

        // Linha e ornamento da plataforma
        doc.save();
        doc.opacity(0.2);
        doc.moveTo(doc.page.width/2 + gap, signLineY)
           .lineTo(doc.page.width/2 + signatureWidth + gap, signLineY)
           .lineWidth(1)
           .stroke();
        doc.circle(doc.page.width/2 + signatureWidth/2 + gap, signLineY, 4).fill();
        doc.restore();

        // Título da plataforma (abaixo da linha)
        doc.font('Helvetica')
           .fontSize(12)
           .opacity(0.8)
           .text('Plataforma', doc.page.width / 2 + gap, signLineY + 15, { 
               width: signatureWidth,
               align: 'center'
           })
        // Código do certificado com ornamento
        doc.save();
        doc.opacity(0.8);
        doc.fontSize(10);
        
        const codeText = `Código de Verificação: ${courseId}-${userId}-${Date.now()}`;
        const codeWidth = doc.widthOfString(codeText);
        const codeX = 50;
        const codeY = doc.page.height - 50;

        // Linha decorativa antes do código
        doc.moveTo(codeX - 20, codeY + 5)
           .lineTo(codeX - 5, codeY + 5)
           .lineWidth(1)
           .stroke();

        // Texto do código
        doc.text(codeText, codeX, codeY);

        // Linha decorativa depois do código
        doc.moveTo(codeX + codeWidth + 5, codeY + 5)
           .lineTo(codeX + codeWidth + 20, codeY + 5)
           .stroke();

        doc.restore();

        // Finalizar PDF
        doc.end();

    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erro ao gerar certificado' });
        }
    }
};

// Verificar certificado
exports.verifyCertificate = async (req, res) => {
    try {
        const { code } = req.params;

        // Extrair IDs do código
        const [courseId, userId] = code.split('-');

        // Buscar matrícula
        const enrollment = await Enrollment.findOne({
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
                    attributes: ['id', 'name']
                }]
            }]
        });

        if (!enrollment) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }

        // Buscar dados do aluno
        const student = await User.findByPk(userId);

        // Formatar dados do certificado
        const certificate = {
            code,
            student_name: student.name,
            course_name: enrollment.course.title,
            course_duration: enrollment.course.duration,
            completion_date: enrollment.updated_at,
            instructor_name: enrollment.course.instructor.name
        };

        res.json(certificate);
    } catch (error) {
        console.error('Erro ao verificar certificado:', error);
        res.status(500).json({ error: 'Erro ao verificar certificado' });
    }
}; 