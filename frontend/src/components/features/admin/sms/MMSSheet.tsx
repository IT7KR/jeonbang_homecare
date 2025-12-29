"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
  Upload,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { sendMMS, sendWorkPhotosMMS } from "@/lib/api/admin/sms";
import { cn } from "@/lib/utils";
import { ImageUpload, imageFileToBase64 } from "./ImageUpload";
import { WorkPhotoSelector } from "./WorkPhotoSelector";
import { MMSTemplateSelector } from "./MMSTemplateSelector";
import type { ImageFile, SMSSendResponse, WorkPhotosResponse, SMSTemplate } from "@/lib/api/admin/types";

interface MMSSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientPhone: string;
  smsType?: string;
  assignmentId?: number;
  workPhotos?: WorkPhotosResponse | null;
  onComplete?: () => void;
}

type Status = "compose" | "sending" | "success" | "error";
type ImageSource = "work_photos" | "upload";

// 메시지 프리픽스
const MESSAGE_PREFIX = "[전방홈케어] ";

export function MMSSheet({
  open,
  onOpenChange,
  recipientName,
  recipientPhone,
  smsType = "manual",
  assignmentId,
  workPhotos,
  onComplete,
}: MMSSheetProps) {
  const { getValidToken } = useAuthStore();

  const [status, setStatus] = useState<Status>("compose");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedWorkPhotos, setSelectedWorkPhotos] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<ImageSource>(
    workPhotos && (workPhotos.before_photo_urls.length > 0 || workPhotos.after_photo_urls.length > 0)
      ? "work_photos"
      : "upload"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SMSSendResponse | null>(null);

  // Determine if work photos are available
  const hasWorkPhotos = workPhotos && (
    workPhotos.before_photo_urls.length > 0 || workPhotos.after_photo_urls.length > 0
  );

  // Reset image source when work photos availability changes
  useEffect(() => {
    if (hasWorkPhotos) {
      setImageSource("work_photos");
    } else {
      setImageSource("upload");
    }
  }, [hasWorkPhotos]);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear other image source when switching
  const handleImageSourceChange = (source: ImageSource) => {
    setImageSource(source);
    if (source === "work_photos") {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
    } else {
      setSelectedWorkPhotos([]);
    }
  };

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: SMSTemplate | null, templateMessage: string) => {
    setSelectedTemplate(template);
    setMessage(templateMessage);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setError("메시지를 입력해주세요");
      return;
    }

    const hasSelectedImages = imageSource === "work_photos"
      ? selectedWorkPhotos.length > 0
      : images.length > 0;

    try {
      setStatus("sending");
      setError(null);

      const token = await getValidToken();
      if (!token) return;

      // 메시지 앞에 프리픽스 추가
      const formattedMessage = `${MESSAGE_PREFIX}${message}`;

      let response: SMSSendResponse;

      if (imageSource === "work_photos" && selectedWorkPhotos.length > 0 && assignmentId) {
        // 시공 사진 MMS 발송
        response = await sendWorkPhotosMMS(token, {
          receiver_phone: recipientPhone,
          message: formattedMessage,
          assignment_id: assignmentId,
          selected_photos: selectedWorkPhotos,
          sms_type: "work_photo_mms",
        });
      } else {
        // 일반 MMS 발송 (직접 업로드)
        const imagePromises = images.map(imageFileToBase64);
        const base64Images = await Promise.all(imagePromises);

        response = await sendMMS(token, {
          receiver_phone: recipientPhone,
          message: formattedMessage,
          sms_type: smsType,
          image1: base64Images[0],
          image2: base64Images[1],
          image3: base64Images[2],
        });
      }

      setResult(response);
      setStatus(response.success ? "success" : "error");
      if (!response.success) {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "발송에 실패했습니다");
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status === "success") {
      onComplete?.();
    }
    // Cleanup image previews
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    // Reset state
    setStatus("compose");
    setMessage("");
    setSelectedTemplate(null);
    setImages([]);
    setSelectedWorkPhotos([]);
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  // Determine message type indicator (프리픽스 포함)
  const getMessageType = () => {
    const hasImages = imageSource === "work_photos"
      ? selectedWorkPhotos.length > 0
      : images.length > 0;
    if (hasImages) return "MMS";
    const totalLength = MESSAGE_PREFIX.length + message.length;
    if (totalLength > 45) return "LMS";
    return "SMS";
  };

  const messageType = getMessageType();

  // Mask phone number for display
  const maskedPhone = recipientPhone.replace(
    /(\d{3})(\d{3,4})(\d{4})/,
    "$1-****-$3"
  );

  // Get image count for display
  const getImageCount = () => {
    if (imageSource === "work_photos") {
      return selectedWorkPhotos.length;
    }
    return images.length;
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md w-full flex flex-col p-6">
        <SheetHeader className="pb-4 border-b -mx-6 px-6">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            문자 발송
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 py-6 overflow-y-auto -mx-6 px-6">
          {/* Compose */}
          {status === "compose" && (
            <div className="space-y-5">
              {/* Recipient info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">수신자</p>
                <p className="font-medium text-gray-900">
                  {recipientName}{" "}
                  <span className="text-gray-500 font-normal">
                    ({maskedPhone})
                  </span>
                </p>
              </div>

              {/* Template selector */}
              <MMSTemplateSelector
                selectedTemplateId={selectedTemplate?.id || null}
                onSelect={handleTemplateSelect}
                customerName={recipientName}
              />

              {/* Message input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    메시지 내용
                  </label>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      messageType === "SMS" && "bg-blue-100 text-blue-700",
                      messageType === "LMS" && "bg-amber-100 text-amber-700",
                      messageType === "MMS" && "bg-purple-100 text-purple-700"
                    )}
                  >
                    {messageType}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2 px-1">
                  ※ 발송 시 앞에 &quot;{MESSAGE_PREFIX.trim()}&quot;가 자동으로 붙습니다
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="발송할 메시지를 입력하세요"
                  rows={5}
                  maxLength={2000 - MESSAGE_PREFIX.length}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>45자 초과 시 LMS, 이미지 첨부 시 MMS로 발송</span>
                  <span
                    className={cn(MESSAGE_PREFIX.length + message.length > 45 ? "text-amber-600" : "")}
                  >
                    {MESSAGE_PREFIX.length + message.length}/2000
                  </span>
                </div>
              </div>

              {/* Image source selector (if work photos available) */}
              {hasWorkPhotos && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이미지 첨부
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleImageSourceChange("work_photos")}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        imageSource === "work_photos"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <ImageIcon className="w-4 h-4" />
                      시공 사진에서 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImageSourceChange("upload")}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        imageSource === "upload"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <Upload className="w-4 h-4" />
                      직접 업로드
                    </button>
                  </div>
                </div>
              )}

              {/* Work photo selector */}
              {imageSource === "work_photos" && hasWorkPhotos ? (
                <div className="border rounded-xl p-4">
                  <WorkPhotoSelector
                    workPhotos={workPhotos}
                    selectedPhotos={selectedWorkPhotos}
                    onSelectionChange={setSelectedWorkPhotos}
                    maxSelection={3}
                  />
                </div>
              ) : (
                /* Image upload */
                <ImageUpload images={images} onChange={setImages} />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Sending */}
          {status === "sending" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-900 font-medium">발송 중...</p>
              <p className="text-sm text-gray-500 mt-1">
                {recipientName}님에게 발송하고 있습니다
              </p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium text-lg mb-1">
                발송 완료
              </p>
              <p className="text-sm text-gray-500 text-center">
                {recipientName}님에게
                <br />
                {messageType}
                {getImageCount() > 0 && ` (사진 ${getImageCount()}장)`}가 성공적으로 발송되었습니다
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-gray-900 font-medium text-lg mb-1">
                발송 실패
              </p>
              <p className="text-sm text-gray-500 text-center mb-4">
                {error || "발송 중 오류가 발생했습니다"}
              </p>
              <button
                onClick={() => setStatus("compose")}
                className="text-sm text-primary hover:underline"
              >
                다시 시도하기
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t -mx-6 px-6">
          {status === "compose" && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                발송하기
              </button>
            </div>
          )}

          {status === "success" && (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors"
            >
              닫기
            </button>
          )}

          {status === "error" && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => setStatus("compose")}
                className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary-600 font-medium transition-colors"
              >
                다시 작성
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
