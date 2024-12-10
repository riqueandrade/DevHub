const User = require('./User');
const Course = require('./Course');
const Module = require('./Module');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const LessonProgress = require('./LessonProgress');
const Certificate = require('./Certificate');
const Activity = require('./Activity');

// Associações User-Course (Instrutor)
User.hasMany(Course, { foreignKey: 'instructor_id', as: 'coursesTeaching' });
Course.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Associações User-Enrollment
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Associações Course-Enrollment
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Associações Course-Module
Course.hasMany(Module, { foreignKey: 'course_id', as: 'modules', onDelete: 'CASCADE' });
Module.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Associações Module-Lesson
Module.hasMany(Lesson, { foreignKey: 'module_id', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });

// Associações Enrollment-LessonProgress
Enrollment.hasMany(LessonProgress, { foreignKey: 'enrollment_id', as: 'lessonProgresses', onDelete: 'CASCADE' });
LessonProgress.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });

// Associações Lesson-LessonProgress
Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id', as: 'lessonProgresses' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// Associações Certificate
User.hasMany(Certificate, { foreignKey: 'user_id', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Course.hasMany(Certificate, { foreignKey: 'course_id', as: 'certificates' });
Certificate.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Associações Activity
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
    User,
    Course,
    Module,
    Lesson,
    Enrollment,
    LessonProgress,
    Certificate,
    Activity
}; 