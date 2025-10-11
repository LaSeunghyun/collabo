'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Image as ImageIcon, Link2, Music, FileText, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import type { AttachmentMetadata, LinkPreviewMetadata } from '@/lib/data/community';
import { ImageUploader } from './ImageUploader';

interface ThreadsComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    images: string[];
    attachments: AttachmentMetadata[];
    linkPreviews: LinkPreviewMetadata[];
    category: string;
  }) => void;
  isSubmitting?: boolean;
}

export function ThreadsComposer({ isOpen, onClose, onSubmit, isSubmitting = false }: ThreadsComposerProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewMetadata[]>([]);
  const [category, setCategory] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isSubmitting) return;

    onSubmit({
      content: content.trim(),
      images,
      attachments,
      linkPreviews,
      category
    });

    // Reset form
    setContent('');
    setImages([]);
    setAttachments([]);
    setLinkPreviews([]);
    setCategory('general');
  }, [content, images, attachments, linkPreviews, category, onSubmit, isSubmitting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleImageUpload = useCallback((newImages: string[]) => {
    setImages(prev => [...prev, ...newImages].slice(0, 10)); // 최대 10개
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAttachmentUpload = useCallback((newAttachment: AttachmentMetadata) => {
    setAttachments(prev => [...prev, newAttachment]);
  }, []);

  const handleAttachmentRemove = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  const handleLinkPreview = useCallback(async (url: string) => {
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (response.ok) {
        const { preview } = await response.json();
        setLinkPreviews(prev => [...prev, preview]);
      }
    } catch (error) {
      console.error('Failed to fetch link preview:', error);
    }
  }, []);

  const handleLinkPreviewRemove = useCallback((index: number) => {
    setLinkPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          <h2 className="text-lg font-semibold text-white">새로운 스레드</h2>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              content.trim() && !isSubmitting
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? '게시 중...' : '게시'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Text input */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary">U</span>
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="새로운 소식이 있나요?"
                className="w-full min-h-[120px] bg-transparent text-white placeholder:text-white/50 resize-none focus:outline-none"
                autoFocus
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/50">
                  {content.length}/500
                </span>
                <span className="text-xs text-white/50">
                  Cmd+Enter로 게시
                </span>
              </div>
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    {attachment.type === 'audio' && <Music className="w-5 h-5 text-white/60" />}
                    {attachment.type === 'video' && <FileText className="w-5 h-5 text-white/60" />}
                    {attachment.type === 'document' && <FileText className="w-5 h-5 text-white/60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-white/60 text-xs">
                      {(attachment.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => handleAttachmentRemove(attachment.id)}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Link Previews */}
          {linkPreviews.length > 0 && (
            <div className="space-y-2">
              {linkPreviews.map((preview, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {preview.title}
                    </p>
                    <p className="text-white/60 text-xs truncate">
                      {preview.domain}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLinkPreviewRemove(index)}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <ImageUploader
              onUpload={handleImageUpload}
              disabled={isUploading || images.length >= 10}
            />
            <button
              onClick={() => {
                const url = prompt('URL을 입력하세요:');
                if (url) handleLinkPreview(url);
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="링크 미리보기"
            >
              <Link2 className="w-5 h-5 text-white/60" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="이모지"
            >
              <Smile className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Category selection */}
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">카테고리:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1 rounded-full bg-white/10 text-white text-sm border border-white/20"
            >
              <option value="general">일반</option>
              <option value="notice">공지</option>
              <option value="collab">협업</option>
              <option value="support">지원</option>
              <option value="showcase">쇼케이스</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
