import { useEffect, useState } from 'react'
import { fetchDashboardStats } from '../../api/dashboard'
import type { DashboardStats } from '../../types'

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub?: string
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">
      {value.toLocaleString()}
    </p>
    {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
  </div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
  }, [])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">대시보드</h2>
      {stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            label="전체 매장"
            value={stats.total_stores}
            sub={`이번 달 +${stats.monthly_new_stores}`}
          />
          <StatCard label="활성 매장" value={stats.active_stores} />
          <StatCard
            label="전체 기록"
            value={stats.total_records}
            sub={`이번 달 +${stats.monthly_new_records}`}
          />
          <StatCard label="승인 대기 기록" value={stats.pending_records} />
        </div>
      ) : (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      )}
    </div>
  )
}
