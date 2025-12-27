"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Wrench,
  ImageIcon,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";

// 배정 상태 라벨
const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  pending: "배정 대기",
  notified: "알림 발송됨",
  accepted: "수락됨",
  scheduled: "일정 확정",
  in_progress: "작업 중",
  completed: "완료",
  cancelled: "취소됨",
};

// 배정 상태 색상
const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  notified: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  scheduled: "bg-purple-100 text-purple-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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

// 서비스 코드 → 한글 명칭 (간단한 fallback)
const SERVICE_NAMES: Record<string, string> = {
  WEEDING: "제초 작업",
  LANDSCAPING_MGMT: "조경 관리",
  TREE_PRUNING: "수목 전지",
  GARDEN_WORK: "정원 공사",
  YARD_WORK: "마당 공사",
  DECK_WORK: "데크 공사",
  FENCE_WALL: "펜스/담장",
  CLEANING_EXTERIOR: "외부 청소",
  CLEANING_INTERIOR: "내부 청소",
  PAINT_EXTERIOR: "페인트(외부)",
  PAINT_INTERIOR: "페인트(내부)",
  PLUMBING_LEAK: "배관/누수",
  WIRING_LIGHTING: "배선/조명",
  BATHROOM_PARTIAL: "욕실 부분 수리",
  BATHROOM_FULL: "욕실 전체 수리",
  OTHERS: "기타 작업",
};

function getServiceName(code: string): string {
  return SERVICE_NAMES[code] || code;
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

export default function PartnerViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PartnerViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchApi<PartnerViewData>(`/partner-portal/view/${token}`);
        setData(result);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch partner view data:", err);
        if (err && typeof err === "object" && "status" in err) {
          const apiError = err as { status?: number; message?: string };
          if (apiError.status === 404) {
            setError("유효하지 않거나 만료된 링크입니다.");
          } else {
            setError(apiError.message || "정보를 불러오는 중 오류가 발생했습니다.");
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

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-xl font-semibold text-red-800">접근 불가</h2>
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-gray-500">
                문의사항이 있으시면 전방홈케어로 연락해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">배정 정보</h1>
        <p className="text-gray-500">신청번호: {data.application_number}</p>
      </div>

      {/* 배정 상태 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">배정 상태</span>
            <Badge className={ASSIGNMENT_STATUS_COLORS[data.assignment_status] || "bg-gray-100"}>
              {ASSIGNMENT_STATUS_LABELS[data.assignment_status] || data.assignment_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 담당 서비스 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            담당 서비스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.assigned_services.map((service) => (
              <Badge key={service} variant="secondary" className="text-sm">
                {getServiceName(service)}
              </Badge>
            ))}
          </div>
          {data.assigned_services.length < data.selected_services.length && (
            <p className="text-sm text-gray-500 mt-3">
              * 전체 신청 서비스 중 귀하에게 배정된 서비스만 표시됩니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 일정 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            일정 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.scheduled_date ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">
                  {formatDate(data.scheduled_date)}
                  {data.scheduled_time && ` ${data.scheduled_time}`}
                </p>
                <p className="text-sm text-gray-500">확정된 일정</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500">일정이 아직 확정되지 않았습니다.</p>
              {data.preferred_consultation_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>희망 상담일: {formatDate(data.preferred_consultation_date)}</span>
                </div>
              )}
              {data.preferred_work_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>희망 작업일: {formatDate(data.preferred_work_date)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고객 정보 (마스킹) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            고객 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>{data.customer_name_masked}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{data.address_partial}</span>
          </div>
          <p className="text-xs text-gray-400">
            * 상세 연락처 및 주소는 배정 수락 후 안내됩니다.
          </p>
        </CardContent>
      </Card>

      {/* 요청 사항 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            요청 사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
        </CardContent>
      </Card>

      {/* 견적 정보 */}
      {(data.estimated_cost || data.estimate_note) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">견적 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.estimated_cost && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">견적 금액</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(data.estimated_cost)}
                </span>
              </div>
            )}
            {data.estimate_note && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-500 mb-1">견적 메모</p>
                <p className="text-gray-700 whitespace-pre-wrap">{data.estimate_note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 배정 메모 */}
      {data.note && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">배정 메모</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{data.note}</p>
          </CardContent>
        </Card>
      )}

      {/* 첨부 사진 */}
      {data.photos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              첨부 사진 ({data.photos.length}장)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {data.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div
                    className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedPhoto(photo.url)}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.filename}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  </div>
                  <a
                    href={photo.url}
                    download={photo.filename}
                    className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4 text-gray-600" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사진 확대 모달 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Image
              src={selectedPhoto}
              alt="확대 이미지"
              width={1200}
              height={800}
              className="object-contain w-full h-full"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedPhoto(null)}
            >
              닫기
            </Button>
          </div>
        </div>
      )}

      {/* 링크 만료 안내 */}
      <div className="text-center text-sm text-gray-400">
        <p>
          이 링크는 {formatDate(data.token_expires_at)}까지 유효합니다.
        </p>
        <p>신청일: {formatDate(data.created_at)}</p>
      </div>
    </div>
  );
}
