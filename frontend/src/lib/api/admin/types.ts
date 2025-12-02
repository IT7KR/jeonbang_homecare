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
  created_at: string;
}

export interface ApplicationListResponse {
  items: ApplicationListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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
  status: string;
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

export interface ApplicationListParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
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
}

// ===== SMS Types =====

export interface SMSLogItem {
  id: number;
  receiver_phone: string;
  message: string;
  sms_type: string;
  reference_type: string | null;
  reference_id: number | null;
  status: string;
  result_code: string | null;
  result_message: string | null;
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
