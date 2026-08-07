import pool from '../utils/database.js';

export default class Level {
    static async findOne(accountId) {
        const [rows] = await pool.query(
            'SELECT * FROM levels WHERE accountId = ? LIMIT 1',
            [accountId]
        );

        return rows.length ? rows[0] : null;
    }

    static async create(data) {
        await pool.query(
            `INSERT INTO levels
            (accountId, created, level, levelProgress)
            VALUES (?, ?, ?, ?)`,
            [
                data.accountId,
                data.created,
                data.level ?? 0,
                data.levelProgress ?? 0
            ]
        );

        return this.findOne(data.accountId);
    }

    static async update(accountId, data) {
        await pool.query(
            `UPDATE levels
             SET level = ?, levelProgress = ?
             WHERE accountId = ?`,
            [
                data.level,
                data.levelProgress,
                accountId
            ]
        );

        return this.findOne(accountId);
    }

    static async delete(accountId) {
        await pool.query(
            'DELETE FROM levels WHERE accountId = ?',
            [accountId]
        );
    }
}