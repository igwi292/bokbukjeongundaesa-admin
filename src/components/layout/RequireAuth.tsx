import { Navigate, Outlet } from 'react-router-dom'

export default function RequireAuth() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('refresh_token')
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
