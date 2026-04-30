export interface Store {
  uuid: string
  name: string
  slug: string
  business_number: string
  description: string
  location: string
  is_active: boolean
  qr_url: string
  created_at: string
  updated_at: string
}

export interface StoreRecord {
  uuid: string
  store: number
  store_uuid: string
  store_name: string
  content: string
  visitor_name: string | null
  status: 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted'
  is_deleted: boolean
  created_at: string
}

export interface DashboardStats {
  total_stores: number
  active_stores: number
  total_records: number
  pending_records: number
  monthly_new_stores: number
  monthly_new_records: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface OwnerProfile {
  business_name: string
  business_registration_number: string
}

export interface UserProfile {
  uuid: string
  email: string
  nickname: string
  phone: string
  user_type: string
  owner_profile: OwnerProfile | null
}
