"use client";

import { useState, useMemo } from "react";
import { Trash2, Send, Loader2, MessageSquare, Clock, RefreshCw, Filter } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

/** 메모 항목 */
export interface NoteItem {
  id: number;
  content: string;
  admin_name: string;
  created_at: string;
  note_type?: "memo" | "manual" | "status_change" | "system";
}

/** 감사 로그 항목 */
export interface AuditItem {
  id: number;
  summary: string;
  admin_name?: string;
  created_at: string;
}

/** 통합 활동 항목 */
export type ActivityItem =
  | { type: "note"; data: NoteItem }
  | { type: "audit"; data: AuditItem };

/** 필터 타입 */
export type ActivityFilterType = "all" | "note" | "audit";

export interface ActivityTimelineProps {
  /** 메모 목록 */
  notes?: NoteItem[];
  /** 감사 로그 목록 */
  auditLogs?: AuditItem[];
  /** 초기 표시 개수 (기본: 5) */
  initialDisplayCount?: number;
  /** 메모 입력창 표시 여부 */
  showInput?: boolean;
  /** 필터 칩 표시 여부 (기본: true, auditLogs가 있을 때만 표시) */
  showFilter?: boolean;
  /** 메모 추가 중 로딩 상태 */
  isAddingNote?: boolean;
  /** 메모 추가 핸들러 */
  onAddNote?: (content: string) => Promise<void>;
  /** 메모 삭제 핸들러 (없으면 삭제 버튼 숨김) */
  onDeleteNote?: (id: number) => Promise<void>;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 메모 + 감사 로그 통합 타임라인 컴포넌트
 * - 메모와 변경 이력을 시간순으로 통합 표시
 * - 필터 칩으로 유형별 필터링
 * - 타입별 아이콘/색상 구분
 * - 메모 추가/삭제 기능
 * - 더보기/접기 토글
 */
export function ActivityTimeline({
  notes = [],
  auditLogs = [],
  initialDisplayCount = 5,
  showInput = true,
  showFilter = true,
  isAddingNote = false,
  onAddNote,
  onDeleteNote,
  emptyMessage = "활동 이력이 없습니다",
  className = "",
}: ActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>("all");

  // 메모와 감사 로그를 통합하여 최신순 정렬
  const allActivityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [
      ...notes.map((n) => ({ type: "note" as const, data: n })),
      ...auditLogs.map((a) => ({ type: "audit" as const, data: a })),
    ];

    return items.sort((a, b) => {
      const dateA = new Date(a.data.created_at).getTime();
      const dateB = new Date(b.data.created_at).getTime();
      return dateB - dateA; // 최신순
    });
  }, [notes, auditLogs]);

  // 필터 적용된 항목
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return allActivityItems;
    return allActivityItems.filter((item) => item.type === activeFilter);
  }, [allActivityItems, activeFilter]);

  const displayedItems = showAll
    ? filteredItems
    : filteredItems.slice(0, initialDisplayCount);

  const hasMore = filteredItems.length > initialDisplayCount;

  // 필터 표시 여부 (auditLogs가 있을 때만)
  const shouldShowFilter = showFilter && auditLogs.length > 0;

  // 메모 추가 핸들러
  const handleAddNote = async () => {
    if (!newContent.trim() || !onAddNote) return;

    await onAddNote(newContent);
    setNewContent("");
  };

  // 엔터키로 추가
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAddingNote) {
      handleAddNote();
    }
  };

  // 타입별 도트 색상
  const getDotColor = (item: ActivityItem) => {
    if (item.type === "note") {
      const noteType = (item.data as NoteItem).note_type;
      if (noteType === "status_change") return "bg-purple-400";
      if (noteType === "system") return "bg-gray-400";
      return "bg-primary";
    }
    return "bg-gray-400";
  };

  // 타입별 아이콘
  const getIcon = (item: ActivityItem) => {
    if (item.type === "note") {
      const noteType = (item.data as NoteItem).note_type;
      if (noteType === "status_change") return <RefreshCw size={12} />;
      if (noteType === "system") return <Clock size={12} />;
      return <MessageSquare size={12} />;
    }
    return <Clock size={12} />;
  };

  // 필터 옵션
  const filterOptions: { value: ActivityFilterType; label: string; count: number }[] = [
    { value: "all", label: "전체", count: allActivityItems.length },
    { value: "note", label: "메모", count: notes.length },
    { value: "audit", label: "변경", count: auditLogs.length },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 필터 칩 */}
      {shouldShowFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setActiveFilter(option.value);
                setShowAll(false); // 필터 변경 시 더보기 초기화
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeFilter === option.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === option.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 메모 입력창 */}
      {showInput && onAddNote && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메모를 입력하세요..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            onClick={handleAddNote}
            disabled={isAddingNote || !newContent.trim()}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingNote ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      )}

      {/* 타임라인 */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {activeFilter === "all"
              ? emptyMessage
              : activeFilter === "note"
                ? "메모가 없습니다"
                : "변경 이력이 없습니다"}
          </p>
        ) : (
          displayedItems.map((item, idx) => (
            <div
              key={`${item.type}-${item.data.id}`}
              className={`relative pl-5 ${
                idx !== displayedItems.length - 1
                  ? "pb-3 border-l-2 border-gray-200"
                  : ""
              }`}
            >
              {/* 타임라인 도트 */}
              <div
                className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${getDotColor(
                  item
                )}`}
              />

              {/* 콘텐츠 카드 */}
              <div className="bg-gray-50 rounded-lg p-3">
                {item.type === "note" ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {(item.data as NoteItem).content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">
                            {(item.data as NoteItem).admin_name}
                          </span>
                          {" · "}
                          {formatRelativeTime(new Date(item.data.created_at))}
                        </p>
                      </div>
                      {/* 삭제 버튼 (memo/manual 타입만) */}
                      {onDeleteNote &&
                        (!("note_type" in item.data) ||
                          (item.data as NoteItem).note_type === "memo" ||
                          (item.data as NoteItem).note_type === "manual" ||
                          (item.data as NoteItem).note_type === undefined) && (
                          <button
                            onClick={() => onDeleteNote(item.data.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700">
                      {(item.data as AuditItem).summary}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">
                        {(item.data as AuditItem).admin_name || "시스템"}
                      </span>
                      {" · "}
                      {formatRelativeTime(new Date(item.data.created_at))}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더보기/접기 */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-sm text-primary hover:underline py-2"
        >
          {showAll ? "접기" : `더보기 (${filteredItems.length - initialDisplayCount}개 더)`}
        </button>
      )}
    </div>
  );
}

export default ActivityTimeline;
