import { notificationRepository, CreateNotificationData } from '../repositories/notificationRepository.js';
import { io } from '../index.js';

export class NotificationService {
  async sendNotification(data: CreateNotificationData) {
    // 1. Save to DB
    const notification = await notificationRepository.createNotification(data);
    
    // 2. Emit real-time event if user is connected
    // Room name MUST match frontend join_global: user_${id}
    // Event name MUST match frontend App.vue: new_notification
    io.to(`user_${data.userId}`).emit('new_notification', notification);

    return notification;
  }

  async getUserNotifications(userId: number, limit?: number, offset?: number) {
    return await notificationRepository.getUserNotifications(userId, limit, offset);
  }

  async markAsRead(notificationId: number, userId: number) {
    const updated = await notificationRepository.markAsRead(notificationId, userId);
    if (!updated) {
      throw new Error("Notification not found or unauthorized");
    }
    return updated;
  }

  async markAllAsRead(userId: number) {
    return await notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
