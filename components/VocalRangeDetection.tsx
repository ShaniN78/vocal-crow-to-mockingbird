'use client';

import { useState, useEffect, useRef } from 'react';
import { detectPitch, frequencyToNote, Note } from '@/lib/audio-utils';
import { saveLowNote, saveHighNote } from '@/lib/storage';
import VolumeMeter from '@/components/VolumeMeter';

interface VocalRangeDetectionProps {
  mode: 'low' | 'high';
  onComplete: (note: Note) => void;
  onCancel: () => void;
}

export default function VocalRangeDetection({
  mode,
  onComplete,
  onCancel,
}: VocalRangeDetectionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [detectedNote, setDetectedNote] = useState<Note | null>(null);
  const [bestNote, setBestNote] = useState<Note | null>(null); // Track the best (lowest/highest) note
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedNotesRef = useRef<Note[]>([]);
  const isRecordingRef = useRef(false);

  // Initialize microphone access on mount for volume meter
  useEffect(() => {
    const initializeMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        analyserRef.current = analyser;
        setAnalyser(analyser);
        dataArrayRef.current = new Float32Array(analyser.frequencyBinCount);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        // Don't show alert here, let the user try when they click "Start Singing"
      }
    };

    initializeMicrophone();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!audioContextRef.current || !analyserRef.current) {
      // If microphone wasn't initialized, try now
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        analyserRef.current = analyser;
        setAnalyser(analyser);
        dataArrayRef.current = new Float32Array(analyser.frequencyBinCount);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
        return;
      }
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    detectedNotesRef.current = [];
    setDetectedNote(null);
    setBestNote(null);
    setCurrentFrequency(null);

    const detect = () => {
      // Check if still recording using ref
      if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current || !isRecordingRef.current) {
        return;
      }

      const audioData = new Float32Array(dataArrayRef.current.length);
      analyserRef.current.getFloatTimeDomainData(audioData);
      const pitch = detectPitch(audioData, audioContextRef.current.sampleRate);

      if (pitch && pitch > 80 && pitch < 800) {
        setCurrentFrequency(pitch);
        const note = frequencyToNote(pitch);
        if (note) {
          setDetectedNote(note);
          detectedNotesRef.current.push(note);
          
          // Update best note (lowest for low mode, highest for high mode)
          setBestNote((currentBest) => {
            if (!currentBest) return note;
            
            if (mode === 'low') {
              // For low mode, keep the note with lower frequency
              return note.frequency < currentBest.frequency ? note : currentBest;
            } else {
              // For high mode, keep the note with higher frequency
              return note.frequency > currentBest.frequency ? note : currentBest;
            }
          });
        }
      } else {
        setCurrentFrequency(null);
        // Don't clear detectedNote - keep the last detected note visible
      }

      if (isRecordingRef.current) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Don't stop the stream - keep it alive for the volume meter
    // The stream will be stopped when the component unmounts or cancel is clicked
  };

  const saveNote = () => {
    // Use bestNote if available, otherwise use detectedNote
    const noteToSave = bestNote || detectedNote;
    if (!noteToSave) return;

    if (mode === 'low') {
      saveLowNote(noteToSave);
    } else {
      saveHighNote(noteToSave);
    }

    stopRecording();
    onComplete(noteToSave);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Detect {mode === 'low' ? 'Low' : 'High'} Note
        </h2>

        <div className="mb-6">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            Sing your {mode === 'low' ? 'lowest' : 'highest'} comfortable note. Hold it steady.
          </p>

          {/* Volume Meter */}
          <VolumeMeter analyser={analyserRef.current} onVolumeChange={setVolumeLevel} />

          {isRecording && (
            <div className="text-center mb-4">
              <div className="inline-block w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-red-500 font-semibold">Recording...</span>
            </div>
          )}

          {/* Note display area with fixed height to prevent flickering */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4 min-h-[120px] flex flex-col justify-center">
            {bestNote || detectedNote ? (
              <>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {(bestNote || detectedNote)!.name}{(bestNote || detectedNote)!.octave}
                </div>
                {currentFrequency && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentFrequency.toFixed(1)} Hz
                  </div>
                )}
                {!currentFrequency && (bestNote || detectedNote) && (
                  <div className="text-sm text-gray-500 dark:text-gray-500 italic">
                    {(bestNote || detectedNote)!.name}{(bestNote || detectedNote)!.octave} detected
                  </div>
                )}
              </>
            ) : (
              isRecording && (
                <p className="text-gray-600 dark:text-gray-400">
                  {volumeLevel > 0.01 ? 'Sing a clear note...' : 'Waiting for audio...'}
                </p>
              )
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              Start Singing
            </button>
          ) : (
            <>
              <button
                onClick={saveNote}
                disabled={!bestNote && !detectedNote}
                className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={stopRecording}
                className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Stop
              </button>
            </>
          )}
          <button
            onClick={() => {
              stopRecording();
              onCancel();
            }}
            className="py-3 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

