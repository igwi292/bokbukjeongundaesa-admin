import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchReports, updateReportStatus, hideMemory, deleteMemory } from '../../api/reports'
import type { Report, ReportStatus } from '../../types'

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

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ko-KR')
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
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
    setReports([])
    const params = statusFilter ? { status: statusFilter } : {}
    return fetchReports(params)
      .then((res) => {
        if (requestId === requestIdRef.current) setReports(res.data.results)
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setFetchError(true)
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false)
      })
  }, [statusFilter])

  useEffect(() => { loadReports() }, [loadReports])

  const handleFilterChange = (value: '' | ReportStatus) => {
    setStatusFilter(value)
    setActionError('')
  }

  const handleHide = async (report: Report) => {
    setActionError('')
    setProcessingId(report.id)
    let hideSucceeded = false
    try {
      await hideMemory(report.record_uuid)
      hideSucceeded = true
      await updateReportStatus(report.id, 'resolved')
    } catch {
      setActionError(
        hideSucceeded
          ? '메모는 숨겨졌으나 신고 상태 업데이트에 실패했습니다. 목록을 확인해 주세요.'
          : '메모 숨김 처리에 실패했습니다. 다시 시도해주세요.'
      )
    }
    await loadReports()
    setProcessingId(null)
  }

  const handleDelete = async (report: Report) => {
    if (!window.confirm('메모를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?')) return
    setActionError('')
    setProcessingId(report.id)
    let deleteSucceeded = false
    try {
      await deleteMemory(report.record_uuid)
      deleteSucceeded = true
      await updateReportStatus(report.id, 'resolved')
    } catch {
      setActionError(
        deleteSucceeded
          ? '메모는 삭제됐으나 신고 상태 업데이트에 실패했습니다. 목록을 확인해 주세요.'
          : '메모 삭제 처리에 실패했습니다. 다시 시도해주세요.'
      )
    }
    await loadReports()
    setProcessingId(null)
  }

  const handleDismiss = async (report: Report) => {
    setActionError('')
    setProcessingId(report.id)
    try {
      await updateReportStatus(report.id, 'dismissed')
    } catch {
      setActionError('신고 반려 처리에 실패했습니다. 다시 시도해주세요.')
    }
    await loadReports()
    setProcessingId(null)
  }

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

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">신고 목록을 불러오지 못했습니다.</p>
          <button onClick={loadReports} className="text-sm text-indigo-600 hover:underline">
            다시 시도
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">신고 내역이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">가게명</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">메모 내용</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">신고 사유</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">신고 일시</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">처리 상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => {
                const isPending = report.status === 'pending'
                const isProcessing = processingId === report.id
                const memoryDeleted = report.record_status === 'deleted'
                const memoryHidden = report.record_status === 'hidden'

                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {report.record_store_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {report.record_content}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{report.reason}</td>
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
                                  onClick={() => handleHide(report)}
                                  disabled={isAnyProcessing}
                                  className="text-xs text-gray-500 hover:underline disabled:opacity-40"
                                >
                                  메모 숨김
                                </button>
                              )}
                              {!memoryDeleted && (
                                <button
                                  onClick={() => handleDelete(report)}
                                  disabled={isAnyProcessing}
                                  className="text-xs text-red-500 hover:underline disabled:opacity-40"
                                >
                                  메모 삭제
                                </button>
                              )}
                              <button
                                onClick={() => handleDismiss(report)}
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
        </div>
      )}
    </div>
  )
}
