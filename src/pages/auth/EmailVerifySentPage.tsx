import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { resendVerificationEmail } from '../../api/auth'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인해주세요</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-1">
          인증 메일을 발송했습니다.
        </p>
        {email && (
          <p className="text-sm font-medium text-indigo-600 mb-4">{email}</p>
        )}
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          받은 메일함의 인증 링크를 클릭하면 가입이 완료됩니다.<br />
          메일이 보이지 않으면 스팸함도 확인해주세요.
        </p>

        {resent && (
          <p className="text-xs text-green-600 mb-4">인증 메일을 재발송했습니다.</p>
        )}
        {resendError && (
          <p className="text-xs text-red-500 mb-4">{resendError}</p>
        )}

        {email && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors mb-3"
          >
            {resending ? '재발송 중...' : '인증 메일 다시 받기'}
          </button>
        )}

        <Link
          to="/login"
          className="block w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          로그인 페이지로 이동
        </Link>
      </div>
    </div>
  )
}
