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

  const [editingBasic, setEditingBasic] = useState(false)
  const [basicDraft, setBasicDraft] = useState({ email: '', phone: '' })
  const [savingBasic, setSavingBasic] = useState(false)
  const [basicError, setBasicError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  const [pwDraft, setPwDraft] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  useEffect(() => {
    queueMicrotask(load)
  }, [])

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
      setProfile((prev) => (prev ? { ...prev, owner_profile: res.data } : prev))
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
      <div style={{ maxWidth: 560 }}>
        <div className="page-h">
          <h2>프로필</h2>
        </div>
        <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-text)' }}>프로필을 불러오지 못했습니다.</span>
          <button onClick={load} className="btn btn-neutral btn-sm">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <div className="empty">불러오는 중...</div>
  }

  return (
    <div className="stack gap-4" style={{ maxWidth: 560 }}>
      <div className="page-h" style={{ marginBottom: 0 }}>
        <h2>프로필</h2>
      </div>

      {/* 기본 정보 */}
      <div className="card">
        <div className="card-h">
          <div className="ct">기본 정보</div>
        </div>
        <div className="set-row" style={{ display: 'block' }}>
          <div className="sd" style={{ marginTop: 0, marginBottom: 4 }}>닉네임</div>
          <div className="sl">{profile.nickname || <span className="t-mute">미입력</span>}</div>
        </div>
        {(['email', 'phone'] as const).map((key, idx) => (
          <div key={key} className="set-row" style={{ display: 'block' }}>
            <div className="sd" style={{ marginTop: 0, marginBottom: 4 }}>{key === 'email' ? '이메일' : '연락처'}</div>
            {editingBasic ? (
              <div className="field">
                <input
                  ref={idx === 0 ? emailRef : undefined}
                  type={key === 'email' ? 'email' : 'tel'}
                  value={basicDraft[key]}
                  onChange={(e) => setBasicDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ) : (
              <div className="sl">{profile[key] || <span className="t-mute">미입력</span>}</div>
            )}
          </div>
        ))}
        {basicError && (
          <div style={{ padding: '12px 20px' }}>
            <p className="note err">{basicError}</p>
          </div>
        )}
        <div className="tbl-foot" style={{ justifyContent: 'flex-end' }}>
          {editingBasic ? (
            <div className="row gap-2">
              <button onClick={() => { setEditingBasic(false); setBasicError('') }} disabled={savingBasic} className="btn btn-neutral btn-sm">
                취소
              </button>
              <button onClick={handleSaveBasic} disabled={savingBasic} className="btn btn-primary btn-sm">
                {savingBasic ? '저장 중...' : '저장하기'}
              </button>
            </div>
          ) : (
            <button onClick={handleEditBasic} className="btn btn-neutral btn-sm">
              수정하기
            </button>
          )}
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="card">
        <div className="card-h">
          <div className="ct">사업자 정보</div>
        </div>
        {(
          [
            { key: 'business_name' as keyof OwnerProfile, label: '상호명' },
            { key: 'business_registration_number' as keyof OwnerProfile, label: '사업자번호' },
          ]
        ).map(({ key, label }, idx) => (
          <div key={key} className="set-row" style={{ display: 'block' }}>
            <div className="sd" style={{ marginTop: 0, marginBottom: 4 }}>{label}</div>
            {editingBiz ? (
              <div className="field">
                <input
                  ref={idx === 0 ? bizNameRef : undefined}
                  type="text"
                  value={bizDraft[key]}
                  onChange={(e) => setBizDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={key === 'business_registration_number' ? '000-00-00000' : ''}
                />
              </div>
            ) : (
              <div className="sl">{profile.owner_profile?.[key] || <span className="t-mute">미입력</span>}</div>
            )}
          </div>
        ))}
        {bizError && (
          <div style={{ padding: '12px 20px' }}>
            <p className="note err">{bizError}</p>
          </div>
        )}
        <div className="tbl-foot" style={{ justifyContent: 'flex-end' }}>
          {editingBiz ? (
            <div className="row gap-2">
              <button onClick={() => { setEditingBiz(false); setBizError('') }} disabled={savingBiz} className="btn btn-neutral btn-sm">
                취소
              </button>
              <button onClick={handleSaveBiz} disabled={savingBiz} className="btn btn-primary btn-sm">
                {savingBiz ? '저장 중...' : '저장하기'}
              </button>
            </div>
          ) : (
            <button onClick={handleEditBiz} className="btn btn-neutral btn-sm">
              수정하기
            </button>
          )}
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="card">
        <div className="card-h">
          <div className="ct">비밀번호 변경</div>
        </div>
        <form onSubmit={handleChangePassword}>
          {[
            { key: 'current' as const, label: '현재 비밀번호', autoComplete: 'current-password' },
            { key: 'next' as const, label: '새 비밀번호', autoComplete: 'new-password' },
            { key: 'confirm' as const, label: '새 비밀번호 확인', autoComplete: 'new-password' },
          ].map(({ key, label, autoComplete }) => (
            <div key={key} className="set-row" style={{ display: 'block' }}>
              <div className="sd" style={{ marginTop: 0, marginBottom: 4 }}>{label}</div>
              <div className="field">
                <input
                  type="password"
                  value={pwDraft[key]}
                  onChange={(e) => setPwDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  autoComplete={autoComplete}
                  required
                  minLength={key !== 'current' ? 8 : undefined}
                />
              </div>
            </div>
          ))}
          {pwError && (
            <div style={{ padding: '12px 20px' }}>
              <p className="note err">{pwError}</p>
            </div>
          )}
          {pwSuccess && (
            <div style={{ padding: '12px 20px' }}>
              <p className="note ok">비밀번호가 성공적으로 변경되었습니다.</p>
            </div>
          )}
          <div className="tbl-foot" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" disabled={changingPw} className="btn btn-primary btn-sm">
              {changingPw ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>

      {/* 계정 탈퇴 */}
      <div className="card" style={{ borderColor: 'var(--danger-bg)' }}>
        <div className="card-h">
          <div className="ct" style={{ color: 'var(--danger)' }}>위험 구역</div>
        </div>
        <div className="card-pad">
          <div className="sl" style={{ marginBottom: 4 }}>계정 탈퇴</div>
          <div className="sd" style={{ marginBottom: 16 }}>
            탈퇴 시 모든 매장 정보, 방문 기록 등 계정과 연결된 데이터가 삭제되며 복구할 수 없습니다.
          </div>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
            className="btn btn-sm"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger-bg)' }}
          >
            계정 탈퇴
          </button>
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="scrim">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-b">
              <h3 className="mt" style={{ fontSize: 16, fontWeight: 700 }}>정말 탈퇴하시겠습니까?</h3>
              <p className="t-mute" style={{ fontSize: 14, lineHeight: 1.5 }}>
                이 작업은 되돌릴 수 없습니다. 계속하려면 아래에{' '}
                <strong className="t-strong">탈퇴합니다</strong>를 입력해주세요.
              </p>
              <div className="field">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="탈퇴합니다"
                />
              </div>
              {deleteError && <p className="note err">{deleteError}</p>}
            </div>
            <div className="modal-f">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="btn btn-neutral btn-block">
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== '탈퇴합니다' || deleting}
                className="btn btn-danger btn-block"
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
