import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'

// Mock the auth store
vi.mock('../store/authStore', () => ({
  default: vi.fn((selector) => {
    const state = {
      login: vi.fn(),
      token: null,
      user: null,
      loading: false,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock react-router navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

describe('LoginPage', () => {
  it('renders login form elements', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByPlaceholderText('user1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows brand name', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText('Reminders')).toBeInTheDocument()
  })

  it('shows default credentials hint', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText(/user1 \/ user1_change_me/i)).toBeInTheDocument()
  })

  it('allows typing in username and password', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    const usernameInput = screen.getByPlaceholderText('user1')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass' } })
    expect(usernameInput.value).toBe('testuser')
    expect(passwordInput.value).toBe('testpass')
  })
})
