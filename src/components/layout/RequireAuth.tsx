import { Navigate, Outlet } from 'react-router-dom'

export default function RequireAuth() {
  const accessToken = localStorage.getItem('access_token')

  if (!accessToken) return <Navigate to="/login" replace />
  return <Outlet />
}
