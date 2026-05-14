import { NavLink } from 'react-router-dom'
import { clearTokens } from '../../api/auth'

const navItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/stores', label: '내 매장', icon: '🏪' },
  { to: '/my-records', label: '우리 매장 기록', icon: '📋' },
  { to: '/records', label: '기록 관리', icon: '📝' },
  { to: '/reports', label: '신고 관리', icon: '🚨' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">복붙전권대사</h1>
        <p className="text-xs text-gray-400 mt-0.5">관리자 콘솔</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <span>👤</span>
          프로필
        </NavLink>
        <button
          onClick={() => {
            clearTokens()
            window.location.href = '/login'
          }}
          className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>🚪</span>
          로그아웃
        </button>
      </div>
    </aside>
  )
}
