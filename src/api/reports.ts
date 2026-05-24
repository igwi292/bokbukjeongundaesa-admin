import client from './client'
import type { PaginatedResponse, Report, ReportStatus } from '../types'

export const fetchReports = (params?: { page?: number; status?: ReportStatus }) =>
  client.get<PaginatedResponse<Report>>('/v1/admin/reports/', { params })

export const updateReportStatus = (
  id: number,
  status: 'resolved' | 'dismissed',
  action?: 'hide' | 'delete' | 'none',
) =>
  client.patch(`/v1/admin/reports/${id}/`, { status, ...(action !== undefined && { action }) })

export const hideMemory = (uuid: string) =>
  client.post(`/v1/owner/memories/${uuid}/hide/`)

export const deleteMemory = (uuid: string) =>
  client.delete(`/v1/owner/memories/${uuid}/`)
