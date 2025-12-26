"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddressSearchProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

interface AddressResult {
  roadAddr: string; // 도로명주소
  jibunAddr: string; // 지번주소
  zipNo: string; // 우편번호
}

export function AddressSearch({
  value,
  onChange,
  placeholder = "주소를 검색하세요",
  className,
  error,
}: AddressSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 주소 검색 API 호출
  const searchAddress = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchError("2자 이상 입력해주세요");
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    try {
      // 행정안전부 도로명주소 API
      // TODO: 실제 API 키와 엔드포인트로 교체 필요
      const apiKey = process.env.NEXT_PUBLIC_JUSO_API_KEY || "";

      if (!apiKey) {
        // API 키가 없으면 더미 데이터로 테스트
        await new Promise((resolve) => setTimeout(resolve, 500));
        setResults([
          {
            roadAddr: `경기도 양평군 양평읍 ${searchQuery} 123`,
            jibunAddr: `경기도 양평군 양평읍 ${searchQuery}리 456`,
            zipNo: "12345",
          },
          {
            roadAddr: `경기도 가평군 가평읍 ${searchQuery}로 789`,
            jibunAddr: `경기도 가평군 가평읍 ${searchQuery}리 101`,
            zipNo: "12346",
          },
        ]);
        setIsOpen(true);
        return;
      }

      const response = await fetch(
        `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${apiKey}&currentPage=1&countPerPage=10&keyword=${encodeURIComponent(searchQuery)}&resultType=json`
      );

      const data = await response.json();

      if (data.results?.common?.errorCode === "0") {
        const addresses = data.results.juso || [];
        setResults(
          addresses.map((addr: Record<string, string>) => ({
            roadAddr: addr.roadAddr,
            jibunAddr: addr.jibunAddr,
            zipNo: addr.zipNo,
          }))
        );
        setIsOpen(true);
      } else {
        setSearchError(data.results?.common?.errorMessage || "검색 실패");
      }
    } catch {
      setSearchError("주소 검색 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (address: AddressResult) => {
    onChange(address.roadAddr);
    setIsOpen(false);
    setSearchQuery("");
    setResults([]);
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchAddress();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* 선택된 주소 표시 */}
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary/20 rounded-lg">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="flex-1 text-gray-900">{value}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        /* 검색 입력 */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pr-10"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={searchAddress}
            disabled={isLoading}
            className="px-4"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* 에러 메시지 */}
      {(error || searchError) && (
        <p className="text-sm text-red-500 mt-1">{error || searchError}</p>
      )}

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">
                {result.roadAddr}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                [지번] {result.jibunAddr}
              </p>
              <p className="text-xs text-gray-400">{result.zipNo}</p>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
