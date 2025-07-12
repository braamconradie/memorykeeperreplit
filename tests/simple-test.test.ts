import { describe, it, expect } from 'vitest'

describe('Simple Tests', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test string operations', () => {
    const testString = 'Memory Keeper App'
    expect(testString).toContain('Memory')
    expect(testString).toContain('Keeper')
    expect(testString.length).toBeGreaterThan(10)
  })

  it('should test array operations', () => {
    const testArray = ['people', 'memories', 'reminders']
    expect(testArray).toHaveLength(3)
    expect(testArray).toContain('memories')
    expect(testArray[0]).toBe('people')
  })

  it('should test object operations', () => {
    const testPerson = {
      id: 1,
      fullName: 'John Doe',
      relationship: 'Friend'
    }
    
    expect(testPerson).toHaveProperty('id')
    expect(testPerson).toHaveProperty('fullName', 'John Doe')
    expect(testPerson.relationship).toBe('Friend')
  })

  it('should test async operations', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => setTimeout(() => resolve('done'), 100))
    }
    
    const result = await asyncFunction()
    expect(result).toBe('done')
  })
})