const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

class User extends Model {
    async checkPassword(password) {
        return bcrypt.compare(password, this.password);
    }

    async getStudyHours() {
        const { Enrollment, Lesson, LessonProgress } = require('./index');
        const result = await LessonProgress.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('lesson.duration')), 'total_hours']
            ],
            include: [{
                model: Lesson,
                as: 'lesson',
                attributes: []
            }, {
                model: Enrollment,
                as: 'enrollment',
                attributes: [],
                where: { user_id: this.id }
            }],
            where: { status: 'concluido' },
            raw: true
        });

        return result?.total_hours || 0;
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('aluno', 'instrutor', 'admin'),
        defaultValue: 'aluno'
    },
    google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '/images/default-avatar.png'
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ativo', 'inativo'),
        defaultValue: 'ativo'
    },
    // Configurações de notificações
    email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    course_updates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    promotional_emails: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Configurações de privacidade
    profile_visibility: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    show_progress: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    show_certificates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 8);
            }
        }
    }
});

module.exports = User; 