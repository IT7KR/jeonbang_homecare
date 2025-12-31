"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Link2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Plus,
  Ban,
  CalendarPlus,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  generateAssignmentURL,
  renewAssignmentURL,
  extendAssignmentURL,
  revokeAssignmentURL,
  getAssignmentURL,
} from "@/lib/api/admin/applications";
import { sendSMS } from "@/lib/api/admin/sms";
import { useAuthStore } from "@/lib/stores/auth";
import type { URLInfo } from "@/lib/api/admin/applications";

interface PartnerUrlManagerProps {
  applicationId: number;
  assignmentId: number;
  partnerName?: string;
  partnerPhone?: string;
  className?: string;
  onUrlChange?: () => void;
}

export function PartnerUrlManager({
  applicationId,
  assignmentId,
  partnerName,
  partnerPhone,
  className,
  onUrlChange,
}: PartnerUrlManagerProps) {
  const { getValidToken } = useAuthStore();
  const [urlData, setUrlData] = useState<URLInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // Form states
  const [createDays, setCreateDays] = useState(7);
  const [extendDays, setExtendDays] = useState(7);

  useEffect(() => {
    fetchUrlData();
  }, [applicationId, assignmentId]);

  const fetchUrlData = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await getAssignmentURL(token, applicationId, assignmentId);
      setUrlData(data);
    } catch (error) {
      console.error("Failed to fetch partner URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!urlData?.view_url) return;
    try {
      await navigator.clipboard.writeText(urlData.view_url);
      setCopied(true);
      toast.success("URL이 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("URL 복사에 실패했습니다");
    }
  };

  const handleCreate = async () => {
    setIsProcessing(true);
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await generateAssignmentURL(
        token,
        applicationId,
        assignmentId,
        {
          expires_in_days: createDays,
        }
      );
      setUrlData(data);
      setShowCreateDialog(false);
      toast.success("협력사 포털 URL이 발급되었습니다");
      onUrlChange?.();
    } catch (error) {
      toast.error("URL 발급에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async () => {
    setIsProcessing(true);
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await renewAssignmentURL(
        token,
        applicationId,
        assignmentId,
        {
          expires_in_days: createDays,
        }
      );
      setUrlData(data);
      setShowCreateDialog(false);
      toast.success("새 URL이 발급되었습니다");
      onUrlChange?.();
    } catch (error) {
      toast.error("URL 재발급에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtend = async () => {
    setIsProcessing(true);
    try {
      const token = await getValidToken();
      if (!token) return;

      const data = await extendAssignmentURL(
        token,
        applicationId,
        assignmentId,
        {
          additional_days: extendDays,
        }
      );
      setUrlData(data);
      setShowExtendDialog(false);
      toast.success(`유효기간이 ${extendDays}일 연장되었습니다`);
      onUrlChange?.();
    } catch (error) {
      toast.error("유효기간 연장에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    setIsProcessing(true);
    try {
      const token = await getValidToken();
      if (!token) return;

      await revokeAssignmentURL(token, applicationId, assignmentId);
      // URL이 만료되면 데이터 다시 조회
      await fetchUrlData();
      setShowRevokeConfirm(false);
      toast.success("URL이 만료 처리되었습니다");
      onUrlChange?.();
    } catch (error) {
      toast.error("URL 만료 처리에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendSMS = async () => {
    if (!urlData?.view_url || !partnerPhone) {
      toast.error("협력사 연락처 또는 URL 정보가 없습니다");
      return;
    }

    setIsSendingSMS(true);
    try {
      const token = await getValidToken();
      if (!token) {
        toast.error("인증 정보가 없습니다");
        return;
      }

      const message = `[전방홈케어] ${
        partnerName || "협력사"
      }님, 배정된 작업을 확인하실 수 있습니다.\n\n포털 URL: ${
        urlData.view_url
      }\n\n문의: 1551-6640`;

      const result = await sendSMS(token, {
        receiver_phone: partnerPhone,
        message,
        sms_type: "partner_portal_url",
      });

      if (result.success) {
        toast.success("협력사 포털 URL이 SMS로 발송되었습니다");
      } else {
        toast.error(result.message || "문자 발송에 실패했습니다");
      }
    } catch (error) {
      toast.error("문자 발송에 실패했습니다");
    } finally {
      setIsSendingSMS(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const isExpired =
    urlData?.is_expired ||
    (urlData?.expires_at ? isPast(parseISO(urlData.expires_at)) : false);
  const hasValidUrl = urlData?.is_issued && urlData?.view_url && !isExpired;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          협력사 포털 URL
        </h4>
        {hasValidUrl && urlData?.expires_at && (
          <div className="flex items-center gap-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">
              {formatDistanceToNow(parseISO(urlData.expires_at), {
                addSuffix: true,
                locale: ko,
              })}
              까지 유효
            </span>
          </div>
        )}
      </div>

      {hasValidUrl ? (
        <div className="space-y-3">
          {/* URL Display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={urlData.view_url || ""}
                readOnly
                className="pr-10 text-sm font-mono bg-gray-50"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(urlData.view_url!, "_blank")}
              title="새 탭에서 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Expiry info */}
          {urlData.expires_at && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              만료일:{" "}
              {format(parseISO(urlData.expires_at), "yyyy년 M월 d일 HH:mm", {
                locale: ko,
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {partnerPhone && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSendSMS}
                disabled={isSendingSMS}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSendingSMS ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                문자 발송
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExtendDialog(true)}
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              기간 연장
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreateDays(7);
                setShowCreateDialog(true);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              재발급
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Ban className="w-4 h-4 mr-1" />
              만료 처리
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
          {isExpired ? (
            <>
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-gray-600 mb-3">URL이 만료되었습니다</p>
            </>
          ) : (
            <>
              <Link2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-600 mb-3">
                발급된 URL이 없습니다
              </p>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreateDays(7);
              setShowCreateDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isExpired ? "새 URL 발급" : "URL 발급"}
          </Button>
        </div>
      )}

      {/* Create/Renew Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasValidUrl ? "협력사 포털 URL 재발급" : "협력사 포털 URL 발급"}
            </DialogTitle>
            <DialogDescription>
              {hasValidUrl
                ? "기존 URL을 무효화하고 새 URL을 발급합니다."
                : "협력사에게 작업 정보를 공유할 수 있는 URL을 발급합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expires-days">유효 기간 (일)</Label>
              <Input
                id="expires-days"
                type="number"
                min={1}
                max={365}
                value={createDays}
                onChange={(e) => setCreateDays(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                최소 1일 ~ 최대 365일 설정 가능
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              onClick={hasValidUrl ? handleRenew : handleCreate}
              disabled={isProcessing || createDays < 1 || createDays > 365}
            >
              {isProcessing && (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              )}
              {hasValidUrl ? "재발급" : "발급"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>유효기간 연장</DialogTitle>
            <DialogDescription>
              현재 만료일로부터 추가로 연장할 기간을 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="extend-days">추가 연장 기간 (일)</Label>
              <Input
                id="extend-days"
                type="number"
                min={1}
                max={365}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
            </div>
            {urlData?.expires_at && (
              <p className="text-sm text-gray-600">
                현재 만료일:{" "}
                {format(parseISO(urlData.expires_at), "yyyy년 M월 d일", {
                  locale: ko,
                })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExtendDialog(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              onClick={handleExtend}
              disabled={isProcessing || extendDays < 1 || extendDays > 365}
            >
              {isProcessing && (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              )}
              연장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirm */}
      <AlertDialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>URL 만료 처리</AlertDialogTitle>
            <AlertDialogDescription>
              이 URL을 만료 처리하시겠습니까? 협력사는 더 이상 이 링크로 접근할
              수 없게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing && (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              )}
              만료 처리
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
