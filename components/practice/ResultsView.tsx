'use client';

import { PitchDataPoint } from '@/lib/storage';
import PracticeVisualization from '@/components/PracticeVisualization';

interface ResultsViewProps {
  score: number;
  originalPitchData: PitchDataPoint[];
  userPitchData: PitchDataPoint[];
  duration: number;
  onPracticeAgain: () => void;
  onUploadNew: () => void;
  onDelete: () => void;
  showDelete: boolean;
}

export default function ResultsView({
  score,
  originalPitchData,
  userPitchData,
  duration,
  onPracticeAgain,
  onUploadNew,
  onDelete,
  showDelete,
}: ResultsViewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Performance Score</h2>
        <div className="text-5xl font-bold text-white">{score.toFixed(1)}%</div>
      </div>

      <PracticeVisualization
        originalPitchData={originalPitchData}
        userPitchData={userPitchData}
        duration={duration}
      />

      <div className="flex gap-4">
        <button
          onClick={onPracticeAgain}
          className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Practice Again
        </button>
        <button
          onClick={onUploadNew}
          className="flex-1 py-3 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          Upload New Sample
        </button>
        {showDelete && (
          <button
            onClick={onDelete}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

