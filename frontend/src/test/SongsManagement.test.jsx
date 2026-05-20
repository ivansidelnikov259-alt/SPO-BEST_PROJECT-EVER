import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SongsManagement from '../components/SongsManagement'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'admin' },
    isAdmin: true,
    userId: 1
  })
}))

const mockSongs = [
  { id: 1, title: 'Test Song 1', composer: 'Test Composer', singer: 'Test Singer', creation_year: 2024, groups: [{ id: 1, name: 'Test Group' }] }
]

vi.mock('axios', () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes('/songs')) {
        return Promise.resolve({ data: mockSongs })
      }
      if (url.includes('/groups/all')) {
        return Promise.resolve({ data: [{ id: 1, name: 'Test Group' }] })
      }
      return Promise.resolve({ data: [] })
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

describe('SongsManagement Component', () => {
  it('should render title', async () => {
    render(<SongsManagement />)
    await waitFor(() => {
      expect(screen.getByText(/Управление песнями/i)).toBeInTheDocument()
    })
  })

  it('should have search input', async () => {
    render(<SongsManagement />)
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Поиск/i)
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('should have filter select', async () => {
    render(<SongsManagement />)
    await waitFor(() => {
      expect(screen.getByText(/По названию/i)).toBeInTheDocument()
    })
  })

  it('should have add song button', async () => {
    render(<SongsManagement />)
    await waitFor(() => {
      expect(screen.getByText(/Добавить песню/i)).toBeInTheDocument()
    })
  })
})