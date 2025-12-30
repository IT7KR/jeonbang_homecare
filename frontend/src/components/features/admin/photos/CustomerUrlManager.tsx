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
  MessageSquare,
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
  getCustomerUrl,
  createCustomerUrl,
  extendCustomerUrl,
  renewCustomerUrl,
  revokeCustomerUrl,
} from "@/lib/api/admin/work-photos";
import { sendSMS } from "@/lib/api/admin/sms";
import { useAuthStore } from "@/lib/stores/auth";
import type { CustomerUrlResponse } from "@/lib/api/admin/types";

interface CustomerUrlManagerProps {
  applicationId: number;
  assignmentId: number;
  customerName?: string;
  customerPhone?: string;
  className?: string;
}

export function CustomerUrlManager({
  applicationId,
  assignmentId,
  customerName,
  customerPhone,
  className,
}: CustomerUrlManagerProps) {
  const { getValidToken } = useAuthStore();
  const [urlData, setUrlData] = useState<CustomerUrlResponse | null>(null);
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
      const data = await getCustomerUrl(applicationId, assignmentId);
      setUrlData(data);
    } catch (error) {
      console.error("Failed to fetch customer URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!urlData?.url) return;
    try {
      await navigator.clipboard.writeText(urlData.url);
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
      const data = await createCustomerUrl(applicationId, assignmentId, {
        expires_in_days: createDays,
      });
      setUrlData(data);
      setShowCreateDialog(false);
      toast.success("고객 열람 URL이 발급되었습니다");
    } catch (error) {
      toast.error("URL 발급에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async () => {
    setIsProcessing(true);
    try {
      const data = await renewCustomerUrl(applicationId, assignmentId, {
        expires_in_days: createDays,
      });
      setUrlData(data);
      setShowCreateDialog(false);
      toast.success("새 URL이 발급되었습니다");
    } catch (error) {
      toast.error("URL 재발급에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtend = async () => {
    setIsProcessing(true);
    try {
      const data = await extendCustomerUrl(applicationId, assignmentId, {
        additional_days: extendDays,
      });
      setUrlData(data);
      setShowExtendDialog(false);
      toast.success(`유효기간이 ${extendDays}일 연장되었습니다`);
    } catch (error) {
      toast.error("유효기간 연장에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    setIsProcessing(true);
    try {
      const data = await revokeCustomerUrl(applicationId, assignmentId);
      setUrlData(data);
      setShowRevokeConfirm(false);
      toast.success("URL이 만료 처리되었습니다");
    } catch (error) {
      toast.error("URL 만료 처리에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendSMS = async () => {
    if (!urlData?.url || !customerPhone) {
      toast.error("고객 연락처 또는 URL 정보가 없습니다");
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
        customerName || "고객"
      }님, 시공 결과를 확인하실 수 있습니다.\n\n확인 URL: ${
        urlData.url
      }\n\n문의: 1551-6640`;

      const result = await sendSMS(token, {
        receiver_phone: customerPhone,
        message,
        sms_type: "customer_result_url",
      });

      if (result.success) {
        toast.success("시공 결과 URL이 SMS로 발송되었습니다");
      } else {
        toast.error(result.message || "SMS 발송에 실패했습니다");
      }
    } catch (error) {
      toast.error("SMS 발송에 실패했습니다");
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

  const isExpired = urlData?.expires_at
    ? isPast(parseISO(urlData.expires_at))
    : false;
  const hasValidUrl = urlData?.is_valid && urlData?.url && !isExpired;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          고객 열람 URL
        </h4>
        {hasValidUrl && (
          <div className="flex items-center gap-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">
              {formatDistanceToNow(parseISO(urlData.expires_at!), {
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
                value={urlData.url || ""}
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
              onClick={() => window.open(urlData.url!, "_blank")}
              title="새 탭에서 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Expiry info */}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            만료일:{" "}
            {format(parseISO(urlData.expires_at!), "yyyy년 M월 d일 HH:mm", {
              locale: ko,
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {customerPhone && (
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
                SMS 전송
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
              {hasValidUrl ? "고객 열람 URL 재발급" : "고객 열람 URL 발급"}
            </DialogTitle>
            <DialogDescription>
              {hasValidUrl
                ? "기존 URL을 무효화하고 새 URL을 발급합니다."
                : "고객에게 시공 정보를 공유할 수 있는 URL을 발급합니다."}
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
              이 URL을 만료 처리하시겠습니까? 고객은 더 이상 이 링크로 접근할 수
              없게 됩니다.
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
