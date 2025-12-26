/**
 * API Client Configuration
 * 중앙화된 API 클라이언트 - 인터셉터, 에러 처리, 토큰 관리
 */

// ===== 설정 =====

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// 업로드 파일 URL (API URL에서 /api/v1 제거)
export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/v\d+$/, "");

// ===== 에러 클래스 =====

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

export class AuthError extends ApiError {
  constructor(message: string = "인증이 필요합니다") {
    super(401, "UNAUTHORIZED", message);
    this.name = "AuthError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(422, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = "네트워크 연결을 확인해주세요") {
    super(0, "NETWORK_ERROR", message);
    this.name = "NetworkError";
  }
}

// ===== 타입 정의 =====

interface FetchOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  skipAuth?: boolean; // 인증 헤더 스킵
}

type TokenGetter = () => Promise<string | null>;

// ===== 토큰 관리 =====

let tokenGetter: TokenGetter | null = null;
let onAuthError: (() => void) | null = null;

/**
 * 토큰 getter 설정 (앱 초기화 시 호출)
 */
export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/**
 * 인증 에러 핸들러 설정 (401 발생 시 호출)
 */
export function setAuthErrorHandler(handler: () => void): void {
  onAuthError = handler;
}

// ===== 에러 파싱 =====

async function parseErrorResponse(response: Response): Promise<ApiError> {
  const status = response.status;

  try {
    const data = await response.json();
    const message = data.detail || data.message || getDefaultErrorMessage(status);
    const code = data.code || getErrorCode(status);

    if (status === 401) {
      return new AuthError(message);
    }
    if (status === 422) {
      return new ValidationError(message, data.errors);
    }

    return new ApiError(status, code, message, data);
  } catch {
    return new ApiError(status, getErrorCode(status), getDefaultErrorMessage(status));
  }
}

function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
  };
  return codes[status] || "UNKNOWN_ERROR";
}

function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "잘못된 요청입니다",
    401: "인증이 필요합니다",
    403: "접근 권한이 없습니다",
    404: "요청한 리소스를 찾을 수 없습니다",
    409: "이미 존재하는 데이터입니다",
    422: "입력값을 확인해주세요",
    429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
    500: "서버 오류가 발생했습니다",
    502: "서버 연결에 실패했습니다",
    503: "서비스를 일시적으로 사용할 수 없습니다",
  };
  return messages[status] || "오류가 발생했습니다";
}

// ===== URL 빌더 =====

function buildUrl(endpoint: string, params?: FetchOptions["params"]): string {
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

// ===== 메인 API 함수 =====

/**
 * 공개 API 호출 (인증 불필요)
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, body, skipAuth = true, ...fetchOptions } = options;

  const url = buildUrl(endpoint, params);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError();
  }
}

/**
 * 인증이 필요한 API 호출
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, body, ...fetchOptions } = options;

  // 토큰 가져오기
  if (!tokenGetter) {
    throw new AuthError("토큰 getter가 설정되지 않았습니다");
  }

  const token = await tokenGetter();
  if (!token) {
    onAuthError?.();
    throw new AuthError();
  }

  const url = buildUrl(endpoint, params);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);

      // 401 에러 시 핸들러 호출
      if (error.status === 401) {
        onAuthError?.();
      }

      throw error;
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError();
  }
}

/**
 * 토큰을 직접 전달하는 API 호출 (auth store 초기화 전 사용)
 */
export async function fetchWithToken<T>(
  endpoint: string,
  token: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, body, ...fetchOptions } = options;

  const url = buildUrl(endpoint, params);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError();
  }
}

/**
 * FormData 업로드 (인증 포함)
 */
export async function uploadWithAuth<T>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> {
  let authToken = token;

  if (!authToken && tokenGetter) {
    authToken = await tokenGetter() ?? undefined;
  }

  if (!authToken) {
    throw new AuthError();
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        // Content-Type은 FormData가 자동 설정
      },
      body: formData,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError();
  }
}

/**
 * FormData 업로드 (공개)
 */
export async function uploadPublic<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new NetworkError();
  }
}

// ===== 유틸리티 =====

/**
 * 업로드 파일의 전체 URL 반환
 */
export function getUploadUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${UPLOADS_BASE_URL}${path}`;
}
