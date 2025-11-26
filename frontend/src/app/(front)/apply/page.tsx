"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  CheckCircle2,
  Upload,
  X,
  Phone,
  MapPin,
  User,
  FileText,
  ArrowLeft,
  Loader2,
  Briefcase,
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
  applicationSchema,
  applicationDefaultValues,
  type ApplicationFormData,
} from "@/lib/validations/application";
import { ROUTES, COMPANY_INFO } from "@/lib/constants";
import { createApplication } from "@/lib/api/applications";
import { compressImages } from "@/lib/utils/image";
import { getServices, type ServicesListResponse } from "@/lib/api/services";
import { ServiceSelector } from "@/components/forms/ServiceSelector";

export default function ApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [services, setServices] = useState<ServicesListResponse | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);

  // 서비스 목록 API에서 가져오기
  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: applicationDefaultValues,
  });

  const selectedServices = watch("selectedServices") || [];

  const handleServiceToggle = (service: string) => {
    const current = selectedServices;
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    setValue("selectedServices", updated, { shouldValidate: true });
  };

  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsCompressing(true);

    try {
      const fileArray = Array.from(files);
      const currentPhotos = watch("photos") || [];

      // 이미지 압축 (클라이언트 측 1차 압축)
      const compressedFiles = await compressImages(fileArray);

      // 최대 5장 제한
      const combined = [...currentPhotos, ...compressedFiles].slice(0, 5);
      setValue("photos", combined);

      // 미리보기 생성
      const newPreviews = combined.map((file) => URL.createObjectURL(file));
      setPreviewImages(newPreviews);
    } catch (error) {
      console.error("Image compression error:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    const currentPhotos = watch("photos") || [];
    const updated = currentPhotos.filter((_, i) => i !== index);
    setValue("photos", updated);

    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);

    try {
      const response = await createApplication(
        {
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          address: data.address,
          address_detail: data.addressDetail,
          selected_services: data.selectedServices,
          description: data.description,
        },
        data.photos
      );

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
          : "신청 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 신청 완료 화면
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                서비스 신청이 완료되었습니다
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                입력하신 연락처로 빠른 시일 내에
                <br />
                담당자가 연락드리겠습니다.
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
            className="inline-flex items-center text-gray-600 hover:text-primary mb-4 transition-colors text-base"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            홈으로
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            서비스 신청
          </h1>
          <p className="text-lg text-gray-600">
            필요한 서비스를 선택하고 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* 서비스 선택 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Briefcase className="h-6 w-6 mr-3 text-primary" />
                서비스 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceSelector
                categories={services?.categories || []}
                selectedServices={selectedServices}
                onServiceToggle={handleServiceToggle}
                isLoading={servicesLoading}
                error={
                  !services && !servicesLoading
                    ? "서비스 목록을 불러올 수 없습니다."
                    : undefined
                }
                variant="primary"
              />
              {errors.selectedServices && (
                <p className="text-base text-red-500 mt-4">
                  {errors.selectedServices.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 고객 정보 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-3 text-primary" />
                고객 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label
                    htmlFor="customerName"
                    className="text-base font-medium"
                  >
                    이름 *
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="홍길동"
                    className="mt-2 h-12 text-base"
                    {...register("customerName")}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="customerPhone"
                    className="text-base font-medium"
                  >
                    연락처 *
                  </Label>
                  <PhoneInput
                    id="customerPhone"
                    placeholder="010-1234-5678"
                    className="mt-2 h-12 text-base"
                    value={watch("customerPhone") || ""}
                    onChange={(value) =>
                      setValue("customerPhone", value, { shouldValidate: true })
                    }
                  />
                  {errors.customerPhone && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.customerPhone.message}
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
                <MapPin className="h-6 w-6 mr-3 text-primary" />
                현장 주소
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
                <Label
                  htmlFor="addressDetail"
                  className="text-base font-medium"
                >
                  상세 주소
                </Label>
                <Input
                  id="addressDetail"
                  placeholder="상세 주소 (동, 호수 등)"
                  className="mt-2 h-12 text-base"
                  {...register("addressDetail")}
                />
              </div>
            </CardContent>
          </Card>

          {/* 상세 내용 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-primary" />
                상세 내용
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  요청 사항 *
                </Label>
                <Textarea
                  id="description"
                  placeholder="필요한 작업 내용을 자세히 설명해주세요. (예: 마당 잔디 제초 필요, 약 100평 규모)"
                  className="mt-2 text-base"
                  rows={5}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* 사진 첨부 */}
              <div>
                <Label className="text-base font-medium">
                  사진 첨부 (선택, 최대 5장)
                </Label>
                <div className="mt-3 space-y-4">
                  {/* 미리보기 */}
                  {previewImages.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {previewImages.map((src, index) => (
                        <div key={index} className="relative group">
                          <button
                            type="button"
                            onClick={() => openLightbox(index)}
                            className="block"
                          >
                            <img
                              src={src}
                              alt={`첨부 이미지 ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 업로드 버튼 */}
                  {previewImages.length < 5 && (
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                        isCompressing
                          ? "cursor-wait bg-gray-50"
                          : "cursor-pointer hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isCompressing ? (
                          <>
                            <Loader2 className="w-8 h-8 mb-2 text-primary animate-spin" />
                            <p className="text-sm text-gray-500">
                              이미지 최적화 중...
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              클릭하여 사진 업로드
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PNG, JPG (자동 최적화)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={isCompressing}
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 동의 */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
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
                    서비스 제공을 위해 이름, 연락처, 주소를 수집하며, 서비스
                    완료 후 3년간 보관됩니다.
                  </p>
                </div>
              </div>
              {errors.agreePrivacy && (
                <p className="text-sm text-red-500 mt-3">
                  {errors.agreePrivacy.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-16 text-lg font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  신청 중...
                </>
              ) : (
                "견적 요청하기"
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

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={previewImages.map((src) => ({ src }))}
      />
    </div>
  );
}
