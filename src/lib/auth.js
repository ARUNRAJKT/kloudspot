import api, { setToken } from '@/lib/api'

function readToken(data, headers) {
  const authorization = headers?.authorization || headers?.Authorization
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  if (!data || typeof data !== 'object') {
    return ''
  }

  const candidates = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    data.data?.token,
    data.data?.accessToken,
    data.data?.access_token,
  ]

  return candidates.find((value) => typeof value === 'string' && value) || ''
}

export async function login(email, password) {
  const response = await api.post('/api/auth/login', { email, password })
  const token = readToken(response.data, response.headers)

  if (!token) {
    throw new Error('Login succeeded, but no token was returned.')
  }

  setToken(token)
}
