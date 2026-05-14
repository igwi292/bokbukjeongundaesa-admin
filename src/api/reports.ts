import client from './client'
import type { PaginatedResponse, Report } from '../types'

export const fetchReports = (params?: { page?: number; status?: ReportStatus }) =>
  client.get<PaginatedResponse<Report>>('/v1/admin/reports/', { params })

export const updateReportStatus = (id: number, status: 'resolved' | 'dismissed') =>
  client.patch(`/v1/admin/reports/${id}/`, { status })

export const hideMemory = (uuid: string) =>
  client.post(`/v1/admin/memories/${uuid}/hide/`)

export const deleteMemory = (uuid: string) =>
  client.delete(`/v1/admin/memories/${uuid}/`)
