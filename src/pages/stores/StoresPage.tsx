import { useCallback, useEffect, useRef, useState } from 'react'
import {
  activateStoreMarker,
  createStore,
  createStoreMarker,
  fetchMyStore,
  fetchStoreMarkers,
  updateStore,
} from '../../api/stores'
import { Icon } from '../../components/ui/Icon'
import { Toggle } from '../../components/ui/Toggle'
import type { Store, StoreMarker } from '../../types'

type EditableDraft = Pick<Store, 'name' | 'location' | 'description'>
type OperationKey = 'is_active' | 'require_approval'

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

const CREATE_FIELDS = [
  { key: 'name' as const, label: '매장명 *', placeholder: '매장 이름' },
  { key: 'location' as const, label: '주소 *', placeholder: '매장 주소' },
  { key: 'business_number' as const, label: '사업자번호', placeholder: '000-00-00000' },
  { key: 'description' as const, label: '매장 소개', placeholder: '매장 소개 (선택)' },
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

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])
  useEffect(() => {
    const t = window.setTimeout(() => dismissRef.current(), 4000)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div className="toast row gap-3" style={{ background: 'var(--danger)' }}>
      {message}
      <button onClick={onDismiss} className="iconbtn" style={{ color: 'rgba(255,255,255,0.8)' }} aria-label="닫기">
        <Icon name="x" size={16} />
      </button>
    </div>
  )
}

