import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { registerRoutes } from '../../server/routes.js'
import { setupAuth } from '../../server/replitAuth.js'

describe('Integration Tests', () => {
  let app: express.Application

  beforeAll(async () => {
    app = express()
    app.use(express.json())
    
    // Mock auth setup
    vi.mock('../../server/replitAuth.js', () => ({
      setupAuth: vi.fn(),
      isAuthenticated: (req: any, res: any, next: any) => {
        req.user = { id: 'integration-test-user' }
        next()
      },
    }))

    await setupAuth(app)
    await registerRoutes(app)
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  describe('Full User Journey', () => {
    it('should handle complete user workflow', async () => {
      // 1. Get initial stats (should be empty)
      const initialStats = await request(app)
        .get('/api/stats')
        .expect(200)

      // 2. Create a person
      const personData = {
        fullName: 'Integration Test Person',
        relationship: 'Friend',
        birthDate: '1990-01-01',
        notes: 'Test person for integration tests',
      }

      const createPersonResponse = await request(app)
        .post('/api/people')
        .send(personData)
        .expect(201)

      expect(createPersonResponse.body).toMatchObject(personData)
      const personId = createPersonResponse.body.id

      // 3. Create a memory for the person
      const memoryData = {
        content: 'Integration test memory content',
        personId: personId,
        tags: ['integration', 'test'],
      }

      const createMemoryResponse = await request(app)
        .post('/api/memories')
        .send(memoryData)
        .expect(201)

      expect(createMemoryResponse.body).toMatchObject(memoryData)

      // 4. Create a reminder for the person
      const reminderData = {
        title: 'Integration Test Reminder',
        reminderDate: '2025-12-25',
        type: 'custom',
        personId: personId,
        description: 'Test reminder for integration testing',
        advanceDays: 7,
        isRecurring: false,
      }

      const createReminderResponse = await request(app)
        .post('/api/reminders')
        .send(reminderData)
        .expect(201)

      expect(createReminderResponse.body).toMatchObject(reminderData)

      // 5. Get updated stats
      const updatedStats = await request(app)
        .get('/api/stats')
        .expect(200)

      // Stats should reflect the new data
      expect(parseInt(updatedStats.body.peopleCount)).toBeGreaterThan(parseInt(initialStats.body.peopleCount))
      expect(parseInt(updatedStats.body.memoriesCount)).toBeGreaterThan(parseInt(initialStats.body.memoriesCount))
      expect(parseInt(updatedStats.body.remindersCount)).toBeGreaterThan(parseInt(initialStats.body.remindersCount))

      // 6. Get the person with memories and reminders
      const peopleResponse = await request(app)
        .get('/api/people')
        .expect(200)

      const testPerson = peopleResponse.body.find((p: any) => p.id === personId)
      expect(testPerson).toBeDefined()
      expect(testPerson.memoryCount).toBeGreaterThan(0)
      expect(testPerson.reminderCount).toBeGreaterThan(0)

      // 7. Get memories filtered by person
      const memoriesResponse = await request(app)
        .get(`/api/memories?personId=${personId}`)
        .expect(200)

      expect(memoriesResponse.body).toHaveLength(1)
      expect(memoriesResponse.body[0]).toMatchObject(memoryData)

      // 8. Get reminders filtered by person
      const remindersResponse = await request(app)
        .get(`/api/reminders?personId=${personId}`)
        .expect(200)

      expect(remindersResponse.body).toHaveLength(1)
      expect(remindersResponse.body[0]).toMatchObject(reminderData)

      // 9. Get upcoming reminders
      const upcomingRemindersResponse = await request(app)
        .get('/api/reminders/upcoming?days=365')
        .expect(200)

      const testReminder = upcomingRemindersResponse.body.find((r: any) => r.id === createReminderResponse.body.id)
      expect(testReminder).toBeDefined()
      expect(testReminder.person).toBeDefined()
      expect(testReminder.person.fullName).toBe(personData.fullName)
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Try to create person without required fields
      const invalidPerson = {
        relationship: 'Friend',
        // Missing fullName
      }

      await request(app)
        .post('/api/people')
        .send(invalidPerson)
        .expect(400)

      // Try to create memory without required fields
      const invalidMemory = {
        personId: 1,
        // Missing content
      }

      await request(app)
        .post('/api/memories')
        .send(invalidMemory)
        .expect(400)

      // Try to create reminder without required fields
      const invalidReminder = {
        reminderDate: '2025-12-25',
        // Missing title
      }

      await request(app)
        .post('/api/reminders')
        .send(invalidReminder)
        .expect(400)
    })

    it('should handle non-existent resources', async () => {
      // Try to get memories for non-existent person
      const memoriesResponse = await request(app)
        .get('/api/memories?personId=999999')
        .expect(200)

      expect(memoriesResponse.body).toHaveLength(0)

      // Try to get reminders for non-existent person
      const remindersResponse = await request(app)
        .get('/api/reminders?personId=999999')
        .expect(200)

      expect(remindersResponse.body).toHaveLength(0)
    })
  })
})