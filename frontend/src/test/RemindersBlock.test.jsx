import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RemindersBlock from '../components/tasks/RemindersBlock'

const mockCategories = [
  { id: 1, name: 'Work', color: '#ff0000', emoji: '💼' },
]

const makeTask = (overrides = {}) => ({
  id: 1,
  description: 'Morning standup',
  start_datetime: new Date(Date.now() + 300000).toISOString(), // 5 min from now
  end_datetime: new Date(Date.now() + 3900000).toISOString(),
  color: '#7c6aff',
  category_id: 1,
  remind_at_start: true,
  is_recurring: false,
  ...overrides,
})

describe('RemindersBlock', () => {
  it('renders nothing when reminders list is empty', () => {
    const { container } = render(<RemindersBlock reminders={[]} categories={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders reminder cards when reminders exist', () => {
    const reminders = [makeTask()]
    render(<RemindersBlock reminders={reminders} categories={mockCategories} />)
    expect(screen.getByText('Morning standup')).toBeInTheDocument()
    expect(screen.getByText('🔔')).toBeInTheDocument()
  })

  it('shows reminder count badge', () => {
    const reminders = [makeTask(), makeTask({ id: 2, description: 'Another reminder' })]
    render(<RemindersBlock reminders={reminders} categories={mockCategories} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows category emoji when category is found', () => {
    const reminders = [makeTask({ category_id: 1 })]
    render(<RemindersBlock reminders={reminders} categories={mockCategories} />)
    expect(screen.getByText('💼')).toBeInTheDocument()
  })

  it('shows fallback emoji when category is not found', () => {
    const reminders = [makeTask({ category_id: 99 })]
    render(<RemindersBlock reminders={reminders} categories={mockCategories} />)
    expect(screen.getByText('📌')).toBeInTheDocument()
  })
})
