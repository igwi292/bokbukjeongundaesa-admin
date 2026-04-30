import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'

interface FormState {
  email: string
  nickname: string
  phone: string
  password: string
  confirmPassword: string
}

interface FieldErrors {
  email?: string
  nickname?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

export default function SignupPage() {
  const [form, setForm] = useState<FormState>({
    email: '',
    nickname: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = '올바른 이메일 형식이 아닙니다.'
    if (form.nickname.length < 2)
      errors.nickname = '닉네임은 2자 이상이어야 합니다.'
    if (form.password.length < 8)
      errors.password = '비밀번호는 8자 이상이어야 합니다.'
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setServerError('')
    setLoading(true)
    try {
      await signup({
        email: form.email,
        nickname: form.nickname,
        phone: form.phone,
        password: form.password,
      })
      navigate('/login')
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.email) setFieldErrors((prev) => ({ ...prev, email: data.email[0] }))
      else if (data?.nickname) setFieldErrors((prev) => ({ ...prev, nickname: data.nickname[0] }))
      else if (data?.password) setFieldErrors((prev) => ({ ...prev, password: data.password[0] }))
      else if (data?.phone) setFieldErrors((prev) => ({ ...prev, phone: data.phone[0] }))
      else setServerError('회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const fields: { key: keyof FormState; label: string; type: string; required: boolean }[] = [
    { key: 'email', label: '이메일', type: 'email', required: true },
    { key: 'nickname', label: '닉네임', type: 'text', required: true },
    { key: 'phone', label: '연락처', type: 'tel', required: false },
    { key: 'password', label: '비밀번호', type: 'password', required: true },
    { key: 'confirmPassword', label: '비밀번호 확인', type: 'password', required: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-gray-900">복붙전권대사</h1>
          <p className="text-sm text-gray-500 mt-1">사장님 회원가입</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {!required && <span className="text-gray-400 font-normal ml-1">(선택)</span>}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                required={required}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                  fieldErrors[key]
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors[key] && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors[key]}</p>
              )}
            </div>
          ))}

          {serverError && <p className="text-sm text-red-500">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
