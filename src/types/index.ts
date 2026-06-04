export interface Store {
  uuid: string
  name: string
  slug: string
  business_number: string
  description: string
  location: string
  is_active: boolean
  require_approval?: boolean
  marker_image?: string
  marker_image_url?: string
  marker_real_size_m?: number
  public_url?: string
  qr_redirect_url?: string
  qr_url: string
  qr_scan_count?: number
  qr_last_scanned_at?: string | null
  created_at: string
  updated_at: string
}

export type RecordStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted'

export interface StoreRecord {
  uuid: string
  store: number
  store_uuid: string
  store_name: string
  content: string
  visitor_name: string | null
  author_nickname?: string
  status: RecordStatus
  report_count?: number
  is_deleted: boolean
  created_at: string
}

export interface OwnerMemory {
  uuid: string
  content: string
  author_nickname: string
  status: RecordStatus
  sticker_type?: string
  report_count: number
  is_deleted: boolean
  created_at: string
  updated_at?: string
}

export interface OwnerStoreSummary {
  slug: string
  name: string
  pending_count?: number
}

export interface DashboardStats {
  total_stores: number
  active_stores: number
  total_records: number
  pending_records: number
  monthly_new_stores: number
  monthly_new_records: number
  pending_reports: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export type ReportAction = 'hide' | 'delete' | 'dismiss'

export interface Report {
  id: number
  status: ReportStatus
  reason: string
  record_uuid: string
  record_content: string
  record_status: RecordStatus
  record_author_nickname: string
  record_store_name: string
  record_is_deleted: boolean
  created_at: string
  updated_at: string
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
