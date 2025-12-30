"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Wrench,
  ImageIcon,
  ZoomIn,
  Phone,
  Download,
  Building2,
  Camera,
  Circle,
} from "lucide-react";
import {
  getCustomerView,
  getQuotePdfUrl,
  type CustomerViewResponse,
  type ProgressStep,
} from "@/lib/api/customer-portal";
import { getServiceName } from "@/lib/utils/service";

// API Base URL for file serving (without /api/v1 suffix since file URLs already include it)
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v1$/, "");

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function ProgressStepper({ steps }: { steps: ProgressStep[] }) {
  return (
    <div className="relative">
      {/* 연결선 */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

      <div className="space-y-4 relative">
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isCancelled = step.status === "cancelled";

          return (
            <div key={index} className="flex items-start gap-4">
              {/* 원형 인디케이터 */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? "bg-green-500"
                    : isCurrent
                    ? "bg-primary ring-4 ring-primary/20"
                    : isCancelled
                    ? "bg-red-500"
                    : "bg-gray-200"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : isCurrent ? (
                  <Circle className="w-4 h-4 text-white fill-white animate-pulse" />
                ) : isCancelled ? (
                  <AlertCircle className="w-5 h-5 text-white" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 pb-2">
                <p
                  className={`font-medium ${
                    isCompleted || isCurrent
                      ? "text-gray-900"
                      : isCancelled
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.step}
                </p>
                {step.date && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<CustomerViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoTab, setPhotoTab] = useState<"before" | "after">("before");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<{ src: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await getCustomerView(token);
        setData(result);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch customer view data:", err);
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as {
            response?: { status?: number; data?: { detail?: string } };
          };
          if (axiosError.response?.status === 404) {
            setError("유효하지 않거나 만료된 링크입니다.");
          } else {
            setError(
              axiosError.response?.data?.detail ||
                "정보를 불러오는 중 오류가 발생했습니다."
            );
          }
        } else {
          setError("정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token]);

  const openLightbox = (photos: { url: string }[], index: number) => {
    setLightboxPhotos(photos.map((p) => ({ src: `${API_BASE_URL}${p.url}` })));
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownloadPdf = () => {
    window.open(getQuotePdfUrl(token), "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container max-w-lg mx-auto py-8 px-4">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">접근 불가</h2>
              <p className="text-gray-600">{error}</p>
              <div className="pt-4 space-y-2 text-sm text-gray-500">
                <p>문의가 필요하시면</p>
                <a
                  href="tel:1551-6640"
                  className="flex items-center justify-center gap-2 text-primary font-medium"
                >
                  <Phone className="h-4 w-4" />
                  전방홈케어 고객센터
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const currentPhotos =
    photoTab === "before" ? data.work_photos_before : data.work_photos_after;
  const hasPhotos =
    data.work_photos_before.length > 0 || data.work_photos_after.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 to-white">
      {/* 헤더 영역 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <div className="text-center space-y-1">
            <p className="text-primary-100 text-sm font-medium">전방홈케어</p>
            <h1 className="text-2xl font-bold">시공 정보</h1>
            <p className="text-primary-200 text-sm">
              #{data.application_number}
            </p>
          </div>
        </div>
      </div>

      {/* 상태 카드 */}
      <div className="container max-w-lg mx-auto px-4 -mt-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm font-medium">
                현재 상태
              </span>
              <Badge className="bg-primary-50 text-primary-700 border-0 px-3 py-1 text-sm font-medium">
                {data.status_label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* 진행 현황 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              진행 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProgressStepper steps={data.progress_steps} />
          </CardContent>
        </Card>

        {/* 서비스 정보 */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5" />
              <h3 className="font-semibold">서비스 정보</h3>
            </div>
          </div>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {data.assigned_services.map((service) => (
                <Badge
                  key={service}
                  variant="outline"
                  className="bg-primary-50 border-primary-200 text-primary-700 px-3 py-1.5 text-sm"
                >
                  {getServiceName(service)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 일정 정보 */}
        {(data.scheduled_date || data.scheduled_time) && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                일정 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(data.scheduled_date!)}
                    {data.scheduled_time && (
                      <span className="text-green-600 ml-2">
                        {data.scheduled_time}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    확정된 일정
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 고객 정보 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <User className="h-4 w-4 text-cyan-600" />
              </div>
              고객 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid gap-2">
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 font-medium">
                  {data.customer_name_masked}
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{data.address_partial}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 협력사 정보 */}
        {data.partner_company && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-amber-600" />
                </div>
                담당 협력사
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2">
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">
                    {data.partner_company}
                  </span>
                </div>
                {data.partner_phone_masked && (
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {data.partner_phone_masked}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 견적 정보 */}
        {data.quote && (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">견적 정보</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownloadPdf}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Download className="h-4 w-4 mr-1" />
                  견적서 다운로드
                </Button>
              </div>
            </div>
            <CardContent className="py-4 space-y-3">
              <div className="text-xs text-gray-500 mb-2">
                견적번호: {data.quote.quote_number}
              </div>

              {/* 견적 항목 */}
              <div className="space-y-2">
                {data.quote.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {item.item_name}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                        {item.unit}
                      </p>
                    </div>
                    <span className="font-medium text-gray-800 whitespace-nowrap ml-4">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* 합계 */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-gray-600 font-medium">합계</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(data.quote.total_amount)}
                </span>
              </div>

              {/* 견적 메모 */}
              {data.quote.estimate_note && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400 mb-2">메모</p>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {data.quote.estimate_note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 시공 사진 */}
        {hasPhotos && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-pink-600" />
                </div>
                시공 사진
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs
                value={photoTab}
                onValueChange={(v: string) =>
                  setPhotoTab(v as "before" | "after")
                }
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="before" className="gap-1">
                    시공 전 ({data.work_photos_before.length})
                  </TabsTrigger>
                  <TabsTrigger value="after" className="gap-1">
                    시공 후 ({data.work_photos_after.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="before">
                  {data.work_photos_before.length > 0 ? (
                    <PhotoGrid
                      photos={data.work_photos_before}
                      onPhotoClick={(index) =>
                        openLightbox(data.work_photos_before, index)
                      }
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">시공 전 사진이 없습니다</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="after">
                  {data.work_photos_after.length > 0 ? (
                    <PhotoGrid
                      photos={data.work_photos_after}
                      onPhotoClick={(index) =>
                        openLightbox(data.work_photos_after, index)
                      }
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">시공 후 사진이 없습니다</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {data.work_photos_uploaded_at && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  사진 업로드: {formatShortDate(data.work_photos_uploaded_at)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 링크 만료 안내 및 문의 정보 */}
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-gray-400">
            이 링크는{" "}
            <span className="font-medium text-gray-500">
              {formatDate(data.token_expires_at)}
            </span>
            까지 유효합니다
          </p>
          <div className="text-sm text-gray-500">{data.contact_info}</div>
          <p className="text-xs text-gray-300">
            신청일: {formatDate(data.created_at)}
          </p>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxPhotos}
      />
    </div>
  );
}

function PhotoGrid({
  photos,
  onPhotoClick,
}: {
  photos: { url: string; filename: string }[];
  onPhotoClick: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
          onClick={() => onPhotoClick(index)}
        >
          <Image
            src={`${API_BASE_URL}${photo.url}`}
            alt={`사진 ${index + 1}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 150px"
            unoptimized
          />
          {/* 호버 오버레이 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
    </div>
  );
}
