const { Lesson, Module, Course } = require('../../models');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

class LessonService {
    constructor() {
        this.setupMulter();
    }

    setupMulter() {
        // Configuração do multer para upload de vídeos
        this.storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'lessons');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            }
        });

        this.fileFilter = (req, file, cb) => {
            const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Apenas vídeos são permitidos (mp4, webm, ogg)'));
            }
        };

        this.upload = multer({
            storage: this.storage,
            limits: {
                fileSize: 500 * 1024 * 1024 // 500MB
            },
            fileFilter: this.fileFilter
        }).single('video');
    }

    async verifyModulePermission(moduleId, userId, isAdmin) {
        const module = await Module.findByPk(moduleId, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!module) {
            throw new Error('Módulo não encontrado');
        }

        if (!isAdmin && module.course.instructor_id !== userId) {
            throw new Error('Sem permissão para editar este módulo');
        }

        return module;
    }

    async verifyLessonPermission(lessonId, userId, isAdmin) {
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
            throw new Error('Aula não encontrada');
        }

        if (!isAdmin && lesson.module.course.instructor_id !== userId) {
            throw new Error('Sem permissão para editar esta aula');
        }

        return lesson;
    }

    async getNextLessonOrder(moduleId) {
        const lastLesson = await Lesson.findOne({
            where: { module_id: moduleId },
            order: [['order_number', 'DESC']]
        });
        return lastLesson ? lastLesson.order_number + 1 : 1;
    }

    async createLesson(moduleId, userId, isAdmin, data) {
        await this.verifyModulePermission(moduleId, userId, isAdmin);

        const lesson = await Lesson.create({
            module_id: moduleId,
            title: data.title,
            description: data.description,
            duration: data.duration,
            order_number: data.order_number || await this.getNextLessonOrder(moduleId)
        });

        return lesson;
    }

    async updateLesson(lessonId, userId, isAdmin, data) {
        const lesson = await this.verifyLessonPermission(lessonId, userId, isAdmin);

        console.log('Atualizando aula no serviço:', {
            lessonId,
            currentContentUrl: lesson.content_url,
            newContentUrl: data.content_url
        });

        // Se houver uma nova URL de conteúdo, remover o arquivo antigo
        if (data.content_url && lesson.content_url && lesson.content_url !== data.content_url) {
            console.log('Removendo arquivo antigo');
            const oldPath = path.join(__dirname, '..', '..', 'public', lesson.content_url);
            console.log('Caminho do arquivo antigo:', oldPath);
            
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                    console.log('Arquivo antigo removido com sucesso');
                } catch (error) {
                    console.error('Erro ao remover arquivo antigo:', error);
                }
            } else {
                console.log('Arquivo antigo não encontrado');
            }
        }

        // Atualizar a aula
        const updatedLesson = await lesson.update({
            title: data.title || lesson.title,
            description: data.description || lesson.description,
            duration: data.duration || lesson.duration,
            content_type: data.content_type || lesson.content_type,
            content_url: data.content_url || lesson.content_url,
            order_number: data.order_number || lesson.order_number
        });

        console.log('Aula atualizada:', {
            id: updatedLesson.id,
            content_type: updatedLesson.content_type,
            content_url: updatedLesson.content_url
        });

        return updatedLesson;
    }

    async handleVideoUpload(req, res) {
        return new Promise((resolve, reject) => {
            this.upload(req, res, (err) => {
                if (err) {
                    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                        reject(new Error('Arquivo muito grande. Máximo 500MB'));
                    } else {
                        reject(err);
                    }
                } else if (!req.file) {
                    reject(new Error('Nenhum arquivo enviado'));
                } else {
                    resolve(req.file);
                }
            });
        });
    }

    async uploadVideo(lessonId, userId, isAdmin, req, res) {
        const lesson = await this.verifyLessonPermission(lessonId, userId, isAdmin);
        
        const file = await this.handleVideoUpload(req, res);
        
        // Remover vídeo antigo se existir
        if (lesson.video_url) {
            const oldPath = path.join(__dirname, '..', '..', 'public', lesson.video_url);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Atualizar caminho no banco de dados
        const videoPath = `/uploads/lessons/${file.filename}`;
        await lesson.update({ video_url: videoPath });

        return {
            video_url: videoPath,
            lesson
        };
    }

    async deleteLesson(lessonId, userId, isAdmin) {
        const lesson = await this.verifyLessonPermission(lessonId, userId, isAdmin);

        // Remover vídeo se existir
        if (lesson.video_url) {
            const videoPath = path.join(__dirname, '..', '..', 'public', lesson.video_url);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
        }

        await lesson.destroy();
    }

    async reorderLessons(moduleId, userId, isAdmin, newOrder) {
        await this.verifyModulePermission(moduleId, userId, isAdmin);

        // Atualizar a ordem das aulas
        for (const item of newOrder) {
            await Lesson.update(
                { order_number: item.order },
                { where: { id: item.lessonId, module_id: moduleId } }
            );
        }

        // Retornar aulas atualizadas
        return await Lesson.findAll({
            where: { module_id: moduleId },
            order: [['order_number', 'ASC']]
        });
    }
}

module.exports = new LessonService(); 