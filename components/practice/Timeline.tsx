'use client';

import { useEffect, useRef } from 'react';

interface TimelineProps {
  duration: number;
  currentTime: number;
  isActive: boolean;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
}

export default function Timeline({ duration, currentTime, isActive, isPlaying = false, onSeek }: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const bgColor = isDarkMode ? '#1F2937' : '#F3F4F6';
    const lineColor = isDarkMode ? '#4B5563' : '#D1D5DB';
    const indicatorColor = '#EF4444'; // red-500

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw time markers
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = isDarkMode ? '#9CA3AF' : '#6B7280';
    ctx.textAlign = 'center';

    const markerInterval = duration > 30 ? 10 : duration > 10 ? 5 : 1; // Show markers every 10s, 5s, or 1s
    const numMarkers = Math.ceil(duration / markerInterval);

    for (let i = 0; i <= numMarkers; i++) {
      const time = i * markerInterval;
      if (time > duration) break;

      const x = (time / duration) * width;
      
      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw time label
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillText(label, x, height - 5);
    }

    // Draw current time indicator (vertical line)
    if (isActive && currentTime > 0) {
      const indicatorX = (currentTime / duration) * width;
      ctx.strokeStyle = indicatorColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indicatorX, 0);
      ctx.lineTo(indicatorX, height);
      ctx.stroke();

      // Draw indicator circle
      ctx.fillStyle = indicatorColor;
      ctx.beginPath();
      ctx.arc(indicatorX, height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [duration, currentTime, isActive]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || !onSeek || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickRatio = x / rect.width;
    const seekTime = Math.max(0, Math.min(duration, clickRatio * duration));
    
    onSeek(seekTime);
  };

  return (
    <div className="space-y-2">
      <div className="relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={800}
          height={60}
          className={`w-full h-auto border border-gray-300 dark:border-gray-600 rounded ${isPlaying ? 'cursor-pointer' : ''}`}
          onClick={handleClick}
        />
      </div>
      <div className="flex justify-end items-center">
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

