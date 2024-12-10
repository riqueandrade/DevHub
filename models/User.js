const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
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
        allowNull: true,
        validate: {
            len: {
                args: [6, 100],
                msg: "A senha deve ter pelo menos 6 caracteres"
            }
        }
    },
    google_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 8);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 8);
            }
        }
    },
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'users'
});

User.prototype.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = User; 