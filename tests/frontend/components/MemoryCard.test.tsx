import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryCard } from '@/components/memory-card'
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

describe('MemoryCard', () => {
  const mockMemory = {
    id: 1,
    content: 'Had a great time at the beach with John. We played volleyball and watched the sunset.',
    tags: ['beach', 'sunset', 'volleyball'],
    createdAt: '2024-07-10T14:30:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    person: {
      id: 1,
      fullName: 'John Doe',
      relationship: 'Friend',
    },
  }

  it('renders memory content correctly', () => {
    render(<MemoryCard memory={mockMemory} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/Had a great time at the beach/)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
  })

  it('displays tags when available', () => {
    render(<MemoryCard memory={mockMemory} />, { wrapper: TestWrapper })
    
    expect(screen.getByText('beach')).toBeInTheDocument()
    expect(screen.getByText('sunset')).toBeInTheDocument()
    expect(screen.getByText('volleyball')).toBeInTheDocument()
  })

  it('shows creation date', () => {
    render(<MemoryCard memory={mockMemory} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/Jul 10/)).toBeInTheDocument()
  })

  it('renders in compact mode', () => {
    render(<MemoryCard memory={mockMemory} compact={true} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/Had a great time at the beach/)).toBeInTheDocument()
  })

  it('handles memory without tags', () => {
    const memoryWithoutTags = {
      ...mockMemory,
      tags: undefined,
    }
    
    render(<MemoryCard memory={memoryWithoutTags} />, { wrapper: TestWrapper })
    
    expect(screen.getByText(/Had a great time at the beach/)).toBeInTheDocument()
    expect(screen.queryByText('beach')).not.toBeInTheDocument()
  })
})