// components/recipe/ImageUploadGrid.tsx
// Three-slot image upload grid used inside CreateRecipeModal.

import { useRef, useState } from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

interface UploadSlotProps {
  url: string | null;
  index: number;
  isUploading: boolean;
  disabled: boolean;
  onFileSelect: (file: File, index: number) => void;
  onRemove: (index: number) => void;
}

function UploadSlot({
  url,
  index,
  isUploading,
  disabled,
  onFileSelect,
  onRemove,
}: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setSizeError('Max file size is 10 MB');
      e.target.value = '';
      return;
    }
    setSizeError(null);
    onFileSelect(file, index);
    e.target.value = '';
  };

  const baseClass =
    'relative h-28 w-full rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors sm:h-32';

  if (url) {
    return (
      <div className={cn(baseClass, 'border-transparent')}>
        <img src={url} alt={`Recipe image ${index + 1}`} className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          aria-label={`Remove image ${index + 1}`}
          className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-0.5 text-white transition-opacity hover:bg-black/80 disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className={cn(baseClass, 'border-muted-foreground/30 bg-muted/30')}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(baseClass, 'border-muted-foreground/30 bg-muted/20 hover:border-[#6ec257]/50 hover:bg-muted/40 cursor-pointer')}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled}
        tabIndex={-1}
      />
      <div className="flex flex-col items-center gap-1 text-muted-foreground">
        <ImagePlus className="h-5 w-5" />
        <span className="text-sm">{sizeError ?? `Photo ${index + 1}`}</span>
      </div>
    </div>
  );
}

interface ImageUploadGridProps {
  images: (string | null)[];
  onUpload: (file: File, index: number) => Promise<string | null>;
  onRemove: (index: number) => void;
  uploadingIndex: number | null;
  disabled?: boolean;
  error?: string | null;
}

export function ImageUploadGrid({
  images,
  onUpload,
  onRemove,
  uploadingIndex,
  disabled = false,
  error,
}: ImageUploadGridProps) {
  const slots = [0, 1, 2] as const;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
        {slots.map((i) => (
          <UploadSlot
            key={i}
            index={i}
            url={images[i] ?? null}
            isUploading={uploadingIndex === i}
            disabled={disabled || uploadingIndex !== null}
            onFileSelect={onUpload}
            onRemove={onRemove}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
