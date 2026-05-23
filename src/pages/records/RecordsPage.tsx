import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  approveMemory,
  deleteMemory,
  fetchOwnerStores,
  fetchStoreMemories,
  hideMemory,
  rejectMemory,
} from '../../api/records'
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

const STATUS_COLOR: Record<RecordStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  hidden: 'bg-gray-100 text-gray-500',
  rejected: 'bg-orange-100 text-orange-600',
  deleted: 'bg-red-100 text-red-500',
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
  approve: 'text-green-600',
  reject: 'text-orange-600',
  hide: 'text-gray-500',
  delete: 'text-red-500',
}

const ACTION_CONFIRM: Record<Action, string | null> = {
  approve: null,
  reject: null,
  hide: null,
  delete: '메모를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?',
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-4 w-12 bg-gray-100 rounded" />
      </div>
      <div className="h-3 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
    </div>
  )
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

  useEffect(() => { loadStores() }, [loadStores])

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

  useEffect(() => { loadMemories() }, [loadMemories])

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
        <h2 className="text-xl font-bold text-gray-900 mb-6">기록 관리</h2>
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">매장 목록을 불러오지 못했습니다.</p>
          <button onClick={loadStores} className="text-sm text-indigo-600 hover:underline">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (stores === null) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">기록 관리</h2>
        <p className="text-sm text-gray-400">매장 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">기록 관리</h2>
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">등록된 매장이 없습니다.</p>
          <p className="text-xs mt-2">먼저 매장을 등록해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">기록 관리</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSlug}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(({ key, label }) => {
          const isActive = statusFilter === key
          const badge = key === 'reported' && reportedCount > 0
            ? ` ${reportedCount}`
            : ''
          return (
            <button
              key={key || 'all'}
              onClick={() => handleFilterChange(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}{badge}
            </button>
          )
        })}
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-500">{actionError}</p>
        </div>
      )}

      {fetchError ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">기록을 불러오지 못했습니다.</p>
          <button onClick={loadMemories} className="text-sm text-indigo-600 hover:underline">
            다시 시도
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : visibleMemories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {statusFilter === 'reported'
            ? '신고된 기록이 없습니다.'
            : '기록이 없습니다.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleMemories.map((m) => {
            const isProcessing = processingUuid === m.uuid
            const actions = availableActions(m)
            return (
              <div
                key={m.uuid}
                className={`bg-white rounded-xl border p-4 ${
                  m.report_count > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {m.author_nickname || '익명'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[m.status] ?? ''}`}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                    {m.report_count > 0 && (
                      <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        신고 {m.report_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                  {m.content}
                </p>

                {actions.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-gray-100">
                    {isProcessing ? (
                      <span className="text-xs text-gray-400">처리 중...</span>
                    ) : (
                      actions.map((a) => (
                        <button
                          key={a}
                          onClick={() => performAction(m, a)}
                          disabled={isAnyProcessing}
                          className={`text-xs font-medium hover:underline disabled:opacity-40 ${ACTION_COLOR[a]}`}
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
