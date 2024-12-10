const db = require('../config/database');

class Activity {
    static async create({ user_id, type, description }) {
        try {
            const query = `
                INSERT INTO activities (user_id, type, description)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const values = [user_id, type, description];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Erro ao criar atividade:', error);
            throw error;
        }
    }

    static async findByUser(userId) {
        try {
            const query = `
                SELECT *
                FROM activities
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10
            `;
            const result = await db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar atividades do usuário:', error);
            throw error;
        }
    }
}

module.exports = Activity; 