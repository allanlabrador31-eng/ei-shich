import React from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { GameState } from '../types/game';

interface HUDProps {
  score: number;
  gameState: GameState;
  isPaused: boolean;
  onPauseToggle: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  gameState,
  isPaused,
  onPauseToggle,
  soundEnabled,
  onSoundToggle,
}) => {
  if (gameState === 'TITLE' || gameState === 'GAME_OVER') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full">
        <div className="w-16" /> {/* spacer to balance top */}

        {/* Big Retro Score */}
        <div className="flex flex-col items-center">
          <span className="font-arcade text-4xl sm:text-5xl text-white retro-text-stroke tabular-nums tracking-wider drop-shadow-md">
            {score}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onSoundToggle}
            aria-label="Toggle Sound"
            className="p-2 bg-black/40 hover:bg-black/60 rounded-xl text-white backdrop-blur-sm transition-all active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            onClick={onPauseToggle}
            aria-label="Pause Game"
            className="p-2 bg-black/40 hover:bg-black/60 rounded-xl text-white backdrop-blur-sm transition-all active:scale-95"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* "GET READY!" Instruction Banner */}
      {gameState === 'GET_READY' && (
        <div className="flex flex-col items-center justify-center my-auto text-center animate-pulse pointer-events-none">
          <div className="bg-amber-400 text-slate-950 font-arcade text-lg sm:text-xl px-5 py-2.5 rounded-xl border-3 border-black shadow-lg mb-4">
            GET READY!
          </div>

          <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-lg border border-white/20 flex items-center gap-2">
            <span className="text-base">👆</span>
            <span>Tap screen or press <kbd className="px-1 bg-white/20 rounded font-mono">SPACE</kbd> to flap!</span>
          </div>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-6" />
    </div>
  );
};
