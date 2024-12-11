const { Course, Module, Lesson, Enrollment, LessonProgress, User, Activity } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que os diretórios de upload existam
const ensureUploadDirs = () => {
    const dirs = [
        path.join(__dirname, '..', 'public', 'uploads'),
        path.join(__dirname, '..', 'public', 'uploads', 'thumbnails'),
        path.join(__dirname, '..', 'public', 'uploads', 'lessons')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log('Diretório criado:', dir);
        }
    });
};

// Criar diretórios necessários
ensureUploadDirs();

// Configuração do multer para upload de thumbnails
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const thumbnailFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas (jpg, jpeg, png, gif)'));
    }
};

const thumbnailUpload = multer({
    storage: thumbnailStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: thumbnailFilter
}).single('thumbnail');

// Middleware de upload de thumbnail
exports.uploadThumbnail = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar o curso
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este curso' });
        }

        // Upload do arquivo usando multer
        thumbnailUpload(req, res, async (err) => {
            if (err) {
                console.error('Erro no upload:', err);
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB' });
                    }
                    return res.status(400).json({ error: err.message });
                }
                return res.status(400).json({ error: 'Erro no upload do arquivo' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            try {
                // Remover thumbnail antiga se existir
                if (course.thumbnail) {
                    const oldPath = path.join(__dirname, '..', 'public', course.thumbnail);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                // Atualizar caminho no banco de dados
                const thumbnailPath = `/uploads/thumbnails/${req.file.filename}`;
                await course.update({ thumbnail: thumbnailPath });

                console.log('Thumbnail atualizada com sucesso:', {
                    courseId,
                    oldThumbnail: course.thumbnail,
                    newThumbnail: thumbnailPath,
                    file: {
                        filename: req.file.filename,
                        size: req.file.size,
                        mimetype: req.file.mimetype
                    }
                });

                res.json({
                    message: 'Thumbnail atualizada com sucesso',
                    thumbnail: thumbnailPath,
                    course: course
                });
            } catch (error) {
                console.error('Erro ao processar upload:', error);
                res.status(500).json({ error: 'Erro ao processar upload' });
            }
        });
    } catch (error) {
        console.error('Erro ao fazer upload da thumbnail:', error);
        res.status(500).json({ error: 'Erro ao fazer upload da thumbnail' });
    }
};

// Função auxiliar para calcular progresso
async function calculateProgress(enrollmentId) {
    const total = await LessonProgress.count({
        where: { enrollment_id: enrollmentId }
    });

    const completed = await LessonProgress.count({
        where: {
            enrollment_id: enrollmentId,
            status: 'concluido'
        }
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
}

// Obter cursos em andamento do usuário
exports.getInProgress = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrollments = await Enrollment.findAll({
            where: {
                user_id: userId,
                status: 'em_andamento'
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

        const coursesInProgress = await Promise.all(enrollments.map(async (enrollment) => {
            const progress = await calculateProgress(enrollment.id);

            return {
                id: enrollment.course.id,
                title: enrollment.course.title,
                description: enrollment.course.description,
                thumbnail: enrollment.course.thumbnail,
                instructor: enrollment.course.instructor,
                progress,
                enrollmentId: enrollment.id,
                level: enrollment.course.level,
                duration: enrollment.course.duration
            };
        }));

        res.json(coursesInProgress);
    } catch (error) {
        console.error('Erro ao buscar cursos em andamento:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos em andamento' });
    }
};

// Obter cursos concluídos do usuário
exports.getCompleted = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrollments = await Enrollment.findAll({
            where: {
                user_id: userId,
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

        const coursesCompleted = enrollments.map(enrollment => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            thumbnail: enrollment.course.thumbnail,
            instructor: enrollment.course.instructor,
            level: enrollment.course.level,
            duration: enrollment.course.duration,
            completedAt: enrollment.updated_at
        }));

        res.json(coursesCompleted);
    } catch (error) {
        console.error('Erro ao buscar cursos concluídos:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos concluídos' });
    }
};

