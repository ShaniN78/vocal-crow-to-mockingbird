'use client';

import { useState } from 'react';

interface UploadViewProps {
  onFileUpload: (file: File) => Promise<void>;
  onViewHistory: () => void;
  historyCount: number;
}

export default function UploadView({ onFileUpload, onViewHistory, historyCount }: UploadViewProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await onFileUpload(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center ${isUploading ? 'opacity-75' : ''}`}>
        <input
          type="file"
          accept=".wav"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className={`block ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <svg
                  className="animate-spin h-12 w-12 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Processing audio file...
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we analyze your sample
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-4">🎵</div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload a WAV file (max 120 seconds)
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Click to select a file
              </div>
            </>
          )}
        </label>
      </div>

      {historyCount > 0 && (
        <button
          onClick={onViewHistory}
          className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          View Practice History ({historyCount})
        </button>
      )}
    </div>
  );
}

