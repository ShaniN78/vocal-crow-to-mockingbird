'use client';

import { useState, useEffect, useRef } from 'react';
import { Note, playTone, detectPitch, frequencyToNote, isOnPitch, getNotesInRange, getPitchAccuracy } from '@/lib/audio-utils';
import { getLowNote, getHighNote } from '@/lib/storage';
import PitchVisualization from '@/components/PitchVisualization';
import SingingTips from '@/components/SingingTips';
import VolumeMeter from '@/components/VolumeMeter';

interface GameProps {
  onBack: () => void;
}

type NoteDuration = 'short' | 'medium' | 'long';

const DURATION_MAP: Record<NoteDuration, number> = {
  short: 3,
  medium: 6,
  long: 9,
};

export default function Game({ onBack }: GameProps) {
  const [score, setScore] = useState(0);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0); // Remaining recording time in seconds
  const [totalRecordingTime, setTotalRecordingTime] = useState(0); // Total time spent recording
  const [noteDuration, setNoteDuration] = useState<NoteDuration>('medium');
  const [timeOnTone, setTimeOnTone] = useState(0);
  const [isOnPitchState, setIsOnPitchState] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const availableNotesRef = useRef<Note[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const timeOnToneRef = useRef(0);
  const roundScoreRef = useRef(0);
  const accumulatedScoreRef = useRef(0); // Track fractional score
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownPitchDetectionRef = useRef<number | null>(null);
  const isCountdownActiveRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Auto-start recording when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && currentNote && !isRecording && !isPlaying) {
      // Small delay to ensure countdown UI updates
      const timer = setTimeout(() => {
        startRecording();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, currentNote, isRecording, isPlaying]);

  // Effect to add roundScore to total score when recording stops
  useEffect(() => {
    if (!isRecording && roundScore > 0 && recordingTime === 0) {
      // Add the round score to total score
      setScore((prevScore) => prevScore + roundScore);
      // Reset roundScore after adding to total
      roundScoreRef.current = 0;
      setRoundScore(0);
    }
  }, [isRecording, roundScore, recordingTime]);

  useEffect(() => {
    const lowNote = getLowNote();
    const highNote = getHighNote();
    if (lowNote && highNote) {
      availableNotesRef.current = getNotesInRange(lowNote, highNote);
    }

    // Initialize microphone for volume meter
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
      }
    };

    initializeMicrophone();

    return () => {
      cleanup();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (countdownPitchDetectionRef.current) {
        cancelAnimationFrame(countdownPitchDetectionRef.current);
      }
      if (recordingTimerIntervalRef.current) {
        clearInterval(recordingTimerIntervalRef.current);
      }
    };
  }, []);

  // Track previous recording state to detect transitions
  const prevIsRecordingRef = useRef(false);
  
  // Effect to add roundScore to total score when recording stops
  useEffect(() => {
    // Detect when recording transitions from true to false
    if (prevIsRecordingRef.current && !isRecording) {
      // Recording just stopped - add round score to total if we have points
      const scoreToAdd = roundScoreRef.current > 0 ? roundScoreRef.current : roundScore;
      if (scoreToAdd > 0) {
        setScore((prevScore) => prevScore + scoreToAdd);
        // Reset roundScore after adding to total
        roundScoreRef.current = 0;
        setRoundScore(0);
      }
    }
    prevIsRecordingRef.current = isRecording;
  }, [isRecording, roundScore]);

  const cleanup = () => {
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

  const startAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playRandomNote = async () => {
    if (availableNotesRef.current.length === 0) return;

    const audioContext = await startAudioContext();
    const randomIndex = Math.floor(Math.random() * availableNotesRef.current.length);
    const note = availableNotesRef.current[randomIndex];
    
    setCurrentNote(note);
    setIsPlaying(true);
    roundScoreRef.current = 0;
    accumulatedScoreRef.current = 0;
    setRoundScore(0);
    setCountdown(null);
    setRecordingTime(0);
    setCurrentPitch(null);
    timeOnToneRef.current = 0;
    setTimeOnTone(0);
    setIsOnPitchState(false);

    playTone(note.frequency, DURATION_MAP[noteDuration], audioContext);

    setTimeout(() => {
      setIsPlaying(false);
      // Start 2-second countdown
      setCountdown(2);
      let countdownValue = 2;
      
      // Start pitch detection during countdown (for visualization only, no scoring)
      isCountdownActiveRef.current = true;
      
      const startCountdownPitchDetection = () => {
        if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current || !note) {
          return;
        }

        const detectPitchDuringCountdown = () => {
          // Stop if countdown is done or recording has started
          if (!isCountdownActiveRef.current || !analyserRef.current || !dataArrayRef.current || !audioContextRef.current) {
            if (countdownPitchDetectionRef.current) {
              cancelAnimationFrame(countdownPitchDetectionRef.current);
              countdownPitchDetectionRef.current = null;
            }
            return;
          }

          const audioData = new Float32Array(dataArrayRef.current.length);
          analyserRef.current.getFloatTimeDomainData(audioData);
          const pitch = detectPitch(audioData, audioContextRef.current.sampleRate);

          if (pitch && pitch > 80 && pitch < 800) {
            setCurrentPitch(pitch);
            // Use lenient tolerance for visualization during countdown (0.08 = ~8%)
            const onPitch = isOnPitch(pitch, note.frequency, 0.08);
            setIsOnPitchState(onPitch);
          } else {
            setCurrentPitch(null);
            setIsOnPitchState(false);
          }

          countdownPitchDetectionRef.current = requestAnimationFrame(detectPitchDuringCountdown);
        };

        detectPitchDuringCountdown();
      };

      // Start pitch detection for countdown
      if (analyserRef.current && audioContextRef.current) {
        startCountdownPitchDetection();
      }

      countdownIntervalRef.current = setInterval(() => {
        countdownValue--;
        if (countdownValue < 0) {
          isCountdownActiveRef.current = false;
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          // Stop countdown pitch detection
          if (countdownPitchDetectionRef.current) {
            cancelAnimationFrame(countdownPitchDetectionRef.current);
            countdownPitchDetectionRef.current = null;
          }
          setCountdown(null);
        } else {
          setCountdown(countdownValue);
        }
      }, 1000);
    }, DURATION_MAP[noteDuration] * 1000);
  };

  const startRecording = async () => {
    if (!currentNote) return;

    // If microphone wasn't initialized, try now
    if (!audioContextRef.current || !analyserRef.current) {
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
    startTimeRef.current = Date.now();
    timeOnToneRef.current = 0;
    setCountdown(null);
    
    // Start recording timer - countdown from note duration
    const duration = DURATION_MAP[noteDuration];
    setRecordingTime(duration);

    // Clear any existing timer
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
    }

    // Update timer every 0.1 seconds
    recordingTimerIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = Math.max(0, prev - 0.1);
        if (newTime <= 0) {
          // Time's up - stop recording automatically
          if (recordingTimerIntervalRef.current) {
            clearInterval(recordingTimerIntervalRef.current);
            recordingTimerIntervalRef.current = null;
          }
          // Stop recording
          isRecordingRef.current = false;
          setIsRecording(false);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          setTotalRecordingTime((prevTotal) => prevTotal + duration);
          // Reset round state (score will be added by useEffect when isRecording becomes false)
          setCurrentPitch(null);
          setIsOnPitchState(false);
          timeOnToneRef.current = 0;
          setTimeOnTone(0);
          // Don't reset roundScore here - let useEffect handle adding it to total score
          accumulatedScoreRef.current = 0;
          // Don't auto-play - wait for user to click "Play Note" button
        }
        return newTime;
      });
    }, 100); // 0.1 seconds = 100ms

    const detect = () => {
      if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current || !isRecordingRef.current || !currentNote) {
        return;
      }

      const audioData = new Float32Array(dataArrayRef.current.length);
      analyserRef.current.getFloatTimeDomainData(audioData);
      const pitch = detectPitch(audioData, audioContextRef.current.sampleRate);

      if (pitch && pitch > 80 && pitch < 800) {
        setCurrentPitch(pitch);
        // Calculate pitch accuracy (0-1 scale)
        const accuracy = getPitchAccuracy(pitch, currentNote.frequency, 0.08);
        const onPitch = accuracy > 0; // Consider "on pitch" if accuracy > 0
        setIsOnPitchState(onPitch);

        if (onPitch) {
          // Award points based on accuracy - closer = more points
          // Minimum: 5 points/sec even at low accuracy, up to 50 points/sec at perfect
          // This ensures you always get points when "on tone"
          const minPointsPerSecond = 5;
          const maxPointsPerSecond = 50;
          const pointsPerSecond = minPointsPerSecond + (accuracy * (maxPointsPerSecond - minPointsPerSecond));
          
          timeOnToneRef.current += 16.67; // ~60fps
          setTimeOnTone(timeOnToneRef.current);
          
          // Accumulate fractional score (don't floor yet)
          // Points per frame: (pointsPerSecond * 16.67ms) / 1000ms
          const additionalScore = (pointsPerSecond * 16.67) / 1000;
          accumulatedScoreRef.current += additionalScore;
          // Award points more frequently - award 1 point every 0.05 accumulated (every 20 increments)
          // This means even at minimum (5 pts/sec), you get 1 point every ~200ms
          const pointsToAward = Math.floor(accumulatedScoreRef.current * 20); // Award 1 point per 0.05 accumulated
          if (pointsToAward > 0) {
            roundScoreRef.current += pointsToAward;
            accumulatedScoreRef.current -= pointsToAward / 20; // Subtract the awarded portion
            // Force state update with the current ref value
            setRoundScore(roundScoreRef.current);
          }
        }
      } else {
        setCurrentPitch(null);
        setIsOnPitchState(false);
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
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
      recordingTimerIntervalRef.current = null;
    }
    // Don't stop the stream - keep it alive for volume meter

    // Score will be added by useEffect when isRecording becomes false
    setRecordingTime((prevTime) => {
      if (prevTime > 0) {
        const duration = DURATION_MAP[noteDuration];
        const timeUsed = duration - prevTime;
        setTotalRecordingTime((prev) => prev + timeUsed);
      }
      return 0;
    });
  };

  const nextRound = () => {
    stopRecording();
    setCurrentNote(null);
    setIsOnPitchState(false);
    setTimeOnTone(0);
    timeOnToneRef.current = 0;
    roundScoreRef.current = 0;
    accumulatedScoreRef.current = 0;
    setRoundScore(0);
    setCurrentPitch(null);
    setCountdown(null);
    setRecordingTime(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Play Game</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Note Duration
          </label>
          <div className="flex gap-2">
            {(['short', 'medium', 'long'] as NoteDuration[]).map((duration) => (
              <button
                key={duration}
                onClick={() => setNoteDuration(duration)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  noteDuration === duration
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {duration} ({DURATION_MAP[duration]}s)
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Total Score: {score}
          </div>
          {isRecording && roundScore > 0 && (
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Round Score: {roundScore}
            </div>
          )}
          {!isRecording && roundScore > 0 && (
            <div className="text-xl text-green-600 dark:text-green-400 mb-2">
              Round: +{roundScore}
            </div>
          )}
          {totalRecordingTime > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total time: {totalRecordingTime.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Volume Meter */}
        <VolumeMeter analyser={analyser} />

        {currentNote && (
          <div className="mb-6">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg mb-4">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {currentNote.name}{currentNote.octave}
              </div>
              {countdown !== null && (
                <div className="text-6xl font-bold text-purple-600 dark:text-purple-400">
                  {countdown}
                </div>
              )}
              {isRecording && recordingTime > 0 && (
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {recordingTime.toFixed(1)}s
                </div>
              )}
            </div>

            {/* Pitch Visualization - show during countdown and recording */}
            {currentNote && (countdown !== null || isRecording) && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <PitchVisualization
                  targetFrequency={currentNote.frequency}
                  currentPitch={currentPitch}
                  isOnPitch={isOnPitchState}
                />
                {isRecording && (
                  <div className="mt-3 text-center">
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      isOnPitchState
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {isOnPitchState ? '✓ On Tone' : 'Adjust Pitch'}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Time on tone: {(timeOnTone / 1000).toFixed(1)}s
                    </div>
                  </div>
                )}
                {countdown !== null && !isRecording && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get ready to sing...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {!currentNote && !isPlaying && (
            <button
              onClick={playRandomNote}
              className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
            >
              Play Note
            </button>
          )}

          {isPlaying && (
            <div className="text-center py-4 px-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                Listen to the note...
              </p>
            </div>
          )}

          {currentNote && !isPlaying && !isRecording && countdown === null && recordingTime === 0 && (
            <div className="space-y-4">
              <SingingTips />
              <button
                onClick={playRandomNote}
                className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
              >
                Play Next Note
              </button>
            </div>
          )}

          {isRecording && (
            <div className="space-y-2">
              <div className="text-center py-2">
                <div className="inline-block w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-red-500 font-semibold">Recording...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

