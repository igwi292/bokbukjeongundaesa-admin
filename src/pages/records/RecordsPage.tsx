import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  approveMemory,
  deleteMemory,
  fetchOwnerStores,
  fetchStoreMemories,
  hideMemory,
  rejectMemory,
} from '../../api/records'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import type { OwnerMemory, OwnerStoreSummary, RecordStatus } from '../../types'

type Action = 'approve' | 'reject' | 'hide' | 'delete'
type StatusFilter = '' | RecordStatus | 'reported'

const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '대기',
  approved: '승인',
  hidden: '숨김',
  rejected: '거절',
  deleted: '삭제',
}

const STATUS_TONE: Record<RecordStatus, BadgeTone> = {
  pending: 'warn',
  approved: 'pos',
  hidden: 'neut',
  rejected: 'warn',
  deleted: 'danger',
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: '', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
  { key: 'hidden', label: '숨김' },
  { key: 'reported', label: '신고됨' },
]

const ACTION_LABEL: Record<Action, string> = {
  approve: '승인',
  reject: '거절',
  hide: '숨김',
  delete: '삭제',
}

const ACTION_COLOR: Record<Action, string> = {
  approve: 'var(--positive)',
  reject: 'var(--warning-text)',
  hide: 'var(--gray-600)',
  delete: 'var(--danger)',
}

const ACTION_CONFIRM: Record<Action, string | null> = {
  approve: null,
  reject: null,
  hide: null,
  delete: '메모를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?',
}

