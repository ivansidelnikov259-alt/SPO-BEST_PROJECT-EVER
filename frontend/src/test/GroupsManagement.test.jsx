import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import GroupsManagement from '../components/GroupsManagement'

// Мок для useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'admin' },
    isAdmin: true,
    userId: 1
  })
}))

// Мок для axios
const mockGroups = [
  { id: 1, name: 'Test Group 1', country: 'USA', formation_year: 2020, rating: 85, description: 'Test' },
  { id: 2, name: 'Test Group 2', country: 'UK', formation_year: 2019, rating: 90, description: 'Test' }
]

vi.mock('axios', () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes('/groups')) {
        return Promise.resolve({ data: mockGroups })
      }
      return Promise.resolve({ data: [] })
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

describe('GroupsManagement Component', () => {
  it('should render title', async () => {
    render(<GroupsManagement />)
    await waitFor(() => {
      expect(screen.getByText(/Управление группами/i)).toBeInTheDocument()
    })
  })

  it('should have search input', async () => {
    render(<GroupsManagement />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск по названию или стране/i)).toBeInTheDocument()
    })
  })

  it('should have add group button', async () => {
    render(<GroupsManagement />)
    await waitFor(() => {
      expect(screen.getByText(/Добавить группу/i)).toBeInTheDocument()
    })
  })
})