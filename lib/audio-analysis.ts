// Audio analysis utilities for practice mode

import { detectPitch } from './audio-utils';
import { PitchDataPoint } from './storage';

const ANALYSIS_INTERVAL = 0.1; // Analyze every 100ms

/**
 * Analyze an audio buffer and extract pitch data over time
 */
export async function analyzeAudioBuffer(
  audioBuffer: AudioBuffer
): Promise<PitchDataPoint[]> {
  const pitchData: PitchDataPoint[] = [];
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const channelData = audioBuffer.getChannelData(0); // Use first channel

  // Analyze in chunks
  const chunkSize = Math.floor(sampleRate * ANALYSIS_INTERVAL);
  let currentTime = 0;

  while (currentTime < duration) {
    const startSample = Math.floor(currentTime * sampleRate);
    const endSample = Math.min(startSample + chunkSize, channelData.length);
    const chunk = channelData.slice(startSample, endSample);

    // Detect pitch in this chunk
    const frequency = detectPitch(chunk, sampleRate);
    
    pitchData.push({
      time: currentTime,
      frequency: frequency,
    });

    currentTime += ANALYSIS_INTERVAL;
  }

  return pitchData;
}

/**
 * Load audio file and convert to AudioBuffer
 */
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Check duration
        if (audioBuffer.duration > 120) {
          reject(new Error('Audio file must be 120 seconds or less it is ' + audioBuffer.duration));
          return;
        }
        
        resolve(audioBuffer);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Calculate performance score by comparing user pitch data to original
 */
export function calculatePerformanceScore(
  originalPitchData: PitchDataPoint[],
  userPitchData: PitchDataPoint[]
): number {
  if (originalPitchData.length === 0 || userPitchData.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let validComparisons = 0;

  // Match up time points (find closest user point for each original point)
  for (const originalPoint of originalPitchData) {
    if (originalPoint.frequency === null) {
      continue; // Skip if no pitch detected in original
    }

    // Find closest user point in time
    let closestUserPoint: PitchDataPoint | null = null;
    let minTimeDiff = Infinity;

    for (const userPoint of userPitchData) {
      const timeDiff = Math.abs(userPoint.time - originalPoint.time);
      if (timeDiff < minTimeDiff && timeDiff < ANALYSIS_INTERVAL * 1.5) {
        minTimeDiff = timeDiff;
        closestUserPoint = userPoint;
      }
    }

    if (closestUserPoint && closestUserPoint.frequency !== null && originalPoint.frequency !== null) {
      // Calculate accuracy (0-1)
      const diff = Math.abs(closestUserPoint.frequency - originalPoint.frequency);
      const relativeDiff = diff / originalPoint.frequency;
      
      // Score: 1.0 for perfect match, 0.0 for >8% difference
      const maxTolerance = 0.08;
      if (relativeDiff <= maxTolerance) {
        const normalized = 1 - (relativeDiff / maxTolerance);
        const accuracy = Math.pow(normalized, 0.5); // Same curve as game mode
        totalScore += accuracy;
        validComparisons++;
      }
    }
  }

  if (validComparisons === 0) {
    return 0;
  }

  // Return score as percentage (0-100)
  return (totalScore / validComparisons) * 100;
}

