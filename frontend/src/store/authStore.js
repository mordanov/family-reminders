import { create } from 'zustand'
import { getMe, getSettings, login as apiLogin } from '../api/client'

const useAuthStore = create((set, get) => ({
  user: null,
  settings: { timezone: 'UTC' },
  token: localStorage.getItem('token'),
  loading: true,

  login: async (username, password) => {
    const resp = await apiLogin(username, password)
    const token = resp.data.access_token
    localStorage.setItem('token', token)
    set({ token })
    await get().fetchMe()
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const [meResp, settingsResp] = await Promise.all([getMe(), getSettings()])
      set({ user: meResp.data, settings: settingsResp.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  updateUserSettings: (settings) => set({ settings }),
}))

export default useAuthStore
