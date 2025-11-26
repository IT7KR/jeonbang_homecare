"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Phone,
  MapPin,
  User,
  Building2,
  Briefcase,
  FileText,
  ArrowLeft,
  Loader2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { DaumPostcode } from "@/components/forms/DaumPostcode";
import {
  partnerSchema,
  partnerDefaultValues,
  type PartnerFormData,
} from "@/lib/validations/partner";
import { SERVICE_CATEGORIES, ROUTES, COMPANY_INFO } from "@/lib/constants";
import { RegionSelector } from "@/components/forms/RegionSelector";
import { ServiceSelector } from "@/components/forms/ServiceSelector";
import { type SelectedRegion } from "@/lib/constants/regions";
import { createPartner } from "@/lib/api/partners";

export default function PartnerPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: partnerDefaultValues,
  });

  const serviceAreas = watch("serviceAreas") || [];
  const workRegions = watch("workRegions") || [];

  const handleServiceToggle = (service: string) => {
    const current = serviceAreas;
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    setValue("serviceAreas", updated, { shouldValidate: true });
  };

  const handleRegionChange = (regions: SelectedRegion[]) => {
    setValue("workRegions", regions, { shouldValidate: true });
  };

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);

    try {
      const response = await createPartner({
        companyName: data.companyName,
        representativeName: data.representativeName,
        businessNumber: data.businessNumber || undefined,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || undefined,
        address: data.address,
        addressDetail: data.addressDetail || undefined,
        serviceAreas: data.serviceAreas,
        workRegions: data.workRegions,
        introduction: data.introduction || undefined,
        experience: data.experience || undefined,
        remarks: data.remarks || undefined,
      });

      if (response.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "등록 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 등록 완료 화면
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-secondary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                파트너 등록 신청이 완료되었습니다
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                등록하신 정보를 검토 후
                <br />
                빠른 시일 내에 연락드리겠습니다.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full h-12 font-semibold">
                  <Link href={ROUTES.HOME}>홈으로 돌아가기</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full h-12 font-semibold"
                >
                  <a href={`tel:${COMPANY_INFO.phone}`}>
                    <Phone className="mr-2 h-5 w-5" />
                    전화 문의하기
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* 헤더 */}
        <div className="mb-10">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center text-gray-600 hover:text-secondary mb-4 transition-colors text-base"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            홈으로
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            파트너 등록
          </h1>
          <p className="text-lg text-gray-600">
            전방 홈케어의 협력 파트너로 등록해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 기본 정보 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Building2 className="h-6 w-6 mr-3 text-secondary" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="companyName" className="text-base font-medium">회사/상호명 *</Label>
                  <Input
                    id="companyName"
                    placeholder="예: 양평조경"
                    className="mt-2 h-12 text-base"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="representativeName" className="text-base font-medium">대표자명 *</Label>
                  <Input
                    id="representativeName"
                    placeholder="홍길동"
                    className="mt-2 h-12 text-base"
                    {...register("representativeName")}
                  />
                  {errors.representativeName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.representativeName.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="businessNumber" className="text-base font-medium">사업자등록번호 (선택)</Label>
                <Input
                  id="businessNumber"
                  placeholder="123-45-67890"
                  className="mt-2 h-12 text-base md:max-w-md"
                  {...register("businessNumber")}
                />
                {errors.businessNumber && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.businessNumber.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 연락처 정보 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-3 text-secondary" />
                연락처 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="contactPhone" className="text-base font-medium">연락처 *</Label>
                  <PhoneInput
                    id="contactPhone"
                    placeholder="010-1234-5678"
                    className="mt-2 h-12 text-base"
                    value={watch("contactPhone") || ""}
                    onChange={(value) =>
                      setValue("contactPhone", value, { shouldValidate: true })
                    }
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.contactPhone.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactEmail" className="text-base font-medium">이메일 (선택)</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="example@email.com"
                      className="pl-10 h-12 text-base"
                      {...register("contactEmail")}
                    />
                  </div>
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주소 정보 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="h-6 w-6 mr-3 text-secondary" />
                사업장 주소
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-base font-medium">주소 *</Label>
                <DaumPostcode
                  value={watch("address") || ""}
                  onChange={(address) =>
                    setValue("address", address, { shouldValidate: true })
                  }
                  placeholder="클릭하여 주소 검색"
                  className="mt-2 h-12 text-base"
                  error={errors.address?.message}
                />
              </div>
              <div>
                <Label htmlFor="addressDetail" className="text-base font-medium">상세 주소</Label>
                <Input
                  id="addressDetail"
                  placeholder="상세 주소 (동, 호수 등)"
                  className="mt-2 h-12 text-base"
                  {...register("addressDetail")}
                />
              </div>
            </CardContent>
          </Card>

          {/* 서비스 분야 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Briefcase className="h-6 w-6 mr-3 text-secondary" />
                서비스 분야
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceSelector
                constantCategories={SERVICE_CATEGORIES}
                selectedServices={serviceAreas}
                onServiceToggle={handleServiceToggle}
                variant="secondary"
              />
              {errors.serviceAreas && (
                <p className="text-base text-red-500 mt-4">
                  {errors.serviceAreas.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 활동 지역 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="h-6 w-6 mr-3 text-secondary" />
                활동 지역
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-gray-600">
                활동 가능한 지역을 선택해주세요 (시/도 → 시/군/구, 복수 선택 가능)
              </p>
              <RegionSelector
                value={workRegions as SelectedRegion[]}
                onChange={handleRegionChange}
                placeholder="활동 지역을 선택하세요"
                error={errors.workRegions?.message}
              />
            </CardContent>
          </Card>

          {/* 소개 및 경력 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-secondary" />
                소개 및 경력
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="introduction" className="text-base font-medium">회사/본인 소개 (선택)</Label>
                <Textarea
                  id="introduction"
                  placeholder="간단한 회사 또는 본인 소개를 입력해주세요"
                  className="mt-2 text-base"
                  rows={3}
                  {...register("introduction")}
                />
                {errors.introduction && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.introduction.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="experience" className="text-base font-medium">경력 및 자격 (선택)</Label>
                <Textarea
                  id="experience"
                  placeholder="보유 자격증, 경력 사항 등을 입력해주세요"
                  className="mt-2 text-base"
                  rows={3}
                  {...register("experience")}
                />
                {errors.experience && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.experience.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="remarks" className="text-base font-medium">비고 (선택)</Label>
                <Textarea
                  id="remarks"
                  placeholder="기타 전달 사항이나 특이사항이 있으면 입력해주세요"
                  className="mt-2 text-base"
                  rows={3}
                  {...register("remarks")}
                />
                {errors.remarks && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.remarks.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 약관 동의 */}
          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start space-x-4">
                <Checkbox
                  id="agreePrivacy"
                  className="w-6 h-6 mt-0.5"
                  checked={watch("agreePrivacy") || false}
                  onCheckedChange={(checked) =>
                    setValue("agreePrivacy", checked === true, {
                      shouldValidate: true,
                    })
                  }
                />
                <div className="grid gap-2 leading-none">
                  <label
                    htmlFor="agreePrivacy"
                    className="text-base font-medium leading-relaxed cursor-pointer"
                  >
                    개인정보 수집 및 이용에 동의합니다 *
                  </label>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    파트너 등록 및 관리를 위해 회사명, 대표자명, 연락처 등을
                    수집합니다.
                  </p>
                </div>
              </div>
              {errors.agreePrivacy && (
                <p className="text-sm text-red-500">
                  {errors.agreePrivacy.message}
                </p>
              )}

              <div className="flex items-start space-x-4">
                <Checkbox
                  id="agreeTerms"
                  className="w-6 h-6 mt-0.5"
                  checked={watch("agreeTerms") || false}
                  onCheckedChange={(checked) =>
                    setValue("agreeTerms", checked === true, {
                      shouldValidate: true,
                    })
                  }
                />
                <div className="grid gap-2 leading-none">
                  <label
                    htmlFor="agreeTerms"
                    className="text-base font-medium leading-relaxed cursor-pointer"
                  >
                    서비스 이용약관에 동의합니다 *
                  </label>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    전방 홈케어 파트너 서비스 이용약관에 동의합니다.
                  </p>
                </div>
              </div>
              {errors.agreeTerms && (
                <p className="text-sm text-red-500">
                  {errors.agreeTerms.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-16 text-lg font-bold bg-secondary hover:bg-secondary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  등록 중...
                </>
              ) : (
                "파트너 등록 신청"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="sm:w-auto h-16 text-lg font-semibold px-8"
              asChild
            >
              <a href={`tel:${COMPANY_INFO.phone}`}>
                <Phone className="mr-2 h-6 w-6" />
                전화 문의
              </a>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
