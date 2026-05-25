import client from './client'
import type { PaginatedResponse, StoreRecord } from '../types'

type OwnerMemoryListResponse =
  | PaginatedResponse<StoreRecord>
  | { items: Array<StoreRecord & { id?: string }> }

const normalizeStatus = (status: string): StoreRecord['status'] =>
  status.toLowerCase() as StoreRecord['status']

const normalizeRecord = (record: StoreRecord & { id?: string }): StoreRecord => ({
  ...record,
  uuid: record.uuid ?? record.id ?? '',
  status: normalizeStatus(record.status),
  visitor_name: record.visitor_name || record.author_nickname || '익명',
})

export const fetchRecords = (params?: { status?: string; page?: number }) =>
  client.get<OwnerMemoryListResponse>('/v1/owner/memories/', { params }).then((res) => {
    if ('items' in res.data) {
      const results = res.data.items.map(normalizeRecord)
      return {
        ...res,
        data: {
          count: results.length,
          next: null,
          previous: null,
          results,
        },
      }
    }
    return {
      ...res,
      data: {
        ...res.data,
        results: res.data.results.map(normalizeRecord),
      },
    }
  })

export const updateRecordStatus = (
  uuid: string,
  status: 'approved' | 'hidden' | 'rejected' | 'deleted'
) => {
  if (status === 'deleted') return client.delete<StoreRecord>(`/v1/owner/memories/${uuid}/`)
  const action = status === 'approved' ? 'approve' : status === 'hidden' ? 'hide' : 'reject'
  return client.post<StoreRecord>(`/v1/owner/memories/${uuid}/${action}/`)
}