// Obter cursos recomendados
exports.getRecommended = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar cursos que o usuário ainda não está matriculado
        const courses = await Course.findAll({
            where: {
                id: {
                    [Op.notIn]: sequelize.literal(`(
                        SELECT course_id 
                        FROM enrollments 
                        WHERE user_id = ${userId}
                    )`)
                },
                status: 'publicado'
            },
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar_url']
            }],
            limit: 6 // Limitar a 6 cursos recomendados
        });

        // Formatar os dados no mesmo padrão dos outros endpoints
        const formattedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            instructor: course.instructor,
            level: course.level,
            duration: course.duration
        }));

        res.json(formattedCourses);
    } catch (error) {
        console.error('Erro ao buscar cursos recomendados:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos recomendados' });
    }
};

// Matricular usuário em um curso
exports.enroll = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.body;

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se já está matriculado
        const existingEnrollment = await Enrollment.findOne({
            where: {
                user_id: userId,
                course_id: courseId
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'Você já está matriculado neste curso' });
        }

        // Criar matrícula
        const enrollment = await Enrollment.create({
            user_id: userId,
            course_id: courseId,
            status: 'em_andamento',
            progress: 0
        });

        // Criar registros de progresso para cada aula
        const lessons = await Lesson.findAll({
            include: [{
                model: Module,
                where: { course_id: courseId }
            }]
        });

        await Promise.all(lessons.map(lesson =>
            LessonProgress.create({
                enrollment_id: enrollment.id,
                lesson_id: lesson.id,
                status: 'nao_iniciado'
            })
        ));

        // Registrar atividade
        await Activity.create({
            user_id: userId,
            type: 'course_start',
            description: `Iniciou o curso ${course.title}`
        });

        res.json({ message: 'Matrícula realizada com sucesso' });
    } catch (error) {
        console.error('Erro ao matricular no curso:', error);
        res.status(500).json({ error: 'Erro ao matricular no curso' });
    }
};

// Obter cursos gerenciados pelo instrutor/admin
exports.getManaged = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const whereClause = isAdmin ? {} : { instructor_id: userId };

        const courses = await Course.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar_url']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json(courses);
    } catch (error) {
        console.error('Erro ao buscar cursos gerenciados:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos gerenciados' });
    }
};

// Criar novo curso
exports.create = async (req, res) => {
    try {
        const { title, description, category_id, level, duration, price } = req.body;

        // Validar campos obrigatórios
        if (!title || !description || !category_id || !level || !duration) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Criar curso sem thumbnail primeiro
        const course = await Course.create({
            title,
            description,
            category_id: parseInt(category_id),
            instructor_id: req.user.id,
            thumbnail: null,
            price: price ? parseFloat(price) : 0,
            duration: parseInt(duration),
            level,
            status: 'rascunho'
        });

        // Se houver arquivo para upload, processa
        if (req.files && req.files.thumbnail) {
            uploadMiddleware.single('thumbnail')(req, res, async (err) => {
                if (err) {
                    console.error('Upload error:', err);
                    return;
                }

                if (req.file) {
                    const thumbnail = `/uploads/thumbnails/${req.file.filename}`;
                    await course.update({ thumbnail });
                }
            });
        }

        // Registrar atividade
        await Activity.create({
            user_id: req.user.id,
            type: 'course_create',
            description: `Criou o curso ${title}`
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('Erro ao criar curso:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar curso' });
    }
};

// Atualizar curso
exports.update = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar o curso
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este curso' });
        }

        // Atualizar dados do curso
        const { title, description, category_id, level, duration, price } = req.body;
        await course.update({
            title,
            description,
            category_id,
            level,
            duration,
            price: price || 0
        });

        // Registrar atividade
        await Activity.create({
            user_id: userId,
            type: 'course_update',
            description: `Atualizou o curso ${course.title}`
        });

        res.json({ message: 'Curso atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar curso:', error);
        res.status(500).json({ error: 'Erro ao atualizar curso' });
    }
};

