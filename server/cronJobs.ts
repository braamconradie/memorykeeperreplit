import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './emailService';

class CronJobService {
  start() {
    // Run every day at 5 AM to check for reminder emails
    cron.schedule('0 5 * * *', async () => {
      console.log('Running daily reminder check at 5 AM...');
      await this.checkAndSendAllReminders();
    });

    console.log('Cron jobs started successfully - will run daily at 5 AM');
  }

  // Test function to manually trigger reminder checking (for testing purposes)
  async testReminders() {
    console.log('Testing reminder check manually...');
    await this.checkAndSendAllReminders();
  }

  private async checkAndSendAllReminders() {
    try {
      const today = new Date();
      const allReminders = await storage.getDueReminders();
      
      console.log(`Checking ${allReminders.length} reminders for ${today.toDateString()}`);
      
      for (const reminder of allReminders) {
        const user = await storage.getUser(reminder.userId);
        if (!user) continue;
        
        // Parse reminder date as local date to avoid timezone issues
        const [year, month, day] = reminder.reminderDate.split('-').map(Number);
        const reminderDate = new Date(year, month - 1, day);
        let shouldSend = false;
        let emailType = '';
        
        // Check if today is the exact reminder date
        if (this.isSameDay(today, reminderDate)) {
          shouldSend = true;
          emailType = 'due';
        }
        
        // Check if today is an advance notification day
        if (reminder.advanceDays && reminder.advanceDays > 0) {
          const advanceDate = new Date(reminderDate);
          advanceDate.setDate(advanceDate.getDate() - reminder.advanceDays);
          
          if (this.isSameDay(today, advanceDate)) {
            shouldSend = true;
            emailType = 'advance';
          }
        }
        
        if (shouldSend) {
          await emailService.sendReminderEmail(user, reminder);
          console.log(`Sent ${emailType} reminder email for "${reminder.title}" to ${user.notificationEmails?.length ? user.notificationEmails.join(', ') : user.email}`);
        }
      }
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

export const cronJobService = new CronJobService();
