import axios, { type InternalAxiosRequestConfig } from 'axios'
import { refreshToken } from './auth'
import { getToken, setToken } from './tokenStore'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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

    if (!original || err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original._retry = true
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
      const { data } = await refreshToken()
      setToken(data.access)
      flushQueue(data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return client(original)
    } catch (refreshErr) {
      flushQueue(null, refreshErr)
      setToken(null)
      window.location.href = '/login'
      return new Promise(() => {})
    } finally {
      isRefreshing = false
    }
  }
)

export default client
