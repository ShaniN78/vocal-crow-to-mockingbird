'use client';

import { useState, useEffect, useRef } from 'react';

interface VolumeMeterProps {
  analyser: AnalyserNode | null;
  onVolumeChange?: (volume: number) => void;
}

export default function VolumeMeter({ analyser, onVolumeChange }: VolumeMeterProps) {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!analyser) {
      setVolumeLevel(0);
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      return;
    }

    // Initialize data array if needed
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Float32Array(analyser.frequencyBinCount);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Start volume monitoring
    const monitorVolume = () => {
      if (!analyser || !dataArrayRef.current || !canvas || !ctx) return;

      const audioData = new Float32Array(dataArrayRef.current.length);
      analyser.getFloatTimeDomainData(audioData);

      // Calculate RMS (Root Mean Square) for volume level
      let sum = 0;
      for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i] * audioData[i];
      }
      const rms = Math.sqrt(sum / audioData.length);
      const volume = Math.min(rms * 10, 1); // Scale and clamp to 0-1
      
      setVolumeLevel(volume);
      onVolumeChange?.(volume);

      // Update canvas dimensions if needed (in case of resize)
      const currentRect = canvas.getBoundingClientRect();
      if (currentRect.width !== canvas.width || currentRect.height !== canvas.height) {
        canvas.width = currentRect.width;
        canvas.height = currentRect.height;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const radius = canvas.height / 2;
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Helper function to draw rounded rectangle path
      const drawRoundedRect = (x: number, y: number, width: number, height: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // Draw background
      ctx.fillStyle = isDark ? '#374151' : '#e5e7eb'; // gray-700 or gray-200
      drawRoundedRect(0, 0, canvas.width, canvas.height, radius);
      ctx.fill();

      // Draw volume bar with gradient
      const barWidth = volume * canvas.width;
      if (barWidth > 0) {
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#34d399'); // green-400
        gradient.addColorStop(0.5, '#fbbf24'); // yellow-400
        gradient.addColorStop(1, '#ef4444'); // red-500

        ctx.fillStyle = gradient;
        // Clip to rounded rectangle
        ctx.save();
        drawRoundedRect(0, 0, canvas.width, canvas.height, radius);
        ctx.clip();
        // Draw the bar (will be clipped to rounded shape)
        ctx.fillRect(0, 0, barWidth, canvas.height);
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(monitorVolume);
    };

    monitorVolume();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [analyser, onVolumeChange]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Volume:</span>
        <div className="flex-1 h-4 rounded-full overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ height: '16px' }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
          {Math.round(volumeLevel * 100)}%
        </span>
      </div>
    </div>
  );
}

