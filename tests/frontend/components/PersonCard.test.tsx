import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersonCard } from '@/components/person-card'
import { vi } from 'vitest'

// Mock the navigation hook
vi.mock('wouter', () => ({
  useLocation: () => ['/people', vi.fn()],
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('PersonCard', () => {
  const mockPerson = {
    id: 1,
    fullName: 'John Doe',
    relationship: 'Friend',
    birthDate: '1990-05-15',
    birthYear: 1990,
    memoryCount: 3,
    reminderCount: 2,
    upcomingReminders: [
      {
        id: 1,
        reminderDate: '2025-05-15',
        type: 'birthday',
        title: 'John\'s Birthday',
      },
    ],
  }

  it('renders person information correctly', () => {
    render(<PersonCard person={mockPerson} />, { wrapper: TestWrapper })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
    expect(screen.getByText('3 memories')).toBeInTheDocument()
    expect(screen.getByText('2 reminders')).toBeInTheDocument()
  })

  it('displays upcoming reminders', () => {
    render(<PersonCard person={mockPerson} />, { wrapper: TestWrapper })
    
    expect(screen.getByText('John\'s Birthday')).toBeInTheDocument()
  })

  it('shows birth date when available', () => {
    render(<PersonCard person={mockPerson} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/May 15/)).toBeInTheDocument()
  })

  it('handles person without birth date', () => {
    const personWithoutBirthDate = {
      ...mockPerson,
      birthDate: undefined,
      birthYear: undefined,
    }
    
    render(<PersonCard person={personWithoutBirthDate} />, { wrapper: TestWrapper })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText(/May 15/)).not.toBeInTheDocument()
  })
})