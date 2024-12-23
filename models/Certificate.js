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
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    preview_url: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    pdf_url: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'certificates'
});

module.exports = Certificate; 