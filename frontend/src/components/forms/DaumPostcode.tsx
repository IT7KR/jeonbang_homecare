"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: () => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
        embed: (element: HTMLElement) => void;
      };
    };
  }
}

interface DaumPostcodeData {
  address: string; // 기본 주소
  addressType: string; // 주소 타입 (R: 도로명, J: 지번)
  bname: string; // 법정동/법정리 이름
  buildingName: string; // 건물명
  apartment: string; // 아파트 여부 (Y/N)
  zonecode: string; // 우편번호
  roadAddress: string; // 도로명 주소
  jibunAddress: string; // 지번 주소
  autoRoadAddress: string; // 자동 도로명 주소
  autoJibunAddress: string; // 자동 지번 주소
}

interface DaumPostcodeProps {
  value: string;
  onChange: (address: string, zonecode?: string) => void;
  placeholder?: string;
  className?: string; // Container class
  triggerClassName?: string; // Button/Input class
  error?: string;
}

export function DaumPostcode({
  value,
  onChange,
  placeholder = "주소를 검색하세요",
  className,
  triggerClassName,
  error,
}: DaumPostcodeProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // 다음 우편번호 스크립트 로드
  useEffect(() => {
    if (typeof window !== "undefined" && !window.daum) {
      const script = document.createElement("script");
      script.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else if (window.daum) {
      setIsScriptLoaded(true);
    }
  }, []);

  const handleSearch = () => {
    if (!isScriptLoaded || !window.daum) {
      toast.warning("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        // 도로명 주소 우선, 없으면 지번 주소 사용
        const address = data.roadAddress || data.jibunAddress;
        onChange(address, data.zonecode);
      },
    }).open();
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* 선택된 주소 표시 */}
      {value ? (
        <div
          className={cn(
            "flex items-center gap-2 p-3 bg-primary-50 border border-primary/20 rounded-lg",
            triggerClassName
          )}
        >
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="flex-1 text-gray-900">{value}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
            aria-label="주소 삭제"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        /* 검색 버튼 */
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          className={cn(
            "w-full h-12 justify-start text-gray-400 font-normal hover:text-gray-600",
            triggerClassName
          )}
        >
          <Search className="h-5 w-5 mr-2" />
          {placeholder}
        </Button>
      )}

      {/* 에러 메시지 */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
