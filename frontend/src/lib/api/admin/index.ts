/**
 * Admin API 모듈
 * 모든 Admin API 함수와 타입을 재export
 */

// Types
export type {
  // Auth
  Admin,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  // Dashboard
  DashboardStats,
  RecentApplication,
  RecentPartner,
  DashboardResponse,
  // Applications
  ApplicationListItem,
  ApplicationListResponse,
  ApplicationDetail,
  ApplicationUpdate,
  ApplicationListParams,
  // Partners
  PartnerListItem,
  PartnerListResponse,
  PartnerWorkRegion,
  PartnerDetail,
  PartnerUpdate,
  PartnerListParams,
  // SMS
  SMSLogItem,
  SMSLogListResponse,
  SMSStats,
  SMSSendRequest,
  SMSSendResponse,
  SMSLogListParams,
  // Bulk SMS
  SMSRecipient,
  SMSRecipientsResponse,
  SMSRecipientsParams,
  BulkSMSSendRequest,
  BulkSMSJobResponse,
  FailedRecipient,
  BulkSMSJobDetail,
  BulkSMSJobListResponse,
  BulkSMSJobListParams,
  // Schedule
  ScheduleItem,
  ScheduleListResponse,
  MonthlyStats,
  SchedulePartner,
  ScheduleListParams,
  // Settings
  ProfileData,
  ProfileUpdate,
  PasswordChange,
  AdminListItem,
  AdminCreate,
  AdminUpdateData,
} from "./types";

// Auth API
export {
  adminLogin,
  refreshAccessToken,
  getMe,
  changePassword,
} from "./auth";

// Dashboard API
export { getDashboard } from "./dashboard";

// Applications API
export {
  getApplications,
  getApplication,
  updateApplication,
} from "./applications";

// Partners API
export {
  getPartners,
  getPartner,
  updatePartner,
  approvePartner,
} from "./partners";

// SMS API
export {
  getSMSStats,
  getSMSLogs,
  sendSMS,
  retrySMS,
  // Bulk SMS
  getSMSRecipients,
  createBulkSMSJob,
  getBulkSMSJob,
  getBulkSMSJobs,
} from "./sms";

// Schedule API
export {
  getSchedule,
  getMonthlyStats,
  getSchedulePartners,
} from "./schedule";

// Settings API
export {
  getProfile,
  updateProfile,
  changePasswordSettings,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "./settings";
