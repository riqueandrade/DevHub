const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'activities'
});

// Método estático para criar uma atividade
Activity.createActivity = async function(data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        throw error;
    }
};

// Método estático para buscar atividades de um usuário
Activity.findByUser = async function(userId) {
    try {
        return await this.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: 10
        });
    } catch (error) {
        console.error('Erro ao buscar atividades do usuário:', error);
        throw error;
    }
};

module.exports = Activity; 