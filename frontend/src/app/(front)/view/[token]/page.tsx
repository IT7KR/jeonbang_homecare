"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { getServiceName } from "@/lib/utils/service";
import { PartnerPhotoUpload } from "@/components/features/partner-portal";

// 배정 상태 설정
const ASSIGNMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  pending: { label: "배정 대기", color: "text-gray-600", bgColor: "bg-gray-100" },
  notified: { label: "알림 발송됨", color: "text-blue-600", bgColor: "bg-blue-50" },
  accepted: { label: "수락됨", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  scheduled: { label: "일정 확정", color: "text-purple-600", bgColor: "bg-purple-50" },
  in_progress: { label: "작업 중", color: "text-orange-600", bgColor: "bg-orange-50" },
  completed: { label: "완료", color: "text-green-600", bgColor: "bg-green-50" },
  cancelled: { label: "취소됨", color: "text-red-600", bgColor: "bg-red-50" },
};

interface PartnerViewPhoto {
  url: string;
  filename: string;
}

interface PartnerViewData {
  assignment_id: number;
  assignment_status: string;
  assigned_services: string[];
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_cost: number | null;
  estimate_note: string | null;
  note: string | null;
  application_number: string;
  customer_name_masked: string;
  address_partial: string;
  selected_services: string[];
  description: string;
  preferred_consultation_date: string | null;
  preferred_work_date: string | null;
  photos: PartnerViewPhoto[];
  created_at: string;
  token_expires_at: string;
}

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

export default function PartnerViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PartnerViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchApi<PartnerViewData>(
        `/partner-portal/view/${token}`
      );
      setData(result);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch partner view data:", err);
      if (err && typeof err === "object" && "status" in err) {
        const apiError = err as { status?: number; message?: string };
        if (apiError.status === 404) {
          setError("유효하지 않거나 만료된 링크입니다.");
        } else {
          setError(
            apiError.message || "정보를 불러오는 중 오류가 발생했습니다."
          );
        }
      } else {
        setError("정보를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

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
                  href="tel:031-XXX-XXXX"
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

  const statusConfig =
    ASSIGNMENT_STATUS_CONFIG[data.assignment_status] ||
    ASSIGNMENT_STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 to-white">
      {/* 헤더 영역 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <div className="text-center space-y-1">
            <p className="text-primary-100 text-sm font-medium">전방홈케어</p>
            <h1 className="text-2xl font-bold">배정 정보</h1>
            <p className="text-primary-200 text-sm">#{data.application_number}</p>
          </div>
        </div>
      </div>

      {/* 상태 카드 */}
      <div className="container max-w-lg mx-auto px-4 -mt-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm font-medium">현재 상태</span>
              <Badge
                className={`${statusConfig.bgColor} ${statusConfig.color} border-0 px-3 py-1 text-sm font-medium`}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* 담당 서비스 - 강조 표시 */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5" />
              <h3 className="font-semibold">담당 서비스</h3>
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
            {data.assigned_services.length < data.selected_services.length && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                전체 신청 서비스 중 귀하에게 배정된 서비스만 표시됩니다
              </p>
            )}
          </CardContent>
        </Card>

        {/* 일정 정보 */}
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
            {data.scheduled_date ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(data.scheduled_date)}
                    {data.scheduled_time && (
                      <span className="text-green-600 ml-2">
                        {data.scheduled_time}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-green-600 font-medium">확정된 일정</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">
                    일정이 아직 확정되지 않았습니다
                  </p>
                </div>
                {(data.preferred_consultation_date ||
                  data.preferred_work_date) && (
                  <div className="grid gap-2">
                    {data.preferred_consultation_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50/50 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-400">희망 상담일</span>
                        <span className="ml-auto font-medium">
                          {formatShortDate(data.preferred_consultation_date)}
                        </span>
                      </div>
                    )}
                    {data.preferred_work_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50/50 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-400">희망 작업일</span>
                        <span className="ml-auto font-medium">
                          {formatShortDate(data.preferred_work_date)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 고객 정보 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
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
            <p className="text-xs text-gray-400 pl-1">
              * 상세 연락처 및 주소는 별도로 안내됩니다
            </p>
          </CardContent>
        </Card>

        {/* 요청 사항 */}
        {data.description && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                요청 사항
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {data.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 견적 정보 */}
        {(data.estimated_cost || data.estimate_note) && (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3">
              <h3 className="font-semibold text-white">견적 정보</h3>
            </div>
            <CardContent className="py-4 space-y-3">
              {data.estimated_cost && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="text-gray-600 font-medium">견적 금액</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(data.estimated_cost)}
                  </span>
                </div>
              )}
              {data.estimate_note && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400 mb-2">견적 메모</p>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {data.estimate_note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 시공 사진 업로드 - 업로드 가능한 상태에서만 표시 */}
        {["accepted", "scheduled", "in_progress"].includes(data.assignment_status) && (
          <PartnerPhotoUpload token={token} onUploadComplete={() => loadData()} />
        )}

        {/* 배정 메모 */}
        {data.note && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-700">배정 메모</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">
                  {data.note}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 첨부 사진 */}
        {data.photos.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-pink-600" />
                </div>
                첨부 사진
                <span className="text-xs font-normal text-gray-400 ml-1">
                  {data.photos.length}장
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {data.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={photo.url}
                      alt={`사진 ${index + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 33vw, 150px"
                    />
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                사진을 탭하면 크게 볼 수 있습니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* 링크 만료 안내 */}
        <div className="text-center py-4 space-y-1">
          <p className="text-sm text-gray-400">
            이 링크는{" "}
            <span className="font-medium text-gray-500">
              {formatDate(data.token_expires_at)}
            </span>
            까지 유효합니다
          </p>
          <p className="text-xs text-gray-300">
            신청일: {formatDate(data.created_at)}
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {data.photos.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={data.photos.map((photo) => ({
            src: photo.url,
          }))}
        />
      )}
    </div>
  );
}
