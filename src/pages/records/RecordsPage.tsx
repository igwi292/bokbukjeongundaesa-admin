import { useCallback, useEffect, useState } from 'react'
import { fetchRecords, updateRecordStatus } from '../../api/records'
import type { StoreRecord } from '../../types'

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  hidden: '숨김',
  deleted: '삭제',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  hidden: 'bg-gray-100 text-gray-600',
  deleted: 'bg-red-100 text-red-600',
}

export default function RecordsPage() {
  const [records, setRecords] = useState<StoreRecord[]>([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(false)

  const loadRecords = useCallback(() => {
    setLoading(true)
    fetchRecords({ status: statusFilter })
      .then((res) => setRecords(res.data.results))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const handleAction = async (
    id: number,
    action: 'approved' | 'hidden' | 'deleted'
  ) => {
    await updateRecordStatus(id, action)
    loadRecords()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">기록 관리</h2>
        <div className="flex gap-2">
          {['pending', 'approved', 'hidden', 'deleted'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">기록이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">매장</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">내용</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">작성자</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">날짜</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{rec.store_name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{rec.content}</td>
                  <td className="px-4 py-3 text-gray-500">{rec.author_nickname ?? '익명'}</td>
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
                      {rec.status !== 'approved' && (
                        <button
                          onClick={() => handleAction(rec.id, 'approved')}
                          className="text-xs text-green-600 hover:underline"
                        >
                          승인
                        </button>
                      )}
                      {rec.status !== 'hidden' && (
                        <button
                          onClick={() => handleAction(rec.id, 'hidden')}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          숨김
                        </button>
                      )}
                      {rec.status !== 'deleted' && (
                        <button
                          onClick={() => handleAction(rec.id, 'deleted')}
                          className="text-xs text-red-500 hover:underline"
                        >
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
