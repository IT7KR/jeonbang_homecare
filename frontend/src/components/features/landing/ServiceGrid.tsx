"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, ChevronDown } from "lucide-react";
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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6">
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className="group flex flex-col items-center p-5 md:p-6 rounded-2xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            {/* 누르기 아이콘 */}
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2 group-hover:animate-bounce" />
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-4">
              <Image
                src={category.icon}
                alt={category.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-base md:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-primary text-center transition-colors">
              {category.name}
            </span>
            <span className="text-sm md:text-base text-gray-400 mt-2">
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-4">
              {selectedCategory && (
                <>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedCategory.icon}
                      alt={selectedCategory.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm md:text-base text-gray-500 mt-1">
                      {selectedCategory.subtitle}
                    </DialogDescription>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedCategory && (
            <div className="mt-4 overflow-y-auto flex-1 overscroll-contain -mr-2 pr-2">
              <p className="text-sm md:text-base font-medium text-gray-500 mb-3 sticky top-0 bg-white pb-2">
                제공 서비스
              </p>
              <ul className="space-y-2 pb-2">
                {selectedCategory.services.map((service) => (
                  <li
                    key={service}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-base md:text-lg text-gray-700 font-medium">{service}</span>
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
