import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReminderCard } from '@/components/reminder-card'
import { vi } from 'vitest'

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

describe('ReminderCard', () => {
  const mockReminder = {
    id: 1,
    type: 'birthday',
    title: 'John\'s Birthday',
    description: 'Don\'t forget to call John on his birthday!',
    reminderDate: '2025-05-15',
    advanceDays: 7,
    isRecurring: true,
    person: {
      id: 1,
      fullName: 'John Doe',
      relationship: 'Friend',
    },
  }

  it('renders reminder information correctly', () => {
    render(<ReminderCard reminder={mockReminder} />, { wrapper: TestWrapper })
    
    expect(screen.getByText('John\'s Birthday')).toBeInTheDocument()
    expect(screen.getByText('Don\'t forget to call John on his birthday!')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
  })

  it('displays reminder date', () => {
    render(<ReminderCard reminder={mockReminder} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/May 15, 2025/)).toBeInTheDocument()
  })

  it('shows recurring indicator', () => {
    render(<ReminderCard reminder={mockReminder} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/Recurring/)).toBeInTheDocument()
  })

  it('displays advance notification info', () => {
    render(<ReminderCard reminder={mockReminder} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/7 days advance/)).toBeInTheDocument()
  })

  it('handles non-recurring reminder', () => {
    const nonRecurringReminder = {
      ...mockReminder,
      isRecurring: false,
    }
    
    render(<ReminderCard reminder={nonRecurringReminder} />, { wrapper: TestWrapper })
    
    expect(screen.getByText('John\'s Birthday')).toBeInTheDocument()
    expect(screen.queryByText(/Recurring/)).not.toBeInTheDocument()
  })

  it('handles different priority levels', () => {
    const { rerender } = render(<ReminderCard reminder={mockReminder} priority="high" />, { wrapper: TestWrapper })
    
    expect(screen.getByText('John\'s Birthday')).toBeInTheDocument()
    
    rerender(<ReminderCard reminder={mockReminder} priority="low" />)
    
    expect(screen.getByText('John\'s Birthday')).toBeInTheDocument()
  })
})