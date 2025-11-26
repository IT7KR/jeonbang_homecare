'use client';

import { useState } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: number;
  name: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  services: Service[];
}

interface StepByStepServiceSelectorProps {
  categories: Category[];
  selectedServiceIds: number[];
  onSelectionChange: (serviceIds: number[]) => void;
  mode: 'customer' | 'partner'; // 고객용 vs 협력사용 문구 구분
}

export function StepByStepServiceSelector({
  categories,
  selectedServiceIds,
  onSelectionChange,
  mode = 'customer'
}: StepByStepServiceSelectorProps) {
  const [currentStep, setCurrentStep] = useState<'category' | 'service'>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setCurrentStep('service');
  };

  const handleServiceToggle = (serviceId: number) => {
    const newSelection = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter(id => id !== serviceId)
      : [...selectedServiceIds, serviceId];
    onSelectionChange(newSelection);
  };

  const handleBack = () => {
    setCurrentStep('category');
    setSelectedCategory(null);
  };

  const getSelectedCountForCategory = (category: Category) => {
    return category.services.filter(s => selectedServiceIds.includes(s.id)).length;
  };

  const totalSelectedServices = selectedServiceIds.length;

  return (
    <div className="space-y-8">
      {/* 진행 상태 표시 */}
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
              {totalSelectedServices}
            </div>
            <div className="text-lg">
              <span className="font-semibold text-blue-900">
                {totalSelectedServices}개 서비스 선택됨
              </span>
              <p className="text-base text-blue-700 mt-1">
                {mode === 'customer'
                  ? '필요한 서비스를 모두 선택해주세요'
                  : '제공 가능한 서비스를 모두 선택해주세요'}
              </p>
            </div>
          </div>
          {currentStep === 'service' && (
            <button
              onClick={handleBack}
              className="
                flex items-center gap-2
                px-6 py-3
                bg-white border-2 border-gray-300
                rounded-lg
                hover:border-blue-500 hover:bg-blue-50
                transition-all
                text-base font-medium
                min-h-[48px]
              "
            >
              <ChevronLeft className="w-5 h-5" />
              카테고리 선택으로
            </button>
          )}
        </div>
      </div>

      {/* Step 1: 카테고리 선택 */}
      {currentStep === 'category' && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            서비스 카테고리를 선택하세요
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const selectedCount = getSelectedCountForCategory(category);
              const hasSelection = selectedCount > 0;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    'p-8 rounded-2xl border-3 text-left',
                    'min-h-[180px] w-full',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300',
                    'hover:border-blue-500 hover:shadow-xl hover:scale-[1.02]',
                    hasSelection
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  )}
                  aria-label={`${category.name}, ${category.services.length}개 서비스, ${selectedCount}개 선택됨`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-5xl" aria-hidden="true">
                      {category.icon}
                    </span>
                    {hasSelection && (
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {selectedCount}
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-lg text-gray-600">
                    {category.services.length}개 서비스
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: 서비스 선택 */}
      {currentStep === 'service' && selectedCategory && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedCategory.icon} {selectedCategory.name}
            </h2>
            <p className="text-lg text-gray-600">
              {mode === 'customer'
                ? '필요한 세부 서비스를 선택하세요 (여러 개 선택 가능)'
                : '제공 가능한 세부 서비스를 선택하세요 (여러 개 선택 가능)'}
            </p>
          </div>

          <div className="space-y-4" role="group" aria-labelledby="service-list-title">
            <h3 id="service-list-title" className="sr-only">
              {selectedCategory.name} 서비스 목록
            </h3>
            {selectedCategory.services.map((service) => {
              const isSelected = selectedServiceIds.includes(service.id);

              return (
                <label
                  key={service.id}
                  className={cn(
                    'flex items-start gap-5 p-6 rounded-xl border-3 cursor-pointer',
                    'transition-all duration-200',
                    'hover:bg-gray-50 hover:border-blue-400 hover:shadow-md',
                    'focus-within:ring-4 focus-within:ring-blue-300',
                    isSelected
                      ? 'bg-blue-50 border-blue-600 shadow-md'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleServiceToggle(service.id)}
                      className="
                        w-7 h-7
                        rounded border-2 border-gray-400
                        text-blue-600
                        focus:ring-4 focus:ring-blue-300
                        cursor-pointer
                      "
                      aria-label={`${service.name}, ${service.description}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-xl font-semibold text-gray-900 leading-tight">
                        {service.name}
                      </div>
                      {isSelected && (
                        <Check
                          className="w-6 h-6 text-blue-600 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="text-base text-gray-600 mt-2 leading-relaxed">
                      {service.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* 하단 액션 버튼 */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 flex gap-4">
            <button
              onClick={handleBack}
              className="
                flex-1 sm:flex-initial
                px-8 py-4
                bg-white border-2 border-gray-300
                rounded-xl
                text-lg font-semibold
                hover:border-gray-400 hover:bg-gray-50
                transition-colors
                min-h-[56px]
              "
            >
              이전으로
            </button>
            <button
              onClick={handleBack}
              className="
                flex-1 sm:flex-initial
                px-8 py-4
                bg-blue-600 text-white
                rounded-xl
                text-lg font-semibold
                hover:bg-blue-700
                transition-colors
                min-h-[56px]
              "
            >
              다른 카테고리 선택
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
