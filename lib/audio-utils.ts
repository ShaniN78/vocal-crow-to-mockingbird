// Audio utilities for pitch detection and note generation

import { playPianoish } from "./play-pianoish";

export interface Note {
  name: string;
  octave: number;
  frequency: number;
}

// Note frequencies for A1 to F6
const NOTE_FREQUENCIES: { [key: string]: number[] } = {
  'C': [32.70, 65.41, 130.81, 261.63, 523.25, 1046.50],
  'C#': [34.65, 69.30, 138.59, 277.18, 554.37, 1108.73],
  'D': [36.71, 73.42, 146.83, 293.66, 587.33, 1174.66],
  'D#': [38.89, 77.78, 155.56, 311.13, 622.25, 1244.51],
  'E': [41.20, 82.41, 164.81, 329.63, 659.25, 1318.51],
  'F': [43.65, 87.31, 174.61, 349.23, 698.46, 1396.91],
  'F#': [46.25, 92.50, 185.00, 369.99, 739.99, 1479.98],
  'G': [49.00, 98.00, 196.00, 392.00, 783.99, 1567.98],
  'G#': [51.91, 103.83, 207.65, 415.30, 830.61, 1661.22],
  'A': [55.00, 110.00, 220.00, 440.00, 880.00, 1760.00],
  'A#': [58.27, 116.54, 233.08, 466.16, 932.33, 1864.66],
  'B': [61.74, 123.47, 246.94, 493.88, 987.77, 1975.53],
};

// Autocorrelation-based pitch detection
export function detectPitch(audioBuffer: Float32Array, sampleRate: number): number | null {
  const bufferSize = audioBuffer.length;
  const minPeriod = Math.floor(sampleRate / 800); // Max frequency ~800 Hz
  const maxPeriod = Math.floor(sampleRate / 80);  // Min frequency ~80 Hz

  let maxCorrelation = 0;
  let bestPeriod = 0;

  // Autocorrelation
  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < bufferSize - period; i++) {
      correlation += audioBuffer[i] * audioBuffer[i + period];
    }
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestPeriod === 0 || maxCorrelation < 0.1) {
    return null;
  }

  const frequency = sampleRate / bestPeriod;
  return frequency;
}

// Convert frequency to note
export function frequencyToNote(frequency: number): Note | null {
  if (frequency < 27.5 || frequency > 1760) {
    return null;
  }

  let closestNote: Note | null = null;
  let minDistance = Infinity;

  for (const [noteName, frequencies] of Object.entries(NOTE_FREQUENCIES)) {
    for (let octave = 0; octave < frequencies.length; octave++) {
      const noteFreq = frequencies[octave];
      const distance = Math.abs(frequency - noteFreq);
      if (distance < minDistance) {
        minDistance = distance;
        closestNote = {
          name: noteName,
          octave: octave + 1,
          frequency: noteFreq,
        };
      }
    }
  }

  // Check if the detected note is close enough (within 50 cents = ~3% frequency difference)
  if (closestNote && minDistance / closestNote.frequency < 0.03) {
    return closestNote;
  }

  return null;
}

// Get all notes in range from lowNote to highNote
export function getNotesInRange(lowNote: Note, highNote: Note): Note[] {
  const notes: Note[] = [];
  const noteNames = Object.keys(NOTE_FREQUENCIES);
  
  const lowIndex = noteNames.indexOf(lowNote.name);
  const highIndex = noteNames.indexOf(highNote.name);
  const lowOctave = lowNote.octave;
  const highOctave = highNote.octave;

  for (let octave = lowOctave; octave <= highOctave; octave++) {
    const startIndex = octave === lowOctave ? lowIndex : 0;
    const endIndex = octave === highOctave ? highIndex : noteNames.length - 1;
    
    for (let i = startIndex; i <= endIndex; i++) {
      const noteName = noteNames[i];
      const frequency = NOTE_FREQUENCIES[noteName][octave - 1];
      notes.push({
        name: noteName,
        octave,
        frequency,
      });
    }
  }

  return notes;
}

// Generate a piano-like tone with harmonics
export function playTone(frequency: number, duration: number, audioContext: AudioContext): void {
  playPianoish(frequency, duration, audioContext, 0.9);
}

// Check if a frequency matches a target frequency (within tolerance)
export function isOnPitch(detectedFreq: number, targetFreq: number, tolerance: number = 0.02): boolean {
  const diff = Math.abs(detectedFreq - targetFreq);
  return diff / targetFreq < tolerance;
}

// Calculate pitch accuracy score (0-1) based on how close the pitch is to target
// Returns a value from 0 (far off) to 1 (perfect)
export function getPitchAccuracy(detectedFreq: number, targetFreq: number, maxTolerance: number = 0.08): number {
  const diff = Math.abs(detectedFreq - targetFreq);
  const relativeDiff = diff / targetFreq;
  
  if (relativeDiff > maxTolerance) {
    return 0; // Too far off
  }
  
  // Linear scale: perfect (0% diff) = 1.0, max tolerance (8% diff) = 0.0
  // Use a gentler curve so even being somewhat close gives decent points
  const normalized = 1 - (relativeDiff / maxTolerance);
  
  // Apply a gentler curve (power of 0.5 = square root) so we get better scores
  // This ensures even 50% accuracy gives reasonable points (0.71)
  // Being 75% accurate gives 0.87 points
  return Math.pow(normalized, 0.5);
}

