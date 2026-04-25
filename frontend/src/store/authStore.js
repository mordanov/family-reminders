import { create } from 'zustand'
import { COOKIE_TOKEN, setCookie, getCookie, clearRememberCookies } from '../utils/cookies'
import { getMe, getSettings, login as apiLogin } from '../api/client'

const REMEMBER_EXPIRE_DAYS = 30

const initToken = () => {
  const stored = localStorage.getItem('token')
  if (stored) return stored
  const fromCookie = getCookie(COOKIE_TOKEN)
  if (fromCookie) {
    localStorage.setItem('token', fromCookie)
    return fromCookie
  }
  return null
}

const useAuthStore = create((set, get) => ({
  user: null,
  settings: { timezone: 'UTC' },
  token: initToken(),
  loading: true,

  login: async (username, password, rememberMe = false) => {
    const resp = await apiLogin(username, password, rememberMe)
    const token = resp.data.access_token
    localStorage.setItem('token', token)
    if (rememberMe) {
      setCookie(COOKIE_TOKEN, token, REMEMBER_EXPIRE_DAYS)
    } else {
      clearRememberCookies()
    }
    set({ token })
    await get().fetchMe()
  },

  logout: () => {
    localStorage.removeItem('token')
    clearRememberCookies()
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
