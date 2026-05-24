import client from './client'
import type { PaginatedResponse, Store } from '../types'

export const fetchStores = (params?: { page?: number; search?: string }) =>
  client.get<PaginatedResponse<Store>>('/v1/owner/stores/', { params })

export const fetchMyStore = async (): Promise<{ data: Store | null }> => {
  const res = await client.get<PaginatedResponse<Store>>('/v1/owner/stores/')
  const results: Store[] = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
  return { data: results[0] ?? null }
}

export const fetchStore = (uuid: string) =>
  client.get<Store>(`/v1/owner/stores/${uuid}/`)

export const createStore = (data: Pick<Store, 'name' | 'location' | 'description' | 'business_number'>) =>
  client.post<Store>('/v1/owner/stores/', data)

export const updateStore = (uuid: string, data: Partial<Store>) =>
  client.patch<Store>(`/v1/owner/stores/${uuid}/`, data)
