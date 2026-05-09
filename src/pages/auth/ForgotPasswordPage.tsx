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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-gray-900">비밀번호 재설정</h1>
          <p className="text-sm text-gray-500 mt-1">가입한 이메일로 재설정 링크를 보내드립니다</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{email}</span>로<br />재설정 링크를 발송했습니다.
            </p>
            <p className="text-xs text-gray-400">이메일이 오지 않는다면 스팸함을 확인해 주세요.</p>
            <Link to="/login" className="block text-sm text-indigo-600 font-medium hover:underline pt-2">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="email"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '발송 중...' : '재설정 링크 보내기'}
            </button>

            <p className="text-center text-sm text-gray-400">
              <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                로그인으로 돌아가기
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
