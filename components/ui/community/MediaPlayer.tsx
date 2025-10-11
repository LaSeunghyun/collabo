'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import clsx from 'clsx';
import type { AttachmentMetadata } from '@/lib/data/community';

interface MediaPlayerProps {
  attachment: AttachmentMetadata;
}

export function MediaPlayer({ attachment }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    if (!media) return;

    const time = parseFloat(e.target.value);
    media.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    if (!media) return;

    const newVolume = parseFloat(e.target.value);
    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isVideo = attachment.type === 'video';
  const isAudio = attachment.type === 'audio';

  if (isVideo) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black/20">
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={attachment.url}
          poster={attachment.thumbnailUrl}
          className="w-full h-auto max-h-96 object-cover"
          muted={isMuted}
          onClick={togglePlay}
        />
        
        {/* Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-white/80 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-white text-sm">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white text-sm">
                {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleMute}
              className="text-white hover:text-white/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />

            <a
              href={attachment.url}
              download={attachment.filename}
              className="text-white hover:text-white/80 transition-colors"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="rounded-2xl bg-white/5 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          <div className="flex-1">
            <p className="text-white font-medium">{attachment.filename}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/60 text-sm">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white/60 text-sm">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <a
            href={attachment.url}
            download={attachment.filename}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>

        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={attachment.url}
          muted={isMuted}
        />
      </div>
    );
  }

  // Document or other file types
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-white/10">
          <Download className="w-6 h-6 text-white/60" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">{attachment.filename}</p>
          <p className="text-white/60 text-sm">
            {(attachment.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <a
          href={attachment.url}
          download={attachment.filename}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          다운로드
        </a>
      </div>
    </div>
  );
}
