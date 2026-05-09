import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, refreshToken, logout as apiLogout, logoutAll as apiLogoutAll } from '../api/auth'
import { setToken } from '../api/tokenStore'

interface AuthContextValue {
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    refreshToken()
      .then(({ data }) => {
        setAccessToken(data.access)
        setToken(data.access)
      })
      .catch(() => {
        setAccessToken(null)
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiLogin(email, password)
    setAccessToken(data.access)
    setToken(data.access)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setAccessToken(null)
      setToken(null)
    }
  }, [])

  const logoutAll = useCallback(async () => {
    try {
      await apiLogoutAll()
    } finally {
      setAccessToken(null)
      setToken(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ accessToken, isLoading, login, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
