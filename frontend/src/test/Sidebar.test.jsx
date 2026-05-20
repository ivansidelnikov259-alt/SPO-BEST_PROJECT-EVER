import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'admin' },
    logout: vi.fn(),
    isAdmin: true
  })
}))

describe('Sidebar Component', () => {
  it('should render logo', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )
    expect(screen.getByText(/MusicManager/i)).toBeInTheDocument()
  })

  it('should have menu items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )
    expect(screen.getByText(/Дашборд/i)).toBeInTheDocument()
    expect(screen.getByText(/Группы/i)).toBeInTheDocument()
    expect(screen.getByText(/Песни/i)).toBeInTheDocument()
    expect(screen.getByText(/Гастроли/i)).toBeInTheDocument()
  })

  it('should have logout button', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )
    expect(screen.getByText(/Выйти/i)).toBeInTheDocument()
  })
})