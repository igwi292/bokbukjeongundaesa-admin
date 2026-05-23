import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats } from '../../api/dashboard'
import type { DashboardStats } from '../../types'

const StatCard = ({ label, value, sub }: { label: string; value: number; sub?: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">{(value ?? 0).toLocaleString()}</p>
    {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
  </div>
)

function ActionRow({
  label,
  description,
  count,
  to,
  tone,
}: {
  label: string
  description: string
  count: number
  to: string
  tone: 'warn' | 'idle'
}) {
  const active = tone === 'warn' && count > 0
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-4 px-5 py-4 rounded-xl border transition-colors ${
        active
          ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
          : 'border-gray-100 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${active ? 'text-orange-700' : 'text-gray-700'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-2xl font-bold ${active ? 'text-orange-700' : 'text-gray-300'}`}>
          {count.toLocaleString()}
        </span>
        <span className={`text-xs ${active ? 'text-orange-500' : 'text-gray-300'}`}>→</span>
      </div>
    </Link>
  )
}

function PendingTasksCard({ pendingRecords }: { pendingRecords: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">처리 필요 항목</p>
          <p className="text-xs text-gray-400 mt-0.5">사장님 확인이 필요한 작업입니다.</p>
        </div>
      </div>
      <div className="space-y-2">
        <ActionRow
          label="승인 대기 메모"
          description="새 방문자 메모가 승인을 기다리고 있습니다."
          count={pendingRecords}
          to="/records"
          tone="warn"
        />
        <ActionRow
          label="신고 관리"
          description="접수된 신고를 확인하고 처리하세요."
          count={0}
          to="/reports"
          tone="idle"
        />
      </div>
    </div>
  )
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-8 w-16 bg-gray-100 rounded mt-3" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    fetchDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (error) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">대시보드</h2>
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-sm text-red-500">데이터를 불러오지 못했습니다.</p>
          <button onClick={load} className="text-sm text-indigo-600 hover:underline">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">대시보드</h2>

      {stats && <PendingTasksCard pendingRecords={stats.pending_records} />}

      {loading && !stats ? (
        <SkeletonStats />
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="전체 매장" value={stats.total_stores} sub={`이번 달 +${stats.monthly_new_stores ?? 0}`} />
          <StatCard label="활성 매장" value={stats.active_stores} />
          <StatCard label="전체 기록" value={stats.total_records} sub={`이번 달 +${stats.monthly_new_records ?? 0}`} />
          <StatCard label="승인 대기 기록" value={stats.pending_records} />
          <StatCard label="대기 중 신고" value={stats.pending_reports} />
        </div>
      ) : null}
    </div>
  )
}
