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
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/sds-logo.svg" alt="" />
          <span className="t">복붙전권대사</span>
        </div>
        <h1 className="auth-h">사장님 회원가입</h1>
        <p className="auth-sub">매장을 등록하고 방문 기록을 받아보세요.</p>

        <form onSubmit={handleSubmit} className="stack gap-4">
          {fields.map(({ key, label, type, required }) => (
            <div className="field" key={key}>
              <label>
                {label}
                {!required && <span className="t-mute" style={{ fontWeight: 400, marginLeft: 4 }}>(선택)</span>}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                required={required}
                style={fieldErrors[key] ? { borderColor: 'var(--danger)' } : undefined}
              />
              {fieldErrors[key] && (
                <p className="t-mute" style={{ fontSize: 12, color: 'var(--danger-text)', marginTop: 4 }}>
                  {fieldErrors[key]}
                </p>
              )}
            </div>
          ))}

          <div className="stack gap-2">
            <label className="row gap-2" style={{ alignItems: 'flex-start', fontSize: 14, color: 'var(--gray-600)' }}>
              <input
                type="checkbox"
                checked={form.agreedToTerms}
                onChange={setAgreement('agreedToTerms')}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--brand)' }}
              />
              <span>서비스 이용약관에 동의합니다.</span>
            </label>
            {fieldErrors.agreedToTerms && (
              <p className="t-mute" style={{ fontSize: 12, color: 'var(--danger-text)' }}>{fieldErrors.agreedToTerms}</p>
            )}
            <label className="row gap-2" style={{ alignItems: 'flex-start', fontSize: 14, color: 'var(--gray-600)' }}>
              <input
                type="checkbox"
                checked={form.agreedToPrivacy}
                onChange={setAgreement('agreedToPrivacy')}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--brand)' }}
              />
              <span>개인정보 처리방침에 동의합니다.</span>
            </label>
            {fieldErrors.agreedToPrivacy && (
              <p className="t-mute" style={{ fontSize: 12, color: 'var(--danger-text)' }}>{fieldErrors.agreedToPrivacy}</p>
            )}
          </div>

          {serverError && <p className="note err">{serverError}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="auth-foot">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
