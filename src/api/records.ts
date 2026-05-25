import client from './client'
import type { PaginatedResponse, StoreRecord } from '../types'

export const fetchRecords = (params?: { status?: string; page?: number }) =>
  client.get<PaginatedResponse<StoreRecord>>('/v1/owner/memories/', { params })

export const updateRecordStatus = (
  uuid: string,
  status: 'approved' | 'hidden' | 'rejected' | 'deleted'
) => {
  if (status === 'deleted') return client.delete<StoreRecord>(`/v1/owner/memories/${uuid}/`)
  const action = status === 'approved' ? 'approve' : status === 'hidden' ? 'hide' : 'reject'
  return client.post<StoreRecord>(`/v1/owner/memories/${uuid}/${action}/`)
}
