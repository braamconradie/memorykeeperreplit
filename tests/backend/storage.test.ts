import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DatabaseStorage } from '../../server/storage.js'

// Mock the database
vi.mock('../../server/db.js', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('DatabaseStorage', () => {
  let storage: DatabaseStorage

  beforeEach(() => {
    storage = new DatabaseStorage()
    vi.clearAllMocks()
  })

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const userData = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      // Mock the database insert
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([userData]),
        }),
      })

      vi.mocked(storage as any).db = {
        insert: mockInsert,
      }

      const result = await storage.upsertUser(userData)

      expect(result).toEqual(userData)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should get user by id', async () => {
      const userData = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      // Mock the database select
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([userData]),
        }),
      })

      vi.mocked(storage as any).db = {
        select: mockSelect,
      }

      const result = await storage.getUser('test-user-123')

      expect(result).toEqual(userData)
      expect(mockSelect).toHaveBeenCalled()
    })
  })

  describe('People Operations', () => {
    it('should create a new person', async () => {
      const personData = {
        userId: 'test-user-123',
        fullName: 'John Doe',
        relationship: 'Friend',
        birthDate: '1990-05-15',
        notes: 'Met at college',
      }

      const createdPerson = {
        id: 1,
        ...personData,
      }

      // Mock the database insert
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdPerson]),
        }),
      })

      vi.mocked(storage as any).db = {
        insert: mockInsert,
      }

      const result = await storage.createPerson(personData)

      expect(result).toEqual(createdPerson)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should get people for a user', async () => {
      const peopleData = [
        {
          id: 1,
          userId: 'test-user-123',
          fullName: 'John Doe',
          relationship: 'Friend',
          memoryCount: 3,
          reminderCount: 2,
          upcomingReminders: [],
        },
      ]

      // Mock the database select
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(peopleData),
        }),
      })

      vi.mocked(storage as any).db = {
        select: mockSelect,
      }

      const result = await storage.getPeople('test-user-123')

      expect(result).toEqual(peopleData)
      expect(mockSelect).toHaveBeenCalled()
    })
  })

  describe('Memory Operations', () => {
    it('should create a new memory', async () => {
      const memoryData = {
        userId: 'test-user-123',
        personId: 1,
        content: 'Had a great time at the beach with John',
        tags: ['beach', 'fun'],
      }

      const createdMemory = {
        id: 1,
        ...memoryData,
        createdAt: '2024-07-10T14:30:00Z',
        updatedAt: '2024-07-10T14:30:00Z',
      }

      // Mock the database insert
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdMemory]),
        }),
      })

      vi.mocked(storage as any).db = {
        insert: mockInsert,
      }

      const result = await storage.createMemory(memoryData)

      expect(result).toEqual(createdMemory)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should get memories for a user', async () => {
      const memoriesData = [
        {
          id: 1,
          userId: 'test-user-123',
          personId: 1,
          content: 'Great day at the beach',
          tags: ['beach', 'fun'],
          createdAt: '2024-07-10T14:30:00Z',
          updatedAt: '2024-07-10T14:30:00Z',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend',
          },
        },
      ]

      // Mock the database select
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(memoriesData),
          }),
        }),
      })

      vi.mocked(storage as any).db = {
        select: mockSelect,
      }

      const result = await storage.getMemories('test-user-123')

      expect(result).toEqual(memoriesData)
      expect(mockSelect).toHaveBeenCalled()
    })
  })

  describe('Reminder Operations', () => {
    it('should create a new reminder', async () => {
      const reminderData = {
        userId: 'test-user-123',
        personId: 1,
        title: 'John\'s Birthday',
        reminderDate: '2025-05-15',
        type: 'birthday',
        advanceDays: 7,
        isRecurring: true,
      }

      const createdReminder = {
        id: 1,
        ...reminderData,
      }

      // Mock the database insert
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdReminder]),
        }),
      })

      vi.mocked(storage as any).db = {
        insert: mockInsert,
      }

      const result = await storage.createReminder(reminderData)

      expect(result).toEqual(createdReminder)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should get upcoming reminders', async () => {
      const upcomingReminders = [
        {
          id: 1,
          userId: 'test-user-123',
          personId: 1,
          title: 'John\'s Birthday',
          reminderDate: '2025-05-15',
          type: 'birthday',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend',
          },
        },
      ]

      // Mock the database select
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(upcomingReminders),
          }),
        }),
      })

      vi.mocked(storage as any).db = {
        select: mockSelect,
      }

      const result = await storage.getUpcomingReminders('test-user-123', 30)

      expect(result).toEqual(upcomingReminders)
      expect(mockSelect).toHaveBeenCalled()
    })
  })
})