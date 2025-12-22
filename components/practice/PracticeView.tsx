'use client';

import { useState, useEffect, useRef } from 'react';
import { PitchDataPoint } from '@/lib/storage';
import { detectPitch } from '@/lib/audio-utils';
import { BufferedAudio } from '@/lib/buffer-audio';
import VolumeMeter from '@/components/VolumeMeter';
import PracticeVisualization from '@/components/PracticeVisualization';
import Timeline from './Timeline';

interface PracticeViewProps {
  audioBuffer: AudioBuffer;
  fileName: string;
  originalPitchData: PitchDataPoint[];
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  stream: MediaStream | null;
  onRecordingComplete: (userPitchData: PitchDataPoint[]) => void;
}

const ANALYSIS_INTERVAL = 0.1; // 100ms intervals

export default function PracticeView({
  audioBuffer,
  fileName,
  originalPitchData,
  analyser,
  audioContext,
  stream,
  onRecordingComplete,
}: PracticeViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userPitchData, setUserPitchData] = useState<PitchDataPoint[]>([]);

  const bufferedAudioRef = useRef<BufferedAudio | null>(null);
  const recordingBufferedAudioRef = useRef<BufferedAudio | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const playbackAnimationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    analyserRef.current = analyser;
  }, [analyser]);

  // Initialize BufferedAudio when audioBuffer or audioContext changes
  useEffect(() => {
    if (audioBuffer && audioContext) {
      bufferedAudioRef.current = new BufferedAudio(audioContext, audioBuffer);
      bufferedAudioRef.current.init();
      
      // Set up callback for when playback ends
      bufferedAudioRef.current.setOnEnded(() => {
        setIsPlaying(false);
        setPlaybackTime(0);
      });
    }

    return () => {
      if (bufferedAudioRef.current) {
        bufferedAudioRef.current.stop();
      }
    };
  }, [audioBuffer, audioContext]);

  // Playback time tracking
  useEffect(() => {
    if (isPlaying && bufferedAudioRef.current) {
      const updatePlaybackTime = () => {
        if (!bufferedAudioRef.current || !bufferedAudioRef.current.getIsPlaying()) {
          setIsPlaying(false);
          setPlaybackTime(0);
          return;
        }

        const currentTime = bufferedAudioRef.current.getCurrentTime();
        setPlaybackTime(Math.min(currentTime, audioBuffer.duration));

        if (currentTime < audioBuffer.duration) {
          playbackAnimationRef.current = requestAnimationFrame(updatePlaybackTime);
        } else {
          setIsPlaying(false);
          setPlaybackTime(0);
        }
      };

      playbackAnimationRef.current = requestAnimationFrame(updatePlaybackTime);
    } else {
      if (playbackAnimationRef.current) {
        cancelAnimationFrame(playbackAnimationRef.current);
        playbackAnimationRef.current = null;
      }
    }

    return () => {
      if (playbackAnimationRef.current) {
        cancelAnimationFrame(playbackAnimationRef.current);
      }
    };
  }, [isPlaying, audioBuffer.duration]);

  const playSample = () => {
    if (!bufferedAudioRef.current) return;

    if (isPlaying) {
      bufferedAudioRef.current.stop();
      setIsPlaying(false);
      setPlaybackTime(0);
    } else {
      bufferedAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (seekTime: number) => {
    if (!bufferedAudioRef.current || !isPlaying) return;
    bufferedAudioRef.current.seek(seekTime);
    setPlaybackTime(seekTime);
    setIsPlaying(true);
  };

  const startRecording = async () => {
    if (!audioBuffer || !analyserRef.current || !audioContext) return;

    setIsRecording(true);
    isRecordingRef.current = true;
    setUserPitchData([]);
    setRecordingTime(0);
    recordingStartTimeRef.current = Date.now();

    // Start playing the original audio during recording
    if (!recordingBufferedAudioRef.current && audioContext) {
      recordingBufferedAudioRef.current = new BufferedAudio(audioContext, audioBuffer);
      recordingBufferedAudioRef.current.init();
    }
    
    if (recordingBufferedAudioRef.current) {
      recordingBufferedAudioRef.current.seek(0);
      recordingBufferedAudioRef.current.play();
    }

    // Start MediaRecorder for audio blob
    try {
      if (stream) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
      }
    } catch (error) {
      console.error('Error starting MediaRecorder:', error);
    }

    // Start pitch detection
    const sampleRate = audioContext?.sampleRate || 44100;
    let lastAnalysisTime = 0;

    const detect = () => {
      if (!isRecordingRef.current || !analyserRef.current) {
        return;
      }

      const now = Date.now();
      const elapsed = (now - (recordingStartTimeRef.current || 0)) / 1000;
      setRecordingTime(elapsed);

      // Analyze every ANALYSIS_INTERVAL seconds
      if (elapsed - lastAnalysisTime >= ANALYSIS_INTERVAL) {
        const audioData = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(audioData);

        const frequency = detectPitch(audioData, sampleRate);

        setUserPitchData(prev => [...prev, {
          time: elapsed,
          frequency: frequency,
        }]);

        lastAnalysisTime = elapsed;
      }

      // Stop recording when sample duration is reached
      if (elapsed >= audioBuffer.duration) {
        stopRecording();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    animationFrameRef.current = requestAnimationFrame(detect);
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;

    setIsRecording(false);
    isRecordingRef.current = false;

    // Stop the original audio playback
    if (recordingBufferedAudioRef.current) {
      recordingBufferedAudioRef.current.stop();
      recordingBufferedAudioRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(userPitchData);
      };
    } else {
      onRecordingComplete(userPitchData);
    }
  };

  const currentTime = isRecording ? recordingTime : isPlaying ? playbackTime : 0;
  const isTimelineActive = isRecording || isPlaying;

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          File: {fileName} ({audioBuffer.duration.toFixed(1)}s)
        </p>
      </div>

      <VolumeMeter analyser={analyser} />

      <Timeline
        duration={audioBuffer.duration}
        currentTime={currentTime}
        isActive={isTimelineActive}
        isPlaying={isPlaying}
        onSeek={handleSeek}
      />

      <div className="flex gap-4">
        <button
          onClick={playSample}
          disabled={isRecording}
          className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {isPlaying ? 'Stop Sample' : 'Play Sample'}
        </button>

        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isPlaying}
            className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="text-center py-4">
          <div className="inline-block w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-red-500 font-semibold">
            Recording... ({(userPitchData.length * ANALYSIS_INTERVAL).toFixed(1)}s)
          </span>
        </div>
      )}

      {userPitchData.length > 0 && !isRecording && (
        <div className="mt-4">
          <PracticeVisualization
            originalPitchData={originalPitchData}
            userPitchData={userPitchData}
            duration={audioBuffer.duration}
          />
        </div>
      )}
    </div>
  );
}

