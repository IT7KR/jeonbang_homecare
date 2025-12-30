"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoPaginationProps {
  /** 총 아이템 수 */
  totalItems: number;
  /** 페이지당 아이템 수 */
  itemsPerPage?: number;
  /** 현재 페이지 (1-based) */
  currentPage: number;
  /** 페이지 변경 콜백 */
  onPageChange: (page: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 사진 목록용 페이지네이션 컴포넌트
 *
 * @example
 * ```tsx
 * <PhotoPagination
 *   totalItems={photos.length}
 *   itemsPerPage={10}
 *   currentPage={currentPage}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 */
export function PhotoPagination({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
  className,
}: PhotoPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 1페이지만 있으면 표시하지 않음
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 표시할 페이지 번호 계산 (최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 중심으로 표시
      let start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);

      // 끝에 가까우면 시작 조정
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 mt-4",
        className
      )}
    >
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={currentPage === 1}
        onClick={handlePrev}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">이전</span>
      </Button>

      {/* 페이지 번호 */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={currentPage === totalPages}
        onClick={handleNext}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">다음</span>
      </Button>
    </div>
  );
}

/**
 * 간단한 페이지네이션 (이전/다음만)
 */
export function SimplePagination({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
  className,
}: PhotoPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 mt-4",
        className
      )}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        이전
      </Button>
      <span className="text-sm text-muted-foreground px-2">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </Button>
    </div>
  );
}
