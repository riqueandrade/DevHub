const { Lesson, Module, Course } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de vídeos
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

const lessonFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas vídeos são permitidos (mp4, webm, ogg)'));
    }
};

const lessonUpload = multer({
    storage: lessonStorage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    },
    fileFilter: lessonFilter
}).single('video');

// Criar nova aula
exports.createLesson = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, description, duration, order_number } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o módulo existe e se o usuário tem permissão
        const module = await Module.findByPk(moduleId, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        if (!isAdmin && module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este módulo' });
        }

        // Criar aula
        const lesson = await Lesson.create({
            module_id: moduleId,
            title,
            description,
            duration,
            order_number: order_number || await getNextLessonOrder(moduleId)
        });

        res.status(201).json({
            message: 'Aula criada com sucesso',
            lesson
        });
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(500).json({ error: 'Erro ao criar aula' });
    }
};

// Atualizar aula
exports.updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, description, duration, order_number } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar aula com módulo e curso
        const lesson = await Lesson.findByPk(lessonId, {
            include: [{
                model: Module,
                as: 'module',
                include: [{
                    model: Course,
                    as: 'course'
                }]
            }]
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        // Verificar permissão
        if (!isAdmin && lesson.module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar esta aula' });
        }

        // Atualizar aula
        await lesson.update({
            title: title || lesson.title,
            description: description || lesson.description,
            duration: duration || lesson.duration,
            order_number: order_number || lesson.order_number
        });

        res.json({
            message: 'Aula atualizada com sucesso',
            lesson
        });
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        res.status(500).json({ error: 'Erro ao atualizar aula' });
    }
};

// Upload de vídeo da aula
exports.uploadVideo = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar aula com módulo e curso
        const lesson = await Lesson.findByPk(lessonId, {
            include: [{
                model: Module,
                as: 'module',
                include: [{
                    model: Course,
                    as: 'course'
                }]
            }]
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        // Verificar permissão
        if (!isAdmin && lesson.module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar esta aula' });
        }

        // Upload do vídeo
        lessonUpload(req, res, async (err) => {
            if (err) {
                console.error('Erro no upload:', err);
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ error: 'Arquivo muito grande. Máximo 500MB' });
                    }
                    return res.status(400).json({ error: err.message });
                }
                return res.status(400).json({ error: 'Erro no upload do arquivo' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            try {
                // Remover vídeo antigo se existir
                if (lesson.video_url) {
                    const oldPath = path.join(__dirname, '..', 'public', lesson.video_url);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }

                // Atualizar caminho no banco de dados
                const videoPath = `/uploads/lessons/${req.file.filename}`;
                await lesson.update({ video_url: videoPath });

                res.json({
                    message: 'Vídeo atualizado com sucesso',
                    video_url: videoPath,
                    lesson
                });
            } catch (error) {
                console.error('Erro ao processar upload:', error);
                res.status(500).json({ error: 'Erro ao processar upload' });
            }
        });
    } catch (error) {
        console.error('Erro ao fazer upload do vídeo:', error);
        res.status(500).json({ error: 'Erro ao fazer upload do vídeo' });
    }
};

// Excluir aula
exports.deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar aula com módulo e curso
        const lesson = await Lesson.findByPk(lessonId, {
            include: [{
                model: Module,
                as: 'module',
                include: [{
                    model: Course,
                    as: 'course'
                }]
            }]
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        // Verificar permissão
        if (!isAdmin && lesson.module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir esta aula' });
        }

        // Remover vídeo se existir
        if (lesson.video_url) {
            const videoPath = path.join(__dirname, '..', 'public', lesson.video_url);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
        }

        // Excluir aula
        await lesson.destroy();

        res.json({
            message: 'Aula excluída com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        res.status(500).json({ error: 'Erro ao excluir aula' });
    }
};

// Reordenar aulas
exports.reorderLessons = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { lessonOrders } = req.body; // Array de { id, order_number }
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar permissão
        const module = await Module.findByPk(moduleId, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        if (!isAdmin && module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este módulo' });
        }

        // Atualizar ordem das aulas
        await Promise.all(lessonOrders.map(({ id, order_number }) => 
            Lesson.update({ order_number }, { where: { id } })
        ));

        res.json({
            message: 'Ordem das aulas atualizada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao reordenar aulas:', error);
        res.status(500).json({ error: 'Erro ao reordenar aulas' });
    }
};

// Função auxiliar para obter próxima ordem de aula
async function getNextLessonOrder(moduleId) {
    const lastLesson = await Lesson.findOne({
        where: { module_id: moduleId },
        order: [['order_number', 'DESC']]
    });

    return lastLesson ? lastLesson.order_number + 1 : 1;
} 