export default function RecordsPage() {
  const [stores, setStores] = useState<OwnerStoreSummary[] | null>(null)
  const [storesError, setStoresError] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string>('')

  const [memories, setMemories] = useState<OwnerMemory[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [actionError, setActionError] = useState('')
  const [processingUuid, setProcessingUuid] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const loadStores = useCallback(() => {
    setStoresError(false)
    fetchOwnerStores()
      .then((list) => {
        setStores(list)
        if (list.length > 0 && !selectedSlug) {
          setSelectedSlug(list[0].slug)
        }
      })
      .catch(() => setStoresError(true))
  }, [selectedSlug])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  const loadMemories = useCallback(() => {
    if (!selectedSlug) return Promise.resolve()
    const requestId = ++requestIdRef.current
    setLoading(true)
    setFetchError(false)
    const params: { status?: RecordStatus } = {}
    if (statusFilter && statusFilter !== 'reported') {
      params.status = statusFilter
    }
    return fetchStoreMemories(selectedSlug, params)
      .then((list) => {
        if (requestId === requestIdRef.current) setMemories(list)
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setFetchError(true)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false)
      })
  }, [selectedSlug, statusFilter])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const handleStoreChange = (slug: string) => {
    setSelectedSlug(slug)
    setActionError('')
  }

  const handleFilterChange = (key: StatusFilter) => {
    setStatusFilter(key)
    setActionError('')
  }

  const performAction = async (memory: OwnerMemory, action: Action) => {
    const confirmMsg = ACTION_CONFIRM[action]
    if (confirmMsg && !window.confirm(confirmMsg)) return

    setActionError('')
    setProcessingUuid(memory.uuid)
    try {
      switch (action) {
        case 'approve': await approveMemory(memory.uuid); break
        case 'reject':  await rejectMemory(memory.uuid);  break
        case 'hide':    await hideMemory(memory.uuid);    break
        case 'delete':  await deleteMemory(memory.uuid);  break
      }
      await loadMemories()
    } catch {
      setActionError(`${ACTION_LABEL[action]} 처리에 실패했습니다. 다시 시도해주세요.`)
    } finally {
      setProcessingUuid(null)
    }
  }

  const visibleMemories = useMemo(() => {
    if (statusFilter === 'reported') {
      return memories.filter((m) => m.report_count > 0)
    }
    return memories
  }, [memories, statusFilter])

  const availableActions = (memory: OwnerMemory): Action[] => {
    if (memory.is_deleted || memory.status === 'deleted') return []
    const actions: Action[] = []
    if (memory.status !== 'approved') actions.push('approve')
    if (memory.status !== 'rejected') actions.push('reject')
    if (memory.status !== 'hidden')   actions.push('hide')
    actions.push('delete')
    return actions
  }

  const isAnyProcessing = processingUuid !== null
  const reportedCount = useMemo(
    () => memories.filter((m) => m.report_count > 0).length,
    [memories],
  )

  if (storesError) {
    return (
      <div>
        <div className="page-h">
          <h2>기록 관리</h2>
        </div>
        <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-text)' }}>매장 목록을 불러오지 못했습니다.</span>
          <button onClick={loadStores} className="btn btn-neutral btn-sm">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (stores === null) {
    return (
      <div>
        <div className="page-h">
          <h2>기록 관리</h2>
        </div>
        <div className="empty">매장 목록을 불러오는 중...</div>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div>
        <div className="page-h">
          <h2>기록 관리</h2>
        </div>
        <div className="empty">
          등록된 매장이 없습니다.
          <div style={{ fontSize: 12, marginTop: 8 }}>먼저 매장을 등록해주세요.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-h">
        <h2>기록 관리</h2>
        <select
          value={selectedSlug}
          onChange={(e) => handleStoreChange(e.target.value)}
          className="chip"
          style={{ cursor: 'pointer' }}
        >
          {stores.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
              {typeof s.pending_count === 'number' && s.pending_count > 0
                ? ` · 대기 ${s.pending_count}`
                : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="chips mb-4">
        {STATUS_FILTERS.map(({ key, label }) => {
          const isActive = statusFilter === key
          const badge = key === 'reported' && reportedCount > 0 ? ` ${reportedCount}` : ''
          return (
            <button
              key={key || 'all'}
              onClick={() => handleFilterChange(key)}
              className={`chip${isActive ? ' active' : ''}`}
            >
              {label}
              {badge}
            </button>
          )
        })}
      </div>

      {actionError && <div className="note err mb-4">{actionError}</div>}

      {fetchError ? (
        <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-text)' }}>기록을 불러오지 못했습니다.</span>
          <button onClick={loadMemories} className="btn btn-neutral btn-sm">
            다시 시도
          </button>
        </div>
      ) : loading ? (
        <div className="empty">불러오는 중...</div>
      ) : visibleMemories.length === 0 ? (
        <div className="empty">
          {statusFilter === 'reported' ? '신고된 기록이 없습니다.' : '기록이 없습니다.'}
        </div>
      ) : (
        <div className="rec-grid">
          {visibleMemories.map((m) => {
            const isProcessing = processingUuid === m.uuid
            const actions = availableActions(m)
            return (
              <div key={m.uuid} className={`rec${m.report_count > 0 ? ' flagged' : ''}`}>
                <div className="rec-h">
                  <div className="min-w-0">
                    <div className="nm">{m.author_nickname || '익명'}</div>
                    <div className="dt">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  <div className="stack gap-2" style={{ alignItems: 'flex-end' }}>
                    <Badge tone={STATUS_TONE[m.status] ?? 'neut'}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </Badge>
                    {m.report_count > 0 && (
                      <Badge tone="danger">신고 {m.report_count.toLocaleString()}</Badge>
                    )}
                  </div>
                </div>

                <div className="rec-body">{m.content}</div>

                {actions.length > 0 && (
                  <div className="rec-acts">
                    {isProcessing ? (
                      <span className="t-mute" style={{ fontSize: 12 }}>
                        처리 중...
                      </span>
                    ) : (
                      actions.map((a) => (
                        <button
                          key={a}
                          onClick={() => performAction(m, a)}
                          disabled={isAnyProcessing}
                          className="link-act"
                          style={{ color: ACTION_COLOR[a] }}
                        >
                          {ACTION_LABEL[a]}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
