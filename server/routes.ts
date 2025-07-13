import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { cronJobService } from "./cronJobs";
import { emailService } from "./emailService";
import { 
  insertPersonSchema, 
  insertMemorySchema, 
  insertReminderSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Start cron jobs
  cronJobService.start();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User settings routes
  app.get('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ notificationEmails: user?.notificationEmails || [] });
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { notificationEmails } = req.body;
      
      // Validate email addresses
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (notificationEmails && Array.isArray(notificationEmails)) {
        for (const email of notificationEmails) {
          if (!emailRegex.test(email)) {
            return res.status(400).json({ message: `Invalid email address: ${email}` });
          }
        }
      }

      const updatedUser = await storage.updateUserSettings(userId, { notificationEmails });
      res.json({ notificationEmails: updatedUser.notificationEmails });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // People routes
  app.get('/api/people', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const people = await storage.getPeople(userId);
      res.json(people);
    } catch (error) {
      console.error("Error fetching people:", error);
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get('/api/people/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personId = parseInt(req.params.id);
      const person = await storage.getPersonById(personId, userId);
      
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(person);
    } catch (error) {
      console.error("Error fetching person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post('/api/people', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personData = insertPersonSchema.parse({
        ...req.body,
        userId,
      });
      
      const person = await storage.createPerson(personData);
      res.json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  app.put('/api/people/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personId = parseInt(req.params.id);
      const updates = insertPersonSchema.partial().parse(req.body);
      
      const person = await storage.updatePerson(personId, userId, updates);
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  app.delete('/api/people/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personId = parseInt(req.params.id);
      
      await storage.deletePerson(personId, userId);
      res.json({ message: "Person deleted successfully" });
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Memory routes
  app.get('/api/memories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personId = req.query.personId ? parseInt(req.query.personId) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      
      const memories = await storage.getMemories(userId, personId, limit);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.get('/api/memories/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const memories = await storage.searchMemories(userId, query);
      res.json(memories);
    } catch (error) {
      console.error("Error searching memories:", error);
      res.status(500).json({ message: "Failed to search memories" });
    }
  });

  app.post('/api/memories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memoryData = insertMemorySchema.parse({
        ...req.body,
        userId,
      });
      
      const memory = await storage.createMemory(memoryData);
      res.json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(500).json({ message: "Failed to create memory" });
    }
  });

  app.put('/api/memories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memoryId = parseInt(req.params.id);
      const updates = insertMemorySchema.partial().parse(req.body);
      
      const memory = await storage.updateMemory(memoryId, userId, updates);
      res.json(memory);
    } catch (error) {
      console.error("Error updating memory:", error);
      res.status(500).json({ message: "Failed to update memory" });
    }
  });

  app.delete('/api/memories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memoryId = parseInt(req.params.id);
      
      await storage.deleteMemory(memoryId, userId);
      res.json({ message: "Memory deleted successfully" });
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ message: "Failed to delete memory" });
    }
  });

  // Reminder routes
  app.get('/api/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const personId = req.query.personId ? parseInt(req.query.personId) : undefined;
      
      const reminders = await storage.getReminders(userId, personId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.get('/api/reminders/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = req.query.days ? parseInt(req.query.days) : 30;
      
      const reminders = await storage.getUpcomingReminders(userId, days);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reminders" });
    }
  });

  app.post('/api/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId,
      });
      
      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put('/api/reminders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminderId = parseInt(req.params.id);
      const updates = insertReminderSchema.partial().parse(req.body);
      
      const reminder = await storage.updateReminder(reminderId, userId, updates);
      res.json(reminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete('/api/reminders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminderId = parseInt(req.params.id);
      
      await storage.deleteReminder(reminderId, userId);
      res.json({ message: "Reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Stats route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Email test route (for development)
  app.post('/api/test-email', isAuthenticated, async (req: any, res) => {
    try {
      const canSend = await emailService.testConnection();
      res.json({ canSend, message: canSend ? "Email service is working" : "Email service is not configured" });
    } catch (error) {
      console.error("Error testing email:", error);
      res.status(500).json({ message: "Failed to test email service" });
    }
  });

  // Test reminder emails (for development)
  app.post('/api/test-reminders', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Manual test of reminder system triggered");
      
      // First check if SMTP is configured
      const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (!hasSmtpConfig) {
        console.log("❌ SMTP credentials not configured - cannot send emails");
        return res.json({ 
          message: "SMTP credentials not configured. Please set up SMTP_USER, SMTP_PASS, and other email settings.",
          configured: false 
        });
      }
      
      await cronJobService.testReminders();
      res.json({ message: "Reminder test completed. Check server logs for details.", configured: true });
    } catch (error) {
      console.error("Error testing reminders:", error);
      res.status(500).json({ message: "Failed to test reminder system" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
