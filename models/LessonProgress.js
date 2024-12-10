const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class LessonProgress extends Model {}

LessonProgress.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pendente', 'em_andamento', 'concluido'),
        defaultValue: 'pendente'
    },
    start_date: {
        type: DataTypes.DATE
    },
    completion_date: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'LessonProgress',
    tableName: 'lesson_progress',
    timestamps: true
});

// Método estático para calcular o progresso total de uma matrícula
LessonProgress.getProgress = async function(enrollmentId) {
    try {
        const { Lesson, Module, Course, Enrollment } = require('./index');
        
        const totalLessons = await Lesson.count({
            include: [{
                model: Module,
                as: 'module',
                required: true,
                include: [{
                    model: Course,
                    as: 'course',
                    required: true,
                    include: [{
                        model: Enrollment,
                        as: 'enrollments',
                        required: true,
                        where: { id: enrollmentId }
                    }]
                }]
            }]
        });

        if (totalLessons === 0) return 0;

        const completedLessons = await this.count({
            where: {
                enrollment_id: enrollmentId,
                status: 'concluido'
            }
        });

        return Math.round((completedLessons / totalLessons) * 100);
    } catch (error) {
        console.error('Erro ao calcular progresso:', error);
        return 0;
    }
};

module.exports = LessonProgress; 