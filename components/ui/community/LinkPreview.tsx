'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import type { LinkPreviewMetadata } from '@/lib/data/community';

interface LinkPreviewProps {
  preview: LinkPreviewMetadata;
}

export function LinkPreview({ preview }: LinkPreviewProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
    >
      {preview.image && !imageError && (
        <div className="relative w-full h-48">
          <Image
            src={preview.image}
            alt={preview.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white line-clamp-2 mb-1">
              {preview.title}
            </h3>
            <p className="text-white/70 text-sm line-clamp-2 mb-2">
              {preview.description}
            </p>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              {preview.siteName && (
                <span className="font-medium">{preview.siteName}</span>
              )}
              {preview.domain && preview.domain !== preview.siteName && (
                <>
                  <span>•</span>
                  <span>{preview.domain}</span>
                </>
              )}
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-white/50 flex-shrink-0 mt-1" />
        </div>
      </div>
    </a>
  );
}
