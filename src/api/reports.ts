import client from './client'
import type { PaginatedResponse, Report, ReportAction, ReportStatus } from '../types'

export const fetchReports = (params?: { page?: number; status?: ReportStatus }) =>
  client.get<PaginatedResponse<Report>>('/v1/owner/reports/', { params })

export const resolveReport = (id: number, action: ReportAction) =>
  client.post<Report>(`/v1/owner/reports/${id}/resolve/`, { action })
