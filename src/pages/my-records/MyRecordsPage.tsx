import { useEffect, useState } from 'react'
import { fetchMyStore } from '../../api/stores'
import { fetchRecords } from '../../api/records'
import type { StoreRecord } from '../../types'

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  hidden: '숨김',
  rejected: '거절',
  deleted: '삭제',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  hidden: 'bg-gray-100 text-gray-500',
  rejected: 'bg-orange-100 text-orange-600',
  deleted: 'bg-red-100 text-red-500',
}

const getReportCount = (record: StoreRecord) => record.report_count ?? 0

function RecordModal({ record, onClose }: { record: StoreRecord; onClose: () => void }) {
  const reportCount = getReportCount(record)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {record.visitor_name ?? '익명'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(record.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[record.status] ?? ''}`}>
                {STATUS_LABEL[record.status] ?? record.status}
              </span>
              {reportCount > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  신고 {reportCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {record.content}
          </p>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
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
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {record.visitor_name ?? '익명'}
        </p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[record.status] ?? ''}`}>
            {STATUS_LABEL[record.status] ?? record.status}
          </span>
          {reportCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              신고 {reportCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
        {record.content}
      </p>

      <p className="text-xs text-gray-400">
        {new Date(record.created_at).toLocaleDateString('ko-KR')}
      </p>
    </button>
  )
}

export default function MyRecordsPage() {
  const [records, setRecords] = useState<StoreRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<StoreRecord | null>(null)

  const load = () => {
    setLoading(true)
    setFetchError(false)
    fetchMyStore()
      .then((res) => {
        if (!res.data) { setLoading(false); return }
        return fetchRecords()
      })
      .then((res) => {
        if (res) setRecords(res.data.results)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { queueMicrotask(load) }, [])

  const filtered = records.filter((r) => {
    const date = new Date(r.created_at)
    if (from && date < new Date(from)) return false
    if (to && date > new Date(`${to}T23:59:59`)) return false
    return true
  })

  const handleReset = () => { setFrom(''); setTo('') }

  return (
    <>
      <div>
        <div className="flex items-start justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900 shrink-0">우리 매장 기록</h2>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-400 shrink-0">시작</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="text-sm text-gray-700 bg-transparent focus:outline-none"
              />
            </div>
            <span className="text-gray-300 text-sm">—</span>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-400 shrink-0">종료</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="text-sm text-gray-700 bg-transparent focus:outline-none"
              />
            </div>
            {(from || to) && (
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                초기화
              </button>
            )}
          </div>
        </div>

        {!loading && (
          <p className="text-xs text-gray-400 mb-4">총 {filtered.length.toLocaleString()}개의 기록</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-gray-400">불러오는 중...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-red-500">기록을 불러오지 못했습니다.</p>
            <button onClick={load} className="text-sm text-indigo-600 hover:underline">다시 시도</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-sm">기록이 없습니다.</p>
            {(from || to) && (
              <button onClick={handleReset} className="mt-2 text-xs text-indigo-500 hover:underline">
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
