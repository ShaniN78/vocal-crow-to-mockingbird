'use client';

import { useEffect, useState } from 'react';
import { getLowNote, getHighNote } from '@/lib/storage';

interface MainMenuProps {
  onDetectLow: () => void;
  onDetectHigh: () => void;
  onPlayGame: () => void;
}

export default function MainMenu({ onDetectLow, onDetectHigh, onPlayGame }: MainMenuProps) {
  const [lowNote, setLowNote] = useState<{ name: string; octave: number } | null>(null);
  const [highNote, setHighNote] = useState<{ name: string; octave: number } | null>(null);

  useEffect(() => {
    const low = getLowNote();
    const high = getHighNote();
    if (low) setLowNote({ name: low.name, octave: low.octave });
    if (high) setHighNote({ name: high.name, octave: high.octave });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Vocal Training
        </h1>

        <div className="space-y-4 mb-6">
          <button
            onClick={onDetectLow}
            className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Detect Low Note
            {lowNote && (
              <span className="block text-sm font-normal mt-1">
                Current: {lowNote.name}{lowNote.octave}
              </span>
            )}
          </button>

          <button
            onClick={onDetectHigh}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Detect High Note
            {highNote && (
              <span className="block text-sm font-normal mt-1">
                Current: {highNote.name}{highNote.octave}
              </span>
            )}
          </button>

          <button
            onClick={onPlayGame}
            disabled={!lowNote || !highNote}
            className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Play Game
            {(!lowNote || !highNote) && (
              <span className="block text-sm font-normal mt-1">
                Please detect your vocal range first
              </span>
            )}
          </button>
        </div>

        {(lowNote || highNote) && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Your Vocal Range:
            </h2>
            <p className="text-lg text-gray-800 dark:text-white">
              {lowNote ? `${lowNote.name}${lowNote.octave}` : 'Not detected'} -{' '}
              {highNote ? `${highNote.name}${highNote.octave}` : 'Not detected'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

