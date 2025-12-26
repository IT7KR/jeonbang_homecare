"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangePreset {
  label: string;
  getValue: () => { from: Date; to: Date };
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "오늘",
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: "최근 7일",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "최근 30일",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "이번 주",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 0 }),
      to: endOfWeek(new Date(), { weekStartsOn: 0 }),
    }),
  },
  {
    label: "이번 달",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
];

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onFromChange: (date: Date | undefined) => void;
  onToChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  presets?: DateRangePreset[];
  showPresets?: boolean;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  placeholder = "날짜 범위 선택",
  className,
  disabled = false,
  presets = DEFAULT_PRESETS,
  showPresets = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handlePresetClick = (preset: DateRangePreset) => {
    const { from: newFrom, to: newTo } = preset.getValue();
    onFromChange(newFrom);
    onToChange(newTo);
  };

  const handleClear = () => {
    onFromChange(undefined);
    onToChange(undefined);
  };

  const formatDateRange = () => {
    if (from && to) {
      if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
        return format(from, "yyyy년 M월 d일", { locale: ko });
      }
      return `${format(from, "M/d", { locale: ko })} ~ ${format(to, "M/d", { locale: ko })}`;
    }
    if (from) {
      return `${format(from, "M/d", { locale: ko })} ~`;
    }
    if (to) {
      return `~ ${format(to, "M/d", { locale: ko })}`;
    }
    return placeholder;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "min-w-[200px] justify-start text-left font-normal",
              !from && !to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* 프리셋 버튼 */}
            {showPresets && (
              <div className="flex flex-col gap-1 border-r p-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                {(from || to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs text-muted-foreground"
                    onClick={handleClear}
                  >
                    초기화
                  </Button>
                )}
              </div>
            )}

            {/* 캘린더 */}
            <div className="flex flex-col gap-2 p-3">
              <div className="text-center text-sm font-medium">시작일</div>
              <Calendar
                mode="single"
                selected={from}
                onSelect={onFromChange}
                disabled={to ? { after: to } : undefined}
                initialFocus
              />
            </div>
            <div className="flex flex-col gap-2 border-l p-3">
              <div className="text-center text-sm font-medium">종료일</div>
              <Calendar
                mode="single"
                selected={to}
                onSelect={onToChange}
                disabled={from ? { before: from } : undefined}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
