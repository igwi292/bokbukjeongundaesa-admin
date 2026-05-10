import { useEffect, useRef, useState } from 'react'
import { fetchMyStore, updateStore, createStore } from '../../api/stores'
import type { Store } from '../../types'

type EditableDraft = Pick<Store, 'name' | 'location' | 'description'>

interface Field {
  key: keyof EditableDraft
  label: string
  placeholder: string
}

type OperationKey = 'is_active' | 'require_approval'

const FIELDS: Field[] = [
  { key: 'name', label: '매장명', placeholder: '매장 이름을 입력하세요' },
  { key: 'location', label: '위치', placeholder: '주소를 입력하세요' },
  { key: 'description', label: '매장 소개', placeholder: '매장 소개를 입력하세요' },
]

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) throw new Error('copy failed')
}

function QrCard({ store }: { store: Store }) {
  const [copyFeedback, setCopyFeedback] = useState('')
  const scanCount = store.qr_scan_count ?? 0
  const lastScannedAt = store.qr_last_scanned_at
    ? new Date(store.qr_last_scanned_at).toLocaleString('ko-KR')
    : '아직 없음'

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = store.qr_url
    a.download = `${store.name}-qr.png`
    a.click()
  }

  const handleCopy = async (label: string, value?: string) => {
    if (!value) return
    try {
      await copyText(value)
      setCopyFeedback(`${label} 복사됨`)
    } catch {
      setCopyFeedback('복사에 실패했습니다')
    } finally {
      window.setTimeout(() => setCopyFeedback(''), 1800)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-medium text-gray-400 mb-1">매장 QR 코드</p>
        <p className="text-xs text-gray-400">손님이 이 QR로 접속하면 방문 기록이 집계됩니다.</p>
      </div>
      <div className="flex flex-col items-center px-6 py-6 gap-4">
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <img src={store.qr_url} alt="매장 QR 코드" className="w-40 h-40 object-contain" />
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-[11px] font-medium text-gray-400 mb-1">스캔 수</p>
            <p className="text-lg font-bold text-gray-900">{scanCount.toLocaleString('ko-KR')}</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-[11px] font-medium text-gray-400 mb-1">마지막 스캔</p>
            <p className="text-sm font-semibold text-gray-700 truncate" title={lastScannedAt}>{lastScannedAt}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <a
            href={store.public_url || store.qr_redirect_url || store.qr_url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            방문자 화면
          </a>
          <button
            onClick={handleDownload}
            className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            다운로드
          </button>
        </div>
        <div className="w-full space-y-2">
          {store.public_url && (
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500" title={store.public_url}>
                {store.public_url}
              </p>
              <button
                onClick={() => handleCopy('방문자 링크', store.public_url)}
                className="shrink-0 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                링크 복사
              </button>
            </div>
          )}
          {store.qr_redirect_url && (
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500" title={store.qr_redirect_url}>
                {store.qr_redirect_url}
              </p>
              <button
                onClick={() => handleCopy('동적 QR 링크', store.qr_redirect_url)}
                className="shrink-0 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                QR 링크 복사
              </button>
            </div>
          )}
          {copyFeedback && <p className="text-xs text-indigo-600">{copyFeedback}</p>}
        </div>
      </div>
    </div>
  )
}

function SettingSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function OperationSettingsCard({
  store,
  onUpdated,
}: {
  store: Store
  onUpdated: (store: Store) => void
}) {
  const [savingKey, setSavingKey] = useState<OperationKey | null>(null)
  const [error, setError] = useState('')
  const requireApproval = store.require_approval ?? true

  const handleToggle = async (key: OperationKey, value: boolean) => {
    setSavingKey(key)
    setError('')
    try {
      const res = await updateStore(store.uuid, { [key]: value } as Partial<Store>)
      onUpdated(res.data)
    } catch {
      setError('운영 설정 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-medium text-gray-400 mb-1">운영 설정</p>
        <p className="text-xs text-gray-400">QR 공개 여부와 새 기록 승인 방식을 관리합니다.</p>
      </div>
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">매장 공개</p>
          <p className="text-xs text-gray-400 mt-1">
            {store.is_active ? 'QR과 방문자 화면이 열려 있습니다.' : 'QR과 방문자 화면이 닫혀 있습니다.'}
          </p>
        </div>
        <SettingSwitch
          checked={store.is_active}
          disabled={savingKey !== null}
          onChange={(checked) => handleToggle('is_active', checked)}
        />
      </div>
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">승인 후 공개</p>
          <p className="text-xs text-gray-400 mt-1">
            {requireApproval ? '새 기록은 승인 전까지 대기 상태입니다.' : '새 기록은 작성 즉시 공개됩니다.'}
          </p>
        </div>
        <SettingSwitch
          checked={requireApproval}
          disabled={savingKey !== null}
          onChange={(checked) => handleToggle('require_approval', checked)}
        />
      </div>
      {error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
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

      <OperationSettingsCard store={store} onUpdated={setStore} />

      {/* 읽기 전용 메타 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">사업자번호</p>
          <p className="text-sm text-gray-700">{store.business_number || '미입력'}</p>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">등록일</p>
          <p className="text-sm text-gray-600">
            {new Date(store.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {/* QR 코드 */}
      {store.qr_url && <QrCard store={store} />}
    </div>
  )
}
