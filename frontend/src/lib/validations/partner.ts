import { z } from "zod";
import { type SelectedRegion } from "@/lib/constants/regions";

// 전화번호 정규식
const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

// 사업자등록번호 정규식 (10자리 숫자, 하이픈 포함/미포함)
const businessNumberRegex = /^[0-9]{3}-?[0-9]{2}-?[0-9]{5}$/;

// 선택된 지역 스키마
const selectedRegionSchema = z.object({
  provinceCode: z.string(),
  provinceName: z.string(),
  districtCodes: z.array(z.string()),
  districtNames: z.array(z.string()),
  isAllDistricts: z.boolean(),
});

// 파트너 등록 폼 스키마
export const partnerSchema = z.object({
  // 기본 정보
  companyName: z
    .string()
    .min(2, "회사/상호명은 2자 이상 입력해주세요")
    .max(100, "회사/상호명은 100자 이하로 입력해주세요"),

  representativeName: z
    .string()
    .min(2, "대표자명은 2자 이상 입력해주세요")
    .max(50, "대표자명은 50자 이하로 입력해주세요"),

  businessNumber: z
    .string()
    .regex(businessNumberRegex, "올바른 사업자등록번호 형식이 아닙니다 (예: 123-45-67890)")
    .optional()
    .or(z.literal("")),

  // 연락처 정보
  contactPhone: z
    .string()
    .regex(phoneRegex, "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)"),

  contactEmail: z
    .string()
    .email("올바른 이메일 형식이 아닙니다")
    .optional()
    .or(z.literal("")),

  // 주소 정보
  address: z.string().min(5, "주소를 입력해주세요"),
  addressDetail: z.string().optional(),

  // 서비스 분야 (최소 1개 이상)
  serviceAreas: z
    .array(z.string())
    .min(1, "최소 1개 이상의 서비스 분야를 선택해주세요"),

  // 활동 지역 (2depth: 시/도 → 시/군/구)
  workRegions: z
    .array(selectedRegionSchema)
    .min(1, "최소 1개 이상의 활동 지역을 선택해주세요"),

  // 소개
  introduction: z
    .string()
    .max(500, "소개는 500자 이하로 입력해주세요")
    .optional(),

  // 경력/자격
  experience: z
    .string()
    .max(500, "경력/자격은 500자 이하로 입력해주세요")
    .optional(),

  // 비고 (추가 메모)
  remarks: z
    .string()
    .max(500, "비고는 500자 이하로 입력해주세요")
    .optional(),

  // 개인정보 동의
  agreePrivacy: z
    .boolean()
    .refine((val) => val === true, {
      message: "개인정보 수집 및 이용에 동의해주세요",
    }),

  // 서비스 이용약관 동의
  agreeTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: "서비스 이용약관에 동의해주세요",
    }),
});

export type PartnerFormData = z.infer<typeof partnerSchema>;

// 폼 기본값
export const partnerDefaultValues: Partial<PartnerFormData> = {
  companyName: "",
  representativeName: "",
  businessNumber: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  addressDetail: "",
  serviceAreas: [],
  workRegions: [],
  introduction: "",
  experience: "",
  remarks: "",
  agreePrivacy: false,
  agreeTerms: false,
};
