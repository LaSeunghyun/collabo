'use client';

import { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import type { AttachmentMetadata } from '@/lib/data/community';

interface ImageUploaderProps {
  onUpload: (images: string[]) => void;
  disabled?: boolean;
}

export function ImageUploader({ onUpload, disabled = false }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    setIsUploading(true);
    const uploadPromises: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) continue;

      const formData = new FormData();
      formData.append('file', file);

      const uploadPromise = fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            return data.attachment.url;
          }
          throw new Error(data.error || 'Upload failed');
        });

      uploadPromises.push(uploadPromise);
    }

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      onUpload(uploadedUrls);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, disabled]);

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, isUploading, handleFileSelect]);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isUploading}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          p-2 rounded-full transition-colors
          ${disabled || isUploading
            ? 'text-white/30 cursor-not-allowed'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
          }
        `}
        title="이미지 업로드"
      >
        {isUploading ? (
          <Upload className="w-5 h-5 animate-pulse" />
        ) : (
          <ImageIcon className="w-5 h-5" />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </>
  );
}
