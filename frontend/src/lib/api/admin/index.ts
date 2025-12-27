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
  ScheduleConflict,
  ApplicationDetail,
  ApplicationUpdate,
  ApplicationListParams,
  // Bulk Assign
  BulkAssignRequest,
  BulkAssignResult,
  BulkAssignResponse,
  // Assignments (1:N)
  AssignmentSummary,
  Assignment,
  AssignmentListResponse,
  AssignmentCreate,
  AssignmentUpdate,
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
  // SMS Templates
  SMSTemplate,
  SMSTemplateListResponse,
  SMSTemplateCreate,
  SMSTemplateUpdate,
  SMSTemplatePreviewRequest,
  SMSTemplatePreviewResponse,
  SMSTemplateListParams,
  // Audit Logs
  AuditLog,
  AuditLogListResponse,
  AuditLogListParams,
  // Application Notes
  ApplicationNote,
  ApplicationNotesListResponse,
  ApplicationNoteCreate,
  // Partner Notes
  PartnerNote,
  PartnerNotesListResponse,
  PartnerNoteCreate,
  PartnerStatusChange,
  // Customer History (중복 관리)
  CustomerHistoryItem,
  CustomerHistoryResponse,
  // Similar Partners (중복 관리)
  SimilarPartnerItem,
  SimilarPartnersResponse,
  // Quote Items (견적 항목)
  QuoteItem,
  QuoteItemCreate,
  QuoteItemUpdate,
  QuoteSummary,
  QuoteItemBulkCreate,
  QuoteCalculateRequest,
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
  bulkAssignApplications,
  getApplicationNotes,
  createApplicationNote,
  deleteApplicationNote,
  // Assignments (1:N)
  getApplicationAssignments,
  createApplicationAssignment,
  updateApplicationAssignment,
  deleteApplicationAssignment,
  // Customer History (중복 관리)
  getCustomerHistory,
} from "./applications";

// Partners API
export {
  getPartners,
  getPartner,
  updatePartner,
  approvePartner,
  changePartnerStatus,
  getPartnerNotes,
  createPartnerNote,
  deletePartnerNote,
  // Similar Partners (중복 관리)
  getSimilarPartners,
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

// SMS Templates API
export {
  getSMSTemplates,
  getSMSTemplate,
  getSMSTemplateByKey,
  createSMSTemplate,
  updateSMSTemplate,
  deleteSMSTemplate,
  previewSMSTemplate,
} from "./sms-templates";

// Audit Logs API
export { getAuditLogs, getEntityAuditLogs } from "./audit-logs";

// Quotes API
export {
  getQuoteItems,
  createQuoteItem,
  createQuoteItemsBulk,
  updateQuoteItem,
  deleteQuoteItem,
  deleteAllQuoteItems,
  calculateQuote,
  reorderQuoteItems,
  downloadQuotePdf,
  getQuotePdfUrl,
} from "./quotes";
