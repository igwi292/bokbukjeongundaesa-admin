import client from './client'
import type { PaginatedResponse, Store } from '../types'

export const fetchStores = (params?: { page?: number; search?: string }) =>
  client.get<PaginatedResponse<Store>>('/stores/', { params })

export const fetchMyStore = async (): Promise<{ data: Store | null }> => {
  const res = await client.get<PaginatedResponse<Store>>('/stores/')
  return { data: res.data.results[0] ?? null }
}

export const fetchStore = (uuid: string) =>
  client.get<Store>(`/stores/${uuid}/`)

export const createStore = (data: Pick<Store, 'name' | 'location' | 'description' | 'business_number'>) =>
  client.post<Store>('/stores/', data)

export const updateStore = (uuid: string, data: Partial<Store>) =>
  client.patch<Store>(`/stores/${uuid}/`, data)
