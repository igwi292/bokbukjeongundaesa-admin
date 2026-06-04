import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchReports, resolveReport } from '../../api/reports'
import { Badge, type BadgeTone } from '../../components/ui/Badge'
import type { PaginatedResponse, Report, ReportAction, ReportStatus } from '../../types'

const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  pending: '대기',
  resolved: '처리완료',
  dismissed: '반려',
}

const REPORT_STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  pending: 'warn',
  resolved: 'pos',
  dismissed: 'neut',
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

  useEffect(() => {
    queueMicrotask(loadReports)
  }, [loadReports])

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
      <div className="page-h">
        <h2>신고 관리</h2>
        <div className="chips">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`chip${statusFilter === value ? ' active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {actionError && <div className="note err mb-4">{actionError}</div>}

      {fetchError ? (
        <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-text)' }}>신고 목록을 불러오지 못했습니다.</span>
          <button onClick={loadReports} className="btn btn-neutral btn-sm">
            다시 시도
          </button>
        </div>
      ) : !loading && reports.length === 0 ? (
        <div className="empty">신고 내역이 없습니다.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>가게명</th>
                <th>메모 내용</th>
                <th>작성자</th>
                <th>신고 사유</th>
                <th>신고 일시</th>
                <th>처리 상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--fg-subtle)', padding: '40px 16px' }}>
                    불러오는 중...
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isPending = report.status === 'pending'
                  const isProcessing = processingId === report.id
                  const memoryDeleted = report.record_is_deleted || report.record_status === 'deleted'
                  const memoryHidden = report.record_status === 'hidden'

                  return (
                    <tr key={report.id}>
                      <td className="t-strong">{report.record_store_name}</td>
                      <td className="t-truncate">{report.record_content}</td>
                      <td>{report.record_author_nickname || '익명'}</td>
                      <td>{report.reason || '-'}</td>
                      <td className="t-mute">{formatDate(report.created_at)}</td>
                      <td>
                        <Badge tone={REPORT_STATUS_TONE[report.status]}>
                          {REPORT_STATUS_LABEL[report.status]}
                        </Badge>
                      </td>
                      <td>
                        {isPending && (
                          <div className="rec-acts" style={{ border: 0, margin: 0, padding: 0 }}>
                            {isProcessing ? (
                              <span className="t-mute" style={{ fontSize: 12 }}>
                                처리 중...
                              </span>
                            ) : (
                              <>
                                {!memoryHidden && !memoryDeleted && (
                                  <button
                                    onClick={() => handleAction(report, 'hide')}
                                    disabled={isAnyProcessing}
                                    className="link-act"
                                    style={{ color: 'var(--gray-600)' }}
                                  >
                                    메모 숨김
                                  </button>
                                )}
                                {!memoryDeleted && (
                                  <button
                                    onClick={() => handleAction(report, 'delete')}
                                    disabled={isAnyProcessing}
                                    className="link-act"
                                    style={{ color: 'var(--danger)' }}
                                  >
                                    메모 삭제
                                  </button>
                                )}
                                <button
                                  onClick={() => handleAction(report, 'dismiss')}
                                  disabled={isAnyProcessing}
                                  className="link-act"
                                  style={{ color: 'var(--warning-text)' }}
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
                })
              )}
            </tbody>
          </table>

          {pageData && (hasPrev || hasNext) && (
            <div className="tbl-foot">
              <span className="t-mute" style={{ fontSize: 12 }}>
                총 {pageData.count.toLocaleString('ko-KR')}건
              </span>
              <div className="row gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev || loading || isAnyProcessing}
                  className="btn btn-neutral btn-sm"
                >
                  이전
                </button>
                <span className="t-mute" style={{ fontSize: 12 }}>
                  {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext || loading || isAnyProcessing}
                  className="btn btn-neutral btn-sm"
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
