import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../../api/auth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await confirmPasswordReset(token, password)
      navigate('/login', { replace: true })
    } catch {
      setError('비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-wrap">
        <div className="stack gap-3" style={{ textAlign: 'center' }}>
          <p className="note err">유효하지 않은 재설정 링크입니다.</p>
          <Link to="/forgot-password" className="auth-foot" style={{ marginTop: 0 }}>
            다시 요청하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/sds-logo.svg" alt="" />
          <span className="t">복붙전권대사</span>
        </div>
        <h1 className="auth-h">새 비밀번호 설정</h1>
        <p className="auth-sub">새로운 비밀번호를 입력해 주세요.</p>

        <form onSubmit={handleSubmit} className="stack gap-4">
          <div className="field">
            <label>새 비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label>새 비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="note err">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
