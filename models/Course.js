const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    category_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    instructor_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    thumbnail: {
        type: DataTypes.STRING(255)
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    duration: {
        type: DataTypes.INTEGER,
        comment: 'Duração em minutos'
    },
    level: {
        type: DataTypes.ENUM('iniciante', 'intermediario', 'avancado'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('rascunho', 'publicado', 'arquivado'),
        defaultValue: 'rascunho'
    }
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'courses'
});

// Método estático para contar cursos em andamento de um usuário
Course.countInProgress = async function(userId) {
    try {
        const { Enrollment } = require('./index');
        return await Enrollment.count({
            where: {
                user_id: userId,
                status: 'ativo'
            }
        });
    } catch (error) {
        console.error('Erro ao contar cursos em andamento:', error);
        return 0;
    }
};

module.exports = Course; 