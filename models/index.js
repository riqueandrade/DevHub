const User = require('./User');
const Course = require('./Course');
const Module = require('./Module');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const LessonProgress = require('./LessonProgress');
const Activity = require('./Activity');
const Certificate = require('./Certificate');
const Category = require('./Category');

// Associações User
User.hasMany(Course, { foreignKey: 'instructor_id', as: 'courses' });
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments' });
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
User.hasMany(Certificate, { foreignKey: 'user_id', as: 'certificates' });

// Associações Course
Course.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
Course.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Course.hasMany(Module, { foreignKey: 'course_id', as: 'modules' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Course.hasMany(Certificate, { foreignKey: 'course_id', as: 'certificates' });

// Associações Category
Category.hasMany(Course, { foreignKey: 'category_id', as: 'courses' });

// Associações Module
Module.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Module.hasMany(Lesson, { foreignKey: 'module_id', as: 'lessons' });

// Associações Lesson
Lesson.belongsTo(Module, { foreignKey: 'module_id', as: 'module' });
Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id', as: 'progress' });

// Associações Enrollment
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Enrollment.hasMany(LessonProgress, { foreignKey: 'enrollment_id', as: 'lessonProgress' });

// Associações LessonProgress
LessonProgress.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id', as: 'lesson' });

// Associações Certificate
Certificate.belongsTo(User, { foreignKey: 'user_id', as: 'student' });
Certificate.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

module.exports = {
    User,
    Course,
    Module,
    Lesson,
    Enrollment,
    LessonProgress,
    Activity,
    Certificate,
    Category
}; 