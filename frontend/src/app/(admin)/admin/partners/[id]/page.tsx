"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  FileText,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import {
  getPartner,
  updatePartner,
  approvePartner,
  PartnerDetail,
} from "@/lib/api/admin";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "대기중",
  approved: "승인됨",
  rejected: "거절됨",
  inactive: "비활성",
};

export default function PartnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { getValidToken } = useAuthStore();

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [adminMemo, setAdminMemo] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadPartner();
  }, [id]);

  const loadPartner = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const data = await getPartner(token, id);
      setPartner(data);
      setAdminMemo(data.admin_memo || "");
      setRejectionReason(data.rejection_reason || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const updated = await updatePartner(token, id, {
        admin_memo: adminMemo || undefined,
      });
      setPartner(updated);
      setSuccessMessage("저장되었습니다");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason.trim()) {
      setError("거절 사유를 입력해주세요");
      return;
    }

    try {
      setIsApproving(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const updated = await approvePartner(
        token,
        id,
        action,
        action === "reject" ? rejectionReason : undefined
      );
      setPartner(updated);
      setSuccessMessage(action === "approve" ? "승인되었습니다" : "거절되었습니다");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다");
    } finally {
      setIsApproving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/partners"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          목록으로
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/partners"
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {partner.company_name}
            </h1>
            <p className="text-gray-600">
              등록일: {formatDate(partner.created_at)}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1.5 text-sm font-medium rounded-full ${
            STATUS_COLORS[partner.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {STATUS_LABELS[partner.status] || partner.status}
        </span>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Partner Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building size={20} className="mr-2" />
              기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">회사/상호명</p>
                  <p className="font-medium">{partner.company_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">대표자명</p>
                  <p className="font-medium">{partner.representative_name}</p>
                </div>
              </div>
              {partner.business_number && (
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">사업자등록번호</p>
                    <p className="font-medium">{partner.business_number}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone size={20} className="mr-2" />
              연락처 정보
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">연락처</p>
                  <a
                    href={`tel:${partner.contact_phone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {formatPhone(partner.contact_phone)}
                  </a>
                </div>
              </div>
              {partner.contact_email && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">이메일</p>
                    <a
                      href={`mailto:${partner.contact_email}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {partner.contact_email}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">주소</p>
                  <p className="font-medium">{partner.address}</p>
                  {partner.address_detail && (
                    <p className="text-gray-600">{partner.address_detail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText size={20} className="mr-2" />
              서비스 정보
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">제공 서비스</p>
                <div className="flex flex-wrap gap-2">
                  {partner.service_areas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">활동 지역</p>
                <div className="flex flex-wrap gap-2">
                  {partner.work_regions.map((region, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {region.provinceName}{" "}
                      {region.isAllDistricts
                        ? "전체"
                        : region.districtNames.join(", ")}
                    </span>
                  ))}
                </div>
              </div>
              {partner.introduction && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">소개</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {partner.introduction}
                  </p>
                </div>
              )}
              {partner.experience && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">경력 및 자격</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {partner.experience}
                  </p>
                </div>
              )}
              {partner.remarks && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">비고</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {partner.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Management */}
        <div className="space-y-6">
          {/* Approval (only for pending) */}
          {partner.status === "pending" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                승인 처리
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거절 사유 (거절 시 필수)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="거절 사유를 입력하세요"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove("reject")}
                    disabled={isApproving}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle size={18} className="mr-2" />
                    거절
                  </button>
                  <button
                    onClick={() => handleApprove("approve")}
                    disabled={isApproving}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    승인
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {partner.status === "rejected" && partner.rejection_reason && (
            <div className="bg-red-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                거절 사유
              </h2>
              <p className="text-red-700">{partner.rejection_reason}</p>
            </div>
          )}

          {/* Approval Info (if approved) */}
          {partner.status === "approved" && partner.approved_at && (
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                승인 정보
              </h2>
              <p className="text-green-700">
                승인일: {formatDate(partner.approved_at)}
              </p>
            </div>
          )}

          {/* Admin Memo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              관리자 메모
            </h2>
            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              rows={4}
              placeholder="메모를 입력하세요"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                저장 중...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                저장하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
