const { Module, Course, Lesson } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

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
    const transaction = await sequelize.transaction();
    
    try {
        const { courseId } = req.params;
        const { moduleOrder } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Validar dados de entrada
        if (!moduleOrder || !Array.isArray(moduleOrder) || moduleOrder.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'Dados inválidos',
                details: 'moduleOrder deve ser um array não vazio de IDs'
            });
        }

        // Converter IDs para números
        const moduleIds = moduleOrder.map(id => parseInt(id)).filter(id => !isNaN(id));

        // Verificar se o curso existe e se o usuário tem permissão
        const course = await Course.findByPk(courseId, { transaction });
        if (!course) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        if (!isAdmin && course.instructor_id !== userId) {
            await transaction.rollback();
            return res.status(403).json({ error: 'Sem permissão para editar este curso' });
        }

        // Verificar se todos os módulos existem e pertencem ao curso
        const modules = await Module.findAll({
            where: { 
                id: { [Op.in]: moduleIds },
                course_id: courseId 
            },
            order: [['order_number', 'ASC']],
            transaction
        });

        if (modules.length !== moduleIds.length) {
            const foundIds = modules.map(m => m.id);
            const missingIds = moduleIds.filter(id => !foundIds.includes(id));
            
            await transaction.rollback();
            return res.status(400).json({ 
                error: 'Alguns módulos não foram encontrados ou não pertencem a este curso',
                expected: moduleIds,
                found: foundIds,
                missing: missingIds
            });
        }

        // Primeiro, definir uma ordem temporária para evitar conflitos de unique
        for (let i = 0; i < moduleIds.length; i++) {
            const moduleId = moduleIds[i];
            const tempOrder = -1 * (i + 1); // Usar números negativos temporariamente
            
            await Module.update(
                { order_number: tempOrder },
                { 
                    where: { 
                        id: moduleId,
                        course_id: courseId 
                    },
                    transaction
                }
            );
        }

        // Depois, definir a ordem final
        for (let i = 0; i < moduleIds.length; i++) {
            const moduleId = moduleIds[i];
            const newOrder = i + 1;
            
            await Module.update(
                { order_number: newOrder },
                { 
                    where: { 
                        id: moduleId,
                        course_id: courseId 
                    },
                    transaction
                }
            );
        }

        // Buscar módulos atualizados para confirmar
        const updatedModules = await Module.findAll({
            where: { course_id: courseId },
            order: [['order_number', 'ASC']],
            transaction
        });

        // Commit da transação
        await transaction.commit();

        res.json({ 
            message: 'Módulos reordenados com sucesso',
            newOrder: updatedModules.map(m => ({
                id: m.id,
                order: m.order_number
            }))
        });
    } catch (error) {
        // Rollback em caso de erro
        await transaction.rollback();
        console.error('Erro ao reordenar módulos:', error);
        res.status(500).json({ 
            error: 'Erro ao reordenar módulos',
            details: error.message
        });
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

// Obter módulo específico
exports.getModule = async (req, res) => {
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
            return res.status(403).json({ error: 'Sem permissão para acessar este módulo' });
        }

        res.json(module);
    } catch (error) {
        console.error('Erro ao buscar módulo:', error);
        res.status(500).json({ error: 'Erro ao buscar módulo' });
    }
}; 