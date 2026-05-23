import client from './client'
import type {
  OwnerMemory,
  OwnerStoreSummary,
  PaginatedResponse,
  RecordStatus,
  StoreRecord,
} from '../types'

type OwnerMemoryListResponse =
  | PaginatedResponse<StoreRecord>
  | { items: Array<StoreRecord & { id?: string }> }

const normalizeStatus = (status: unknown): RecordStatus =>
  (typeof status === 'string' ? status.toLowerCase() : '') as RecordStatus

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

const normalizeMemory = (raw: Record<string, unknown>): OwnerMemory => ({
  uuid: (raw.uuid ?? raw.id) as string,
  content: (raw.content as string) ?? '',
  author_nickname: (raw.author_nickname as string) ?? '',
  status: normalizeStatus(raw.status),
  sticker_type: raw.sticker_type as string | undefined,
  report_count: (raw.report_count as number) ?? 0,
  is_deleted: Boolean(raw.is_deleted),
  created_at: (raw.created_at as string) ?? '',
  updated_at: raw.updated_at as string | undefined,
})

export const fetchOwnerStores = async (): Promise<OwnerStoreSummary[]> => {
  const res = await client.get<unknown>('/v1/owner/stores/')
  const data = res.data as { results?: unknown[] } | unknown[]
  const list = Array.isArray(data) ? data : (data?.results ?? [])
  return (list as Array<Record<string, unknown>>).map((s) => ({
    slug: s.slug as string,
    name: s.name as string,
    pending_count: s.pending_count as number | undefined,
  }))
}

export const fetchStoreMemories = async (
  slug: string,
  params?: { status?: RecordStatus }
): Promise<OwnerMemory[]> => {
  const res = await client.get<{ items?: Array<Record<string, unknown>> }>(
    `/v1/owner/stores/${slug}/memories/`,
    { params }
  )
  return (res.data?.items ?? []).map(normalizeMemory)
}

export const approveMemory = async (uuid: string): Promise<OwnerMemory> => {
  const res = await client.post<Record<string, unknown>>(`/v1/owner/memories/${uuid}/approve/`)
  return normalizeMemory(res.data)
}

export const rejectMemory = async (uuid: string): Promise<OwnerMemory> => {
  const res = await client.post<Record<string, unknown>>(`/v1/owner/memories/${uuid}/reject/`)
  return normalizeMemory(res.data)
}

export const hideMemory = async (uuid: string): Promise<OwnerMemory> => {
  const res = await client.post<Record<string, unknown>>(`/v1/owner/memories/${uuid}/hide/`)
  return normalizeMemory(res.data)
}

export const deleteMemory = (uuid: string): Promise<void> =>
  client.delete(`/v1/owner/memories/${uuid}/`).then(() => undefined)
