import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardStats } from '../../api/dashboard'
import { Icon } from '../../components/ui/Icon'
import type { DashboardStats } from '../../types'

const StatCard = ({ label, value, sub }: { label: string; value: number; sub?: string }) => (
  <div className="stat">
    <div className="lbl">{label}</div>
    <div className="val">{(value ?? 0).toLocaleString()}</div>
    {sub && <div className="sub">{sub}</div>}
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
    <Link to={to} className={`act-row${active ? ' warn' : ''}`}>
      <div className="min-w-0">
        <div className="al">{label}</div>
        <div className="ad">{description}</div>
      </div>
      <div className="right">
        <span className="ac">{count.toLocaleString()}</span>
        <Icon name="chevron-right" size={18} style={{ color: 'var(--fg-subtle)' }} />
      </div>
    </Link>
  )
}

function PendingTasksCard({
  pendingRecords,
  pendingReports,
}: {
  pendingRecords: number
  pendingReports: number
}) {
  return (
    <div className="card card-pad mb-6">
      <div className="page-h" style={{ marginBottom: 16 }}>
        <div>
          <div className="al" style={{ fontSize: 14, fontWeight: 600 }}>
            처리 필요 항목
          </div>
          <div className="ad" style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 2 }}>
            사장님 확인이 필요한 작업입니다.
          </div>
        </div>
      </div>
      <div className="stack gap-2">
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
          count={pendingReports}
          to="/reports"
          tone="warn"
        />
      </div>
    </div>
  )
}

function SkeletonStats() {
  return (
    <div className="stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat" style={{ opacity: 0.6 }}>
          <div className="lbl">불러오는 중</div>
          <div className="val">—</div>
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

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return (
      <div>
        <div className="page-h">
          <h2>대시보드</h2>
        </div>
        <div className="empty stack gap-3" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-text)' }}>데이터를 불러오지 못했습니다.</span>
          <button onClick={load} className="btn btn-neutral btn-sm">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-h">
        <h2>대시보드</h2>
      </div>

      {stats && (
        <PendingTasksCard
          pendingRecords={stats.pending_records}
          pendingReports={stats.pending_reports}
        />
      )}

      {loading && !stats ? (
        <SkeletonStats />
      ) : stats ? (
        <div className="stat-grid">
          <StatCard
            label="전체 매장"
            value={stats.total_stores}
            sub={`이번 달 +${stats.monthly_new_stores ?? 0}`}
          />
          <StatCard label="활성 매장" value={stats.active_stores} />
          <StatCard
            label="전체 기록"
            value={stats.total_records}
            sub={`이번 달 +${stats.monthly_new_records ?? 0}`}
          />
          <StatCard label="승인 대기 기록" value={stats.pending_records} />
          <StatCard label="대기 중 신고" value={stats.pending_reports} />
        </div>
      ) : null}
    </div>
  )
}
