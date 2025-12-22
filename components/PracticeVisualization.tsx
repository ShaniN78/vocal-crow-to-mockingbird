'use client';

import { useEffect, useRef } from 'react';
import { PitchDataPoint } from '@/lib/storage';

interface PracticeVisualizationProps {
  originalPitchData: PitchDataPoint[];
  userPitchData: PitchDataPoint[];
  duration: number;
}

export default function PracticeVisualization({
  originalPitchData,
  userPitchData,
  duration,
}: PracticeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const waveformCanvas = waveformCanvasRef.current;
    if (!canvas || !waveformCanvas) return;

    const ctx = canvas.getContext('2d');
    const waveformCtx = waveformCanvas.getContext('2d');
    if (!ctx || !waveformCtx) return;

    const width = canvas.width;
    const height = canvas.height;
    const waveformHeight = waveformCanvas.height;

    // Clear canvases
    ctx.clearRect(0, 0, width, height);
    waveformCtx.clearRect(0, 0, width, waveformHeight);

    // Find frequency range
    let minFreq = Infinity;
    let maxFreq = -Infinity;

    [...originalPitchData, ...userPitchData].forEach(point => {
      if (point.frequency !== null) {
        minFreq = Math.min(minFreq, point.frequency);
        maxFreq = Math.max(maxFreq, point.frequency);
      }
    });

    // Add padding
    const freqRange = maxFreq - minFreq;
    minFreq = Math.max(0, minFreq - freqRange * 0.1);
    maxFreq = maxFreq + freqRange * 0.1;

    // Draw grid and labels
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    ctx.strokeStyle = isDarkMode ? '#4B5563' : '#E5E7EB';
    ctx.fillStyle = isDarkMode ? '#9CA3AF' : '#6B7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // Draw time grid lines
    const timeSteps = Math.ceil(duration);
    for (let i = 0; i <= timeSteps; i++) {
      const x = (i / timeSteps) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      if (i < timeSteps) {
        ctx.fillText(`${i}s`, x, height - 5);
      }
    }

    // Draw frequency grid lines
    const freqSteps = 5;
    for (let i = 0; i <= freqSteps; i++) {
      const y = (i / freqSteps) * height;
      const freq = maxFreq - (i / freqSteps) * (maxFreq - minFreq);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(freq)}Hz`, width - 5, y + 4);
      ctx.textAlign = 'center';
    }

    // Draw original pitch line (blue)
    ctx.strokeStyle = '#3B82F6'; // blue-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    let hasStarted = false;

    originalPitchData.forEach((point, index) => {
      if (point.frequency !== null) {
        const x = (point.time / duration) * width;
        const y = height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * height;
        
        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    // Draw user pitch line (red)
    ctx.strokeStyle = '#EF4444'; // red-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    hasStarted = false;

    userPitchData.forEach((point) => {
      if (point.frequency !== null) {
        const x = (point.time / duration) * width;
        const y = height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * height;
        
        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    // Draw points for better visibility
    originalPitchData.forEach((point) => {
      if (point.frequency !== null) {
        const x = (point.time / duration) * width;
        const y = height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * height;
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    userPitchData.forEach((point) => {
      if (point.frequency !== null) {
        const x = (point.time / duration) * width;
        const y = height - ((point.frequency - minFreq) / (maxFreq - minFreq)) * height;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw waveform (simplified - showing amplitude over time)
    waveformCtx.strokeStyle = isDarkMode ? '#6B7280' : '#9CA3AF';
    waveformCtx.lineWidth = 1;
    waveformCtx.beginPath();
    
    // For waveform, we'll show a simple representation
    // In a real implementation, you'd analyze the actual audio waveform
    const waveformPoints = Math.min(originalPitchData.length, 200);
    for (let i = 0; i < waveformPoints; i++) {
      const x = (i / waveformPoints) * width;
      // Simple sine wave representation (in real app, use actual audio data)
      const y = waveformHeight / 2 + Math.sin(i * 0.1) * (waveformHeight / 4);
      
      if (i === 0) {
        waveformCtx.moveTo(x, y);
      } else {
        waveformCtx.lineTo(x, y);
      }
    }
    waveformCtx.stroke();
  }, [originalPitchData, userPitchData, duration]);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Pitch Comparison
        </h3>
        <div className="flex items-center gap-4 mb-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Original</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Your Performance</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-auto border border-gray-300 dark:border-gray-600 rounded"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          Waveform
        </h3>
        <canvas
          ref={waveformCanvasRef}
          width={800}
          height={100}
          className="w-full h-auto border border-gray-300 dark:border-gray-600 rounded"
        />
      </div>
    </div>
  );
}