function CreateStoreModal({
  onCreated,
  onClose,
  onError,
}: {
  onCreated: () => void
  onClose: () => void
  onError: (msg: string) => void
}) {
  const [draft, setDraft] = useState({ name: '', location: '', description: '', business_number: '' })
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!draft.name.trim()) {
      setFieldError('매장명을 입력해주세요.')
      return
    }
    if (!draft.location.trim()) {
      setFieldError('주소를 입력해주세요.')
      return
    }
    setFieldError('')
    setSaving(true)
    try {
      await createStore(draft)
      onCreated()
    } catch (err) {
      console.error('[CreateStore] API error:', err)
      onError('매장 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <span className="mt">새 매장 등록</span>
          <button type="button" onClick={onClose} className="iconbtn" aria-label="닫기">
            <Icon name="x" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-b">
            {CREATE_FIELDS.map(({ key, label, placeholder }) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input
                  type="text"
                  value={draft[key]}
                  placeholder={placeholder}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            {fieldError && <p className="note err">{fieldError}</p>}
          </div>
          <div className="modal-f">
            <button type="button" onClick={onClose} disabled={saving} className="btn btn-neutral">
              취소
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? '등록 중...' : '매장 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
    <div className="card mb-4">
      <div className="card-h">
        <div className="ct">매장 QR 코드</div>
        <div className="cs">손님이 이 QR로 접속하면 방문 기록이 집계됩니다.</div>
      </div>
      <div className="card-pad stack gap-4" style={{ alignItems: 'center' }}>
        <div className="qr-img">
          <img src={store.qr_url} alt="매장 QR 코드" />
        </div>
        <div className="kv" style={{ width: '100%' }}>
          <div className="k">
            <div className="kl">스캔 수</div>
            <div className="kv2">{scanCount.toLocaleString('ko-KR')}</div>
          </div>
          <div className="k">
            <div className="kl">마지막 스캔</div>
            <div className="kv2" style={{ fontSize: 13, fontWeight: 600 }} title={lastScannedAt}>
              {lastScannedAt}
            </div>
          </div>
        </div>
        <div className="row gap-2" style={{ width: '100%' }}>
          <a
            href={store.public_url || store.qr_redirect_url || store.qr_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-neutral btn-block"
          >
            <Icon name="external-link" size={16} />
            방문자 화면
          </a>
          <button onClick={handleDownload} className="btn btn-primary btn-block">
            <Icon name="download" size={16} />
            다운로드
          </button>
        </div>
        <div className="stack gap-2" style={{ width: '100%' }}>
          {store.public_url && (
            <div className="urlbar">
              <span className="u" title={store.public_url}>
                {store.public_url}
              </span>
              <button onClick={() => handleCopy('방문자 링크', store.public_url)} className="btn btn-neutral btn-sm">
                <Icon name="copy" size={16} />
                링크 복사
              </button>
            </div>
          )}
          {store.qr_redirect_url && (
            <div className="urlbar">
              <span className="u" title={store.qr_redirect_url}>
                {store.qr_redirect_url}
              </span>
              <button onClick={() => handleCopy('동적 QR 링크', store.qr_redirect_url)} className="btn btn-neutral btn-sm">
                <Icon name="copy" size={16} />
                QR 링크 복사
              </button>
            </div>
          )}
          {copyFeedback && (
            <p className="t-mute" style={{ fontSize: 12, color: 'var(--brand)' }}>
              {copyFeedback}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function OperationSettingsCard({ store, onUpdated }: { store: Store; onUpdated: (store: Store) => void }) {
  const [savingKey, setSavingKey] = useState<OperationKey | null>(null)
  const [error, setError] = useState('')
  const requireApproval = store.require_approval ?? true

  const handleToggle = async (key: OperationKey, value: boolean) => {
    setSavingKey(key)
    setError('')
    try {
      const res = await updateStore(store.slug, { [key]: value } as Partial<Store>)
      onUpdated(res.data)
    } catch {
      setError('운영 설정 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-h">
        <div className="ct">운영 설정</div>
        <div className="cs">QR 공개 여부와 새 기록 승인 방식을 관리합니다.</div>
      </div>
      <div className="set-row">
        <div className="min-w-0">
          <div className="sl">매장 공개</div>
          <div className="sd">
            {store.is_active ? 'QR과 방문자 화면이 열려 있습니다.' : 'QR과 방문자 화면이 닫혀 있습니다.'}
          </div>
        </div>
        <Toggle on={store.is_active} disabled={savingKey !== null} onClick={() => handleToggle('is_active', !store.is_active)} />
      </div>
      <div className="set-row">
        <div className="min-w-0">
          <div className="sl">승인 후 공개</div>
          <div className="sd">
            {requireApproval ? '새 기록은 승인 전까지 대기 상태입니다.' : '새 기록은 작성 즉시 공개됩니다.'}
          </div>
        </div>
        <Toggle on={requireApproval} disabled={savingKey !== null} onClick={() => handleToggle('require_approval', !requireApproval)} />
      </div>
      {error && (
        <div style={{ padding: '12px 20px' }}>
          <p className="note err">{error}</p>
        </div>
      )}
    </div>
  )
}

function MarkerSettingsCard({ store, onUpdated }: { store: Store; onUpdated: (store: Store) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [realSize, setRealSize] = useState(String(store.active_marker?.physical_width_m ?? store.marker_real_size_m ?? 0.1))
  const [markers, setMarkers] = useState<StoreMarker[]>([])
  const [saving, setSaving] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const activeMarker = markers.find((marker) => marker.is_active) ?? store.active_marker ?? null
  const hasMarker = !!activeMarker || !!store.marker_image_url
  const isErr = message.includes('실패') || message.includes('선택') || message.includes('올바르게')

  const loadMarkers = useCallback(() => {
    fetchStoreMarkers(store.slug)
      .then((response) => setMarkers(response.data))
      .catch(() => setMessage('마커 버전 기록을 불러오지 못했습니다.'))
  }, [store.slug])

  useEffect(() => {
    void loadMarkers()
  }, [loadMarkers])

  const handleSave = async () => {
    const size = Number(realSize)
    if (!Number.isFinite(size) || size <= 0) {
      setMessage('마커 실측 가로 길이를 올바르게 입력해주세요.')
      return
    }
    if (!file) {
      setMessage('새 마커 버전에 사용할 이미지를 선택해주세요.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const res = await createStoreMarker(store.slug, {
        image: file,
        physical_width_m: size,
      })
      onUpdated({
        ...store,
        active_marker: res.data,
        marker_image_url: res.data.image_url,
        marker_real_size_m: res.data.physical_width_m,
      })
      setFile(null)
      setMarkers((current) => [res.data, ...current.map((marker) => ({ ...marker, is_active: false }))])
      setMessage(`AR 마커 v${res.data.version}이 활성화되었습니다.`)
    } catch {
      setMessage('AR 마커 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (marker: StoreMarker) => {
    if (marker.is_active) return
    setActivatingId(marker.id)
    setMessage('')
    try {
      const response = await activateStoreMarker(store.slug, marker.id)
      setMarkers((current) => current.map((item) => ({
        ...item,
        is_active: item.id === response.data.id,
      })))
      onUpdated({
        ...store,
        active_marker: response.data,
        marker_image_url: response.data.image_url,
        marker_real_size_m: response.data.physical_width_m,
      })
      setRealSize(String(response.data.physical_width_m))
      setMessage(`AR 마커 v${response.data.version}으로 되돌렸습니다.`)
    } catch {
      setMessage('이전 마커 활성화에 실패했습니다.')
    } finally {
      setActivatingId(null)
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-h">
        <div className="ct">AR 마커</div>
        <div className="cs">손님 카메라가 현실 공간의 기준점으로 인식할 이미지를 등록합니다.</div>
      </div>
      <div className="card-pad stack gap-4">
        {(activeMarker?.image_url || store.marker_image_url) ? (
          <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)', background: 'var(--gray-50)', padding: 12 }}>
            <img src={activeMarker?.image_url || store.marker_image_url} alt="등록된 AR 마커" style={{ maxHeight: 160, width: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div
            className="empty"
            style={{ padding: '32px 16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--gray-200)', background: 'var(--gray-50)' }}
          >
            등록된 마커 이미지가 없습니다.
          </div>
        )}
        <div className="field">
          <label>새 마커 버전 이미지</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ height: 'auto', padding: '8px 0', border: 0 }}
          />
        </div>
        <div className="field">
          <label>실제 가로 길이(m)</label>
          <input type="number" min="0.01" step="0.01" value={realSize} onChange={(e) => setRealSize(e.target.value)} />
        </div>
        {message && (
          <p className="note" style={{ color: isErr ? 'var(--danger-text)' : 'var(--brand)', background: 'transparent', padding: 0 }}>
            {message}
          </p>
        )}
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-block">
          {saving ? '저장 중...' : hasMarker ? '새 버전 등록' : '마커 등록'}
        </button>
        {markers.length > 0 && (
          <div className="stack gap-2">
            <div className="sl">버전 기록</div>
            {markers.map((marker) => (
              <div className="set-row" key={marker.id} style={{ padding: '12px 0' }}>
                <div className="min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    v{marker.version} · {(marker.physical_width_m * 100).toFixed(1)}cm
                  </div>
                  <div className="t-mute" style={{ fontSize: 11 }}>
                    {new Date(marker.created_at).toLocaleString('ko-KR')} · {marker.image_sha256.slice(0, 12)}
                  </div>
                </div>
                <button
                  type="button"
                  className={marker.is_active ? 'btn btn-sm btn-brand' : 'btn btn-sm btn-neutral'}
                  disabled={marker.is_active || activatingId !== null}
                  onClick={() => handleActivate(marker)}
                >
                  {marker.is_active ? '사용 중' : activatingId === marker.id ? '전환 중...' : '이 버전 사용'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  const dismissToast = useCallback(() => setToastMessage(''), [])

  const load = useCallback(() => {
    setFetchError(false)
    fetchMyStore()
      .then((res) => {
        setStore(res.data)
        if (res.data) {
          setDraft({ name: res.data.name, location: res.data.location, description: res.data.description })
        }
      })
      .catch(() => setFetchError(true))
  }, [])

  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  const handleEdit = () => {
    if (!store) return
    setDraft({ name: store.name, location: store.location, description: store.description })
    setSaveError('')
    setEditing(true)
    setTimeout(() => firstInputRef.current?.focus(), 0)
  }

  const handleCancel = () => {
    setEditing(false)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!store) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await updateStore(store.slug, draft)
      setStore(res.data)
      setEditing(false)
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreated = useCallback(() => {
    setShowCreateModal(false)
    load()
  }, [load])

  if (fetchError) {
    return (
      <div style={{ maxWidth: 560 }}>
        <div className="page-h">
          <h2>내 매장</h2>
        </div>
        <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-text)' }}>매장 정보를 불러오지 못했습니다.</span>
          <button onClick={load} className="btn btn-neutral btn-sm">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (store === undefined) {
    return <div className="empty">불러오는 중...</div>
  }

  const pageHeader = (
    <div className="page-h">
      <h2>내 매장</h2>
      <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
        <Icon name="plus" size={16} />새 매장 등록
      </button>
    </div>
  )

  const modal = showCreateModal ? (
    <CreateStoreModal onCreated={handleCreated} onClose={() => setShowCreateModal(false)} onError={setToastMessage} />
  ) : null

  const toast = toastMessage ? <Toast message={toastMessage} onDismiss={dismissToast} /> : null

  if (store === null) {
    return (
      <div style={{ maxWidth: 560 }}>
        {pageHeader}
        <div
          className="empty stack gap-4"
          style={{ alignItems: 'center', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--gray-200)', background: 'var(--gray-50)', padding: '64px 20px' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
            <Icon name="store" size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="sl" style={{ color: 'var(--gray-700)' }}>아직 등록된 매장이 없어요</div>
            <div className="sd" style={{ marginTop: 4 }}>첫 매장을 등록하고 QR 코드를 받아보세요.</div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Icon name="plus" size={16} />새 매장 등록
          </button>
        </div>
        {modal}
        {toast}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {pageHeader}
      {modal}
      {toast}

      <div className="card mb-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div className="set-row" key={key} style={{ display: 'block' }}>
            <div className="sd" style={{ marginBottom: 6, marginTop: 0 }}>{label}</div>
            {editing ? (
              <div className="field">
                <input
                  ref={key === 'name' ? firstInputRef : undefined}
                  type="text"
                  value={draft[key]}
                  placeholder={placeholder}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ) : (
              <div className="sl">{store[key] || <span className="t-mute">미입력</span>}</div>
            )}
          </div>
        ))}

        {saveError && (
          <div style={{ padding: '12px 20px' }}>
            <p className="note err">{saveError}</p>
          </div>
        )}

        <div className="tbl-foot" style={{ justifyContent: 'flex-end' }}>
          {editing ? (
            <div className="row gap-2">
              <button onClick={handleCancel} disabled={saving} className="btn btn-neutral btn-sm">
                취소
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          ) : (
            <button onClick={handleEdit} className="btn btn-neutral btn-sm">
              수정하기
            </button>
          )}
        </div>
      </div>

      <OperationSettingsCard store={store} onUpdated={setStore} />
      <MarkerSettingsCard key={store.slug} store={store} onUpdated={setStore} />

      <div className="card mb-4">
        <div className="set-row">
          <div className="sd" style={{ marginTop: 0 }}>사업자번호</div>
          <div className="sl">{store.business_number || '미입력'}</div>
        </div>
        <div className="set-row">
          <div className="sd" style={{ marginTop: 0 }}>등록일</div>
          <div className="sl">{new Date(store.created_at).toLocaleDateString('ko-KR')}</div>
        </div>
      </div>

      {store.qr_url && <QrCard store={store} />}
    </div>
  )
}
