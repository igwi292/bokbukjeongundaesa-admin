import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequireGuest() {
  const { accessToken, isLoading } = useAuth()

  if (isLoading) return null

  if (accessToken) return <Navigate to="/" replace />
  return <Outlet />
}
