import axios from 'axios'

export interface TokenPair {
  access: string
  refresh: string
}

export interface SignupPayload {
  email: string
  nickname: string
  phone: string
  password: string
}

const base = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const login = (email: string, password: string) =>
  base.post<TokenPair>('/accounts/login/', { email, password })

export const refreshAccessToken = (refresh: string) =>
  base.post<{ access: string }>('/accounts/token/refresh/', { refresh })

export const signup = (payload: SignupPayload) =>
  base.post('/accounts/register/', payload)

export const saveTokens = (pair: TokenPair) => {
  localStorage.setItem('access_token', pair.access)
  localStorage.setItem('refresh_token', pair.refresh)
}

export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
