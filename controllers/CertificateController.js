const PDFDocument = require('pdfkit');
const CertificateService = require('./services/CertificateService');

// Obter certificado
exports.getCertificate = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        const certificate = await CertificateService.getCertificateData(userId, courseId);
        res.json(certificate);
    } catch (error) {
        console.error('Erro ao buscar certificado:', error);
        res.status(error.message === 'Certificado não encontrado' ? 404 : 500)
           .json({ error: error.message || 'Erro ao buscar certificado' });
    }
};

// Download do certificado
exports.downloadCertificate = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        const enrollment = await CertificateService.findEnrollment(userId, courseId);
        if (!enrollment) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }

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

        // Gerar PDF usando o serviço
        await CertificateService.generatePDF(enrollment, student, doc);
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        res.status(500).json({ error: 'Erro ao gerar certificado' });
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

// Listar certificados
exports.listCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const sort = req.query.sort || 'date_desc';

        console.log('Buscando certificados para usuário:', {
            userId,
            page,
            limit,
            search,
            sort
        });

        // Configurar ordenação
        let order = [['updated_at', 'DESC']];
        if (sort === 'date_asc') order = [['updated_at', 'ASC']];
        else if (sort === 'name_asc') order = [[{ model: Course, as: 'course' }, 'title', 'ASC']];
        else if (sort === 'name_desc') order = [[{ model: Course, as: 'course' }, 'title', 'DESC']];

        // Buscar matrículas concluídas
        const { count, rows: enrollments } = await Enrollment.findAndCountAll({
            where: {
                user_id: userId,
                status: 'concluido'
            },
            include: [{
                model: Course,
                as: 'course',
                where: search ? {
                    title: {
                        [Op.iLike]: `%${search}%`
                    }
                } : {},
                include: [{
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }]
            }],
            order,
            limit,
            offset
        });

        console.log('Matrículas encontradas:', {
            total: count,
            enrollments: enrollments.map(e => ({
                id: e.id,
                course_id: e.course_id,
                course_title: e.course.title,
                status: e.status
            }))
        });

        // Formatar certificados
        const certificates = enrollments.map(enrollment => ({
            id: enrollment.id,
            course_id: enrollment.course_id,
            course_title: enrollment.course.title,
            instructor_name: enrollment.course.instructor.name,
            completion_date: enrollment.updated_at,
            code: `${enrollment.course_id}-${userId}-${Date.now()}`
        }));

        console.log('Certificados formatados:', certificates);

        res.json({
            certificates,
            pagination: {
                total: count,
                pages: Math.ceil(count / limit),
                current_page: page,
                per_page: limit
            }
        });
    } catch (error) {
        console.error('Erro ao listar certificados:', error);
        res.status(500).json({ error: 'Erro ao listar certificados' });
    }
}; 