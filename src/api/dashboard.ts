import client from './client'
import type { DashboardStats } from '../types'

export const fetchDashboardStats = () =>
  client.get<DashboardStats>('/dashboard/stats/')
