import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfile, updateProfile, updateOwnerProfile } from '../../api/profile'
import { changePassword, deleteAccount } from '../../api/account'
import { useAuth } from '../../context/AuthContext'
import type { UserProfile, OwnerProfile } from '../../types'

export default function ProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fetchError, setFetchError] = useState(false)

  // 기본 정보 편집
  const [editingBasic, setEditingBasic] = useState(false)
  const [basicDraft, setBasicDraft] = useState({ email: '', phone: '' })
  const [savingBasic, setSavingBasic] = useState(false)
  const [basicError, setBasicError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  // 비밀번호 변경
  const [pwDraft, setPwDraft] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // 계정 탈퇴
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // 사업자 정보 편집
  const [editingBiz, setEditingBiz] = useState(false)
  const [bizDraft, setBizDraft] = useState({ business_name: '', business_registration_number: '' })
  const [savingBiz, setSavingBiz] = useState(false)
  const [bizError, setBizError] = useState('')
  const bizNameRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setFetchError(false)
    fetchProfile()
      .then((res) => {
        setProfile(res.data)
        setBasicDraft({ email: res.data.email, phone: res.data.phone })
        setBizDraft({
          business_name: res.data.owner_profile?.business_name ?? '',
          business_registration_number: res.data.owner_profile?.business_registration_number ?? '',
        })
      })
      .catch(() => setFetchError(true))
  }

  useEffect(() => { queueMicrotask(load) }, [])

  const handleEditBasic = () => {
    if (!profile) return
    setBasicDraft({ email: profile.email, phone: profile.phone })
    setBasicError('')
    setEditingBasic(true)
    setTimeout(() => emailRef.current?.focus(), 0)
  }

  const handleSaveBasic = async () => {
    setSavingBasic(true)
    setBasicError('')
    try {
      const res = await updateProfile(basicDraft)
      setProfile(res.data)
      setEditingBasic(false)
    } catch {
      setBasicError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSavingBasic(false)
    }
  }

  const handleEditBiz = () => {
    if (!profile) return
    setBizDraft({
      business_name: profile.owner_profile?.business_name ?? '',
      business_registration_number: profile.owner_profile?.business_registration_number ?? '',
    })
    setBizError('')
    setEditingBiz(true)
    setTimeout(() => bizNameRef.current?.focus(), 0)
  }

  const handleSaveBiz = async () => {
    setSavingBiz(true)
    setBizError('')
    try {
      const res = await updateOwnerProfile(bizDraft)
      setProfile((prev) => prev ? { ...prev, owner_profile: res.data } : prev)
      setEditingBiz(false)
    } catch {
      setBizError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSavingBiz(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount()
      await logout()
      navigate('/login')
    } catch {
      setDeleteError('계정 탈퇴에 실패했습니다. 다시 시도해주세요.')
      setDeleting(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwDraft.next !== pwDraft.confirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPwError('')
    setPwSuccess(false)
    setChangingPw(true)
    try {
      await changePassword(pwDraft.current, pwDraft.next)
      setPwDraft({ current: '', next: '', confirm: '' })
      setPwSuccess(true)
    } catch {
      setPwError('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.')
    } finally {
      setChangingPw(false)
    }
  }

  if (fetchError) {
    return (
      <div className="max-w-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-8">프로필</h2>
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">프로필을 불러오지 못했습니다.</p>
          <button onClick={load} className="text-sm text-indigo-600 hover:underline">다시 시도</button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-900">프로필</h2>

      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">기본 정보</p>
        </div>

        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1">닉네임</p>
          <p className="text-sm font-medium text-gray-900">{profile.nickname || <span className="text-gray-400">미입력</span>}</p>
        </div>

        {(['email', 'phone'] as const).map((key, idx) => (
          <div key={key} className={`px-6 py-5 ${idx === 0 ? 'border-b border-gray-100' : ''}`}>
            <p className="text-xs font-medium text-gray-400 mb-1">{key === 'email' ? '이메일' : '연락처'}</p>
            {editingBasic ? (
              <input
                ref={idx === 0 ? emailRef : undefined}
                type={key === 'email' ? 'email' : 'tel'}
                value={basicDraft[key]}
                onChange={(e) => setBasicDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">{profile[key] || <span className="text-gray-400">미입력</span>}</p>
            )}
          </div>
        ))}

        {basicError && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-500">{basicError}</p>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          {editingBasic ? (
            <>
              <button onClick={() => { setEditingBasic(false); setBasicError('') }} disabled={savingBasic} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                취소
              </button>
              <button onClick={handleSaveBasic} disabled={savingBasic} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {savingBasic ? '저장 중...' : '저장하기'}
              </button>
            </>
          ) : (
            <button onClick={handleEditBasic} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              수정하기
            </button>
          )}
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">사업자 정보</p>
        </div>

        {([
          { key: 'business_name' as keyof OwnerProfile, label: '상호명' },
          { key: 'business_registration_number' as keyof OwnerProfile, label: '사업자번호' },
        ]).map(({ key, label }, idx) => (
          <div key={key} className={`px-6 py-5 ${idx === 0 ? 'border-b border-gray-100' : ''}`}>
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            {editingBiz ? (
              <input
                ref={idx === 0 ? bizNameRef : undefined}
                type="text"
                value={bizDraft[key]}
                onChange={(e) => setBizDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={key === 'business_registration_number' ? '000-00-00000' : ''}
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {profile.owner_profile?.[key] || <span className="text-gray-400">미입력</span>}
              </p>
            )}
          </div>
        ))}

        {bizError && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-500">{bizError}</p>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          {editingBiz ? (
            <>
              <button onClick={() => { setEditingBiz(false); setBizError('') }} disabled={savingBiz} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                취소
              </button>
              <button onClick={handleSaveBiz} disabled={savingBiz} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {savingBiz ? '저장 중...' : '저장하기'}
              </button>
            </>
          ) : (
            <button onClick={handleEditBiz} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              수정하기
            </button>
          )}
        </div>
      </div>
      {/* 비밀번호 변경 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">비밀번호 변경</p>
        </div>

        <form onSubmit={handleChangePassword}>
          {[
            { key: 'current' as const, label: '현재 비밀번호', autoComplete: 'current-password' },
            { key: 'next' as const, label: '새 비밀번호', autoComplete: 'new-password' },
            { key: 'confirm' as const, label: '새 비밀번호 확인', autoComplete: 'new-password' },
          ].map(({ key, label, autoComplete }, idx, arr) => (
            <div key={key} className={`px-6 py-5 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
              <input
                type="password"
                value={pwDraft[key]}
                onChange={(e) => setPwDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                autoComplete={autoComplete}
                required
                minLength={key !== 'current' ? 8 : undefined}
              />
            </div>
          ))}

          {pwError && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-500">{pwError}</p>
            </div>
          )}
          {pwSuccess && (
            <div className="px-6 py-3 bg-green-50 border-t border-green-100">
              <p className="text-xs text-green-600">비밀번호가 성공적으로 변경되었습니다.</p>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={changingPw}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {changingPw ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>
      {/* 계정 탈퇴 */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">위험 구역</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm font-medium text-gray-800 mb-1">계정 탈퇴</p>
          <p className="text-xs text-gray-400 mb-4">
            탈퇴 시 모든 매장 정보, 방문 기록 등 계정과 연결된 데이터가 삭제되며 복구할 수 없습니다.
          </p>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            계정 탈퇴
          </button>
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              이 작업은 되돌릴 수 없습니다. 계속하려면 아래에 <strong className="text-gray-700">탈퇴합니다</strong>를 입력해주세요.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="탈퇴합니다"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
            />
            {deleteError && (
              <p className="text-xs text-red-500 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '탈퇴합니다' || deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
