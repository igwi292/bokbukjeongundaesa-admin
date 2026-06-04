import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { resendVerificationEmail } from '../../api/auth'
import { Icon } from '../../components/ui/Icon'

export default function EmailVerifySentPage() {
  const { state } = useLocation()
  const email: string = state?.email ?? ''

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState('')

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    setResent(false)
    setResendError('')
    try {
      await resendVerificationEmail(email)
      setResent(true)
    } catch {
      setResendError('재발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--brand-100)',
            color: 'var(--brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Icon name="bell" size={26} />
        </div>

        <h1 className="auth-h">이메일을 확인해주세요</h1>
        <p className="t-mute" style={{ fontSize: 14, marginBottom: 4 }}>인증 메일을 발송했습니다.</p>
        {email && (
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)', marginBottom: 16 }}>{email}</p>
        )}
        <p className="t-mute" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
          받은 메일함의 인증 링크를 클릭하면 가입이 완료됩니다.<br />
          메일이 보이지 않으면 스팸함도 확인해주세요.
        </p>

        {resent && <p className="note ok mb-4">인증 메일을 재발송했습니다.</p>}
        {resendError && <p className="note err mb-4">{resendError}</p>}

        <div className="stack gap-2">
          {email && (
            <button onClick={handleResend} disabled={resending} className="btn btn-neutral btn-block">
              {resending ? '재발송 중...' : '인증 메일 다시 받기'}
            </button>
          )}
          <Link to="/login" className="btn btn-primary btn-block">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}
