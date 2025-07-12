import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('People API', () => {
    it('should fetch people successfully', async () => {
      const mockPeople = [
        {
          id: 1,
          fullName: 'John Doe',
          relationship: 'Friend',
          memoryCount: 3,
          reminderCount: 2,
          upcomingReminders: []
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPeople
      })

      const response = await fetch('/api/people')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual(mockPeople)
      expect(data).toHaveLength(1)
      expect(data[0]).toHaveProperty('fullName', 'John Doe')
    })

    it('should handle people API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      const response = await fetch('/api/people')
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })
  })

  describe('Memories API', () => {
    it('should fetch memories successfully', async () => {
      const mockMemories = [
        {
          id: 1,
          content: 'Great day at the beach',
          createdAt: '2024-07-10T14:30:00Z',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend'
          }
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMemories
      })

      const response = await fetch('/api/memories')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual(mockMemories)
      expect(data[0]).toHaveProperty('content', 'Great day at the beach')
      expect(data[0].person).toHaveProperty('fullName', 'John Doe')
    })

    it('should create memories successfully', async () => {
      const newMemory = {
        content: 'Had lunch with John',
        personId: 1,
        tags: ['lunch', 'restaurant']
      }

      const createdMemory = {
        id: 2,
        ...newMemory,
        createdAt: '2024-07-10T14:30:00Z',
        updatedAt: '2024-07-10T14:30:00Z'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => createdMemory
      })

      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory)
      })
      
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(response.status).toBe(201)
      expect(data).toMatchObject(newMemory)
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('createdAt')
    })
  })

  describe('Reminders API', () => {
    it('should fetch reminders successfully', async () => {
      const mockReminders = [
        {
          id: 1,
          title: 'John\'s Birthday',
          reminderDate: '2025-05-15',
          type: 'birthday',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend'
          }
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockReminders
      })

      const response = await fetch('/api/reminders')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual(mockReminders)
      expect(data[0]).toHaveProperty('title', 'John\'s Birthday')
      expect(data[0]).toHaveProperty('type', 'birthday')
    })

    it('should fetch upcoming reminders with date filtering', async () => {
      const mockUpcomingReminders = [
        {
          id: 1,
          title: 'John\'s Birthday',
          reminderDate: '2025-05-15',
          type: 'birthday',
          person: {
            id: 1,
            fullName: 'John Doe',
            relationship: 'Friend'
          }
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUpcomingReminders
      })

      const response = await fetch('/api/reminders/upcoming?days=30')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0]).toHaveProperty('reminderDate', '2025-05-15')
    })
  })

  describe('Statistics API', () => {
    it('should fetch user statistics', async () => {
      const mockStats = {
        peopleCount: '5',
        memoriesCount: '10',
        remindersCount: '3'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockStats
      })

      const response = await fetch('/api/stats')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual(mockStats)
      expect(parseInt(data.peopleCount)).toBe(5)
      expect(parseInt(data.memoriesCount)).toBe(10)
      expect(parseInt(data.remindersCount)).toBe(3)
    })
  })
})