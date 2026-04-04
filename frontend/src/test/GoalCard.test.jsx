import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GoalCard from '../components/goals/GoalCard'

const mockUsers = [
  { id: 1, username: 'user1' },
  { id: 2, username: 'user2' },
]

const makeGoal = (overrides = {}) => ({
  id: 1,
  description: 'Learn a new language',
  progress: 0,
  activity_count: 0,
  activity_ids: [],
  owner_id: 1,
  ...overrides,
})

const makeActivity = (overrides = {}) => ({
  id: 1,
  description: 'Practice vocab',
  completed: false,
  priority: 5,
  creator_id: 1,
  assigned_user_ids: [],
  color: '#7c6aff',
  category_id: null,
  ...overrides,
})

describe('GoalCard', () => {
  const noop = () => {}

  it('renders goal description', () => {
    render(<GoalCard goal={makeGoal()} activities={[]} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText('Learn a new language')).toBeInTheDocument()
  })

  it('shows zero progress', () => {
    render(<GoalCard goal={makeGoal({ progress: 0 })} activities={[]} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 50% progress', () => {
    render(<GoalCard goal={makeGoal({ progress: 50, activity_count: 2 })} activities={[]} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows 100% progress', () => {
    render(<GoalCard goal={makeGoal({ progress: 100, activity_count: 1 })} activities={[]} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows activity count', () => {
    render(<GoalCard goal={makeGoal({ activity_count: 3 })} activities={[]} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText('3 activities')).toBeInTheDocument()
  })

  it('shows singular activity label for count of 1', () => {
    render(<GoalCard goal={makeGoal({ activity_count: 1 })} activities={[]} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText('1 activity')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<GoalCard goal={makeGoal()} activities={[]} users={[]} onEdit={noop} onDelete={onDelete} onRefresh={noop} />)
    // Hover to reveal actions, then click delete
    const card = screen.getByText('Learn a new language').closest('div')
    fireEvent.mouseOver(card)
    const deleteBtn = screen.getByTitle('Delete')
    fireEvent.click(deleteBtn)
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<GoalCard goal={makeGoal()} activities={[]} users={[]} onEdit={onEdit} onDelete={noop} onRefresh={noop} />)
    const editBtn = screen.getByTitle('Edit')
    fireEvent.click(editBtn)
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('shows linked activities', () => {
    const goal = makeGoal({ activity_ids: [1, 2] })
    const activities = [
      makeActivity({ id: 1, description: 'Practice vocab' }),
      makeActivity({ id: 2, description: 'Watch movies', completed: true }),
    ]
    render(<GoalCard goal={goal} activities={activities} users={[]} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    expect(screen.getByText(/Practice vocab/)).toBeInTheDocument()
    expect(screen.getByText(/Watch movies/)).toBeInTheDocument()
  })

  it('shows copy user selector when copy button clicked', () => {
    render(<GoalCard goal={makeGoal()} activities={[]} users={mockUsers} onEdit={noop} onDelete={noop} onRefresh={noop} />)
    const copyBtn = screen.getByTitle('Copy to user')
    fireEvent.click(copyBtn)
    expect(screen.getByText('user1')).toBeInTheDocument()
    expect(screen.getByText('user2')).toBeInTheDocument()
  })
})
