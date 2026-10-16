import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 text-white shadow-2xl flex flex-col items-center text-center">
        <h2 className="font-arcade text-xl text-amber-400 retro-text-stroke mb-4">
          PAUSED
        </h2>

        {/* Audio Toggle */}
        <div className="w-full flex items-center justify-center mb-5">
          <button
            onClick={() => {
              onToggleSound();
              sound.soundEnabled = !soundEnabled;
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 transition-all active:scale-98"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Sound FX: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Sound FX: MUTED</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:translate-y-0.5 text-white font-arcade text-xs rounded-xl shadow-[0_4px_0_#065f46] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:translate-y-0.5 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>MAIN MENU</span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-500">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono">ESC</kbd> to resume
        </p>
      </div>
    </div>
  );
};
