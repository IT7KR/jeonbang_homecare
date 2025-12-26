import { cn } from "@/lib/utils";

/**
 * Skeleton 로딩 플레이스홀더
 *
 * @example
 * // 기본 사용
 * <Skeleton className="h-4 w-[250px]" />
 *
 * // 카드 스켈레톤
 * <Skeleton className="h-[200px] w-full rounded-xl" />
 *
 * // 아바타
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

/**
 * 테이블 로우 스켈레톤
 */
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * 테이블 스켈레톤
 */
function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-5 py-3.5">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 카드 스켈레톤
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * 통계 카드 그리드 스켈레톤
 */
function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 폼 필드 스켈레톤
 */
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

/**
 * 페이지 헤더 스켈레톤
 */
function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  );
}

/**
 * 필터 섹션 스켈레톤
 */
function FilterSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="flex-1 flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Admin 리스트 페이지 전체 스켈레톤
 */
function AdminListSkeleton({
  showStats = false,
  statsCount = 4,
  tableRows = 5,
  tableColumns = 6,
}: {
  showStats?: boolean;
  statsCount?: number;
  tableRows?: number;
  tableColumns?: number;
}) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FilterSkeleton />
      {showStats && <StatsGridSkeleton count={statsCount} />}
      <TableSkeleton rows={tableRows} columns={tableColumns} />
    </div>
  );
}

export {
  Skeleton,
  TableRowSkeleton,
  TableSkeleton,
  CardSkeleton,
  StatsGridSkeleton,
  FormFieldSkeleton,
  PageHeaderSkeleton,
  FilterSkeleton,
  AdminListSkeleton,
};