// Publicar curso
exports.publish = async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Sem permissão para publicar este curso' });
        }

        await course.update({ status: 'publicado' });

        res.json({ message: 'Curso publicado com sucesso' });
    } catch (error) {
        console.error('Erro ao publicar curso:', error);
        res.status(500).json({ error: 'Erro ao publicar curso' });
    }
};

// Arquivar curso
exports.archive = async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Sem permissão para arquivar este curso' });
        }

        await course.update({ status: 'arquivado' });

        res.json({ message: 'Curso arquivado com sucesso' });
    } catch (error) {
        console.error('Erro ao arquivar curso:', error);
        res.status(500).json({ error: 'Erro ao arquivar curso' });
    }
};

// Excluir curso
exports.delete = async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Sem permissão para excluir este curso' });
        }

        // Remover thumbnail se existir
        if (course.thumbnail && course.thumbnail.startsWith('/uploads/')) {
            const thumbnailPath = path.join(__dirname, '..', 'public', course.thumbnail);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        }

        await course.destroy();

        res.json({ message: 'Curso excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir curso:', error);
        res.status(500).json({ error: 'Erro ao excluir curso' });
    }
};

// Obter curso específico
exports.getCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar o curso com dados do instrutor, módulos e aulas
        const course = await Course.findOne({
            where: { id: courseId },
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                },
                {
                    model: Module,
                    as: 'modules',
                    include: [{
                        model: Lesson,
                        as: 'lessons',
                        include: [{
                            model: LessonProgress,
                            as: 'progress',
                            required: false,
                            include: [{
                                model: Enrollment,
                                as: 'enrollment',
                                where: { user_id: userId },
                                required: false
                            }]
                        }]
                    }]
                }
            ],
            order: [
                [{ model: Module, as: 'modules' }, 'order_number', 'ASC'],
                [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order_number', 'ASC']
            ]
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se o usuário já está matriculado
        const enrollment = await Enrollment.findOne({
            where: {
                user_id: userId,
                course_id: courseId
            }
        });

        // Permitir acesso se:
        // 1. O usuário é admin
        // 2. O usuário é o instrutor do curso
        // 3. O usuário está matriculado no curso
        // 4. O curso está publicado (para permitir compra)
        if (!isAdmin && 
            course.instructor_id !== userId && 
            !enrollment && 
            course.status !== 'publicado') {
            return res.status(403).json({ error: 'Sem permissão para acessar este curso' });
        }

        // Formatar os dados para incluir o status de conclusão das aulas
        const formattedCourse = {
            ...course.toJSON(),
            modules: course.modules.map(module => ({
                ...module.toJSON(),
                lessons: module.lessons.map(lesson => ({
                    ...lesson.toJSON(),
                    completed: lesson.progress && 
                              lesson.progress.length > 0 && 
                              lesson.progress[0].status === 'concluido'
                }))
            }))
        };

        res.json(formattedCourse);
    } catch (error) {
        console.error('Erro ao buscar curso:', error);
        res.status(500).json({ error: 'Erro ao buscar curso' });
    }
};

// Obter módulos de um curso
exports.getModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para acessar este curso' });
        }

        // Buscar módulos
        const modules = await Module.findAll({
            where: { course_id: courseId },
            include: [{
                model: Lesson,
                as: 'lessons',
                attributes: ['id', 'title', 'content_type', 'duration', 'order_number']
            }],
            order: [
                ['order_number', 'ASC'],
                [{ model: Lesson, as: 'lessons' }, 'order_number', 'ASC']
            ]
        });

        res.json(modules);
    } catch (error) {
        console.error('Erro ao buscar módulos:', error);
        res.status(500).json({ error: 'Erro ao buscar módulos' });
    }
};

// Criar módulo
exports.createModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para modificar este curso' });
        }

        // Obter última ordem
        const lastModule = await Module.findOne({
            where: { course_id: courseId },
            order: [['order_number', 'DESC']]
        });

        const order_number = lastModule ? lastModule.order_number + 1 : 1;

        // Criar módulo
        const module = await Module.create({
            course_id: courseId,
            title,
            description,
            order_number
        });

        res.status(201).json(module);
    } catch (error) {
        console.error('Erro ao criar módulo:', error);
        res.status(500).json({ error: 'Erro ao criar módulo' });
    }
};

