import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { registerRoutes } from '../../server/routes.js'
import { storage } from '../../server/storage.js'

// Mock the storage
vi.mock('../../server/storage.js', () => ({
  storage: {
    getUser: vi.fn(),
    upsertUser: vi.fn(),
    getPeople: vi.fn(),
    createPerson: vi.fn(),
    getMemories: vi.fn(),
    createMemory: vi.fn(),
    getReminders: vi.fn(),
    createReminder: vi.fn(),
    getUserStats: vi.fn(),
    getUpcomingReminders: vi.fn(),
  },
}))

// Mock authentication middleware
vi.mock('../../server/replitAuth.js', () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id' }
    next()
  },
}))

describe('API Routes', () => {
  let app: express.Application

  beforeAll(async () => {
    app = express()
    app.use(express.json())
    await registerRoutes(app)
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/people', () => {
    it('should return list of people', async () => {
      const mockPeople = [
        {
          id: 1,
          fullName: 'John Doe',
          relationship: 'Friend',
          memoryCount: 3,
          reminderCount: 2,
          upcomingReminders: [],
        },
      ]

      vi.mocked(storage.getPeople).mockResolvedValue(mockPeople)

      const response = await request(app)
        .get('/api/people')
        .expect(200)

      expect(response.body).toEqual(mockPeople)
      expect(storage.getPeople).toHaveBeenCalledWith('test-user-id')
    })
  })

  describe('POST /api/people', () => {
    it('should create a new person', async () => {
      const newPerson = {
        fullName: 'Jane Smith',
        relationship: 'Sister',
        birthDate: '1992-03-20',
        notes: 'Lives in Seattle',
      }

      const createdPerson = {
        id: 2,
        userId: 'test-user-id',
        ...newPerson,
      }

      vi.mocked(storage.createPerson).mockResolvedValue(createdPerson)

      const response = await request(app)
        .post('/api/people')
        .send(newPerson)
        .expect(201)

      expect(response.body).toEqual(createdPerson)
      expect(storage.createPerson).toHaveBeenCalledWith({
        ...newPerson,
        userId: 'test-user-id',
      })
    })

    it('should validate required fields', async () => {
      const invalidPerson = {
        relationship: 'Friend',
        // Missing fullName
      }

      await request(app)
        .post('/api/people')
        .send(invalidPerson)
        .expect(400)
    })
  })

  describe('GET /api/memories', () => {
    it('should return list of memories', async () => {
      const mockMemories = [
        {
          id: 1,
          content: 'Great day at the beach',
          createdAt: '2024-07-10T14:30:00Z',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend',
          },
        },
      ]

      vi.mocked(storage.getMemories).mockResolvedValue(mockMemories)

      const response = await request(app)
        .get('/api/memories')
        .expect(200)

      expect(response.body).toEqual(mockMemories)
      expect(storage.getMemories).toHaveBeenCalledWith('test-user-id', undefined, undefined)
    })

    it('should filter memories by person', async () => {
      const mockMemories = [
        {
          id: 1,
          content: 'Great day at the beach',
          createdAt: '2024-07-10T14:30:00Z',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend',
          },
        },
      ]

      vi.mocked(storage.getMemories).mockResolvedValue(mockMemories)

      const response = await request(app)
        .get('/api/memories?personId=1')
        .expect(200)

      expect(response.body).toEqual(mockMemories)
      expect(storage.getMemories).toHaveBeenCalledWith('test-user-id', 1, undefined)
    })
  })

  describe('POST /api/memories', () => {
    it('should create a new memory', async () => {
      const newMemory = {
        content: 'Had lunch with John at the new cafe',
        personId: 1,
        tags: ['lunch', 'cafe'],
      }

      const createdMemory = {
        id: 2,
        userId: 'test-user-id',
        ...newMemory,
        createdAt: '2024-07-10T14:30:00Z',
        updatedAt: '2024-07-10T14:30:00Z',
      }

      vi.mocked(storage.createMemory).mockResolvedValue(createdMemory)

      const response = await request(app)
        .post('/api/memories')
        .send(newMemory)
        .expect(201)

      expect(response.body).toEqual(createdMemory)
      expect(storage.createMemory).toHaveBeenCalledWith({
        ...newMemory,
        userId: 'test-user-id',
      })
    })

    it('should validate required fields', async () => {
      const invalidMemory = {
        personId: 1,
        // Missing content
      }

      await request(app)
        .post('/api/memories')
        .send(invalidMemory)
        .expect(400)
    })
  })

  describe('GET /api/reminders', () => {
    it('should return list of reminders', async () => {
      const mockReminders = [
        {
          id: 1,
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

      vi.mocked(storage.getReminders).mockResolvedValue(mockReminders)

      const response = await request(app)
        .get('/api/reminders')
        .expect(200)

      expect(response.body).toEqual(mockReminders)
      expect(storage.getReminders).toHaveBeenCalledWith('test-user-id', undefined)
    })
  })

  describe('POST /api/reminders', () => {
    it('should create a new reminder', async () => {
      const newReminder = {
        title: 'Anniversary with Sarah',
        reminderDate: '2025-06-20',
        type: 'anniversary',
        personId: 2,
        advanceDays: 7,
        isRecurring: true,
      }

      const createdReminder = {
        id: 3,
        userId: 'test-user-id',
        ...newReminder,
      }

      vi.mocked(storage.createReminder).mockResolvedValue(createdReminder)

      const response = await request(app)
        .post('/api/reminders')
        .send(newReminder)
        .expect(201)

      expect(response.body).toEqual(createdReminder)
      expect(storage.createReminder).toHaveBeenCalledWith({
        ...newReminder,
        userId: 'test-user-id',
      })
    })

    it('should validate required fields', async () => {
      const invalidReminder = {
        reminderDate: '2025-06-20',
        // Missing title
      }

      await request(app)
        .post('/api/reminders')
        .send(invalidReminder)
        .expect(400)
    })
  })

  describe('GET /api/stats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        peopleCount: 5,
        memoriesCount: 10,
        remindersCount: 3,
      }

      vi.mocked(storage.getUserStats).mockResolvedValue(mockStats)

      const response = await request(app)
        .get('/api/stats')
        .expect(200)

      expect(response.body).toEqual(mockStats)
      expect(storage.getUserStats).toHaveBeenCalledWith('test-user-id')
    })
  })

  describe('GET /api/reminders/upcoming', () => {
    it('should return upcoming reminders', async () => {
      const mockUpcomingReminders = [
        {
          id: 1,
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

      vi.mocked(storage.getUpcomingReminders).mockResolvedValue(mockUpcomingReminders)

      const response = await request(app)
        .get('/api/reminders/upcoming?days=30')
        .expect(200)

      expect(response.body).toEqual(mockUpcomingReminders)
      expect(storage.getUpcomingReminders).toHaveBeenCalledWith('test-user-id', 30)
    })

    it('should default to 30 days if no days parameter provided', async () => {
      const mockUpcomingReminders = []

      vi.mocked(storage.getUpcomingReminders).mockResolvedValue(mockUpcomingReminders)

      await request(app)
        .get('/api/reminders/upcoming')
        .expect(200)

      expect(storage.getUpcomingReminders).toHaveBeenCalledWith('test-user-id', 30)
    })
  })
})