import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
