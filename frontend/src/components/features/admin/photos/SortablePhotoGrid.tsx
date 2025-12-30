"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, CheckSquare, Square } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  index: number;
}

interface SortablePhotoItemProps {
  photo: Photo;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onPhotoClick?: (index: number) => void;
  isDragging?: boolean;
  photoType: "before" | "after";
}

function SortablePhotoItem({
  photo,
  isSelectionMode,
  isSelected,
  onSelect,
  onDelete,
  onPhotoClick,
  isDragging,
  photoType,
}: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayUrl = photo.thumbnailUrl || photo.url;

  const handleImageClick = () => {
    if (!isSelectionMode && onPhotoClick) {
      onPhotoClick(photo.index);
    } else if (isSelectionMode) {
      onSelect(photo.index);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden border bg-gray-50 group",
        isSorting && "opacity-50",
        isDragging && "z-50",
        isSelected
          ? "border-primary border-2 ring-2 ring-primary/20"
          : "border-gray-200",
        !isSelectionMode && onPhotoClick && "cursor-pointer"
      )}
      onClick={handleImageClick}
    >
      <Image
        src={displayUrl}
        alt={`시공 ${photoType === "before" ? "전" : "후"} 사진 ${photo.index + 1}`}
        fill
        className="object-cover"
        unoptimized
      />

      {/* Selection checkbox */}
      {isSelectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(photo.index);
          }}
          className="absolute top-1 left-1 z-10"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary bg-white rounded" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 bg-white/80 rounded" />
          )}
        </button>
      )}

      {/* Drag handle */}
      {!isSelectionMode && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
          title="드래그하여 순서 변경"
        >
          <GripVertical className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Delete button (when not in selection mode) */}
      {!isSelectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo.index);
          }}
          className="absolute top-1 right-1 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Photo number */}
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
        {photo.index + 1}
      </div>
    </div>
  );
}

// Static photo item for drag overlay
function PhotoOverlay({ photo, photoType }: { photo: Photo; photoType: "before" | "after" }) {
  const displayUrl = photo.thumbnailUrl || photo.url;

  return (
    <div className="aspect-square w-24 rounded-lg overflow-hidden border-2 border-primary bg-gray-50 shadow-lg">
      <Image
        src={displayUrl}
        alt={`시공 ${photoType === "before" ? "전" : "후"} 사진 ${photo.index + 1}`}
        fill
        className="object-cover"
        unoptimized
      />
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary rounded text-[10px] text-white">
        {photo.index + 1}
      </div>
    </div>
  );
}

interface SortablePhotoGridProps {
  photos: string[];
  thumbnails: string[];
  photoType: "before" | "after";
  startIndex?: number;
  isSelectionMode: boolean;
  selectedIndices: Set<number>;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onPhotoClick?: (index: number) => void;
}

export function SortablePhotoGrid({
  photos,
  thumbnails,
  photoType,
  startIndex = 0,
  isSelectionMode,
  selectedIndices,
  onSelect,
  onDelete,
  onReorder,
  onPhotoClick,
}: SortablePhotoGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create photo items with stable IDs
  const photoItems: Photo[] = photos.map((url, index) => ({
    id: `${photoType}-${startIndex + index}`,
    url,
    thumbnailUrl: thumbnails[index],
    index: startIndex + index,
  }));

  const activePhoto = activeId
    ? photoItems.find((p) => p.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const activeItem = photoItems.find((p) => p.id === active.id);
      const overItem = photoItems.find((p) => p.id === over.id);

      if (activeItem && overItem) {
        onReorder(activeItem.index, overItem.index);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={photoItems.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photoItems.map((photo) => (
            <SortablePhotoItem
              key={photo.id}
              photo={photo}
              photoType={photoType}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIndices.has(photo.index)}
              onSelect={onSelect}
              onDelete={onDelete}
              onPhotoClick={onPhotoClick}
              isDragging={photo.id === activeId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay adjustScale style={{ transformOrigin: "0 0" }}>
        {activePhoto ? (
          <PhotoOverlay photo={activePhoto} photoType={photoType} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
