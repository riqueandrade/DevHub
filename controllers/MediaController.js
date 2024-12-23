const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Course } = require('../models');

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
exports.uploadCourseThumbnail = async (req, res) => {
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