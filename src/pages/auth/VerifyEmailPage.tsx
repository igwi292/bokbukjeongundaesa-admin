import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../../api/auth'

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
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-400',
      icon: (
        <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ),
      title: '이메일 인증 중...',
      desc: '잠시만 기다려주세요.',
      action: null,
    },
    success: {
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: '이메일 인증 완료!',
      desc: '계정이 활성화되었습니다. 이제 로그인하실 수 있습니다.',
      action: (
        <Link
          to="/login"
          className="block w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors mt-6"
        >
          로그인하기
        </Link>
      ),
    },
    error: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: '인증에 실패했습니다',
      desc: '링크가 만료되었거나 유효하지 않습니다. 다시 로그인하거나 이메일을 재발송해주세요.',
      action: (
        <Link
          to="/login"
          className="block w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors mt-6"
        >
          로그인 페이지로 이동
        </Link>
      ),
    },
    missing: {
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      ),
      title: '유효하지 않은 링크',
      desc: '인증 토큰이 포함되지 않은 링크입니다. 이메일 내 링크를 다시 확인해주세요.',
      action: (
        <Link
          to="/login"
          className="block w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors mt-6"
        >
          로그인 페이지로 이동
        </Link>
      ),
    },
  } as const

  const c = config[status]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8 text-center">
        <div className={`w-14 h-14 ${c.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <span className={c.iconColor}>{c.icon}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{c.title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
        {c.action}
      </div>
    </div>
  )
}
