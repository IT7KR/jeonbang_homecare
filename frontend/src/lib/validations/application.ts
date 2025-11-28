import { z } from "zod";

// 전화번호 정규식 (하이픈 포함/미포함 모두 허용)
const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

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
    .min(10, "상세 내용은 10자 이상 입력해주세요")
    .max(1000, "상세 내용은 1000자 이하로 입력해주세요"),

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
  photos: [],
  agreePrivacy: false,
};
