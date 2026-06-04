import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../../api/auth'
import { Icon } from '../../components/ui/Icon'

type Status = 'loading' | 'success' | 'error' | 'missing'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing')

  useEffect(() => {
    if (!token) return
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  const config = {
    loading: {
      bg: 'var(--gray-50)',
      color: 'var(--gray-400)',
      icon: 'bell' as const,
      title: '이메일 인증 중...',
      desc: '잠시만 기다려주세요.',
      showAction: false,
      actionLabel: '',
    },
    success: {
      bg: 'var(--positive-bg)',
      color: 'var(--positive)',
      icon: 'check' as const,
      title: '이메일 인증 완료!',
      desc: '계정이 활성화되었습니다. 이제 로그인하실 수 있습니다.',
      showAction: true,
      actionLabel: '로그인하기',
    },
    error: {
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
      icon: 'x' as const,
      title: '인증에 실패했습니다',
      desc: '링크가 만료되었거나 유효하지 않습니다. 다시 로그인하거나 이메일을 재발송해주세요.',
      showAction: true,
      actionLabel: '로그인 페이지로 이동',
    },
    missing: {
      bg: 'var(--warning-bg)',
      color: 'var(--warning)',
      icon: 'flag' as const,
      title: '유효하지 않은 링크',
      desc: '인증 토큰이 포함되지 않은 링크입니다. 이메일 내 링크를 다시 확인해주세요.',
      showAction: true,
      actionLabel: '로그인 페이지로 이동',
    },
  } as const

  const c = config[status]

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: c.bg,
            color: c.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Icon name={c.icon} size={26} />
        </div>
        <h1 className="auth-h">{c.title}</h1>
        <p className="t-mute" style={{ fontSize: 14, lineHeight: 1.6 }}>{c.desc}</p>
        {c.showAction && (
          <Link to="/login" className="btn btn-primary btn-block" style={{ marginTop: 24 }}>
            {c.actionLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
