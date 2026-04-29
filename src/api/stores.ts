import client from './client'
import type { PaginatedResponse, Store } from '../types'

export const fetchStores = (params?: { page?: number; search?: string }) =>
  client.get<PaginatedResponse<Store>>('/stores/', { params })

export const fetchStore = (id: number) =>
  client.get<Store>(`/stores/${id}/`)

export const updateStore = (id: number, data: Partial<Store>) =>
  client.patch<Store>(`/stores/${id}/`, data)
