import { useState, useEffect, useCallback } from 'react';
import { GameState, GameSettings } from './types/game';
import { FlappyCanvas } from './components/FlappyCanvas';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { HUD } from './components/HUD';
import { sound } from './utils/audio';

const STORAGE_BEST_KEY = 'flappy_allan_best_score';
const STORAGE_SETTINGS_KEY = 'flappy_allan_settings';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BEST_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        return {
          difficulty: 'classic',
          skin: 'classic', // default to classic Hachiware
          soundEnabled: true,
          ...JSON.parse(saved),
        };
      }
    } catch {
      // Fallback
    }
    return {
      difficulty: 'classic',
      skin: 'classic',
      soundEnabled: true,
    };
  });

  // Sync sound engine state
  useEffect(() => {
    sound.soundEnabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Start sequence: from TITLE to GET_READY
  const handleStart = () => {
    setCurrentScore(0);
    setIsNewBest(false);
    setIsPaused(false);
    setGameState('GET_READY');
  };

  // From GET_READY to active PLAYING on first tap
  const handleTapToFly = () => {
    if (gameState === 'GET_READY') {
      setGameState('PLAYING');
    }
  };

  // When game over triggers from FlappyCanvas
  const handleGameOver = useCallback((finalScore: number) => {
    setCurrentScore(finalScore);
    setGameState('GAME_OVER');

    setBestScore(prevBest => {
      if (finalScore > prevBest) {
        setIsNewBest(true);
        try {
          localStorage.setItem(STORAGE_BEST_KEY, finalScore.toString());
        } catch {
          // Ignore
        }
        return finalScore;
      }
      setIsNewBest(false);
      return prevBest;
    });
  }, []);

  // Quick restart
  const handleRestart = () => {
    setCurrentScore(0);
    setIsNewBest(false);
    setIsPaused(false);
    setGameState('GET_READY');
  };

  // Return to menu
  const handleMenu = () => {
    setIsPaused(false);
    setGameState('TITLE');
  };

  // Pause toggle
  const handleTogglePause = () => {
    if (gameState === 'PLAYING') {
      setIsPaused(prev => !prev);
    }
  };

  // Global key controls (Escape for pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING' || isPaused) {
          e.preventDefault();
          setIsPaused(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused]);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center select-none relative font-sans">
      
      {/* Game Viewport Container with 16:9 / 4:3 safe bounds */}
      <div className="relative w-full h-full max-w-[440px] max-h-[720px] aspect-[9/16] shadow-2xl overflow-hidden sm:rounded-2xl border-0 sm:border-4 border-slate-900 bg-sky-400">
        
        {/* Core Canvas Loop (isolated, never re-renders unexpectedly) */}
        <FlappyCanvas
          gameState={gameState}
          difficulty={settings.difficulty}
          skin={settings.skin}
          onGameOver={handleGameOver}
          onScoreUpdate={score => setCurrentScore(score)}
          isPaused={isPaused}
          onTapToStart={handleTapToFly}
        />

        {/* HUD Overlay (Score, Top Bar) */}
        <HUD
          score={currentScore}
          gameState={gameState}
          isPaused={isPaused}
          onPauseToggle={handleTogglePause}
          soundEnabled={settings.soundEnabled}
          onSoundToggle={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        />

        {/* Title Screen Overlay */}
        {gameState === 'TITLE' && (
          <TitleScreen
            onStart={handleStart}
            settings={settings}
            onUpdateSettings={updateSettings}
            bestScore={bestScore}
          />
        )}

        {/* Pause Modal */}
        {isPaused && (
          <PauseModal
            onResume={() => setIsPaused(false)}
            onRestart={handleRestart}
            onHome={handleMenu}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          />
        )}

        {/* Game Over Modal featuring Allan's Quote */}
        {gameState === 'GAME_OVER' && (
          <GameOverModal
            score={currentScore}
            bestScore={bestScore}
            isNewBest={isNewBest}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        )}
      </div>

    </main>
  );
}
