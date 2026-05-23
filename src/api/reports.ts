import client from './client'
import type { PaginatedResponse, Report, ReportAction, ReportStatus } from '../types'

export const fetchReports = (params?: { page?: number; status?: ReportStatus }) =>
  client.get<PaginatedResponse<Report>>('/v1/owner/reports/', { params })

export const updateReportStatus = (
  id: number,
  status: 'resolved' | 'dismissed',
  action?: 'hide' | 'delete' | 'none',
) =>
  client.patch(`/v1/owner/reports/${id}/`, { status, ...(action !== undefined && { action }) })

export const hideMemory = (uuid: string) =>
  client.post(`/v1/owner/memories/${uuid}/hide/`)

export const deleteMemory = (uuid: string) =>
  client.delete(`/v1/owner/memories/${uuid}/`)

export const resolveReport = async (report: Report, action: ReportAction): Promise<void> => {
  switch (action) {
    case 'hide':
      await hideMemory(report.record_uuid)
      await updateReportStatus(report.id, 'resolved')
      return
    case 'delete':
      await deleteMemory(report.record_uuid)
      await updateReportStatus(report.id, 'resolved')
      return
    case 'dismiss':
      await updateReportStatus(report.id, 'dismissed')
      return
  }
}
