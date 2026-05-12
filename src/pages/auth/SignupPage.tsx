import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../../api/auth'

interface FormState {
  email: string
  nickname: string
  phone: string
  password: string
  confirmPassword: string
  agreedToTerms: boolean
  agreedToPrivacy: boolean
}

interface FieldErrors {
  email?: string
  nickname?: string
  phone?: string
  password?: string
  confirmPassword?: string
  agreedToTerms?: string
  agreedToPrivacy?: string
}

type SignupErrorPayload = {
  email?: string[]
  nickname?: string[]
  phone?: string[]
  password?: string[]
  agreed_to_terms?: string[]
  agreed_to_privacy?: string[]
}

type TextFieldKey = 'email' | 'nickname' | 'phone' | 'password' | 'confirmPassword'

const firstError = (value?: string[]) => value?.[0]

export default function SignupPage() {
  const [form, setForm] = useState<FormState>({
    email: '',
    nickname: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
    agreedToPrivacy: false,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (key: TextFieldKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const setAgreement = (key: 'agreedToTerms' | 'agreedToPrivacy') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.checked }))
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
    if (!form.agreedToTerms)
      errors.agreedToTerms = '서비스 이용약관에 동의해야 합니다.'
    if (!form.agreedToPrivacy)
      errors.agreedToPrivacy = '개인정보 처리방침에 동의해야 합니다.'
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
        agreed_to_terms: form.agreedToTerms,
        agreed_to_privacy: form.agreedToPrivacy,
      })
      navigate('/email-verify-sent', { state: { email: form.email } })
    } catch (err: unknown) {
      const data = isAxiosError<SignupErrorPayload>(err) ? err.response?.data : undefined
      const emailError = firstError(data?.email)
      const nicknameError = firstError(data?.nickname)
      const passwordError = firstError(data?.password)
      const phoneError = firstError(data?.phone)
      const termsError = firstError(data?.agreed_to_terms)
      const privacyError = firstError(data?.agreed_to_privacy)

      if (emailError) setFieldErrors((prev) => ({ ...prev, email: emailError }))
      else if (nicknameError) setFieldErrors((prev) => ({ ...prev, nickname: nicknameError }))
      else if (passwordError) setFieldErrors((prev) => ({ ...prev, password: passwordError }))
      else if (phoneError) setFieldErrors((prev) => ({ ...prev, phone: phoneError }))
      else if (termsError) setFieldErrors((prev) => ({ ...prev, agreedToTerms: termsError }))
      else if (privacyError) setFieldErrors((prev) => ({ ...prev, agreedToPrivacy: privacyError }))
      else setServerError('회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const fields: { key: TextFieldKey; label: string; type: string; required: boolean }[] = [
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

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.agreedToTerms}
                onChange={setAgreement('agreedToTerms')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>서비스 이용약관에 동의합니다.</span>
            </label>
            {fieldErrors.agreedToTerms && (
              <p className="text-xs text-red-500">{fieldErrors.agreedToTerms}</p>
            )}
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.agreedToPrivacy}
                onChange={setAgreement('agreedToPrivacy')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>개인정보 처리방침에 동의합니다.</span>
            </label>
            {fieldErrors.agreedToPrivacy && (
              <p className="text-xs text-red-500">{fieldErrors.agreedToPrivacy}</p>
            )}
          </div>

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
