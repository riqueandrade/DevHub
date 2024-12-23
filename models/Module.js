const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Module = sequelize.define('Module', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'courses',
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
    order_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    createdAt: 'created_at',
    updatedAt: false,
    tableName: 'modules'
});

module.exports = Module; 