const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    icon: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'bi-folder'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'categories'
});

module.exports = Category;