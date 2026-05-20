import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ToursManagement from '../components/ToursManagement'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'admin' },
    isAdmin: true,
    userId: 1
  })
}))

const mockTours = [
  { id: 1, program_name: 'Test Tour', city: 'Test City', date: '2025-06-01', start_date: '2025-06-01', end_date: '2025-06-10', avg_ticket_price: 100, currency: 'USD', group_name: 'Test Group' }
]

vi.mock('axios', () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes('/tours')) {
        return Promise.resolve({ data: mockTours })
      }
      if (url.includes('/groups')) {
        return Promise.resolve({ data: [{ id: 1, name: 'Test Group' }] })
      }
      return Promise.resolve({ data: [] })
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

describe('ToursManagement Component', () => {
  it('should render title', async () => {
    render(<ToursManagement />)
    await waitFor(() => {
      expect(screen.getByText(/Управление гастролями/i)).toBeInTheDocument()
    })
  })

  it('should have search input', async () => {
    render(<ToursManagement />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск по названию программы, городу или группе/i)).toBeInTheDocument()
    })
  })

  it('should have add tour button', async () => {
    render(<ToursManagement />)
    await waitFor(() => {
      expect(screen.getByText(/Добавить гастроли/i)).toBeInTheDocument()
    })
  })
})