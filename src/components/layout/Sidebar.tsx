import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../ui/Icon'

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '대시보드', icon: 'layout-dashboard' },
  { to: '/stores', label: '내 매장', icon: 'store' },
  { to: '/my-records', label: '우리 매장 기록', icon: 'clipboard-list' },
  { to: '/records', label: '기록 관리', icon: 'notebook-pen' },
  { to: '/reports', label: '신고 관리', icon: 'flag' },
]

export default function Sidebar() {
  const { logout, logoutAll } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleLogoutAll = async () => {
    await logoutAll()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sb">
      <div className="sb-brand">
        <img src="/sds-logo.svg" alt="" />
        <div>
          <div className="t">복붙전권대사</div>
          <div className="s">관리자 콘솔</div>
        </div>
      </div>
      <nav className="sb-nav">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `ni${isActive ? ' active' : ''}`}
          >
            <span className="ico">
              <Icon name={icon} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sb-foot">
        <NavLink
          to="/profile"
          className={({ isActive }) => `ni${isActive ? ' active' : ''}`}
        >
          <span className="ico">
            <Icon name="user" />
          </span>
          프로필
        </NavLink>
        <button className="ni" onClick={handleLogout}>
          <span className="ico">
            <Icon name="log-out" />
          </span>
          로그아웃
        </button>
        <button className="ni danger" onClick={handleLogoutAll}>
          <span className="ico">
            <Icon name="lock" />
          </span>
          모든 기기 로그아웃
        </button>
      </div>
    </aside>
  )
}
