"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** 선택 가능한 최소 날짜 (이전 날짜는 선택 불가) */
  fromDate?: Date
  /** 선택 가능한 최대 날짜 (이후 날짜는 선택 불가) */
  toDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "날짜를 선택하세요",
  className,
  disabled = false,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // 날짜 범위 제한을 위한 disabled 설정
  const disabledDates = React.useMemo(() => {
    const matchers: Array<{ before: Date } | { after: Date }> = [];
    if (fromDate) {
      matchers.push({ before: fromDate });
    }
    if (toDate) {
      matchers.push({ after: toDate });
    }
    return matchers.length > 0 ? matchers : undefined;
  }, [fromDate, toDate]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    // 날짜 선택 시 팝오버 닫기
    if (selectedDate) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ko }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={disabledDates}
        />
      </PopoverContent>
    </Popover>
  )
}
