const LessonService = require('./services/LessonService');
const path = require('path');

// Criar nova aula
exports.createLesson = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        console.log('Criando aula:', {
            moduleId,
            userId,
            isAdmin,
            body: req.body,
            files: req.files ? Object.keys(req.files) : []
        });

        // Se houver arquivo, processar o upload
        if (req.files && req.files.content_file) {
            const file = req.files.content_file;
            console.log('Arquivo recebido:', {
                name: file.name,
                size: file.size,
                mimetype: file.mimetype
            });

            // Validar tipo de arquivo
            const allowedTypes = {
                'pdf': ['application/pdf'],
                'slides': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
                'documento': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                'video': ['video/mp4', 'video/webm', 'video/ogg'],
                'texto': ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            };

            const contentType = req.body.content_type;
            if (!allowedTypes[contentType] || !allowedTypes[contentType].includes(file.mimetype)) {
                throw new Error(`Tipo de arquivo inválido para ${contentType}. Tipos permitidos: ${allowedTypes[contentType].join(', ')}`);
            }

            // Gerar nome único para o arquivo
            const fileExtension = path.extname(file.name).toLowerCase();
            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}${fileExtension}`;
            const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lessons', fileName);

            // Garantir que o diretório existe
            const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'lessons');
            if (!require('fs').existsSync(uploadDir)) {
                require('fs').mkdirSync(uploadDir, { recursive: true });
            }

            // Mover o arquivo
            await file.mv(filePath);

            // Adicionar URL do arquivo aos dados
            req.body.content_url = `/uploads/lessons/${fileName}`;
        }

        // Criar objeto com os dados da aula
        const lessonData = {
            title: req.body.title,
            description: req.body.description,
            content_type: req.body.content_type,
            content_url: req.body.content_url,
            duration: parseInt(req.body.duration)
        };

        console.log('Dados da aula para criação:', lessonData);

        const lesson = await LessonService.createLesson(moduleId, userId, isAdmin, lessonData);

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
            hasFile: !!req.files?.content_file,
            body: req.body,
            files: req.files ? Object.keys(req.files) : []
        });

        // Verificar se há arquivo sendo enviado
        if (!req.files || !req.files.content_file) {
            console.log('Sem arquivo novo, atualizando apenas dados básicos');
            // Se não houver arquivo, apenas atualizar os dados básicos
            const lesson = await LessonService.updateLesson(lessonId, userId, isAdmin, req.body);
            return res.json({
                message: 'Aula atualizada com sucesso',
                lesson
            });
        }

        // Se houver arquivo, processar o upload
        const file = req.files.content_file;
        console.log('Arquivo recebido:', {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype,
            tempFilePath: file.tempFilePath,
            md5: file.md5
        });

        // Validar tipo de arquivo
        const allowedTypes = {
            'pdf': ['application/pdf'],
            'slides': ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
            'documento': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            'video': ['video/mp4', 'video/webm', 'video/ogg'],
            'texto': ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };

        const contentType = req.body.content_type;
        if (!allowedTypes[contentType] || !allowedTypes[contentType].includes(file.mimetype)) {
            throw new Error(`Tipo de arquivo inválido para ${contentType}. Tipos permitidos: ${allowedTypes[contentType].join(', ')}`);
        }

        const fileExtension = path.extname(file.name).toLowerCase();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}${fileExtension}`;
        const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lessons', fileName);

        console.log('Salvando arquivo:', {
            fileName,
            filePath,
            contentType: file.mimetype,
            tempFilePath: file.tempFilePath,
            exists: require('fs').existsSync(file.tempFilePath)
        });

        // Garantir que o diretório existe
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'lessons');
        if (!require('fs').existsSync(uploadDir)) {
            require('fs').mkdirSync(uploadDir, { recursive: true });
        }

        // Mover o arquivo para o diretório de uploads usando fs.copyFile
        try {
            const fs = require('fs').promises;
            await fs.copyFile(file.tempFilePath, filePath);
            console.log('Arquivo copiado com sucesso');
            
            // Remover arquivo temporário
            try {
                await fs.unlink(file.tempFilePath);
                console.log('Arquivo temporário removido');
            } catch (unlinkError) {
                console.error('Erro ao remover arquivo temporário:', unlinkError);
                // Não lançar erro aqui, pois o arquivo já foi copiado
            }
        } catch (error) {
            console.error('Erro detalhado ao salvar arquivo:', error);
            throw new Error(`Erro ao salvar arquivo: ${error.message}`);
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
        console.error('Erro detalhado ao atualizar aula:', error);
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