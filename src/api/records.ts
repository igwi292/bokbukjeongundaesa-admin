import client from './client'
import type { PaginatedResponse, StoreRecord } from '../types'

export const fetchRecords = (params?: {
  store_id?: number
  status?: string
  page?: number
}) => client.get<PaginatedResponse<StoreRecord>>('/records/', { params })

export const updateRecordStatus = (
  id: number,
  status: 'approved' | 'hidden' | 'deleted'
) => client.patch<StoreRecord>(`/records/${id}/`, { status })
