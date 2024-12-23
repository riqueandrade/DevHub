const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class AvatarService {
    constructor() {
        // Criar diretório de uploads se não existir
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Diretório de avatares criado:', uploadDir);
        }
    }

    async downloadAndSaveAvatar(avatarUrl) {
        try {
            if (!avatarUrl) return null;

            // Garantir que o diretório existe
            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Diretório de avatares criado:', uploadDir);
            }

            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            
            const filename = `${uuidv4()}.jpg`;
            const filepath = path.join(uploadDir, filename);
            
            fs.writeFileSync(filepath, buffer);
            console.log('Avatar salvo com sucesso:', filepath);
            
            return `/uploads/avatars/${filename}`;
        } catch (error) {
            console.error('Erro ao baixar avatar:', error);
            return null;
        }
    }

    validateAvatar(file) {
        // Verificar se é uma imagem
        if (!file.mimetype.startsWith('image/')) {
            throw new Error('O arquivo deve ser uma imagem');
        }

        // Verificar tamanho (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('O arquivo deve ter no máximo 5MB');
        }

        // Verificar extensão
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const extension = path.extname(file.name).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            throw new Error('Extensão de arquivo não permitida');
        }

        return true;
    }

    async processAvatar(file) {
        try {
            this.validateAvatar(file);

            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
            const filename = `${uuidv4()}${path.extname(file.name)}`;
            const filepath = path.join(uploadDir, filename);

            await file.mv(filepath);
            
            return `/uploads/avatars/${filename}`;
        } catch (error) {
            console.error('Erro ao processar avatar:', error);
            throw error;
        }
    }
}

module.exports = new AvatarService(); 