// LocalStorage utilities for session management

const STORAGE_KEYS = {
  SESSION_ID: 'vocal_session_id',
  LOW_NOTE: 'vocal_low_note',
  HIGH_NOTE: 'vocal_high_note',
} as const;

export interface StoredNote {
  name: string;
  octave: number;
  frequency: number;
}

// Generate or retrieve session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

// Save low note
export function saveLowNote(note: StoredNote): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LOW_NOTE, JSON.stringify(note));
}

// Save high note
export function saveHighNote(note: StoredNote): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.HIGH_NOTE, JSON.stringify(note));
}

// Get low note
export function getLowNote(): StoredNote | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.LOW_NOTE);
  return stored ? JSON.parse(stored) : null;
}

// Get high note
export function getHighNote(): StoredNote | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.HIGH_NOTE);
  return stored ? JSON.parse(stored) : null;
}

// Check if vocal range is detected
export function hasVocalRange(): boolean {
  return getLowNote() !== null && getHighNote() !== null;
}

