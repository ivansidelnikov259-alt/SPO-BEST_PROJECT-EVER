import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Login from '../components/Login'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loading: false,
    user: null
  })
}))

describe('Login Component', () => {
  it('should render login form', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText(/Введите имя пользователя/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Введите пароль/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('should have title', () => {
    render(<Login />)
    expect(screen.getByText(/Музыкальный Менеджер/i)).toBeInTheDocument()
  })

  it('should have username input', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText(/Введите имя пользователя/i)).toBeInTheDocument()
  })

  it('should have password input', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText(/Введите пароль/i)).toBeInTheDocument()
  })

  it('should have submit button', () => {
    render(<Login />)
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })
})