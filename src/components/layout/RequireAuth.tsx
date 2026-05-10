import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequireAuth() {
  const { accessToken, isLoading } = useAuth()

  if (isLoading) return null
  if (!accessToken) return <Navigate to="/login" replace />
  return <Outlet />
}
