import nodemailer from 'nodemailer';
import { storage } from './storage';
import type { ReminderWithPerson, User } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // Use STARTTLS for port 587
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
        pass: (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, ''), // Remove all spaces
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    console.log('Email config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user || 'NOT_SET',
      pass: config.auth.pass ? `***SET*** (${config.auth.pass.length} chars)` : 'NOT_SET'
    });

    this.transporter = nodemailer.createTransport(config);
  }

  async sendReminderEmail(user: User, reminder: ReminderWithPerson): Promise<void> {
    try {
      // Use user's notification email addresses, fallback to user email if none set
      const emailAddresses = user.notificationEmails && user.notificationEmails.length > 0 
        ? user.notificationEmails 
        : [user.email].filter(Boolean);

      // Skip sending if no email addresses are configured
      if (emailAddresses.length === 0) {
        console.log(`No notification emails configured for user ${user.id}, skipping reminder email`);
        return;
      }

      const subject = this.generateSubject(reminder);
      const body = this.generateBody(user, reminder);

      for (const email of emailAddresses.filter(Boolean)) {
        await this.transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: email,
          subject,
          html: body,
        });

        console.log(`✅ Reminder email sent to ${email} for "${reminder.title}"`);
        
        // Log the email notification
        await storage.createEmailNotification({
          userId: user.id,
          reminderId: reminder.id,
          emailAddress: email,
          subject,
          body,
          status: 'sent',
        });
      }
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      
      // Log failed notification
      await storage.createEmailNotification({
        userId: user.id,
        reminderId: reminder.id,
        emailAddress: user.email || '',
        subject: this.generateSubject(reminder),
        body: this.generateBody(user, reminder),
        status: 'failed',
      });
    }
  }

  private generateSubject(reminder: ReminderWithPerson): string {
    const personName = reminder.person?.fullName || 'Someone';
    
    switch (reminder.type) {
      case 'birthday':
        return `🎂 ${personName}'s Birthday ${reminder.advanceDays && reminder.advanceDays > 0 ? `in ${reminder.advanceDays} days` : 'is today'}!`;
      case 'custom':
        return `🔔 Reminder: ${reminder.title}`;
      default:
        return `📅 Reminder: ${reminder.title}`;
    }
  }

  private generateBody(user: User, reminder: ReminderWithPerson): string {
    const personName = reminder.person?.fullName || 'Someone';
    const relationship = reminder.person?.relationship || '';
    
    let ageText = '';
    if (reminder.type === 'birthday' && reminder.person?.birthYear) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - reminder.person.birthYear;
      ageText = ` (turning ${age})`;
    }

    let bodyText = '';
    
    if (reminder.type === 'birthday') {
      const daysText = reminder.advanceDays && reminder.advanceDays > 0 
        ? `in ${reminder.advanceDays} days` 
        : 'today';
      
      bodyText = `
        <h2>🎂 Birthday Reminder</h2>
        <p><strong>${personName}'s birthday is ${daysText}${ageText}!</strong></p>
        ${relationship ? `<p><em>Relationship: ${relationship}</em></p>` : ''}
        ${reminder.person?.notes ? `<p><strong>Notes about ${personName}:</strong><br>${reminder.person.notes}</p>` : ''}
      `;
    } else {
      bodyText = `
        <h2>🔔 Custom Reminder</h2>
        <p><strong>${reminder.title}</strong></p>
        ${reminder.description ? `<p>${reminder.description}</p>` : ''}
        ${personName ? `<p><em>Related to: ${personName}</em></p>` : ''}
        ${relationship ? `<p><em>Relationship: ${relationship}</em></p>` : ''}
        ${reminder.person?.notes ? `<p><strong>Notes about ${personName}:</strong><br>${reminder.person.notes}</p>` : ''}
      `;
    }

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #6366f1; margin: 0;">Memory Keeper</h1>
              <p style="margin: 5px 0 0 0; color: #666;">Nurturing your relationships</p>
            </div>
            
            ${bodyText}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                This is an automated reminder from your Memory Keeper app.<br>
                <a href="${process.env.APP_URL || 'http://localhost:5000'}" style="color: #6366f1;">View in Memory Keeper</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Testing email connection...');
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        response: (error as any)?.response,
        responseCode: (error as any)?.responseCode,
        command: (error as any)?.command
      });
      return false;
    }
  }
}

export const emailService = new EmailService();