// Atualizar módulo
exports.updateModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { title, description } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para modificar este curso' });
        }

        // Atualizar módulo
        const module = await Module.findOne({
            where: { id: moduleId, course_id: courseId }
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        await module.update({ title, description });

        res.json(module);
    } catch (error) {
        console.error('Erro ao atualizar módulo:', error);
        res.status(500).json({ error: 'Erro ao atualizar módulo' });
    }
};

// Excluir módulo
exports.deleteModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para modificar este curso' });
        }

        // Excluir módulo
        const module = await Module.findOne({
            where: { id: moduleId, course_id: courseId }
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        await module.destroy();

        res.json({ message: 'Módulo excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir módulo:', error);
        res.status(500).json({ error: 'Erro ao excluir módulo' });
    }
};

// Reordenar módulos
exports.reorderModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleOrder } = req.body; // Array de IDs na nova ordem
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para modificar este curso' });
        }

        // Atualizar ordem dos módulos
        await Promise.all(moduleOrder.map(async (moduleId, index) => {
            await Module.update(
                { order_number: index + 1 },
                { where: { id: moduleId, course_id: courseId } }
            );
        }));

        res.json({ message: 'Ordem dos módulos atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao reordenar módulos:', error);
        res.status(500).json({ error: 'Erro ao reordenar módulos' });
    }
};

// Obter aulas de um módulo
exports.getLessons = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para acessar este curso' });
        }

        // Buscar aulas
        const lessons = await Lesson.findAll({
            where: { module_id: moduleId },
            order: [['order_number', 'ASC']]
        });

        res.json(lessons);
    } catch (error) {
        console.error('Erro ao buscar aulas:', error);
        res.status(500).json({ error: 'Erro ao buscar aulas' });
    }
};

// Configuração do multer para upload de arquivos das aulas
const lessonStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'lessons');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const lessonFileFilter = (req, file, cb) => {
    const allowedTypes = {
        'pdf': ['application/pdf'],
        'slides': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        'documento': [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        'video': ['video/mp4', 'video/webm', 'video/ogg'],
        'texto': ['text/plain']
    };

    const contentType = req.body.content_type;
    
    // Se não houver tipo de conteúdo definido, rejeitar
    if (!contentType) {
        cb(new Error('Tipo de conteúdo não especificado'));
        return;
    }

    // Se o tipo de conteúdo não estiver na lista de permitidos
    if (!allowedTypes[contentType]) {
        cb(new Error('Tipo de conteúdo inválido'));
        return;
    }

    // Se o tipo de arquivo não corresponder ao tipo de conteúdo
    if (!allowedTypes[contentType].includes(file.mimetype)) {
        cb(new Error(`Tipo de arquivo inválido para ${contentType}. Tipos permitidos: ${allowedTypes[contentType].join(', ')}`));
        return;
    }

    cb(null, true);
};

const lessonUpload = multer({
    storage: lessonStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: lessonFileFilter
}).single('content_file');

// Middleware de upload de arquivo
exports.uploadFile = (req, res, next) => {
    lessonUpload(req, res, (err) => {
        if (err) {
            console.error('Erro no upload:', err);
            
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'Arquivo muito grande. Máximo 50MB' });
                }
                return res.status(400).json({ error: err.message });
            }
            
            return res.status(400).json({ error: err.message });
        }

        if (!req.file && req.body.content_type !== 'video') {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
        }

        console.log('Upload concluído com sucesso:', {
            body: req.body,
            file: req.file ? {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : null
        });

        next();
    });
};

