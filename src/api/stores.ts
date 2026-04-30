import client from './client'
import type { PaginatedResponse, Store } from '../types'

let MOCK_STORE: Store = {
  id: 1,
  name: '카페 온도',
  location: '서울시 마포구 연남동 123-4',
  hours: '10:00 - 22:00',
  owner: 'taehee',
  plan: 'pro',
  status: 'active',
  created_at: '2024-11-01T00:00:00Z',
  qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://bokbuk.app/store/1',
  record_count: 312,
}

export const fetchStores = (params?: { page?: number; search?: string }) =>
  client.get<PaginatedResponse<Store>>('/stores/', { params })

export const fetchStore = (id: number) =>
  client.get<Store>(`/stores/${id}/`)

export const fetchMyStore = () =>
  Promise.resolve({ data: MOCK_STORE }) as ReturnType<typeof client.get<Store>>

export const updateStore = (_id: number, data: Partial<Store>) => {
  MOCK_STORE = { ...MOCK_STORE, ...data }
  return Promise.resolve({ data: MOCK_STORE }) as ReturnType<typeof client.patch<Store>>
}
