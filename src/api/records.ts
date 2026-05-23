import client from './client'
import type { PaginatedResponse, StoreRecord } from '../types'

export const fetchRecords = (params?: { status?: string; page?: number }) =>
  client.get<PaginatedResponse<StoreRecord>>('/v1/owner/records/', { params })

export const updateRecordStatus = (
  uuid: string,
  status: 'approved' | 'hidden' | 'rejected' | 'deleted'
) =>
  client.patch<StoreRecord>(`/v1/owner/records/${uuid}/`, { status })
