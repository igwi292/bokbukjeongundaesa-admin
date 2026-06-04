import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch {
      setError('이메일 발송에 실패했습니다. 다시 시도해주세요.')
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
        <h1 className="auth-h">비밀번호 재설정</h1>
        <p className="auth-sub">가입한 이메일로 재설정 링크를 보내드립니다.</p>

        {sent ? (
          <div className="stack gap-3" style={{ textAlign: 'center' }}>
            <p className="ds-body" style={{ fontSize: 14 }}>
              <strong>{email}</strong>로<br />재설정 링크를 발송했습니다.
            </p>
            <p className="t-mute" style={{ fontSize: 12 }}>이메일이 오지 않는다면 스팸함을 확인해 주세요.</p>
            <Link to="/login" className="auth-foot" style={{ marginTop: 0 }}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
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

            {error && <p className="note err">{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {loading ? '발송 중...' : '재설정 링크 보내기'}
            </button>

            <p className="auth-foot" style={{ marginTop: 0 }}>
              <Link to="/login">로그인으로 돌아가기</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
