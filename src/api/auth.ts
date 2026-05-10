import axios from 'axios'

export interface SignupPayload {
  email: string
  nickname: string
  phone: string
  password: string
}

const base = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

export const login = (email: string, password: string) =>
  base.post<{ access: string }>('/v1/owner/auth/login/', { email, password })

export const refreshToken = () =>
  base.post<{ access: string }>('/v1/owner/auth/refresh')

export const logout = () =>
  base.post('/v1/owner/auth/logout')

export const logoutAll = () =>
  base.post('/v1/owner/auth/logout-all')

export const signup = (payload: SignupPayload) =>
  base.post('/accounts/register/', payload)

export const requestPasswordReset = (email: string) =>
  base.post('/v1/owner/auth/password/reset/request', { email })

export const confirmPasswordReset = (token: string, password: string) =>
  base.post('/v1/owner/auth/password/reset/confirm', { token, password })

export const verifyEmail = (token: string) =>
  base.post('/v1/owner/auth/email/verify', { token })

export const resendVerificationEmail = (email: string) =>
  base.post('/v1/owner/auth/email/resend', { email })
