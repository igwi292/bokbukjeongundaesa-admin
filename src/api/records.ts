import client from './client'
import type { PaginatedResponse, StoreRecord } from '../types'

let MOCK_RECORDS: StoreRecord[] = [
  { id: 1, store_id: 1, store_name: '카페 온도', content: '여자친구랑 처음 온 날 기억해요. 분위기가 너무 좋았고 커피도 맛있었어요. 꼭 다시 올게요!', author_nickname: '민지', status: 'approved', created_at: '2025-04-28T14:20:00Z' },
  { id: 2, store_id: 1, store_name: '카페 온도', content: '우리 100일 기념으로 왔어요 🎉 소중한 날 함께해줘서 감사합니다', author_nickname: '수현', status: 'pending', created_at: '2025-04-27T11:00:00Z' },
  { id: 3, store_id: 1, store_name: '카페 온도', content: '혼자 작업하러 왔는데 너무 조용하고 좋아요. 단골될 것 같아요.', author_nickname: null, status: 'approved', created_at: '2025-04-25T09:30:00Z' },
  { id: 4, store_id: 1, store_name: '카페 온도', content: '친구들이랑 수다 떨다 시간 가는 줄 몰랐어요. 다음에 또 올게요!', author_nickname: '예린', status: 'pending', created_at: '2025-04-22T16:45:00Z' },
  { id: 5, store_id: 1, store_name: '카페 온도', content: '라떼가 정말 맛있었어요. 가격도 합리적이고 직원분들도 친절해요.', author_nickname: '준혁', status: 'approved', created_at: '2025-04-20T13:10:00Z' },
  { id: 6, store_id: 1, store_name: '카페 온도', content: '오늘 기분 안 좋았는데 여기 오니까 좋아졌어요. 감사합니다 :)', author_nickname: null, status: 'hidden', created_at: '2025-04-18T17:00:00Z' },
]

export const fetchRecords = (params?: {
  store_id?: number
  status?: string
  page?: number
}) => {
  let results = [...MOCK_RECORDS]
  if (params?.status) results = results.filter((r) => r.status === params.status)
  if (params?.store_id) results = results.filter((r) => r.store_id === params.store_id)
  const response: PaginatedResponse<StoreRecord> = { count: results.length, next: null, previous: null, results }
  return Promise.resolve({ data: response }) as ReturnType<typeof client.get<PaginatedResponse<StoreRecord>>>
}

export const updateRecordStatus = (
  id: number,
  status: 'approved' | 'hidden' | 'deleted'
) => {
  const record = MOCK_RECORDS.find((r) => r.id === id)
  if (record) record.status = status
  return Promise.resolve({ data: record! }) as ReturnType<typeof client.patch<StoreRecord>>
}
