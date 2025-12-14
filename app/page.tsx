'use client';

import { useState, useEffect } from 'react';
import MainMenu from '@/components/MainMenu';
import VocalRangeDetection from '@/components/VocalRangeDetection';
import Game from '@/components/Game';
import { getSessionId } from '@/lib/storage';
import { Note } from '@/lib/audio-utils';

type View = 'menu' | 'detectLow' | 'detectHigh' | 'game';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('menu');

  useEffect(() => {
    // Initialize session
    getSessionId();
  }, []);

  const handleDetectLow = () => {
    setCurrentView('detectLow');
  };

  const handleDetectHigh = () => {
    setCurrentView('detectHigh');
  };

  const handlePlayGame = () => {
    setCurrentView('game');
  };

  const handleDetectionComplete = (note: Note) => {
    setCurrentView('menu');
  };

  const handleDetectionCancel = () => {
    setCurrentView('menu');
  };

  const handleGameBack = () => {
    setCurrentView('menu');
  };

  return (
    <main>
      {currentView === 'menu' && (
        <MainMenu
          onDetectLow={handleDetectLow}
          onDetectHigh={handleDetectHigh}
          onPlayGame={handlePlayGame}
        />
      )}
      {currentView === 'detectLow' && (
        <VocalRangeDetection
          mode="low"
          onComplete={handleDetectionComplete}
          onCancel={handleDetectionCancel}
        />
      )}
      {currentView === 'detectHigh' && (
        <VocalRangeDetection
          mode="high"
          onComplete={handleDetectionComplete}
          onCancel={handleDetectionCancel}
        />
      )}
      {currentView === 'game' && <Game onBack={handleGameBack} />}
    </main>
  );
}
