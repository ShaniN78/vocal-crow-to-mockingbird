'use client';

import { useState, useEffect, useRef } from 'react';
import { PitchDataPoint, PracticeRecording, savePracticeRecording, getPracticeHistory, deletePracticeRecording } from '@/lib/storage';
import { loadAudioFile, analyzeAudioBuffer, calculatePerformanceScore } from '@/lib/audio-analysis';
import UploadView from '@/components/practice/UploadView';
import PracticeView from '@/components/practice/PracticeView';
import ResultsView from '@/components/practice/ResultsView';
import HistoryView from '@/components/practice/HistoryView';

interface VocalPracticeProps {
  onBack: () => void;
}

type ViewMode = 'upload' | 'practice' | 'results' | 'history';

export default function VocalPractice({ onBack }: VocalPracticeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [originalPitchData, setOriginalPitchData] = useState<PitchDataPoint[]>([]);
  const [userPitchData, setUserPitchData] = useState<PitchDataPoint[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<PracticeRecording[]>([]);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getPracticeHistory());
  }, []);

  // Initialize audio context and microphone on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        analyserRef.current = analyser;
        setAnalyser(analyser);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      }
    };

    initAudio();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleFileUpload = async (file: File): Promise<void> => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.wav')) {
      alert('Please upload a WAV file');
      return;
    }

    try {
      const buffer = await loadAudioFile(file);
      setAudioBuffer(buffer);
      setUploadedFile(file);

      // Analyze the audio
      const pitchData = await analyzeAudioBuffer(buffer);
      setOriginalPitchData(pitchData);

      setViewMode('practice');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to load audio file');
      throw error; // Re-throw so UploadView can handle the error state
    }
  };

  const handleRecordingComplete = (recordedPitchData: PitchDataPoint[]) => {
    if (recordedPitchData.length === 0) {
      alert('No pitch data recorded. Please try again.');
      setViewMode('practice');
      return;
    }

    setUserPitchData(recordedPitchData);

    // Calculate score
    const calculatedScore = calculatePerformanceScore(originalPitchData, recordedPitchData);
    setScore(calculatedScore);

    // Save to history
    const recording: PracticeRecording = {
      id: `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      fileName: uploadedFile?.name || 'Unknown',
      originalDuration: audioBuffer?.duration || 0,
      originalPitchData: originalPitchData,
      userPitchData: recordedPitchData,
      score: calculatedScore,
    };

    savePracticeRecording(recording);
    setCurrentRecordingId(recording.id);
    setHistory(getPracticeHistory());
    setViewMode('results');
  };

  const handleDelete = (id: string) => {
    deletePracticeRecording(id);
    setHistory(getPracticeHistory());
    if (currentRecordingId === id) {
      setViewMode('upload');
      setCurrentRecordingId(null);
      setUserPitchData([]);
      setScore(null);
    }
  };

  const resetPractice = () => {
    setUserPitchData([]);
    setScore(null);
    setViewMode('practice');
  };

  const viewHistory = () => {
    setHistory(getPracticeHistory());
    setViewMode('history');
  };

  const loadRecording = (recording: PracticeRecording) => {
    setOriginalPitchData(recording.originalPitchData);
    setUserPitchData(recording.userPitchData);
    setScore(recording.score);
    setCurrentRecordingId(recording.id);
    setViewMode('results');
  };

  const getDuration = () => {
    if (originalPitchData.length > 0) {
      return originalPitchData[originalPitchData.length - 1].time;
    }
    return audioBuffer?.duration || 0;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-8 px-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Practice with Sample
          </h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>

        {viewMode === 'upload' && (
          <UploadView
            onFileUpload={handleFileUpload}
            onViewHistory={viewHistory}
            historyCount={history.length}
          />
        )}

        {viewMode === 'practice' && audioBuffer && (
          <PracticeView
            audioBuffer={audioBuffer}
            fileName={uploadedFile?.name || 'Unknown'}
            originalPitchData={originalPitchData}
            analyser={analyser}
            audioContext={audioContextRef.current}
            stream={streamRef.current}
            onRecordingComplete={handleRecordingComplete}
          />
        )}

        {viewMode === 'results' && score !== null && (
          <ResultsView
            score={score}
            originalPitchData={originalPitchData}
            userPitchData={userPitchData}
            duration={getDuration()}
            onPracticeAgain={resetPractice}
            onUploadNew={() => setViewMode('upload')}
            onDelete={() => currentRecordingId && handleDelete(currentRecordingId)}
            showDelete={!!currentRecordingId}
          />
        )}

        {viewMode === 'history' && (
          <HistoryView
            history={history}
            onLoadRecording={loadRecording}
            onDelete={handleDelete}
            onBackToUpload={() => setViewMode('upload')}
          />
        )}
      </div>
    </div>
  );
}
