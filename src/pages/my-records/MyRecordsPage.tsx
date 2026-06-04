import { useEffect, useState } from 'react'
import { fetchMyStore } from '../../api/stores'
import { fetchRecords } from '../../api/records'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import type { StoreRecord } from '../../types'

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  hidden: '숨김',
  rejected: '거절',
  deleted: '삭제',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warn',
  approved: 'pos',
  hidden: 'neut',
  rejected: 'warn',
  deleted: 'danger',
}

const getReportCount = (record: StoreRecord) => record.report_count ?? 0

function RecordModal({ record, onClose }: { record: StoreRecord; onClose: () => void }) {
  const reportCount = getReportCount(record)

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="mt">{record.visitor_name ?? '익명'}</div>
            <div className="dt" style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 2 }}>
              {new Date(record.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          <div className="stack gap-2" style={{ alignItems: 'flex-end' }}>
            <Badge tone={STATUS_TONE[record.status] ?? 'neut'}>
              {STATUS_LABEL[record.status] ?? record.status}
            </Badge>
            {reportCount > 0 && <Badge tone="danger">신고 {reportCount.toLocaleString()}</Badge>}
          </div>
        </div>

        <div className="modal-b">
          <div className="rec-body">{record.content}</div>
        </div>

        <div className="modal-f">
          <button onClick={onClose} className="btn btn-neutral">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

function RecordCard({ record, onClick }: { record: StoreRecord; onClick: () => void }) {
  const reportCount = getReportCount(record)

  return (
    <button onClick={onClick} className={`rec${reportCount > 0 ? ' flagged' : ''}`} style={{ textAlign: 'left' }}>
      <div className="rec-h">
        <div className="nm">{record.visitor_name ?? '익명'}</div>
        <div className="stack gap-2" style={{ alignItems: 'flex-end' }}>
          <Badge tone={STATUS_TONE[record.status] ?? 'neut'}>
            {STATUS_LABEL[record.status] ?? record.status}
          </Badge>
          {reportCount > 0 && <Badge tone="danger">신고 {reportCount.toLocaleString()}</Badge>}
        </div>
      </div>

      <div
        className="rec-body"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        {record.content}
      </div>

      <div className="dt" style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
        {new Date(record.created_at).toLocaleDateString('ko-KR')}
      </div>
    </button>
  )
}

export default function MyRecordsPage() {
  const [records, setRecords] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [noStore, setNoStore] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<StoreRecord | null>(null)

  const load = () => {
    setLoading(true)
    setFetchError(false)
    setNoStore(false)
    fetchMyStore()
      .then((res) => {
        if (!res.data) {
          setNoStore(true)
          setLoading(false)
          return
        }
        return fetchRecords()
      })
      .then((res) => {
        if (res) setRecords(res.data?.results ?? [])
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    queueMicrotask(load)
  }, [])

  const filtered = records.filter((r) => {
    const date = new Date(r.created_at)
    if (from && date < new Date(from)) return false
    if (to && date > new Date(`${to}T23:59:59`)) return false
    return true
  })

  const handleReset = () => {
    setFrom('')
    setTo('')
  }

  return (
    <>
      <div>
        <div className="page-h">
          <h2>우리 매장 기록</h2>

          <div className="row gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className="chip row gap-2">
              <span className="t-mute" style={{ fontSize: 11 }}>
                시작
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--gray-700)' }}
              />
            </div>
            <span className="t-mute">—</span>
            <div className="chip row gap-2">
              <span className="t-mute" style={{ fontSize: 11 }}>
                종료
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--gray-700)' }}
              />
            </div>
            {(from || to) && (
              <button onClick={handleReset} className="link-act" style={{ color: 'var(--fg-muted)' }}>
                초기화
              </button>
            )}
          </div>
        </div>

        {!loading && !noStore && (
          <p className="t-mute mb-4" style={{ fontSize: 12 }}>
            총 {filtered.length.toLocaleString()}개의 기록
          </p>
        )}

        {loading ? (
          <div className="empty">불러오는 중...</div>
        ) : fetchError ? (
          <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
            <span style={{ color: 'var(--danger-text)' }}>기록을 불러오지 못했습니다.</span>
            <button onClick={load} className="btn btn-neutral btn-sm">
              다시 시도
            </button>
          </div>
        ) : noStore ? (
          <div className="empty">
            등록된 매장이 없습니다.
            <div style={{ fontSize: 12, marginTop: 6 }}>먼저 내 매장 메뉴에서 매장을 등록해주세요.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            기록이 없습니다.
            {(from || to) && (
              <div style={{ marginTop: 8 }}>
                <button onClick={handleReset} className="link-act" style={{ color: 'var(--brand)' }}>
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rec-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {filtered.map((record) => (
              <RecordCard key={record.uuid} record={record} onClick={() => setSelected(record)} />
            ))}
          </div>
        )}
      </div>

      {selected && <RecordModal record={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
