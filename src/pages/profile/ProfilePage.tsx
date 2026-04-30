import { useEffect, useRef, useState } from 'react'
import { fetchProfile, updateProfile } from '../../api/profile'
import type { UserProfile } from '../../types'

interface Field {
  key: keyof Pick<UserProfile, 'email' | 'phone'>
  label: string
  type: string
}

const FIELDS: Field[] = [
  { key: 'email', label: '이메일', type: 'email' },
  { key: 'phone', label: '연락처', type: 'tel' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
      .then((res) => {
        setProfile(res.data)
        setDraft({ email: res.data.email, phone: res.data.phone })
      })
      .catch(() => {})
  }, [])

  const handleEdit = () => {
    if (!profile) return
    setDraft({ email: profile.email, phone: profile.phone })
    setError('')
    setEditing(true)
    setTimeout(() => firstInputRef.current?.focus(), 0)
  }

  const handleCancel = () => {
    setEditing(false)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await updateProfile(draft)
      setProfile(res.data)
      setEditing(false)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-8">프로필</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 아이디 (읽기 전용) */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1">아이디</p>
          <p className="text-sm font-medium text-gray-900">{profile.username}</p>
        </div>

        {/* 이메일 / 연락처 */}
        {FIELDS.map(({ key, label, type }, idx) => (
          <div key={key} className={`px-6 py-5 ${idx < FIELDS.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            {editing ? (
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type={type}
                value={draft[key]}
                onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {profile[key] || <span className="text-gray-400">미입력</span>}
              </p>
            )}
          </div>
        ))}

        {/* 에러 메시지 */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              수정하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
