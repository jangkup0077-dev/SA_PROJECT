import { pool } from '../config/db.js';
export class NotificationRepository {
    async createNotification(data) {
        const query = `
      INSERT INTO notifications (user_id, type, title, message, entity_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const values = [data.userId, data.type, data.title, data.message, data.entityId || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    async getUserNotifications(userId, limit = 20, offset = 0) {
        const query = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
        const result = await pool.query(query, [userId, limit, offset]);
        return result.rows;
    }
    async markAsRead(notificationId, userId) {
        const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
        const result = await pool.query(query, [notificationId, userId]);
        return result.rows[0];
    }
    async markAllAsRead(userId) {
        const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE;
    `;
        const result = await pool.query(query, [userId]);
        return result.rowCount;
    }
}
export const notificationRepository = new NotificationRepository();
