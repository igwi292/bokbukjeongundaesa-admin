export interface Store {
  id: number
  name: string
  location: string
  owner: string
  plan: 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'inactive'
  created_at: string
  qr_url: string
  record_count: number
}

export interface StoreRecord {
  id: number
  store_id: number
  store_name: string
  content: string
  image_url?: string
  author_nickname?: string
  status: 'pending' | 'approved' | 'hidden' | 'deleted'
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
