const { Certificate, Course, User, Enrollment } = require('../models');
const { Op } = require('sequelize');

// Função auxiliar para gerar código único do certificado
const generateCertificateCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`.toUpperCase();
};

class CertificateController {
    // Listar certificados do usuário
    async getCertificates(req, res) {
        try {
            const {
                page = 1,
                limit = 9,
                sort = 'date_desc',
                search = ''
            } = req.query;

            // Construir where clause
            const where = {
                user_id: req.user.id
            };

            // Incluir busca se houver
            if (search) {
                where['$course.title$'] = { [Op.like]: `%${search}%` };
            }

            // Definir ordenação
            let order = [];
            switch (sort) {
                case 'date_asc':
                    order.push(['created_at', 'ASC']);
                    break;
                case 'date_desc':
                    order.push(['created_at', 'DESC']);
                    break;
                case 'name_asc':
                    order.push([{ model: Course, as: 'course' }, 'title', 'ASC']);
                    break;
                case 'name_desc':
                    order.push([{ model: Course, as: 'course' }, 'title', 'DESC']);
                    break;
                default:
                    order.push(['created_at', 'DESC']);
            }

            // Buscar certificados
            const { count, rows } = await Certificate.findAndCountAll({
                where,
                include: [{
                    model: Course,
                    as: 'course',
                    include: [{
                        model: User,
                        as: 'instructor',
                        attributes: ['id', 'name']
                    }]
                }],
                order,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            });

            res.json({
                certificates: rows,
                total: count,
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            console.error('Erro ao buscar certificados:', error);
            res.status(500).json({ error: 'Erro ao buscar certificados' });
        }
    }

    // Buscar certificado específico
    async getCertificate(req, res) {
        try {
            const certificate = await Certificate.findOne({
                where: {
                    id: req.params.id,
                    user_id: req.user.id
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

            if (!certificate) {
                return res.status(404).json({ error: 'Certificado não encontrado' });
            }

            res.json(certificate);
        } catch (error) {
            console.error('Erro ao buscar certificado:', error);
            res.status(500).json({ error: 'Erro ao buscar certificado' });
        }
    }

    // Gerar certificado
    async generateCertificate(req, res) {
        try {
            const { courseId } = req.params;

            // Verificar se o usuário completou o curso
            const enrollment = await Enrollment.findOne({
                where: {
                    user_id: req.user.id,
                    course_id: courseId,
                    status: 'concluido'
                }
            });

            if (!enrollment) {
                return res.status(400).json({ error: 'Curso não concluído' });
            }

            // Verificar se já existe certificado
            let certificate = await Certificate.findOne({
                where: {
                    user_id: req.user.id,
                    course_id: courseId
                }
            });

            if (certificate) {
                return res.status(400).json({ error: 'Certificado já existe' });
            }

            // Gerar certificado
            certificate = await Certificate.create({
                user_id: req.user.id,
                course_id: courseId,
                code: generateCertificateCode(),
                preview_url: `/certificates/${courseId}/preview.jpg`,
                pdf_url: `/certificates/${courseId}/certificate.pdf`
            });

            res.json(certificate);
        } catch (error) {
            console.error('Erro ao gerar certificado:', error);
            res.status(500).json({ error: 'Erro ao gerar certificado' });
        }
    }
}

module.exports = new CertificateController(); 