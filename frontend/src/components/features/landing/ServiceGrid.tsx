"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SERVICE_CATEGORIES } from "@/lib/constants";

type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function ServiceGrid() {
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);

  return (
    <>
      {/* 아이콘 그리드 - 5열 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className="group flex flex-col items-center p-4 md:p-5 rounded-2xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden mb-3">
              <Image
                src={category.icon}
                alt={category.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-primary text-center transition-colors">
              {category.name}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              {category.services.length}개 항목
            </span>
          </button>
        ))}
      </div>

      {/* 세부 항목 모달 */}
      <Dialog
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedCategory && (
                <>
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={selectedCategory.icon}
                      alt={selectedCategory.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-0.5">
                      {selectedCategory.subtitle}
                    </DialogDescription>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedCategory && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 mb-3">
                제공 서비스
              </p>
              <ul className="space-y-2">
                {selectedCategory.services.map((service) => (
                  <li
                    key={service}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
