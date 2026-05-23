import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchReports, resolveReport } from '../../api/reports'
import type { PaginatedResponse, Report, ReportAction, ReportStatus } from '../../types'

const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pending: '대기',
  resolved: '처리완료',
  dismissed: '반려',
}

const REPORT_STATUS_COLOR: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
}

const FILTER_OPTIONS: { value: '' | ReportStatus; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기' },
  { value: 'resolved', label: '처리완료' },
  { value: 'dismissed', label: '반려' },
]

const ACTION_CONFIRM: Record<ReportAction, string | null> = {
  hide: null,
  delete: '메모를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?',
  dismiss: null,
}

const ACTION_ERROR: Record<ReportAction, string> = {
  hide: '메모 숨김 처리에 실패했습니다. 다시 시도해주세요.',
  delete: '메모 삭제 처리에 실패했습니다. 다시 시도해주세요.',
  dismiss: '신고 반려 처리에 실패했습니다. 다시 시도해주세요.',
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR')
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-100 rounded" />
        </td>
      ))}
    </tr>
  )
}

export default function ReportsPage() {
  const [page, setPage] = useState(1)
  const [pageData, setPageData] = useState<PaginatedResponse<Report> | null>(null)
  const [statusFilter, setStatusFilter] = useState<'' | ReportStatus>('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [actionError, setActionError] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const requestIdRef = useRef(0)

  const loadReports = useCallback(() => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setFetchError(false)
    const params: { page?: number; status?: ReportStatus } = { page }
    if (statusFilter) params.status = statusFilter
    return fetchReports(params)
      .then((res) => {
        if (requestId === requestIdRef.current) setPageData(res.data)
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setFetchError(true)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false)
      })
  }, [page, statusFilter])

  useEffect(() => { queueMicrotask(loadReports) }, [loadReports])

  const handleFilterChange = (value: '' | ReportStatus) => {
    setStatusFilter(value)
    setPage(1)
    setActionError('')
  }

  const handleAction = async (report: Report, action: ReportAction) => {
    const confirmMessage = ACTION_CONFIRM[action]
    if (confirmMessage && !window.confirm(confirmMessage)) return

    setActionError('')
    setProcessingId(report.id)
    try {
      await resolveReport(report, action)
      await loadReports()
    } catch {
      setActionError(ACTION_ERROR[action])
    } finally {
      setProcessingId(null)
    }
  }

  const reports = pageData?.results ?? []
  const hasPrev = Boolean(pageData?.previous)
  const hasNext = Boolean(pageData?.next)
  const isAnyProcessing = processingId !== null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">신고 관리</h2>
        <div className="flex gap-2">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-500">{actionError}</p>
        </div>
      )}

      {fetchError ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">신고 목록을 불러오지 못했습니다.</p>
          <button onClick={loadReports} className="text-sm text-indigo-600 hover:underline">
            다시 시도
          </button>
        </div>
      ) : !loading && reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">신고 내역이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">가게명</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">메모 내용</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">작성자</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">신고 사유</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">신고 일시</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">처리 상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`s-${i}`} />)
                : reports.map((report) => {
                    const isPending = report.status === 'pending'
                    const isProcessing = processingId === report.id
                    const memoryDeleted = report.record_is_deleted || report.record_status === 'deleted'
                    const memoryHidden = report.record_status === 'hidden'

                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {report.record_store_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {report.record_content}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {report.record_author_nickname || '익명'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{report.reason || '-'}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${REPORT_STATUS_COLOR[report.status]}`}>
                            {REPORT_STATUS_LABEL[report.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isPending && (
                            <div className="flex gap-2 justify-end items-center">
                              {isProcessing ? (
                                <span className="text-xs text-gray-400">처리 중...</span>
                              ) : (
                                <>
                                  {!memoryHidden && !memoryDeleted && (
                                    <button
                                      onClick={() => handleAction(report, 'hide')}
                                      disabled={isAnyProcessing}
                                      className="text-xs text-gray-500 hover:underline disabled:opacity-40"
                                    >
                                      메모 숨김
                                    </button>
                                  )}
                                  {!memoryDeleted && (
                                    <button
                                      onClick={() => handleAction(report, 'delete')}
                                      disabled={isAnyProcessing}
                                      className="text-xs text-red-500 hover:underline disabled:opacity-40"
                                    >
                                      메모 삭제
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAction(report, 'dismiss')}
                                    disabled={isAnyProcessing}
                                    className="text-xs text-orange-500 hover:underline disabled:opacity-40"
                                  >
                                    신고 반려
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>

          {pageData && (hasPrev || hasNext) && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                총 {pageData.count.toLocaleString('ko-KR')}건
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev || loading || isAnyProcessing}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-xs text-gray-500">{page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext || loading || isAnyProcessing}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
