/**
 * API Client Exports
 * 모든 API 모듈 재export
 */

// Core client utilities
export {
  // Base URL
  API_BASE_URL,
  UPLOADS_BASE_URL,
  // Error classes
  ApiError,
  AuthError,
  ValidationError,
  NetworkError,
  // API functions
  fetchApi,
  fetchWithAuth,
  fetchWithToken,
  uploadWithAuth,
  uploadPublic,
  // Token management
  setTokenGetter,
  setAuthErrorHandler,
  // Utilities
  getUploadUrl,
} from "./client";

// Public APIs
export * from "./regions";
export * from "./applications";
export * from "./partners";
export * from "./services";

// Admin APIs (전체 재export, 개별 import는 @/lib/api/admin/... 사용 권장)
export * from "./admin";