// Criar nova aula
exports.createLesson = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, description, content_type, duration } = req.body;
        const file = req.file;

        // Validar campos obrigatórios
        if (!title || !description || !content_type || !duration) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        // Verificar se o módulo existe
        const module = await Module.findByPk(moduleId);
        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        // Criar a aula
        const lesson = await Lesson.create({
            module_id: moduleId,
            title,
            description,
            content_type,
            content_url: file ? `/uploads/lessons/${file.filename}` : null,
            duration: parseInt(duration),
            order_number: await Lesson.count({ where: { module_id: moduleId } }) + 1
        });

        res.status(201).json(lesson);
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar aula' });
    }
};

// Atualizar aula
exports.updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, description, content_type, duration } = req.body;

        const lesson = await Lesson.findByPk(lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        let content_url = lesson.content_url;

        if (content_type === 'video') {
            content_url = req.body.content_url || content_url;
        } else if (req.file) {
            // Se houver arquivo antigo, excluir
            if (lesson.content_url && !lesson.content_url.includes('http')) {
                const oldFile = path.join(__dirname, '..', 'public', lesson.content_url);
                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }
            }
            content_url = `/uploads/lessons/${req.file.filename}`;
        }

        await lesson.update({
            title,
            description,
            content_type,
            content_url,
            duration
        });

        res.json(lesson);
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        res.status(500).json({ error: 'Erro ao atualizar aula' });
    }
};

