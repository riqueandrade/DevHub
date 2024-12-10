const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
    async validatePassword(password) {
        return bcrypt.compare(password, this.password);
    }

    async getStudyHours() {
        const { LessonProgress, Lesson, Enrollment } = require('./index');
        
        const result = await LessonProgress.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('lesson.duration')), 'total_minutes']
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
            where: {
                status: 'concluido'
            },
            raw: true
        });

        const totalMinutes = result?.total_minutes || 0;
        return Math.ceil(totalMinutes / 60);
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
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('aluno', 'instrutor', 'admin'),
        defaultValue: 'aluno'
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
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(8);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(8);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

module.exports = User; 