/**
 * Admin API 공통 타입 정의
 */

// ===== Auth Types =====

export interface Admin {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  admin: Admin;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ===== Dashboard Types =====

export interface DashboardStats {
  applications_total: number;
  applications_new: number;
  applications_consulting: number;
  applications_assigned: number;
  applications_scheduled: number;
  applications_completed: number;
  applications_today: number;
  applications_this_week: number;
  partners_total: number;
  partners_pending: number;
  partners_approved: number;
  partners_this_month: number;
}

export interface RecentApplication {
  id: number;
  application_number: string;
  status: string;
  created_at: string;
}

export interface RecentPartner {
  id: number;
  company_name: string;
  status: string;
  created_at: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_applications: RecentApplication[];
  recent_partners: RecentPartner[];
}

// ===== Applications Types =====

export interface ApplicationListItem {
  id: number;
  application_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  selected_services: string[];
  status: string;
  assigned_partner_id: number | null;
  scheduled_date: string | null;
  preferred_consultation_date: string | null;
  preferred_work_date: string | null;
  created_at: string;
}

export interface ApplicationListResponse {
  items: ApplicationListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ScheduleConflict {
  application_id: number;
  application_number: string;
  customer_name: string;
  scheduled_time: string | null;
}

// ===== Assignment Types (1:N 협력사 배정) =====

export interface AssignmentSummary {
  id: number;
  partner_id: number;
  partner_name: string;
  partner_company: string | null;
  assigned_services: string[];
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  estimate_note: string | null;
  note: string | null;
}

export interface Assignment {
  id: number;
  application_id: number;
  partner_id: number;
  assigned_services: string[];
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  estimate_note: string | null;
  assigned_by: number | null;
  assigned_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  partner_name: string | null;
  partner_phone: string | null;
  partner_company: string | null;
}

export interface AssignmentListResponse {
  items: Assignment[];
  total: number;
}

export interface AssignmentCreate {
  partner_id: number;
  assigned_services: string[];
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_cost?: number;
  estimate_note?: string;
  note?: string;
  send_sms?: boolean;
}

export interface AssignmentUpdate {
  assigned_services?: string[];
  status?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_cost?: number;
  final_cost?: number;
  estimate_note?: string;
  note?: string;
  send_sms?: boolean;
}

export interface ApplicationDetail {
  id: number;
  application_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  address_detail: string | null;
  selected_services: string[];
  description: string;
  photos: string[];
  preferred_consultation_date: string | null;
  preferred_work_date: string | null;
  status: string;
  // 레거시 필드 (단일 배정 호환용)
  assigned_partner_id: number | null;
  assigned_admin_id: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  // 일정 충돌 경고 (업데이트 응답에서만)
  schedule_conflicts?: ScheduleConflict[] | null;
  // 다중 배정 목록 (1:N)
  assignments?: AssignmentSummary[] | null;
}

export interface ApplicationUpdate {
  status?: string;
  assigned_partner_id?: number;
  assigned_admin_id?: number;
  scheduled_date?: string;
  scheduled_time?: string;
  estimated_cost?: number;
  final_cost?: number;
  admin_memo?: string;
  send_sms?: boolean;
}

// 통합 검색 타입 (모든 검색 유형 포함)
export type UnifiedSearchType = "auto" | "name" | "phone" | "number" | "company";

export interface ApplicationListParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
  search_type?: UnifiedSearchType;
  date_from?: string;  // YYYY-MM-DD
  date_to?: string;    // YYYY-MM-DD
  services?: string;   // 콤마 구분
  assigned_admin_id?: number;
  assigned_partner_id?: number;
}

// ===== Bulk Assign Types =====

export interface BulkAssignRequest {
  application_ids: number[];
  partner_id: number;
  send_sms?: boolean;
}

export interface BulkAssignResult {
  application_id: number;
  application_number: string;
  success: boolean;
  message: string;
}

export interface BulkAssignResponse {
  total: number;
  success_count: number;
  failed_count: number;
  results: BulkAssignResult[];
  partner_name: string;
}

// ===== Partners Types =====

export interface PartnerListItem {
  id: number;
  company_name: string;
  representative_name: string;
  contact_phone: string;
  service_areas: string[];
  status: string;
  created_at: string;
}

export interface PartnerListResponse {
  items: PartnerListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PartnerWorkRegion {
  provinceCode: string;
  provinceName: string;
  districtCodes: string[];
  districtNames: string[];
  isAllDistricts: boolean;
}

export interface PartnerDetail {
  id: number;
  company_name: string;
  representative_name: string;
  business_number: string | null;
  contact_phone: string;
  contact_email: string | null;
  address: string;
  address_detail: string | null;
  service_areas: string[];
  work_regions: PartnerWorkRegion[];
  introduction: string | null;
  experience: string | null;
  remarks: string | null;
  business_registration_file: string | null;  // 사업자등록증 파일 경로
  status: string;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerUpdate {
  status?: string;
  rejection_reason?: string;
  admin_memo?: string;
}

export interface PartnerListParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
  search_type?: UnifiedSearchType;
  date_from?: string;  // YYYY-MM-DD
  date_to?: string;    // YYYY-MM-DD
  services?: string;   // 콤마 구분
  region?: string;
  approved_by?: number;
}

// ===== SMS Types =====

export interface SMSLogItem {
  id: number;
  receiver_phone: string;
  message: string;
  sms_type: string;
  trigger_source: "system" | "manual" | "bulk"; // 발송 출처
  reference_type: string | null;
  reference_id: number | null;
  status: string;
  result_code: string | null;
  result_message: string | null;
  mms_images: string[] | null;
  created_at: string;
  sent_at: string | null;
}

export interface SMSLogListResponse {
  items: SMSLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SMSStats {
  total_sent: number;
  total_failed: number;
  today_sent: number;
  today_failed: number;
  this_month_sent: number;
  this_month_failed: number;
}

export interface SMSSendRequest {
  receiver_phone: string;
  message: string;
  sms_type?: string;
}

export interface MMSSendRequest {
  receiver_phone: string;
  message: string;
  sms_type?: string;
  image1?: string;
  image2?: string;
  image3?: string;
}

export interface WorkPhotoMMSRequest {
  receiver_phone: string;
  message: string;
  assignment_id: number;
  selected_photos: string[];
  sms_type?: string;
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  size: number;
  type: string;
}

export interface SMSSendResponse {
  success: boolean;
  message: string;
  sms_log_id: number | null;
}

export interface SMSLogListParams {
  page?: number;
  page_size?: number;
  status?: string;
  sms_type?: string;
  trigger_source?: "system" | "manual" | "bulk";
  search?: string;
}

// ===== Bulk SMS Types =====

export interface SMSRecipient {
  id: number;
  name: string;
  phone: string; // 마스킹된 번호 (010-****-5678)
  label: string; // 신청번호 또는 회사명
  type: "customer" | "partner";
  status?: string;
}

export interface SMSRecipientsResponse {
  items: SMSRecipient[];
  total: number;
  page: number;
  page_size: number;
}

export interface SMSRecipientsParams {
  target_type: "customer" | "partner";
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface BulkSMSSendRequest {
  job_type: "announcement" | "status_notify" | "manual_select";
  title?: string;
  target_type: "customer" | "partner";
  target_filter?: { status?: string };
  target_ids?: number[];
  message: string;
}

export interface BulkSMSJobResponse {
  job_id: number;
  status: string;
  message: string;
}

export interface FailedRecipient {
  phone: string;
  name?: string;
  error: string;
}

export interface BulkSMSJobDetail {
  id: number;
  job_type: string;
  title?: string;
  target_type: string;
  status: "pending" | "processing" | "completed" | "partial_failed" | "failed";
  total_count: number;
  sent_count: number;
  failed_count: number;
  progress: number; // 0-100%
  current_batch: number;
  total_batches: number;
  failed_recipients?: FailedRecipient[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BulkSMSJobListResponse {
  items: BulkSMSJobDetail[];
  total: number;
  page: number;
  page_size: number;
}

export interface BulkSMSJobListParams {
  page?: number;
  page_size?: number;
  status?: string;
}

// ===== Schedule Types =====

export interface ScheduleItem {
  id: number;
  application_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  selected_services: string[];
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  assigned_partner_id: number | null;
  assigned_partner_name: string | null;
}

export interface ScheduleListResponse {
  items: ScheduleItem[];
  total: number;
}

export interface MonthlyStats {
  total_scheduled: number;
  completed: number;
  pending: number;
  by_date: Record<string, number>;
}

export interface SchedulePartner {
  id: number;
  company_name: string;
  service_areas: string[];
}

export interface ScheduleListParams {
  start_date: string;
  end_date: string;
  status?: string;
  partner_id?: number;
}

// ===== Settings Types =====

export interface ProfileData {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
}

export interface ProfileUpdate {
  name?: string;
  phone?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface AdminListItem {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AdminCreate {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AdminUpdateData {
  name?: string;
  phone?: string;
  is_active?: boolean;
}

// ===== SMS Template Types =====

export interface SMSTemplate {
  id: number;
  template_key: string;
  title: string;
  description: string | null;
  content: string;
  available_variables: string[] | null;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
}

export interface SMSTemplateListResponse {
  items: SMSTemplate[];
  total: number;
}

export interface SMSTemplateCreate {
  template_key: string;
  title: string;
  description?: string;
  content: string;
  available_variables?: string[];
  is_active?: boolean;
}

export interface SMSTemplateUpdate {
  title?: string;
  description?: string;
  content?: string;
  is_active?: boolean;
}

export interface SMSTemplatePreviewRequest {
  template_key: string;
  variables: Record<string, string>;
}

export interface SMSTemplatePreviewResponse {
  original: string;
  preview: string;
  byte_length: number;
  message_type: "SMS" | "LMS";
}

export interface SMSTemplateListParams {
  is_active?: boolean;
  search?: string;
}

// ===== Audit Log Types =====

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  summary: string | null;
  admin_id: number | null;
  admin_name: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditLogListParams {
  entity_type?: string;
  entity_id?: number;
  action?: string;
  admin_id?: number;
  page?: number;
  page_size?: number;
}

// ===== Application Note Types =====

export interface ApplicationNote {
  id: number;
  application_id: number;
  admin_id: number;
  admin_name: string;
  content: string;
  created_at: string;
}

export interface ApplicationNotesListResponse {
  items: ApplicationNote[];
  total: number;
}

export interface ApplicationNoteCreate {
  content: string;
}

// ===== Partner Note Types =====

export interface PartnerNote {
  id: number;
  partner_id: number;
  admin_id: number | null;
  admin_name: string;
  note_type: "memo" | "status_change" | "system";
  content: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
}

export interface PartnerNotesListResponse {
  items: PartnerNote[];
  total: number;
}

export interface PartnerNoteCreate {
  content: string;
}

export interface PartnerStatusChange {
  new_status: "pending" | "approved" | "rejected" | "inactive";
  reason?: string;
  send_sms?: boolean;
}

// ===== Customer History Types (중복 관리) =====

export interface CustomerHistoryItem {
  id: number;
  application_number: string;
  selected_services: string[];
  status: string;
  status_label: string;
  created_at: string;
  completed_at: string | null;
}

export interface CustomerHistoryResponse {
  application_id: number;
  customer_phone_masked: string;
  total_applications: number;
  applications: CustomerHistoryItem[];
}

// ===== Similar Partners Types (중복 관리) =====

export interface SimilarPartnerItem {
  id: number;
  company_name: string;
  representative_name: string;
  contact_phone: string;
  business_number: string | null;
  status: string;
  status_label: string;
  created_at: string;
}

export interface SimilarPartnersResponse {
  partner_id: number;
  company_name: string;
  similar_partners: SimilarPartnerItem[];
  total: number;
}


// ===== Quote Item Types (견적 항목) =====

export interface QuoteItem {
  id: number;
  assignment_id: number;
  item_name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteItemCreate {
  item_name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price: number;
  sort_order?: number;
}

export interface QuoteItemUpdate {
  item_name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  sort_order?: number;
}

export interface QuoteSummary {
  assignment_id: number;
  items: QuoteItem[];
  total_amount: number;
  item_count: number;
}

export interface QuoteItemBulkCreate {
  items: QuoteItemCreate[];
}

export interface QuoteCalculateRequest {
  update_assignment?: boolean;
}

// ===== Work Photos Types (시공 사진) =====

export interface WorkPhoto {
  url: string;
  filename: string;
}

export interface WorkPhotosResponse {
  assignment_id: number;
  before_photos: string[];
  after_photos: string[];
  before_photo_urls: string[];
  after_photo_urls: string[];
  uploaded_at: string | null;
  updated_at: string | null;
}

export interface WorkPhotoUploadResponse {
  assignment_id: number;
  photo_type: "before" | "after";
  photos: string[];
  total_count: number;
  message: string;
}

// ===== Customer URL Types (고객 열람 URL) =====

export interface CustomerUrlResponse {
  assignment_id: number;
  token: string | null;
  url: string | null;
  expires_at: string | null;
  is_valid: boolean;
  message: string | null;
}

export interface CustomerUrlCreate {
  expires_in_days?: number;
}

export interface CustomerUrlExtend {
  additional_days: number;
}

// ===== Extended Assignment Types (시공 사진 + 고객 URL 포함) =====

export interface AssignmentWithPhotos extends Assignment {
  work_photos_before: string[] | null;
  work_photos_after: string[] | null;
  work_photos_uploaded_at: string | null;
  work_photos_updated_at: string | null;
  customer_token: string | null;
  customer_token_expires_at: string | null;
  customer_url: string | null;
}
