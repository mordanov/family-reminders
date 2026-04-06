import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (username, password) => {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/login', form)
}
export const register = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')
export const getUsers = () => api.get('/auth/users')
export const getSettings = () => api.get('/auth/settings')
export const updateSettings = (data) => api.put('/auth/settings', data)

// Categories
export const getCategories = () => api.get('/categories')
export const createCategory = (data) => api.post('/categories', data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)

// Tasks
export const getTodayTasks = (date) => api.get('/tasks/today', date ? { params: { target_date: date } } : {})
export const getWeekTasks = (start, end) => api.get('/tasks/week', { params: { start: start.toISOString(), end: end.toISOString() } })
export const getReminders = () => api.get('/tasks/reminders')
export const createTask = (data) => api.post('/tasks', data)
export const updateTask = (id, data, scope = 'this') => api.put(`/tasks/${id}`, data, { params: { scope } })
export const deleteTask = (id, scope = 'this') => api.delete(`/tasks/${id}`, { params: { scope } })

// Activities
export const getActivities = () => api.get('/activities')
export const createActivity = (data) => api.post('/activities', data)
export const updateActivity = (id, data) => api.put(`/activities/${id}`, data)
export const deleteActivity = (id) => api.delete(`/activities/${id}`)

// Life Goals
export const getGoals = () => api.get('/goals')
export const createGoal = (data) => api.post('/goals', data)
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data)
export const deleteGoal = (id) => api.delete(`/goals/${id}`)
export const copyGoal = (id, targetUserId) => api.post(`/goals/${id}/copy`, { target_user_id: targetUserId })

// Archive
export const getArchivedTasks = (params) => api.get('/tasks/archive', { params })
export const getArchivedActivities = (params) => api.get('/activities/archive', { params })

// Payments
export const getPayments = () => api.get('/payments')
export const createPayment = (data) => api.post('/payments', data)
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data)
export const deletePayment = (id) => api.delete(`/payments/${id}`)

// Nutrition
export const getMealPlan = (date) => api.get('/nutrition/meal-plan', { params: { date } })
export const upsertMealPlan = (data) => api.put('/nutrition/meal-plan', data)
export const getShoppingList = () => api.get('/nutrition/shopping-list')
export const addShoppingItem = (data) => api.post('/nutrition/shopping-list/items', data)
export const updateShoppingItem = (id, data) => api.put(`/nutrition/shopping-list/items/${id}`, data)
export const deleteShoppingItem = (id) => api.delete(`/nutrition/shopping-list/items/${id}`)
export const clearShoppingList = () => api.post('/nutrition/shopping-list/clear')
export const newShoppingListVersion = () => api.post('/nutrition/shopping-list/new-version')

export default api
