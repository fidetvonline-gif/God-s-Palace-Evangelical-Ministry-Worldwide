import { useState } from 'react';
import { Church } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
}

export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  fallbackTitle,
  loading = 'eager',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#EBE6DF] text-[#52525B] p-6 text-center ${containerClassName}`}
      >
        <Church className="w-8 h-8 text-[#1B365D]/60 mb-2" strokeWidth={1.5} aria-hidden="true" />
        {fallbackTitle && (
          <span className="font-serif text-sm text-[#18181B]/80 max-w-[20ch]">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
