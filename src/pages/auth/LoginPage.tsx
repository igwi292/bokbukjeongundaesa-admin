import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/sds-logo.svg" alt="" />
          <span className="t">복붙전권대사</span>
        </div>
        <h1 className="auth-h">사장님 로그인</h1>
        <p className="auth-sub">매장과 방문 기록을 관리하세요.</p>

        <form onSubmit={handleSubmit} className="stack gap-4">
          <div className="field">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="note err">{error}</p>}

          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" className="link-act" style={{ color: 'var(--fg-muted)' }}>
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="auth-foot">
          아직 계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
