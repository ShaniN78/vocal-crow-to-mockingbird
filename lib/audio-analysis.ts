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
 * Convert frequency difference to cents (musically accurate unit)
 * 1 semitone = 100 cents, and frequency doubles every 12 semitones
 */
function frequencyToCents(freq1: number, freq2: number): number {
  if (freq1 === 0 || freq2 === 0) return Infinity;
  return 1200 * Math.log2(freq2 / freq1);
}

/**
 * Calculate performance score by comparing user pitch data to original
 * Uses cents (musical intervals) for more accurate scoring
 */
export function calculatePerformanceScore(
  originalPitchData: PitchDataPoint[],
  userPitchData: PitchDataPoint[]
): number {
  if (originalPitchData.length === 0 || userPitchData.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let totalComparisons = 0;

  // Match up time points (find closest user point for each original point)
  for (const originalPoint of originalPitchData) {
    if (originalPoint.frequency === null || originalPoint.frequency <= 0) {
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

    if (closestUserPoint && closestUserPoint.frequency !== null && closestUserPoint.frequency > 0) {
      totalComparisons++;
      
      // Calculate difference in cents (musically accurate)
      const centsDiff = Math.abs(frequencyToCents(originalPoint.frequency, closestUserPoint.frequency));
      
      // Strict tolerance: 50 cents = half a semitone (~3% frequency difference)
      // This is the threshold for "in tune" - professional singers aim for <25 cents
      const maxToleranceCents = 50;
      
      if (centsDiff <= maxToleranceCents) {
        // Calculate accuracy: perfect (0 cents) = 1.0, at tolerance (50 cents) = 0.0
        // Use a steeper curve (squared) so only very accurate singing gets high scores
        const normalized = 1 - (centsDiff / maxToleranceCents);
        const accuracy = normalized * normalized; // Squared curve - stricter scoring
        totalScore += accuracy;
      }
      // If outside tolerance, accuracy = 0 (no points), but still counts as comparison
    }
  }

  if (totalComparisons === 0) {
    return 0;
  }

  // Return score as percentage (0-100)
  return (totalScore / totalComparisons) * 100;
}

