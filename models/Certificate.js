const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
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
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    certificate_url: {
        type: DataTypes.VIRTUAL,
        get() {
            return `/certificates/certificate_${this.id}.pdf`;
        }
    },
    issued_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'certificates'
});

// Método estático para contar certificados de um usuário
Certificate.countByUser = async function(userId) {
    try {
        return await this.count({
            where: { user_id: userId }
        });
    } catch (error) {
        console.error('Erro ao contar certificados:', error);
        return 0;
    }
};

module.exports = Certificate; 