const { Course, Module, Lesson, User } = require('../models');
const { Op } = require('sequelize');

// Criar novo curso
exports.createCourse = async (req, res) => {
    try {
        const { title, description, level, duration, price } = req.body;
        const userId = req.user.id;

        const course = await Course.create({
            title,
            description,
            level,
            duration,
            price,
            instructor_id: userId,
            status: 'rascunho'
        });

        res.status(201).json({
            message: 'Curso criado com sucesso',
            course
        });
    } catch (error) {
        console.error('Erro ao criar curso:', error);
        res.status(500).json({ error: 'Erro ao criar curso' });
    }
};

// Atualizar curso
exports.updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, level, duration, price, status } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar curso
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este curso' });
        }

        // Validar status
        if (status === 'publicado') {
            const hasModules = await Module.count({ where: { course_id: courseId } });
            if (!hasModules) {
                return res.status(400).json({ error: 'O curso precisa ter pelo menos um módulo para ser publicado' });
            }

            const hasLessons = await Lesson.count({
                include: [{
                    model: Module,
                    as: 'module',
                    where: { course_id: courseId }
                }]
            });

            if (!hasLessons) {
                return res.status(400).json({ error: 'O curso precisa ter pelo menos uma aula para ser publicado' });
            }
        }

        // Atualizar curso
        await course.update({
            title: title || course.title,
            description: description || course.description,
            level: level || course.level,
            duration: duration || course.duration,
            price: price || course.price,
            status: status || course.status
        });

        res.json({
            message: 'Curso atualizado com sucesso',
            course
        });
    } catch (error) {
        console.error('Erro ao atualizar curso:', error);
        res.status(500).json({ error: 'Erro ao atualizar curso' });
    }
};

// Excluir curso
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar curso
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir este curso' });
        }

        // Excluir curso
        await course.destroy();

        res.json({
            message: 'Curso excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir curso:', error);
        res.status(500).json({ error: 'Erro ao excluir curso' });
    }
};

// Listar cursos do instrutor
exports.getInstructorCourses = async (req, res) => {
    try {
        const userId = req.user.id;

        const courses = await Course.findAll({
            where: { instructor_id: userId },
            include: [{
                model: Module,
                as: 'modules',
                include: [{
                    model: Lesson,
                    as: 'lessons',
                    attributes: ['id', 'title', 'duration']
                }]
            }],
            order: [
                ['created_at', 'DESC'],
                [{ model: Module, as: 'modules' }, 'order', 'ASC'],
                [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order', 'ASC']
            ]
        });

        res.json(courses);
    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        res.status(500).json({ error: 'Erro ao listar cursos' });
    }
};

// Buscar curso por ID
exports.getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const course = await Course.findByPk(courseId, {
            include: [{
                model: Module,
                as: 'modules',
                include: [{
                    model: Lesson,
                    as: 'lessons',
                    attributes: ['id', 'title', 'description', 'duration', 'content_url', 'content_type', 'order_number']
                }]
            }, {
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar_url', 'bio']
            }],
            order: [
                [{ model: Module, as: 'modules' }, 'order_number', 'ASC'],
                [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order_number', 'ASC']
            ]
        });

        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Se o curso não estiver publicado, verificar permissão
        if (course.status !== 'publicado' && course.instructor_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Sem permissão para visualizar este curso' });
        }

        res.json(course);
    } catch (error) {
        console.error('Erro ao buscar curso:', error);
        res.status(500).json({ error: 'Erro ao buscar curso' });
    }
};

// Buscar cursos publicados
exports.getPublishedCourses = async (req, res) => {
    try {
        const { search, level, instructor } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Construir where clause
        const whereClause = {
            status: 'publicado'
        };

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (level) {
            whereClause.level = level;
        }

        if (instructor) {
            whereClause.instructor_id = instructor;
        }

        // Buscar cursos
        const { count, rows: courses } = await Course.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'avatar_url']
            }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            courses,
            total: count,
            pages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
}; 