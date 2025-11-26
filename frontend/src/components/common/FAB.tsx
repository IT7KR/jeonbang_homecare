"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FABProps {
  className?: string;
}

export function FAB({ className }: FABProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 flex flex-col gap-3",
        className
      )}
    >
      {/* 전화 버튼 */}
      <Button
        asChild
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <a href={`tel:${COMPANY_INFO.phone}`} aria-label="전화 걸기">
          <Phone className="h-6 w-6" />
        </a>
      </Button>
    </div>
  );
}
