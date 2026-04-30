import client from './client'
import type { DashboardStats } from '../types'

const MOCK: DashboardStats = {
  total_stores: 24,
  active_stores: 18,
  total_records: 1340,
  pending_records: 7,
  monthly_new_stores: 3,
  monthly_new_records: 212,
}

export const fetchDashboardStats = () =>
  Promise.resolve({ data: MOCK }) as ReturnType<typeof client.get<DashboardStats>>
