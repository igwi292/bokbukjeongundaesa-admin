import { useEffect, useRef, useState } from 'react'
import { fetchMyStore, updateStore, createStore } from '../../api/stores'
import type { Store } from '../../types'

type EditableDraft = Pick<Store, 'name' | 'location' | 'description'>

interface Field {
  key: keyof EditableDraft
  label: string
  placeholder: string
}

const FIELDS: Field[] = [
  { key: 'name', label: '매장명', placeholder: '매장 이름을 입력하세요' },
  { key: 'location', label: '위치', placeholder: '주소를 입력하세요' },
  { key: 'description', label: '매장 소개', placeholder: '매장 소개를 입력하세요' },
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

function CreateStoreForm({ onCreated }: { onCreated: (store: Store) => void }) {
  const [draft, setDraft] = useState({ name: '', location: '', description: '', business_number: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!draft.name.trim()) { setError('매장명을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await createStore(draft)
      onCreated(res.data)
    } catch {
      setError('매장 등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg">
      <p className="text-sm font-medium text-gray-700 mb-4">아직 등록된 매장이 없습니다. 첫 매장을 등록해보세요.</p>
      <div className="space-y-3">
        {[
          { key: 'name', label: '매장명', placeholder: '매장 이름' },
          { key: 'location', label: '위치', placeholder: '주소' },
          { key: 'business_number', label: '사업자번호', placeholder: '000-00-00000' },
          { key: 'description', label: '매장 소개', placeholder: '매장 소개 (선택)' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <input
              type="text"
              value={draft[key as keyof typeof draft]}
              placeholder={placeholder}
              onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-4 w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saving ? '등록 중...' : '매장 등록하기'}
      </button>
    </div>
  )
}

export default function StoresPage() {
  const [store, setStore] = useState<Store | null | undefined>(undefined)
  const [fetchError, setFetchError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<EditableDraft>({ name: '', location: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setFetchError(false)
    fetchMyStore()
      .then((res) => {
        setStore(res.data)
        if (res.data) {
          setDraft({ name: res.data.name, location: res.data.location, description: res.data.description })
        }
      })
      .catch(() => setFetchError(true))
  }

  useEffect(() => { queueMicrotask(load) }, [])

  const handleEdit = () => {
    if (!store) return
    setDraft({ name: store.name, location: store.location, description: store.description })
    setSaveError('')
    setEditing(true)
    setTimeout(() => firstInputRef.current?.focus(), 0)
  }

  const handleCancel = () => { setEditing(false); setSaveError('') }

  const handleSave = async () => {
    if (!store) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await updateStore(store.uuid, draft)
      setStore(res.data)
      setEditing(false)
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (fetchError) {
    return (
      <div className="max-w-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-8">내 매장</h2>
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">매장 정보를 불러오지 못했습니다.</p>
          <button onClick={load} className="text-sm text-indigo-600 hover:underline">다시 시도</button>
        </div>
      </div>
    )
  }

  if (store === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (store === null) {
    return (
      <div className="max-w-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-8">내 매장</h2>
        <CreateStoreForm onCreated={(s) => setStore(s)} />
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
                onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {store[key] || <span className="text-gray-400">미입력</span>}
              </p>
            )}
          </div>
        ))}

        {saveError && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-500">{saveError}</p>
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
          <p className="text-xs font-medium text-gray-400">사업자번호</p>
          <p className="text-sm text-gray-700">{store.business_number || '미입력'}</p>
        </div>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">상태</p>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {store.is_active ? '운영 중' : '비활성'}
          </span>
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
