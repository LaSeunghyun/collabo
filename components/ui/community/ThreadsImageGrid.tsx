'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface ThreadsImageGridProps {
  images: string[];
}

export function ThreadsImageGrid({ images }: ThreadsImageGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setIsFullscreen(false);
  };

  if (images.length === 1) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-white/5">
        <Image
          src={images[0]}
          alt="Post image"
          width={600}
          height={400}
          className="w-full h-auto max-h-96 object-cover cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden bg-white/5">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
            <Image
              src={image}
              alt={`Post image ${index + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={() => {
                setCurrentIndex(index);
                setIsFullscreen(true);
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden bg-white/5">
        <div className="relative aspect-square">
          <Image
            src={images[0]}
            alt="Post image 1"
            fill
            className="object-cover cursor-pointer"
            onClick={() => {
              setCurrentIndex(0);
              setIsFullscreen(true);
            }}
          />
        </div>
        <div className="grid grid-rows-2 gap-1">
          {images.slice(1).map((image, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={image}
                alt={`Post image ${index + 2}`}
                fill
                className="object-cover cursor-pointer"
                onClick={() => {
                  setCurrentIndex(index + 1);
                  setIsFullscreen(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden bg-white/5">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
            <Image
              src={image}
              alt={`Post image ${index + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={() => {
                setCurrentIndex(index);
                setIsFullscreen(true);
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 5개 이상인 경우 첫 번째 이미지와 나머지 개수 표시
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white/5">
      <div className="relative aspect-video">
        <Image
          src={images[0]}
          alt="Post image"
          fill
          className="object-cover cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        />
        {images.length > 5 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              +{images.length - 1}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={() => setIsFullscreen(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="relative max-w-4xl max-h-full p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <Image
            src={images[currentIndex]}
            alt={`Post image ${currentIndex + 1}`}
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={clsx(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
