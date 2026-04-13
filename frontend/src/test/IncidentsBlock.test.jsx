import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IncidentsBlock from '../components/tasks/IncidentsBlock'

vi.mock('../api/client', () => ({
  deleteIncident: vi.fn(() => Promise.resolve({ data: { ok: true } })),
}))

const makeIncident = (overrides = {}) => ({
  id: 1,
  start_datetime: '2026-04-01T10:00:00.000Z',
  end_datetime: '2026-04-01T11:00:00.000Z',
  description: 'Water leak in kitchen',
  actions_taken: 'Closed valve and called plumber',
  importance: 4,
  ...overrides,
})

describe('IncidentsBlock', () => {
  it('renders empty state', () => {
    render(<IncidentsBlock incidents={[]} onRefresh={() => {}} />)
    expect(screen.getByText(/No incidents yet|Инцидентов пока нет/)).toBeInTheDocument()
  })

  it('renders incident details and stars', () => {
    render(<IncidentsBlock incidents={[makeIncident()]} onRefresh={() => {}} />)
    expect(screen.getByText('Water leak in kitchen')).toBeInTheDocument()
    expect(screen.getByText(/Closed valve and called plumber/)).toBeInTheDocument()
    expect(screen.getByText('★★★★☆')).toBeInTheDocument()
  })

  it('opens form on add click', async () => {
    const user = userEvent.setup()
    render(<IncidentsBlock incidents={[]} onRefresh={() => {}} />)
    await user.click(screen.getByRole('button', { name: /Add Incident|Добавить инцидент/i }))
    expect(screen.getByText(/New Incident|Новый инцидент/)).toBeInTheDocument()
  })
})

