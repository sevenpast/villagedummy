/**
 * NOTIFICATION ENGINE
 * 
 * Handles all notifications and reminders in the system
 * - Schedule reminders
 * - Send in-app notifications
 * - Trigger email notifications
 * - Manage notification preferences
 */

import { createClient } from '@supabase/supabase-js';
import { addDays, addHours, isBefore } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface Reminder {
  id: string;
  user_id: string;
  task_id?: number;
  message: string;
  scheduled_for: Date;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'cancelled';
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  action_url?: string;
  is_read: boolean;
  created_at: Date;
}

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  reminder_frequency: 'daily' | 'weekly' | 'custom';
}

export class NotificationEngine {
  /**
   * Schedule a reminder for a user
   */
  async scheduleReminder(
    userId: string,
    taskId: number,
    message: string,
    scheduledFor: Date,
    reminderType: string = 'task_deadline'
  ): Promise<{ success: boolean; reminderId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          task_id: taskId,
          message,
          scheduled_for: scheduledFor.toISOString(),
          reminder_type: reminderType,
          status: 'pending',
          send_via_email: true,
          send_via_push: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error scheduling reminder:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reminderId: data.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule automatic reminder based on task deadline
   */
  async scheduleTaskDeadlineReminder(
    userId: string,
    taskId: number,
    deadlineDate: Date,
    taskTitle: string
  ): Promise<void> {
    // Schedule 3 reminders: 7 days before, 3 days before, 1 day before
    const reminderDays = [7, 3, 1];

    for (const days of reminderDays) {
      const reminderDate = addDays(deadlineDate, -days);

      // Only schedule if in the future
      if (isBefore(new Date(), reminderDate)) {
        await this.scheduleReminder(
          userId,
          taskId,
          `Reminder: "${taskTitle}" is due in ${days} day${days > 1 ? 's' : ''}`,
          reminderDate,
          'task_deadline'
        );
      }
    }
  }

  /**
   * Cancel all reminders for a task (when task is completed)
   */
  async cancelTaskReminders(userId: string, taskId: number): Promise<void> {
    await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('status', 'pending');
  }

  /**
   * Get pending reminders (for cron job)
   */
  async getPendingReminders(): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching pending reminders:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(reminderId: string): Promise<void> {
    await supabase
      .from('reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', reminderId);
  }

  /**
   * Create in-app notification
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    notificationType: string,
    actionUrl?: string
  ): Promise<{ success: boolean; notificationId?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          notification_type: notificationType,
          action_url: actionUrl,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false };
      }

      return { success: true, notificationId: data.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false };
    }
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllNotificationsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  /**
   * Send task completion congratulations
   */
  async sendTaskCompletionNotification(
    userId: string,
    taskTitle: string,
    taskId: number
  ): Promise<void> {
    await this.createNotification(
      userId,
      '🎉 Task Completed!',
      `Great job! You've completed "${taskTitle}". Keep up the good work!`,
      'task_completion',
      `/tasks/${taskId}`
    );
  }

  /**
   * Send milestone notification
   */
  async sendMilestoneNotification(
    userId: string,
    milestone: string,
    completedTasks: number,
    totalTasks: number
  ): Promise<void> {
    await this.createNotification(
      userId,
      `🏆 Milestone Reached: ${milestone}`,
      `You've completed ${completedTasks} out of ${totalTasks} tasks. You're ${Math.round((completedTasks / totalTasks) * 100)}% done!`,
      'milestone',
      '/dashboard'
    );
  }

  /**
   * Send urgent task notification
   */
  async sendUrgentTaskNotification(
    userId: string,
    taskTitle: string,
    taskId: number,
    daysRemaining: number
  ): Promise<void> {
    await this.createNotification(
      userId,
      '⚠️ Urgent Task',
      `"${taskTitle}" is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Complete it soon!`,
      'urgent_task',
      `/tasks/${taskId}`
    );
  }

  /**
   * Get notification count (for badge)
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<void> {
    const thirtyDaysAgo = addDays(new Date(), -30);

    await supabase
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo.toISOString());
  }
}

// Export singleton instance
export const notificationEngine = new NotificationEngine();
