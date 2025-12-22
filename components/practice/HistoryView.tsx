'use client';

import { PracticeRecording } from '@/lib/storage';

interface HistoryViewProps {
  history: PracticeRecording[];
  onLoadRecording: (recording: PracticeRecording) => void;
  onDelete: (id: string) => void;
  onBackToUpload: () => void;
}

export default function HistoryView({
  history,
  onLoadRecording,
  onDelete,
  onBackToUpload,
}: HistoryViewProps) {
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Practice History
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No practice recordings yet.
        </p>
      ) : (
        <div className="space-y-3">
          {history.slice().reverse().map((recording) => (
            <div
              key={recording.id}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-800 dark:text-white">
                  {recording.fileName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(recording.timestamp).toLocaleString()} • 
                  Score: {recording.score.toFixed(1)}% • 
                  Duration: {recording.originalDuration.toFixed(1)}s
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoadRecording(recording)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(recording.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBackToUpload}
        className="w-full py-3 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
      >
        Back to Upload
      </button>
    </div>
  );
}

