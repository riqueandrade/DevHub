const LessonService = require('./services/LessonService');
const path = require('path');

// Criar nova aula
exports.createLesson = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const lesson = await LessonService.createLesson(moduleId, userId, isAdmin, req.body);

        res.status(201).json({
            message: 'Aula criada com sucesso',
            lesson
        });
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(error.message.includes('permissão') ? 403 : 
                  error.message.includes('encontrado') ? 404 : 500)
           .json({ error: error.message || 'Erro ao criar aula' });
    }
};

// Atualizar aula
exports.updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        console.log('Atualizando aula:', {
            lessonId,
            userId,
            isAdmin,
            hasFile: !!req.files?.file,
            body: req.body
        });

        // Verificar se há arquivo sendo enviado
        if (!req.files || !req.files.file) {
            console.log('Sem arquivo novo, atualizando apenas dados básicos');
            // Se não houver arquivo, apenas atualizar os dados básicos
            const lesson = await LessonService.updateLesson(lessonId, userId, isAdmin, req.body);
            return res.json({
                message: 'Aula atualizada com sucesso',
                lesson
            });
        }

        // Se houver arquivo, processar o upload
        const file = req.files.file;
        console.log('Arquivo recebido:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype
        });

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}.${fileExtension}`;
        const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lessons', fileName);

        console.log('Salvando arquivo:', {
            fileName,
            filePath
        });

        // Mover o arquivo para o diretório de uploads
        try {
            await file.mv(filePath);
            console.log('Arquivo salvo com sucesso');
        } catch (error) {
            console.error('Erro ao salvar arquivo:', error);
            throw new Error('Erro ao salvar arquivo');
        }

        // Atualizar a aula com o novo arquivo
        const data = {
            ...req.body,
            content_url: `/uploads/lessons/${fileName}`
        };

        console.log('Atualizando dados da aula:', data);

        const lesson = await LessonService.updateLesson(lessonId, userId, isAdmin, data);

        res.json({
            message: 'Aula atualizada com sucesso',
            lesson
        });
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        res.status(error.message.includes('permissão') ? 403 : 
                  error.message.includes('encontrada') ? 404 : 500)
           .json({ error: error.message || 'Erro ao atualizar aula' });
    }
};

// Upload de vídeo da aula
exports.uploadVideo = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const result = await LessonService.uploadVideo(lessonId, userId, isAdmin, req, res);

        res.json({
            message: 'Vídeo atualizado com sucesso',
            video_url: result.video_url,
            lesson: result.lesson
        });
    } catch (error) {
        console.error('Erro ao fazer upload do vídeo:', error);
        res.status(error.message.includes('permissão') ? 403 :
                  error.message.includes('encontrada') ? 404 :
                  error.message.includes('grande') ? 400 : 500)
           .json({ error: error.message || 'Erro ao fazer upload do vídeo' });
    }
};

// Excluir aula
exports.deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        await LessonService.deleteLesson(lessonId, userId, isAdmin);

        res.json({
            message: 'Aula excluída com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        res.status(error.message.includes('permissão') ? 403 : 
                  error.message.includes('encontrada') ? 404 : 500)
           .json({ error: error.message || 'Erro ao excluir aula' });
    }
};

// Reordenar aulas
exports.reorderLessons = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { newOrder } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const updatedLessons = await LessonService.reorderLessons(moduleId, userId, isAdmin, newOrder);

        res.json({
            message: 'Aulas reordenadas com sucesso',
            lessons: updatedLessons
        });
    } catch (error) {
        console.error('Erro ao reordenar aulas:', error);
        res.status(error.message.includes('permissão') ? 403 : 
                  error.message.includes('encontrado') ? 404 : 500)
           .json({ error: error.message || 'Erro ao reordenar aulas' });
    }
}; 