import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './emailService';

class CronJobService {
  start() {
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily reminder check...');
      await this.checkAndSendReminders();
    });

    // Run every hour during business hours for advance reminders
    cron.schedule('0 9-17 * * *', async () => {
      console.log('Running hourly reminder check...');
      await this.checkAndSendAdvanceReminders();
    });

    console.log('Cron jobs started successfully');
  }

  private async checkAndSendReminders() {
    try {
      const dueReminders = await storage.getDueReminders();
      
      for (const reminder of dueReminders) {
        const user = await storage.getUser(reminder.userId);
        if (user && user.email) {
          await emailService.sendReminderEmail(user, reminder);
          console.log(`Sent reminder email for ${reminder.title} to ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
    }
  }

  private async checkAndSendAdvanceReminders() {
    try {
      const today = new Date();
      const reminders = await storage.getDueReminders();
      
      for (const reminder of reminders) {
        if (reminder.advanceDays && reminder.advanceDays > 0) {
          const reminderDate = new Date(reminder.reminderDate);
          const advanceDate = new Date(reminderDate);
          advanceDate.setDate(advanceDate.getDate() - reminder.advanceDays);
          
          // Check if today is the advance notification day
          if (this.isSameDay(today, advanceDate)) {
            const user = await storage.getUser(reminder.userId);
            if (user && user.email) {
              await emailService.sendReminderEmail(user, reminder);
              console.log(`Sent advance reminder email for ${reminder.title} to ${user.email}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking and sending advance reminders:', error);
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

export const cronJobService = new CronJobService();
