const { Course, Module, Lesson, Enrollment, LessonProgress, User, Activity } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de imagens
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = file.mimetype.split('/')[1];
    
    if (allowedTypes.test(mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas (jpg, jpeg, png, gif)'));
    }
};

const uploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

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
            limit: 5,
            order: sequelize.literal('RAND()')
        });

        res.json(courses);
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

// Upload de thumbnail
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

        // Verificar se há arquivo
        if (!req.files || !req.files.thumbnail) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const file = req.files.thumbnail;

        // Validar tipo do arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ error: 'Apenas imagens são permitidas (jpg, jpeg, png, gif)' });
        }

        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB' });
        }

        // Gerar nome único para o arquivo
        const ext = path.extname(file.name);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'thumbnails', fileName);

        // Remover thumbnail antiga se existir
        if (course.thumbnail) {
            const oldPath = path.join(__dirname, '..', 'public', course.thumbnail);
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (error) {
                    console.error('Erro ao remover thumbnail antiga:', error);
                }
            }
        }

        // Mover o arquivo
        await file.mv(uploadPath);

        // Atualizar caminho no banco de dados
        const thumbnailPath = `/uploads/thumbnails/${fileName}`;
        await course.update({ thumbnail: thumbnailPath });

        // Forçar refresh dos dados
        await course.reload();

        console.log('Thumbnail atualizada com sucesso:', {
            courseId,
            oldThumbnail: course.thumbnail,
            newThumbnail: thumbnailPath,
            file: {
                name: file.name,
                size: file.size,
                mimetype: file.mimetype
            }
        });

        res.json({
            message: 'Thumbnail atualizada com sucesso',
            thumbnail: thumbnailPath,
            course: course
        });
    } catch (error) {
        console.error('Erro ao fazer upload da thumbnail:', error);
        res.status(500).json({ error: error.message || 'Erro ao fazer upload da thumbnail' });
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

        // Buscar o curso com dados do instrutor e categoria
        const course = await Course.findOne({
            where: { id: courseId },
            include: [
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }
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

        res.json(course);
    } catch (error) {
        console.error('Erro ao buscar curso:', error);
        res.status(500).json({ error: 'Erro ao buscar curso' });
    }
}; 