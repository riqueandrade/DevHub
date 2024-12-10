const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Enrollment = require('./Enrollment');
const Lesson = require('./Lesson');
const Module = require('./Module');
const Course = require('./Course');
const { Op } = require('sequelize');

const LessonProgress = sequelize.define('LessonProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'enrollments',
            key: 'id'
        }
    },
    lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'lessons',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('nao_iniciado', 'em_andamento', 'concluido'),
        defaultValue: 'nao_iniciado'
    },
    progress: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    last_accessed: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'lesson_progress',
    indexes: [
        {
            unique: true,
            fields: ['enrollment_id', 'lesson_id']
        }
    ]
});

// Associações
LessonProgress.belongsTo(Enrollment, { foreignKey: 'enrollment_id' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// Método estático para calcular o progresso total de uma matrícula
LessonProgress.getProgress = async function(enrollmentId) {
    try {
        const totalLessons = await Lesson.count({
            include: [{
                model: Module,
                required: true,
                include: [{
                    model: Course,
                    required: true,
                    include: [{
                        model: Enrollment,
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

// Método estático para atualizar o progresso de uma matrícula
LessonProgress.updateEnrollmentProgress = async function(enrollmentId) {
    try {
        const progress = await this.getProgress(enrollmentId);
        await Enrollment.update(
            { progress },
            { where: { id: enrollmentId } }
        );

        // Se o progresso for 100%, marcar como concluído
        if (progress === 100) {
            await Enrollment.update(
                {
                    status: 'concluido',
                    completed_at: new Date()
                },
                { where: { id: enrollmentId } }
            );
        }

        return progress;
    } catch (error) {
        console.error('Erro ao atualizar progresso da matrícula:', error);
        throw error;
    }
};

module.exports = LessonProgress; 