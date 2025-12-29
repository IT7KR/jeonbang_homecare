"use client";

import { TYPE_OPTIONS, TRIGGER_SOURCE_OPTIONS } from "@/hooks/useSMS";

interface SMSFiltersProps {
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  triggerSourceFilter: string;
  onTriggerSourceFilterChange: (value: string) => void;
}

export function SMSFilters({
  typeFilter,
  onTypeFilterChange,
  triggerSourceFilter,
  onTriggerSourceFilterChange,
}: SMSFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={triggerSourceFilter}
        onChange={(e) => onTriggerSourceFilterChange(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
      >
        {TRIGGER_SOURCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
