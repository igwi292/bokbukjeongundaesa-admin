import client from './client'
import type { Store } from '../types'

type RawStore = Store & { place_id?: string; uuid?: string }
type StoreListResponse = RawStore[] | { results?: RawStore[] }

// 백엔드 OwnerStoreDetailSerializer는 uuid 대신 place_id를 반환함
function normalizeStore(raw: RawStore): Store {
  return { ...raw, uuid: raw.uuid ?? raw.place_id }
}

export const fetchMyStore = async (): Promise<{ data: Store | null }> => {
  // 목록 serializer(OwnerStoreSerializer)는 경량화된 필드만 포함 (qr_url, business_number 등 누락)
  // → slug로 상세 조회를 추가로 호출해 완전한 데이터를 가져옴
  const listRes = await client.get<StoreListResponse>('/v1/owner/stores/')
  const raw = Array.isArray(listRes.data) ? listRes.data : (listRes.data.results ?? [])
  if (!raw[0]) return { data: null }

  const detailRes = await client.get<RawStore>(`/v1/owner/stores/${raw[0].slug}/`)
  return { data: normalizeStore(detailRes.data) }
}

export const createStore = (
  data: Pick<Store, 'name' | 'location' | 'description' | 'business_number'>
) => client.post<Store>('/v1/owner/stores/', data)

// 백엔드 lookup_field = 'slug' 이므로 uuid가 아닌 slug로 URL을 구성해야 함
export const updateStore = (slug: string, data: Partial<Store>) =>
  client.patch<Store>(`/v1/owner/stores/${slug}/`, data)

export const updateStoreMarker = (
  slug: string,
  data: { marker_image?: File; marker_real_size_m: number }
) => {
  const form = new FormData()
  if (data.marker_image) form.append('marker_image', data.marker_image)
  form.append('marker_real_size_m', String(data.marker_real_size_m))
  return client.patch<Store>(`/v1/owner/stores/${slug}/`, form)
}
