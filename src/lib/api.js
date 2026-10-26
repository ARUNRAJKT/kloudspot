import axios from 'axios'

const TOKEN_KEY = 'kloudspot.token'
const listeners = new Set()

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function subscribeSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
  notify()
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  notify()
}

function readPayload() {
  const token = getToken()
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getTokenExpiry() {
  const exp = Number(readPayload()?.exp)
  return Number.isFinite(exp) ? exp * 1000 : null
}

export function isSessionActive() {
  const data = readPayload()
  if (!data) return false
  const exp = Number(data.exp)
  // no exp claim: treat it as still logged in rather than kicking them out
  return !Number.isFinite(exp) || exp * 1000 > Date.now()
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hiring-dev.internal.kloudspot.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const headers = error.config?.headers
    const sent = headers?.get?.('Authorization') || headers?.Authorization || ''
    // login 401 is a bad password; a late 401 from an old token shouldn't log out the new one
    if (error.response?.status === 401 && !url.includes('/api/auth/login') && sent === `Bearer ${getToken()}`) {
      clearToken()
    }
    return Promise.reject(error)
  },
)

export function getSession() {
  const data = readPayload()
  if (!data) return null

  return {
    name: data.name || '',
    email: data.email || '',
    role: data.role || '',
  }
}

export default api
