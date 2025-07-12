import {
  users,
  people,
  memories,
  reminders,
  emailNotifications,
  type User,
  type UpsertUser,
  type Person,
  type InsertPerson,
  type Memory,
  type InsertMemory,
  type Reminder,
  type InsertReminder,
  type EmailNotification,
  type InsertEmailNotification,
  type PersonWithStats,
  type MemoryWithPerson,
  type ReminderWithPerson,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // People operations
  getPeople(userId: string): Promise<PersonWithStats[]>;
  getPersonById(id: number, userId: string): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, userId: string, updates: Partial<InsertPerson>): Promise<Person>;
  deletePerson(id: number, userId: string): Promise<void>;
  
  // Memory operations
  getMemories(userId: string, personId?: number, limit?: number): Promise<MemoryWithPerson[]>;
  getMemoryById(id: number, userId: string): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: number, userId: string, updates: Partial<InsertMemory>): Promise<Memory>;
  deleteMemory(id: number, userId: string): Promise<void>;
  searchMemories(userId: string, query: string): Promise<MemoryWithPerson[]>;
  
  // Reminder operations
  getReminders(userId: string, personId?: number): Promise<ReminderWithPerson[]>;
  getUpcomingReminders(userId: string, days: number): Promise<ReminderWithPerson[]>;
  getReminderById(id: number, userId: string): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, userId: string, updates: Partial<InsertReminder>): Promise<Reminder>;
  deleteReminder(id: number, userId: string): Promise<void>;
  getDueReminders(): Promise<ReminderWithPerson[]>;
  
  // Email notification operations
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  getEmailNotifications(userId: string): Promise<EmailNotification[]>;
  
  // Stats operations
  getUserStats(userId: string): Promise<{
    peopleCount: number;
    memoriesCount: number;
    remindersCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // People operations
  async getPeople(userId: string): Promise<PersonWithStats[]> {
    const result = await db
      .select({
        id: people.id,
        userId: people.userId,
        fullName: people.fullName,
        relationship: people.relationship,
        birthDate: people.birthDate,
        birthYear: people.birthYear,
        notes: people.notes,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
        memoryCount: sql<number>`count(distinct ${memories.id})`,
        reminderCount: sql<number>`count(distinct ${reminders.id})`,
      })
      .from(people)
      .leftJoin(memories, eq(people.id, memories.personId))
      .leftJoin(reminders, eq(people.id, reminders.personId))
      .where(eq(people.userId, userId))
      .groupBy(people.id)
      .orderBy(asc(people.fullName));

    const peopleWithStats = await Promise.all(
      result.map(async (person) => {
        const upcomingReminders = await this.getUpcomingReminders(userId, 30);
        return {
          ...person,
          upcomingReminders: upcomingReminders.filter(r => r.personId === person.id),
        };
      })
    );

    return peopleWithStats;
  }

  async getPersonById(id: number, userId: string): Promise<Person | undefined> {
    const [person] = await db
      .select()
      .from(people)
      .where(and(eq(people.id, id), eq(people.userId, userId)));
    return person;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const [newPerson] = await db.insert(people).values(person).returning();
    return newPerson;
  }

  async updatePerson(id: number, userId: string, updates: Partial<InsertPerson>): Promise<Person> {
    const [updatedPerson] = await db
      .update(people)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(people.id, id), eq(people.userId, userId)))
      .returning();
    return updatedPerson;
  }

  async deletePerson(id: number, userId: string): Promise<void> {
    await db.delete(people).where(and(eq(people.id, id), eq(people.userId, userId)));
  }

  // Memory operations
  async getMemories(userId: string, personId?: number, limit?: number): Promise<MemoryWithPerson[]> {
    let whereConditions = [eq(memories.userId, userId)];
    
    if (personId) {
      whereConditions.push(eq(memories.personId, personId));
    }

    let baseQuery = db
      .select({
        id: memories.id,
        userId: memories.userId,
        personId: memories.personId,
        content: memories.content,
        tags: memories.tags,
        createdAt: memories.createdAt,
        updatedAt: memories.updatedAt,
        person: {
          id: people.id,
          userId: people.userId,
          fullName: people.fullName,
          relationship: people.relationship,
          birthDate: people.birthDate,
          birthYear: people.birthYear,
          notes: people.notes,
          createdAt: people.createdAt,
          updatedAt: people.updatedAt,
        },
      })
      .from(memories)
      .leftJoin(people, eq(memories.personId, people.id))
      .where(and(...whereConditions))
      .orderBy(desc(memories.createdAt));

    const results = limit ? await baseQuery.limit(limit) : await baseQuery;
    
    return results.map(row => ({
      ...row,
      person: row.person && row.person.id ? row.person : undefined,
    })) as MemoryWithPerson[];
  }

  async getMemoryById(id: number, userId: string): Promise<Memory | undefined> {
    const [memory] = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, id), eq(memories.userId, userId)));
    return memory;
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const [newMemory] = await db.insert(memories).values(memory).returning();
    return newMemory;
  }

  async updateMemory(id: number, userId: string, updates: Partial<InsertMemory>): Promise<Memory> {
    const [updatedMemory] = await db
      .update(memories)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(memories.id, id), eq(memories.userId, userId)))
      .returning();
    return updatedMemory;
  }

  async deleteMemory(id: number, userId: string): Promise<void> {
    await db.delete(memories).where(and(eq(memories.id, id), eq(memories.userId, userId)));
  }

  async searchMemories(userId: string, query: string): Promise<MemoryWithPerson[]> {
    const results = await db
      .select({
        id: memories.id,
        userId: memories.userId,
        personId: memories.personId,
        content: memories.content,
        tags: memories.tags,
        createdAt: memories.createdAt,
        updatedAt: memories.updatedAt,
        person: {
          id: people.id,
          userId: people.userId,
          fullName: people.fullName,
          relationship: people.relationship,
          birthDate: people.birthDate,
          birthYear: people.birthYear,
          notes: people.notes,
          createdAt: people.createdAt,
          updatedAt: people.updatedAt,
        },
      })
      .from(memories)
      .leftJoin(people, eq(memories.personId, people.id))
      .where(
        and(
          eq(memories.userId, userId),
          ilike(memories.content, `%${query}%`)
        )
      )
      .orderBy(desc(memories.createdAt));
    
    return results.map(row => ({
      ...row,
      person: row.person && row.person.id ? row.person : undefined,
    })) as MemoryWithPerson[];
  }

  // Reminder operations
  async getReminders(userId: string, personId?: number): Promise<ReminderWithPerson[]> {
    let whereConditions = [eq(reminders.userId, userId), eq(reminders.isActive, true)];
    
    if (personId) {
      whereConditions.push(eq(reminders.personId, personId));
    }

    const results = await db
      .select({
        id: reminders.id,
        userId: reminders.userId,
        personId: reminders.personId,
        type: reminders.type,
        title: reminders.title,
        description: reminders.description,
        reminderDate: reminders.reminderDate,
        advanceDays: reminders.advanceDays,
        isRecurring: reminders.isRecurring,
        isActive: reminders.isActive,
        createdAt: reminders.createdAt,
        updatedAt: reminders.updatedAt,
        person: {
          id: people.id,
          userId: people.userId,
          fullName: people.fullName,
          relationship: people.relationship,
          birthDate: people.birthDate,
          birthYear: people.birthYear,
          notes: people.notes,
          createdAt: people.createdAt,
          updatedAt: people.updatedAt,
        },
      })
      .from(reminders)
      .leftJoin(people, eq(reminders.personId, people.id))
      .where(and(...whereConditions))
      .orderBy(asc(reminders.reminderDate));

    return results.map(row => ({
      ...row,
      person: row.person && row.person.id ? row.person : undefined,
    })) as ReminderWithPerson[];
  }

  async getUpcomingReminders(userId: string, days: number): Promise<ReminderWithPerson[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const results = await db
      .select({
        id: reminders.id,
        userId: reminders.userId,
        personId: reminders.personId,
        type: reminders.type,
        title: reminders.title,
        description: reminders.description,
        reminderDate: reminders.reminderDate,
        advanceDays: reminders.advanceDays,
        isRecurring: reminders.isRecurring,
        isActive: reminders.isActive,
        createdAt: reminders.createdAt,
        updatedAt: reminders.updatedAt,
        person: {
          id: people.id,
          userId: people.userId,
          fullName: people.fullName,
          relationship: people.relationship,
          birthDate: people.birthDate,
          birthYear: people.birthYear,
          notes: people.notes,
          createdAt: people.createdAt,
          updatedAt: people.updatedAt,
        },
      })
      .from(reminders)
      .leftJoin(people, eq(reminders.personId, people.id))
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.isActive, true),
          gte(reminders.reminderDate, today.toISOString().split('T')[0]),
          lte(reminders.reminderDate, futureDate.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(reminders.reminderDate));
    
    return results.map(row => ({
      ...row,
      person: row.person && row.person.id ? row.person : undefined,
    })) as ReminderWithPerson[];
  }

  async getReminderById(id: number, userId: string): Promise<Reminder | undefined> {
    const [reminder] = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
    return reminder;
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, userId: string, updates: Partial<InsertReminder>): Promise<Reminder> {
    const [updatedReminder] = await db
      .update(reminders)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning();
    return updatedReminder;
  }

  async deleteReminder(id: number, userId: string): Promise<void> {
    await db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
  }

  async getDueReminders(): Promise<ReminderWithPerson[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const results = await db
      .select({
        id: reminders.id,
        userId: reminders.userId,
        personId: reminders.personId,
        type: reminders.type,
        title: reminders.title,
        description: reminders.description,
        reminderDate: reminders.reminderDate,
        advanceDays: reminders.advanceDays,
        isRecurring: reminders.isRecurring,
        isActive: reminders.isActive,
        createdAt: reminders.createdAt,
        updatedAt: reminders.updatedAt,
        person: {
          id: people.id,
          userId: people.userId,
          fullName: people.fullName,
          relationship: people.relationship,
          birthDate: people.birthDate,
          birthYear: people.birthYear,
          notes: people.notes,
          createdAt: people.createdAt,
          updatedAt: people.updatedAt,
        },
      })
      .from(reminders)
      .leftJoin(people, eq(reminders.personId, people.id))
      .where(
        and(
          eq(reminders.isActive, true),
          lte(reminders.reminderDate, today)
        )
      )
      .orderBy(asc(reminders.reminderDate));
    
    return results.map(row => ({
      ...row,
      person: row.person && row.person.id ? row.person : undefined,
    })) as ReminderWithPerson[];
  }

  // Email notification operations
  async createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification> {
    const [newNotification] = await db.insert(emailNotifications).values(notification).returning();
    return newNotification;
  }

  async getEmailNotifications(userId: string): Promise<EmailNotification[]> {
    return await db
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.userId, userId))
      .orderBy(desc(emailNotifications.sentAt));
  }

  // Stats operations
  async getUserStats(userId: string): Promise<{
    peopleCount: number;
    memoriesCount: number;
    remindersCount: number;
  }> {
    const [peopleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(people)
      .where(eq(people.userId, userId));

    const [memoriesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memories)
      .where(eq(memories.userId, userId));

    const [remindersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.isActive, true)));

    return {
      peopleCount: peopleCount.count,
      memoriesCount: memoriesCount.count,
      remindersCount: remindersCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
