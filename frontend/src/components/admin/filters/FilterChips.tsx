"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterChip {
  key: string;
  label: string;
  value?: string;
  onRemove: () => void;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
  className?: string;
}

export function FilterChips({
  chips,
  onClearAll,
  className,
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-2",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">활성 필터:</span>

      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="flex items-center gap-1 pl-2 pr-1"
        >
          <span className="text-xs font-medium">{chip.label}</span>
          {chip.value && <span className="text-xs">: {chip.value}</span>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={chip.onRemove}
            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">제거</span>
          </Button>
        </Badge>
      ))}

      {chips.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          전체 초기화
        </Button>
      )}
    </div>
  );
}
