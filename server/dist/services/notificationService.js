import { notificationRepository } from '../repositories/notificationRepository.js';
import { io } from '../index.js';
export class NotificationService {
    async sendNotification(data) {
        // 1. Save to DB
        const notification = await notificationRepository.createNotification(data);
        // 2. Emit real-time event if user is connected
        io.to(data.userId.toString()).emit('notification', notification);
        return notification;
    }
    async getUserNotifications(userId, limit, offset) {
        return await notificationRepository.getUserNotifications(userId, limit, offset);
    }
    async markAsRead(notificationId, userId) {
        const updated = await notificationRepository.markAsRead(notificationId, userId);
        if (!updated) {
            throw new Error("Notification not found or unauthorized");
        }
        return updated;
    }
    async markAllAsRead(userId) {
        return await notificationRepository.markAllAsRead(userId);
    }
}
export const notificationService = new NotificationService();
