const LessonService = require('./services/LessonService');

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

        const lesson = await LessonService.updateLesson(lessonId, userId, isAdmin, req.body);

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