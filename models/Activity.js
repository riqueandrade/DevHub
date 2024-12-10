const { DataTypes, Op } = require('sequelize');
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
    updatedAt: false,
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

// Método estático para calcular streak de dias seguidos
Activity.getStreak = async function(userId) {
    try {
        const activities = await this.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date']
            ],
            where: { 
                user_id: userId,
                created_at: {
                    [Op.gte]: sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 30 DAY)')
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'DESC']],
            raw: true
        });

        if (activities.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < activities.length; i++) {
            const activityDate = new Date(activities[i].date);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (activityDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        // Se o usuário não tiver atividade hoje, verificar se teve ontem
        if (streak === 0) {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            for (let i = 0; i < activities.length; i++) {
                const activityDate = new Date(activities[i].date);
                const expectedDate = new Date(yesterday);
                expectedDate.setDate(yesterday.getDate() - i);

                if (activityDate.getTime() === expectedDate.getTime()) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        return streak;
    } catch (error) {
        console.error('Erro ao calcular streak:', error);
        return 0;
    }
};

module.exports = Activity; 