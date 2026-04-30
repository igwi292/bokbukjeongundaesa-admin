import axios, { type InternalAxiosRequestConfig } from 'axios'
import { refreshAccessToken, clearTokens } from './auth'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 시 refresh token으로 재발급 후 원래 요청 재시도
let isRefreshing = false
let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const flushQueue = (token: string | null, err: unknown = null) => {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(err)))
  queue = []
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original: InternalAxiosRequestConfig & { _retry?: boolean } = err.config

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }

    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) {
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(client(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await refreshAccessToken(refresh)
      localStorage.setItem('access_token', data.access)
      client.defaults.headers.common.Authorization = `Bearer ${data.access}`
      flushQueue(data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return client(original)
    } catch (refreshErr) {
      flushQueue(null, refreshErr)
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
