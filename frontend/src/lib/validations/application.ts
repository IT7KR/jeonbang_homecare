import { z } from "zod";
import { PHONE_PATTERN } from "./patterns";

// 전화번호 정규식 - 공통 패턴 사용
const phoneRegex = PHONE_PATTERN;

// 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
const getTodayString = () => new Date().toISOString().split("T")[0];

// 미래 날짜 검증 함수
const isFutureOrToday = (dateStr: string | undefined) => {
  if (!dateStr) return true;
  return dateStr >= getTodayString();
};

// 서비스 신청 폼 스키마
export const applicationSchema = z.object({
  // 고객 정보
  customerName: z
    .string()
    .min(2, "이름은 2자 이상 입력해주세요")
    .max(50, "이름은 50자 이하로 입력해주세요"),
  customerPhone: z
    .string()
    .regex(phoneRegex, "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)"),

  // 주소 정보
  address: z.string().min(5, "주소를 입력해주세요"),
  addressDetail: z.string().optional(),

  // 서비스 선택 (최소 1개 이상)
  selectedServices: z
    .array(z.string())
    .min(1, "최소 1개 이상의 서비스를 선택해주세요"),

  // 상세 내용
  description: z
    .string()
    .min(20, "전달 사항은 20자 이상 입력해주세요")
    .max(1000, "전달 사항은 1000자 이하로 입력해주세요"),

  // 희망 상담일 (선택, 오늘 이후)
  preferredConsultationDate: z
    .string()
    .optional()
    .refine(isFutureOrToday, { message: "희망일은 오늘 이후 날짜여야 합니다" }),

  // 희망 작업일 (선택, 오늘 이후)
  preferredWorkDate: z
    .string()
    .optional()
    .refine(isFutureOrToday, { message: "희망일은 오늘 이후 날짜여야 합니다" }),

  // 사진 첨부 (선택)
  photos: z.array(z.instanceof(File)).optional(),

  // 개인정보 동의
  agreePrivacy: z
    .boolean()
    .refine((val) => val === true, {
      message: "개인정보 수집 및 이용에 동의해주세요",
    }),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

// 폼 기본값
export const applicationDefaultValues: Partial<ApplicationFormData> = {
  customerName: "",
  customerPhone: "",
  address: "",
  addressDetail: "",
  selectedServices: [],
  description: "",
  preferredConsultationDate: "",
  preferredWorkDate: "",
  photos: [],
  agreePrivacy: false,
};