// Excluir aula
exports.deleteLesson = async (req, res) => {
    try {
        const { courseId, moduleId, lessonId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para modificar este curso' });
        }

        // Verificar se a aula pertence ao módulo e curso corretos
        const lesson = await Lesson.findOne({
            where: { id: lessonId },
            include: [{
                model: Module,
                where: { id: moduleId, course_id: courseId }
            }]
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        // Remover arquivo se existir
        if (lesson.content_url && lesson.content_url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', 'public', lesson.content_url);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.error('Erro ao remover arquivo:', error);
                }
            }
        }

        // Excluir aula
        await lesson.destroy();

        res.json({ message: 'Aula excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        res.status(500).json({ error: 'Erro ao excluir aula' });
    }
};

// Reordenar aulas
exports.reorderLessons = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { lessonOrder } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para modificar este curso' });
        }

        // Verificar se o módulo pertence ao curso
        const module = await Module.findOne({
            where: { id: moduleId, course_id: courseId }
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        // Atualizar ordem das aulas
        await Promise.all(lessonOrder.map((lessonId, index) =>
            Lesson.update(
                { order_number: index + 1 },
                { where: { id: lessonId, module_id: moduleId } }
            )
        ));

        res.json({ message: 'Ordem das aulas atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao reordenar aulas:', error);
        res.status(500).json({ error: 'Erro ao reordenar aulas' });
    }
};

// Obter aula específica
exports.getLesson = async (req, res) => {
    try {
        const { courseId, moduleIndex, lessonIndex } = req.params;
        const userId = req.user.id;

        // Buscar o curso com módulos e aulas
        const course = await Course.findOne({
            where: { id: courseId },
            include: [{
                model: Module,
                as: 'modules',
                include: [{
                    model: Lesson,
                    as: 'lessons',
                    attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'duration', 'order_number'],
                    include: [{
                        model: LessonProgress,
                        as: 'progress',
                        required: false,
                        include: [{
                            model: Enrollment,
                            as: 'enrollment',
                            required: false,
                            where: { user_id: userId }
                        }]
                    }]
                }]
            }],
            order: [
                [{ model: Module, as: 'modules' }, 'order_number', 'ASC'],
                [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order_number', 'ASC']
            ]
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se o usuário tem acesso ao curso
        const enrollment = await Enrollment.findOne({
            where: {
                user_id: userId,
                course_id: courseId
            }
        });

        if (!enrollment && course.instructor_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Sem permissão para acessar esta aula' });
        }

        // Obter o módulo pelo índice
        const module = course.modules[moduleIndex];
        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        // Obter a aula pelo índice
        const lesson = module.lessons[lessonIndex];
        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        // Formatar a aula
        const formattedLesson = {
            ...lesson.toJSON(),
            completed: lesson.progress && 
                      lesson.progress.length > 0 && 
                      lesson.progress[0].status === 'concluido',
            moduleTitle: module.title,
            moduleIndex: parseInt(moduleIndex),
            lessonIndex: parseInt(lessonIndex)
        };

        // Log para debug
        console.log('Aula formatada:', {
            id: formattedLesson.id,
            title: formattedLesson.title,
            moduleTitle: formattedLesson.moduleTitle,
            moduleIndex: formattedLesson.moduleIndex,
            lessonIndex: formattedLesson.lessonIndex,
            completed: formattedLesson.completed
        });

        res.json(formattedLesson);
    } catch (error) {
        console.error('Erro ao buscar aula:', error);
        res.status(500).json({ error: 'Erro ao buscar aula' });
    }
};

// Marcar aula como concluída
exports.completeLesson = async (req, res) => {
    try {
        const { courseId, moduleIndex, lessonIndex } = req.params;
        const userId = req.user.id;

        // Buscar o curso com módulos e aulas
        const course = await Course.findOne({
            where: { id: courseId },
            include: [{
                model: Module,
                as: 'modules',
                include: [{
                    model: Lesson,
                    as: 'lessons',
                    attributes: ['id', 'title', 'description', 'content_type', 'content_url', 'duration', 'order_number']
                }]
            }],
            order: [
                [{ model: Module, as: 'modules' }, 'order_number', 'ASC'],
                [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order_number', 'ASC']
            ]
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se o usuário está matriculado
        const enrollment = await Enrollment.findOne({
            where: {
                user_id: userId,
                course_id: courseId
            }
        });

        if (!enrollment) {
            return res.status(403).json({ error: 'Você não está matriculado neste curso' });
        }

        // Obter o módulo pelo índice
        const module = course.modules[moduleIndex];
        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        // Obter a aula pelo índice
        const lesson = module.lessons[lessonIndex];
        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        // Atualizar ou criar progresso da aula
        const [progress, created] = await LessonProgress.findOrCreate({
            where: {
                enrollment_id: enrollment.id,
                lesson_id: lesson.id
            },
            defaults: {
                status: 'concluido',
                completion_date: new Date()
            }
        });

        if (!created) {
            await progress.update({ 
                status: 'concluido',
                completion_date: new Date()
            });
        }

        // Verificar se todas as aulas foram concluídas
        const totalLessons = await Lesson.count({
            include: [{
                model: Module,
                where: { course_id: courseId }
            }]
        });

        const completedLessons = await LessonProgress.count({
            where: {
                enrollment_id: enrollment.id,
                status: 'concluido'
            }
        });

        // Se todas as aulas foram concluídas, marcar curso como concluído
        if (totalLessons === completedLessons) {
            await enrollment.update({ 
                status: 'concluido',
                progress: 100
            });

            // Registrar atividade de conclusão do curso
            await Activity.create({
                user_id: userId,
                type: 'course_complete',
                description: `Concluiu o curso ${course.title}`
            });
        } else {
            // Atualizar progresso do curso
            const progress = Math.round((completedLessons / totalLessons) * 100);
            await enrollment.update({ progress });
        }

        // Log para debug
        console.log('Progresso atualizado:', {
            courseId,
            moduleIndex,
            lessonIndex,
            lessonId: lesson.id,
            totalLessons,
            completedLessons,
            progress: Math.round((completedLessons / totalLessons) * 100)
        });

        res.json({ 
            message: 'Aula marcada como concluída',
            progress: Math.round((completedLessons / totalLessons) * 100)
        });
    } catch (error) {
        console.error('Erro ao marcar aula como concluída:', error);
        res.status(500).json({ error: 'Erro ao marcar aula como concluída' });
    }
};

// Obter todas as matrículas do usuário
exports.getEnrollments = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrollments = await Enrollment.findAll({
            where: {
                user_id: userId
            },
            attributes: ['id', 'course_id', 'status', 'progress']
        });

        res.json(enrollments);
    } catch (error) {
        console.error('Erro ao buscar matrículas:', error);
        res.status(500).json({ error: 'Erro ao buscar matrículas' });
    }
};