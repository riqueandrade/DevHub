const { Module, Course, Lesson } = require('../models');

// Criar novo módulo
exports.createModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, order_number } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar se o curso existe e se o usuário tem permissão
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este curso' });
        }

        // Criar módulo
        const module = await Module.create({
            course_id: courseId,
            title,
            description,
            order_number: order_number || await getNextModuleOrder(courseId)
        });

        res.status(201).json({
            message: 'Módulo criado com sucesso',
            module
        });
    } catch (error) {
        console.error('Erro ao criar módulo:', error);
        res.status(500).json({ error: 'Erro ao criar módulo' });
    }
};

// Atualizar módulo
exports.updateModule = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { title, description, order_number } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar módulo com curso
        const module = await Module.findByPk(moduleId, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este módulo' });
        }

        // Atualizar módulo
        await module.update({
            title: title || module.title,
            description: description || module.description,
            order_number: order_number || module.order_number
        });

        res.json({
            message: 'Módulo atualizado com sucesso',
            module
        });
    } catch (error) {
        console.error('Erro ao atualizar módulo:', error);
        res.status(500).json({ error: 'Erro ao atualizar módulo' });
    }
};

// Excluir módulo
exports.deleteModule = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Buscar módulo com curso
        const module = await Module.findByPk(moduleId, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!module) {
            return res.status(404).json({ error: 'Módulo não encontrado' });
        }

        // Verificar permissão
        if (!isAdmin && module.course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para excluir este módulo' });
        }

        // Excluir módulo
        await module.destroy();

        res.json({
            message: 'Módulo excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir módulo:', error);
        res.status(500).json({ error: 'Erro ao excluir módulo' });
    }
};

// Listar módulos de um curso
exports.getModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log('Buscando módulos para o curso:', courseId);

        const modules = await Module.findAll({
            where: { course_id: courseId },
            include: [{
                model: Lesson,
                as: 'lessons',
                attributes: ['id', 'title', 'description', 'duration', 'order_number', 'content_type', 'content_url']
            }],
            order: [
                ['order_number', 'ASC'],
                [{ model: Lesson, as: 'lessons' }, 'order_number', 'ASC']
            ]
        });

        console.log('Módulos encontrados:', modules.length);
        if (modules.length > 0) {
            console.log('Primeiro módulo:', {
                id: modules[0].id,
                title: modules[0].title,
                lessons: modules[0].lessons.map(l => ({
                    id: l.id,
                    title: l.title,
                    content_type: l.content_type
                }))
            });
        }

        res.json(modules);
    } catch (error) {
        console.error('Erro detalhado ao listar módulos:', error);
        res.status(500).json({ error: 'Erro ao listar módulos', details: error.message });
    }
};

// Reordenar módulos
exports.reorderModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleOrders } = req.body; // Array de { id, order_number }
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Verificar permissão
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        if (!isAdmin && course.instructor_id !== userId) {
            return res.status(403).json({ error: 'Sem permissão para editar este curso' });
        }

        // Atualizar ordem dos módulos
        await Promise.all(moduleOrders.map(({ id, order_number }) => 
            Module.update({ order_number }, { where: { id } })
        ));

        res.json({
            message: 'Ordem dos módulos atualizada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao reordenar módulos:', error);
        res.status(500).json({ error: 'Erro ao reordenar módulos' });
    }
};

// Função auxiliar para obter próxima ordem de módulo
async function getNextModuleOrder(courseId) {
    const lastModule = await Module.findOne({
        where: { course_id: courseId },
        order: [['order_number', 'DESC']]
    });

    return lastModule ? lastModule.order_number + 1 : 1;
} 