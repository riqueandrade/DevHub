const { Course, Category, User } = require('../models');
const { Op } = require('sequelize');

class CatalogController {
    // Listar cursos com filtros e paginação
    async getCourses(req, res) {
        try {
            const {
                page = 1,
                limit = 9,
                sort = 'relevance',
                search = '',
                categories = '',
                levels = '',
                price = ''
            } = req.query;

            // Construir where clause
            const where = {
                status: 'publicado'
            };

            // Filtro de busca
            if (search) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } }
                ];
            }

            // Filtro de categorias
            if (categories) {
                where.category_id = {
                    [Op.in]: categories.split(',')
                };
            }

            // Filtro de níveis
            if (levels) {
                where.level = {
                    [Op.in]: levels.split(',')
                };
            }

            // Filtro de preço
            if (price) {
                const priceFilters = price.split(',');
                if (priceFilters.includes('free')) {
                    where.price = 0;
                } else if (priceFilters.includes('paid')) {
                    where.price = { [Op.gt]: 0 };
                }
            }

            // Definir ordenação
            let order = [];
            switch (sort) {
                case 'price_asc':
                    order.push(['price', 'ASC']);
                    break;
                case 'price_desc':
                    order.push(['price', 'DESC']);
                    break;
                case 'name_asc':
                    order.push(['title', 'ASC']);
                    break;
                case 'name_desc':
                    order.push(['title', 'DESC']);
                    break;
                default:
                    order.push(['created_at', 'DESC']);
            }

            // Buscar cursos
            const { count, rows } = await Course.findAndCountAll({
                where,
                include: [{
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'name', 'avatar_url']
                }],
                order,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            });

            res.json({
                courses: rows,
                total: count,
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            console.error('Erro ao buscar cursos:', error);
            res.status(500).json({ error: 'Erro ao buscar cursos' });
        }
    }

    // Listar categorias
    async getCategories(req, res) {
        try {
            const categories = await Category.findAll({
                attributes: ['id', 'name', 'icon'],
                order: [['name', 'ASC']]
            });

            res.json(categories);
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({ error: 'Erro ao buscar categorias' });
        }
    }
}

module.exports = new CatalogController(); 