"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchType = "auto" | "name" | "phone" | "number" | "company";

export interface UnifiedSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch: (query: string, type: SearchType) => void;
  placeholder?: string;
  debounceMs?: number;
  showTypeHint?: boolean;
  className?: string;
  defaultValue?: string;
}

const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  auto: "자동 감지",
  name: "이름",
  phone: "전화번호",
  number: "신청번호",
  company: "회사명",
};

function isValidDate(dateStr: string): boolean {
  // YYYYMMDD 형식의 날짜 유효성 검사
  if (dateStr.length !== 8) return false;

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);

  // 연도: 2020~2099
  if (year < 2020 || year > 2099) return false;
  // 월: 1~12
  if (month < 1 || month > 12) return false;
  // 일: 1~31
  if (day < 1 || day > 31) return false;

  return true;
}

function detectSearchType(query: string): SearchType {
  if (!query) return "auto";

  // 신청번호: YYYYMMDD-XXX 또는 YYYYMMDDXXX 형식
  // 하이픈 있는 경우
  if (/^\d{8}-\d{1,3}$/.test(query)) {
    const datePart = query.substring(0, 8);
    if (isValidDate(datePart)) {
      return "number";
    }
  }

  // 하이픈 없는 경우 (9~11자리 숫자, 앞 8자리가 유효한 날짜)
  if (/^\d{9,11}$/.test(query)) {
    const datePart = query.substring(0, 8);
    if (isValidDate(datePart)) {
      return "number";
    }
  }

  // 전화번호: 숫자/하이픈만, 4~11자리 (010-xxxx-xxxx 또는 01012345678)
  const cleaned = query.replace(/-/g, "").replace(/\s/g, "");
  if (/^\d+$/.test(cleaned) && cleaned.length >= 4 && cleaned.length <= 11) {
    return "phone";
  }

  // 기본: 이름
  return "name";
}

export function UnifiedSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "이름, 전화번호, 신청번호로 검색...",
  debounceMs = 300,
  showTypeHint = true,
  className,
  defaultValue = "",
}: UnifiedSearchInputProps) {
  const [inputValue, setInputValue] = useState(defaultValue || value || "");
  const [detectedType, setDetectedType] = useState<SearchType>("auto");

  // 외부 value 변경 시 내부 상태 동기화 (controlled mode)
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
      setDetectedType(detectSearchType(value));
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    const type = detectSearchType(inputValue);
    setDetectedType(type);

    const timer = setTimeout(() => {
      // 빈값이거나 2글자 이상일 때 검색 실행
      if (!inputValue || inputValue.length >= 2) {
        onSearch(inputValue, type);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, onSearch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onChange?.("");
    onSearch("", "auto");
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const type = detectSearchType(inputValue);
        onSearch(inputValue, type);
      }
    },
    [inputValue, onSearch]
  );

  return (
    <div className={cn("relative flex-1", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-20"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">지우기</span>
          </Button>
        )}
      </div>

      {/* 검색 타입 힌트 */}
      {showTypeHint && inputValue && detectedType !== "auto" && (
        <div className="absolute left-0 top-full mt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            {SEARCH_TYPE_LABELS[detectedType]}로 검색
          </span>
        </div>
      )}
    </div>
  );
}
