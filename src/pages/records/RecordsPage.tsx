import { useCallback, useEffect, useState } from 'react'
import { fetchRecords, updateRecordStatus } from '../../api/records'
import type { StoreRecord } from '../../types'

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  hidden: '숨김',
  rejected: '거절',
  deleted: '삭제',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  hidden: 'bg-gray-100 text-gray-600',
  rejected: 'bg-orange-100 text-orange-700',
  deleted: 'bg-red-100 text-red-600',
}

type RecordFilter = StoreRecord['status'] | 'reported'

const FILTERS: { key: RecordFilter; label: string }[] = [
  { key: 'reported', label: '신고됨' },
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'hidden', label: '숨김' },
  { key: 'rejected', label: '거절' },
  { key: 'deleted', label: '삭제' },
]

const getReportCount = (record: StoreRecord) => record.report_count ?? 0

export default function RecordsPage() {
  const [records, setRecords] = useState<StoreRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<RecordFilter>('pending')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadRecords = useCallback(() => {
    setLoading(true)
    setFetchError(false)
    fetchRecords(statusFilter === 'reported' ? undefined : { status: statusFilter })
      .then((res) => {
        const results = statusFilter === 'reported'
          ? res.data.results.filter((record) => getReportCount(record) > 0)
          : res.data.results
        setRecords(results)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { queueMicrotask(loadRecords) }, [loadRecords])

  const handleAction = async (
    uuid: string,
    action: 'approved' | 'hidden' | 'rejected' | 'deleted'
  ) => {
    setActionError('')
    try {
      await updateRecordStatus(uuid, action)
      loadRecords()
    } catch {
      setActionError('상태 변경에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">기록 관리</h2>
        <div className="flex flex-wrap justify-end gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === key
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
          <p className="text-sm text-red-500">기록을 불러오지 못했습니다.</p>
          <button onClick={loadRecords} className="text-sm text-indigo-600 hover:underline">다시 시도</button>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {statusFilter === 'reported' ? '신고된 기록이 없습니다.' : '기록이 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">매장</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">내용</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">방문자</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">신고</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">날짜</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((rec) => (
                <tr
                  key={rec.uuid}
                  className={getReportCount(rec) > 0 ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{rec.store_name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{rec.content}</td>
                  <td className="px-4 py-3 text-gray-500">{rec.visitor_name ?? '익명'}</td>
                  <td className="px-4 py-3">
                    {getReportCount(rec) > 0 ? (
                      <span className="inline-flex items-center rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        {getReportCount(rec).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[rec.status] ?? ''}`}>
                      {STATUS_LABEL[rec.status] ?? rec.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(rec.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      {rec.status !== 'approved' && !rec.is_deleted && (
                        <button onClick={() => handleAction(rec.uuid, 'approved')} className="text-xs text-green-600 hover:underline">
                          승인
                        </button>
                      )}
                      {rec.status !== 'hidden' && !rec.is_deleted && (
                        <button onClick={() => handleAction(rec.uuid, 'hidden')} className="text-xs text-gray-500 hover:underline">
                          숨김
                        </button>
                      )}
                      {!rec.is_deleted && (
                        <button onClick={() => handleAction(rec.uuid, 'deleted')} className="text-xs text-red-500 hover:underline">
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
