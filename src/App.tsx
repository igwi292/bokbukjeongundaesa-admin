import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RequireAuth from './components/layout/RequireAuth'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import StoresPage from './pages/stores/StoresPage'
import RecordsPage from './pages/records/RecordsPage'
import SettingsPage from './pages/settings/SettingsPage'
import ProfilePage from './pages/profile/ProfilePage'
import MyRecordsPage from './pages/my-records/MyRecordsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/my-records" element={<MyRecordsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
