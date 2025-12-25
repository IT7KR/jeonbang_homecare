"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle2, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getServices, type ServiceCategoryWithTypes } from "@/lib/api/services";

// 카테고리별 이미지 매핑
const categoryImageMap: Record<string, string> = {
  construction: "/icons/services/architecture-icon.png",
  exterior: "/icons/services/external-management-icon.png",
  landscaping: "/icons/services/landscaping-work-icon.png",
  outdoor_facility: "/icons/services/external-facilities-icon.png",
  indoor_furniture: "/icons/services/indoor-furniture-icon.png",
  bathroom: "/icons/services/washroom-icon.png",
  finishing: "/icons/services/closing-construction-icon.png",
  plumbing: "/icons/services/facilities-icon.png",
  electrical: "/icons/services/electricity-icon.png",
  window_door: "/icons/services/windows-icon.png",
  others: "/icons/services/other-operations-icon.png",
  cleaning: "/icons/services/cleaning-icon.png",
  specialized_services: "/icons/services/specialized-services-icon.png",
};

// 기본 이미지
const DEFAULT_ICON = "/icons/services/windows-icon.png";

export function ServiceGrid() {
  const [categories, setCategories] = useState<ServiceCategoryWithTypes[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategoryWithTypes | null>(null);

  useEffect(() => {
    getServices()
      .then((response) => {
        setCategories(response.categories);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      {/* 아이콘 그리드 - 5열 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6">
        {categories.map((category) => {
          const imagePath = categoryImageMap[category.code] || DEFAULT_ICON;

          return (
            <button
              key={category.code}
              onClick={() => setSelectedCategory(category)}
              aria-label={`${category.name} 서비스 상세 보기`}
              className="group flex flex-col items-center p-5 md:p-6 rounded-2xl bg-white border border-gray-100 hover:border-primary/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              {/* 누르기 아이콘 */}
              <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2 group-hover:animate-bounce" aria-hidden="true" />

              {/* 아이콘 영역 */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-4 bg-white">
                <Image
                  src={imagePath}
                  alt={category.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <span className="text-base md:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-primary text-center transition-colors">
                {category.name}
              </span>
              <span className="text-sm md:text-base text-gray-400 mt-2">
                {category.services.length}개 항목
              </span>
            </button>
          );
        })}
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
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                    <Image
                      src={
                        categoryImageMap[selectedCategory.code] || DEFAULT_ICON
                      }
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
                      {selectedCategory.description}
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
                    key={service.code}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
                    <span className="text-base md:text-lg text-gray-700 font-medium">
                      {service.name}
                      {!service.is_active && (
                        <span className="text-sm text-gray-400 font-normal ml-2">
                          (준비 중)
                        </span>
                      )}
                    </span>
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
