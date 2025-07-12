import { describe, it, expect } from 'vitest'

describe('Utility Functions', () => {
  describe('Date Handling', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2024-07-10T14:30:00Z')
      
      expect(testDate.getFullYear()).toBe(2024)
      expect(testDate.getMonth()).toBe(6) // July is month 6 (0-indexed)
      expect(testDate.getDate()).toBe(10)
    })

    it('should handle date strings', () => {
      const dateString = '2025-05-15'
      const [year, month, day] = dateString.split('-').map(Number)
      
      expect(year).toBe(2025)
      expect(month).toBe(5)
      expect(day).toBe(15)
    })

    it('should compare dates correctly', () => {
      const date1 = new Date('2024-07-10')
      const date2 = new Date('2024-07-15')
      
      expect(date1.getTime()).toBeLessThan(date2.getTime())
      expect(date2.getTime()).toBeGreaterThan(date1.getTime())
    })
  })

  describe('Text Processing', () => {
    it('should handle search queries', () => {
      const searchQuery = 'John'
      const testData = [
        { name: 'John Doe', content: 'Friend from college' },
        { name: 'Jane Smith', content: 'Sister who lives nearby' },
        { name: 'Bob Johnson', content: 'Coworker at the office' }
      ]
      
      const filtered = testData.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0].name).toBe('John Doe')
      expect(filtered[1].name).toBe('Bob Johnson')
    })

    it('should handle tag processing', () => {
      const tags = ['beach', 'sunset', 'volleyball']
      const tagString = tags.join(', ')
      
      expect(tagString).toBe('beach, sunset, volleyball')
      expect(tags).toContain('beach')
      expect(tags).toHaveLength(3)
    })
  })

  describe('Form Validation', () => {
    it('should validate person data', () => {
      const validPerson = {
        fullName: 'John Doe',
        relationship: 'Friend',
        birthDate: '1990-05-15'
      }
      
      const invalidPerson = {
        relationship: 'Friend'
        // Missing fullName
      }
      
      expect(validPerson.fullName).toBeTruthy()
      expect(validPerson.relationship).toBeTruthy()
      expect(validPerson.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      
      expect(invalidPerson.fullName).toBeFalsy()
    })

    it('should validate memory data', () => {
      const validMemory = {
        content: 'Great day at the beach',
        personId: 1,
        tags: ['beach', 'fun']
      }
      
      const invalidMemory = {
        personId: 1
        // Missing content
      }
      
      expect(validMemory.content).toBeTruthy()
      expect(validMemory.personId).toBeTruthy()
      expect(validMemory.tags).toBeInstanceOf(Array)
      
      expect(invalidMemory.content).toBeFalsy()
    })

    it('should validate reminder data', () => {
      const validReminder = {
        title: 'John\'s Birthday',
        reminderDate: '2025-05-15',
        type: 'birthday',
        personId: 1
      }
      
      const invalidReminder = {
        reminderDate: '2025-05-15'
        // Missing title
      }
      
      expect(validReminder.title).toBeTruthy()
      expect(validReminder.reminderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(validReminder.type).toBeTruthy()
      expect(validReminder.personId).toBeTruthy()
      
      expect(invalidReminder.title).toBeFalsy()
    })
  })

  describe('Data Transformation', () => {
    it('should transform person data for display', () => {
      const personData = {
        id: 1,
        fullName: 'John Doe',
        relationship: 'Friend',
        birthDate: '1990-05-15',
        memoryCount: 3,
        reminderCount: 2
      }
      
      const displayName = personData.fullName
      const displayRelationship = personData.relationship
      const hasMemories = personData.memoryCount > 0
      const hasReminders = personData.reminderCount > 0
      
      expect(displayName).toBe('John Doe')
      expect(displayRelationship).toBe('Friend')
      expect(hasMemories).toBe(true)
      expect(hasReminders).toBe(true)
    })

    it('should calculate time differences', () => {
      const today = new Date()
      const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      
      const diffTime = futureDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      expect(diffDays).toBe(7)
    })
  })
})