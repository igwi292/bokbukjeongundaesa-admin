import { useEffect, useRef, useState } from 'react'
import { fetchMyStore, updateStore } from '../../api/stores'
import type { Store } from '../../types'

type EditableDraft = Pick<Store, 'name' | 'location' | 'hours'>

interface Field {
  key: keyof EditableDraft
  label: string
  placeholder: string
}

const FIELDS: Field[] = [
  { key: 'name', label: '매장명', placeholder: '매장 이름을 입력하세요' },
  { key: 'location', label: '위치', placeholder: '주소를 입력하세요' },
  { key: 'hours', label: '영업시간', placeholder: '예) 09:00 - 22:00' },
]

function QrCard({ qrUrl, storeName }: { qrUrl: string; storeName: string }) {
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `${storeName}-qr.png`
    a.click()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-medium text-gray-400 mb-1">매장 QR 코드</p>
        <p className="text-xs text-gray-400">손님이 이 QR로 접속하면 매장 기록 화면으로 연결됩니다.</p>
      </div>
      <div className="flex flex-col items-center px-6 py-6 gap-4">
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <img src={qrUrl} alt="매장 QR 코드" className="w-40 h-40 object-contain" />
        </div>
        <div className="flex gap-2 w-full">
          <a
            href={qrUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            미리보기
          </a>
          <button
            onClick={handleDownload}
            className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            다운로드
          </button>
        </div>
      </div>
    </div>
  )
}

const PLAN_LABEL: Record<Store['plan'], string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_COLOR: Record<Store['plan'], string> = {
  basic: 'bg-gray-100 text-gray-600',
  pro: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-purple-100 text-purple-700',
}

export default function StoresPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<EditableDraft>({ name: '', location: '', hours: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMyStore()
      .then((res) => {
        setStore(res.data)
        setDraft({ name: res.data.name, location: res.data.location, hours: res.data.hours })
      })
      .catch(() => {})
  }, [])

  const handleEdit = () => {
    if (!store) return
    setDraft({ name: store.name, location: store.location, hours: store.hours })
    setError('')
    setEditing(true)
    setTimeout(() => firstInputRef.current?.focus(), 0)
  }

  const handleCancel = () => {
    setEditing(false)
    setError('')
  }

  const handleSave = async () => {
    if (!store) return
    setSaving(true)
    setError('')
    try {
      const res = await updateStore(store.id, draft)
      setStore(res.data)
      setEditing(false)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-8">내 매장</h2>

      {/* 편집 가능 필드 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {FIELDS.map(({ key, label, placeholder }, idx) => (
          <div
            key={key}
            className={`px-6 py-5 ${idx < FIELDS.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            {editing ? (
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type="text"
                value={draft[key]}
                placeholder={placeholder}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {store[key] || <span className="text-gray-400">미입력</span>}
              </p>
            )}
          </div>
        ))}

        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

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

      {/* 읽기 전용 메타 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">플랜</p>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_COLOR[store.plan]}`}>
            {PLAN_LABEL[store.plan]}
          </span>
        </div>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">누적 기록</p>
          <p className="text-sm font-semibold text-gray-900">{store.record_count.toLocaleString()}개</p>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">등록일</p>
          <p className="text-sm text-gray-600">
            {new Date(store.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {/* QR 코드 */}
      {store.qr_url && <QrCard qrUrl={store.qr_url} storeName={store.name} />}
    </div>
  )
}
