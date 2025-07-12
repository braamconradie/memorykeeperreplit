import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '@/pages/home'
import { vi } from 'vitest'

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock the navigation component
vi.mock('@/components/navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}))

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/home', vi.fn()],
}))

describe('Home Page', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    // Mock fetch responses
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          peopleCount: '5',
          memoriesCount: '10',
          remindersCount: '3',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
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
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
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
        ]),
      })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('renders home page with statistics', async () => {
    renderWithQueryClient(<Home />)
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('displays recent memories', async () => {
    renderWithQueryClient(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Great day at the beach')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('shows upcoming reminders', async () => {
    renderWithQueryClient(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('John\'s Birthday')).toBeInTheDocument()
    })
  })
})