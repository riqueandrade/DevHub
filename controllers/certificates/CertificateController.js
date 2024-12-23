const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const Certificate = require('../../models/Certificate');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Enrollment = require('../../models/Enrollment');

class CertificateController {
    async getCertificates(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 9;
            const search = req.query.search || '';
            const sort = req.query.sort || 'date_desc';

            // Configurar ordenação
            let order = [];
            switch (sort) {
                case 'date_asc':
                    order.push(['issued_at', 'ASC']);
                    break;
                case 'date_desc':
                    order.push(['issued_at', 'DESC']);
                    break;
                case 'name_asc':
                    order.push([{ model: Course, as: 'course' }, 'title', 'ASC']);
                    break;
                case 'name_desc':
                    order.push([{ model: Course, as: 'course' }, 'title', 'DESC']);
                    break;
                default:
                    order.push(['issued_at', 'DESC']);
            }

            // Configurar busca
            const whereClause = {
                user_id: userId
            };

            const courseWhereClause = {};
            if (search) {
                courseWhereClause.title = {
                    [Op.like]: `%${search}%`
                };
            }

            // Buscar certificados com paginação
            const { count, rows: certificates } = await Certificate.findAndCountAll({
                where: whereClause,
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['title'],
                    where: courseWhereClause
                }],
                order,
                limit,
                offset: (page - 1) * limit
            });

            // Formatar certificados
            const formattedCertificates = certificates.map(cert => ({
                id: cert.id,
                course_title: cert.course?.title || 'Curso não encontrado',
                certificate_url: `/api/user/certificates/${cert.id}/download`,
                issued_at: cert.issued_at
            }));

            // Calcular total de páginas
            const totalPages = Math.ceil(count / limit);

            res.json({
                certificates: formattedCertificates,
                pagination: {
                    total: count,
                    page,
                    limit,
                    total_pages: totalPages
                }
            });
        } catch (error) {
            console.error('Erro ao buscar certificados:', error);
            res.status(500).json({ error: 'Erro ao buscar certificados' });
        }
    }

    async downloadCertificate(req, res) {
        try {
            const userId = req.user.id;
            const certificateId = req.params.id;

            const certificate = await Certificate.findOne({
                where: { 
                    id: certificateId,
                    user_id: userId
                },
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['title', 'duration', 'level']
                }, {
                    model: User,
                    as: 'student',
                    attributes: ['name']
                }]
            });

            if (!certificate) {
                return res.status(404).json({ error: 'Certificado não encontrado' });
            }

            // Buscar informações da matrícula
            const enrollment = await Enrollment.findOne({
                where: {
                    user_id: userId,
                    course_id: certificate.course_id
                }
            });

            if (!enrollment) {
                return res.status(404).json({ error: 'Matrícula não encontrada' });
            }

            // Criar diretório de certificados se não existir
            const certificatesDir = path.join(__dirname, '..', '..', 'public', 'certificates');
            if (!fs.existsSync(certificatesDir)) {
                fs.mkdirSync(certificatesDir, { recursive: true });
            }

            // Gerar certificado se não existir
            const filePath = path.join(certificatesDir, `certificate_${certificate.id}.pdf`);
            
            // Criar um novo documento PDF
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margin: 0
            });

            // Pipe o PDF para o arquivo
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Definir cores
            const primaryColor = '#1B1464';    // Azul escuro
            const accentColor = '#0652DD';     // Azul médio
            const goldColor = '#FFD700';       // Dourado
            const textColor = '#2C2C2C';       // Quase preto

            // Adicionar fundo branco
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill('#FFFFFF');

            // Adicionar borda dourada dupla
            const borderWidth = 15;
            const innerBorderWidth = 10;
            
            doc.rect(borderWidth, borderWidth, doc.page.width - (2 * borderWidth), doc.page.height - (2 * borderWidth))
               .lineWidth(3)
               .stroke(goldColor);

            doc.rect(borderWidth + innerBorderWidth, borderWidth + innerBorderWidth, 
                    doc.page.width - (2 * (borderWidth + innerBorderWidth)), 
                    doc.page.height - (2 * (borderWidth + innerBorderWidth)))
               .lineWidth(1)
               .stroke(goldColor);

            // Adicionar elementos decorativos nos cantos
            const cornerSize = 30;
            // Superior esquerdo
            doc.moveTo(borderWidth, borderWidth + cornerSize)
               .lineTo(borderWidth, borderWidth)
               .lineTo(borderWidth + cornerSize, borderWidth)
               .lineWidth(3)
               .stroke(goldColor);

            // Superior direito
            doc.moveTo(doc.page.width - borderWidth - cornerSize, borderWidth)
               .lineTo(doc.page.width - borderWidth, borderWidth)
               .lineTo(doc.page.width - borderWidth, borderWidth + cornerSize)
               .stroke(goldColor);

            // Inferior esquerdo
            doc.moveTo(borderWidth, doc.page.height - borderWidth - cornerSize)
               .lineTo(borderWidth, doc.page.height - borderWidth)
               .lineTo(borderWidth + cornerSize, doc.page.height - borderWidth)
               .stroke(goldColor);

            // Inferior direito
            doc.moveTo(doc.page.width - borderWidth - cornerSize, doc.page.height - borderWidth)
               .lineTo(doc.page.width - borderWidth, doc.page.height - borderWidth)
               .lineTo(doc.page.width - borderWidth, doc.page.height - borderWidth - cornerSize)
               .stroke(goldColor);

            // Adicionar logo DevHub
            const logoPath = path.join(__dirname, '..', '..', 'public', 'images', 'logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, doc.page.width / 2 - 50, 40, { width: 100 });
            } else {
                doc.font('Helvetica-Bold')
                   .fontSize(30)
                   .fillColor(primaryColor)
                   .text('DevHub', 0, 40, {
                       width: doc.page.width,
                       align: 'center',
                       paragraphGap: 0,
                       indent: 0,
                       lineGap: 0
                   });
            }

            // Título principal
            doc.font('Helvetica-Bold')
               .fontSize(60)
               .fillColor(primaryColor)
               .text('CERTIFICADO', 0, 120, { align: 'center' });

            // Texto principal
            const centerY = doc.page.height / 2 - 80;

            doc.font('Helvetica')
               .fontSize(16)
               .fillColor(textColor)
               .text('Certificamos que', 0, centerY, { align: 'center' });

            // Nome do aluno
            doc.font('Helvetica-Bold')
               .fontSize(40)
               .fillColor(primaryColor)
               .text(certificate.student.name, 0, centerY + 40, { align: 'center' });

            // Descrição do curso
            doc.font('Helvetica')
               .fontSize(16)
               .fillColor(textColor)
               .text('concluiu com êxito o curso online', 0, centerY + 100, { align: 'center' });

            // Nome do curso
            doc.font('Helvetica-Bold')
               .fontSize(30)
               .fillColor(accentColor)
               .text(certificate.course.title.toUpperCase(), 0, centerY + 130, { align: 'center' });

            // Informações adicionais em uma tabela centralizada
            const infoY = centerY + 190;
            const infoStyle = {
                font: 'Helvetica',
                fontSize: 14,
                color: textColor
            };

            // Formatar datas
            const dataInicio = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
            const dataFim = enrollment.completed_at ? new Date(enrollment.completed_at) : new Date();

            // Criar uma tabela centralizada com as informações
            const tableWidth = 800;
            const tableX = (doc.page.width - tableWidth) / 2;
            const columnWidth = tableWidth / 3;

            // Função auxiliar para adicionar célula da tabela
            function addTableCell(label, value, x, y) {
                doc.font(infoStyle.font)
                   .fontSize(infoStyle.fontSize)
                   .fillColor(infoStyle.color)
                   .text(label, x, y, { width: columnWidth, align: 'center' });

                doc.font('Helvetica-Bold')
                   .text(value, x, y + 20, { width: columnWidth, align: 'center' });
            }

            // Adicionar células da tabela
            addTableCell(
                'Carga Horária',
                `${Math.ceil(certificate.course.duration / 60)} horas`,
                tableX,
                infoY
            );

            addTableCell(
                'Nível',
                certificate.course.level.charAt(0).toUpperCase() + certificate.course.level.slice(1),
                tableX + columnWidth,
                infoY
            );

            addTableCell(
                'Período',
                `${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`,
                tableX + (2 * columnWidth),
                infoY
            );

            // Assinatura
            const lineY = doc.page.height - 100;
            
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor(primaryColor)
               .text('Henrique de Andrade Reynaud', doc.page.width / 2 - 150, lineY, { 
                   width: 300,
                   align: 'center'
               });

            doc.font('Helvetica')
               .fontSize(12)
               .fillColor(textColor)
               .text('Diretor de Ensino', doc.page.width / 2 - 150, lineY + 20, { 
                   width: 300,
                   align: 'center'
               });

            // Linha decorativa para assinatura
            doc.moveTo(doc.page.width / 2 - 150, lineY + 50)
               .lineTo(doc.page.width / 2 + 150, lineY + 50)
               .lineWidth(1)
               .stroke(goldColor);

            // Data de emissão (à esquerda)
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(textColor)
               .text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 
                     50, 
                     doc.page.height - 30);

            // ID do certificado (à direita)
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(textColor)
               .text(`Certificado Nº ${certificate.id.toString().padStart(6, '0')}`, 
                     doc.page.width - 200, 
                     doc.page.height - 30);

            // Finalizar o PDF
            doc.end();

            // Esperar o stream terminar antes de enviar o arquivo
            stream.on('finish', () => {
                res.download(filePath, `Certificado - ${certificate.course.title}.pdf`);
            });

        } catch (error) {
            console.error('Erro ao baixar certificado:', error);
            res.status(500).json({ error: 'Erro ao baixar certificado' });
        }
    }
}

module.exports = new CertificateController(); 