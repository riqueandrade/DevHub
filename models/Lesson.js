const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Module = require('./Module');

const Lesson = sequelize.define('Lesson', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'modules',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    content_type: {
        type: DataTypes.ENUM('video', 'texto', 'quiz'),
        allowNull: false
    },
    content_url: {
        type: DataTypes.STRING(255)
    },
    duration: {
        type: DataTypes.INTEGER,
        comment: 'Duração em minutos'
    },
    order_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    createdAt: 'created_at',
    updatedAt: false,
    tableName: 'lessons'
});

// Associações
Lesson.belongsTo(Module, { foreignKey: 'module_id' });
Module.hasMany(Lesson, { foreignKey: 'module_id', onDelete: 'CASCADE' });

// Método estático para calcular a duração total de um módulo
Lesson.getTotalDuration = async function(moduleId) {
    const result = await this.sum('duration', {
        where: { module_id: moduleId }
    });
    return result || 0;
};

module.exports = Lesson; 