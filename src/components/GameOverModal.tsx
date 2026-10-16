import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';
import { RotateCcw, Share2, Check, Award, Flame } from 'lucide-react';
import { MedalType } from '../types/game';

interface GameOverModalProps {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  bestScore,
  isNewBest,
  onRestart,
  onMenu,
}) => {
  const [copied, setCopied] = useState(false);

  // Trigger retro game over sound stinger on mount
  useEffect(() => {
    sound.playGameOverStinger();
  }, []);

  // Determine medal
  let medal: MedalType = 'none';
  if (score >= 50) medal = 'platinum';
  else if (score >= 35) medal = 'gold';
  else if (score >= 20) medal = 'silver';
  else if (score >= 10) medal = 'bronze';

  const handleShare = () => {
    const text = `Naka-score ako ng ${score} sa Flappy Hachiware in Minecraft! Sabi sa akin: "kelangan mo na paamoy pwet mo kay allan" - ei shichh u lose 💀🐱⛏️`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Listen to Space / Enter to quickly restart
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-amber-50 border-4 border-amber-900 rounded-2xl shadow-2xl p-5 flex flex-col items-center text-center text-slate-800">
        
        {/* Retro Game Over Title */}
        <div className="mb-2">
          <span className="font-arcade text-2xl text-red-600 retro-text-stroke tracking-wider block">
            GAME OVER
          </span>
        </div>

        {/* The Legendary Requested Allan Quote Box */}
        <div className="w-full bg-red-100 border-2 border-dashed border-red-500 rounded-xl p-3 my-2 shadow-inner flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 tracking-wide mb-1">
            <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600" />
            <span>ALLAN'S VERDICT</span>
            <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600" />
          </div>
          <p className="text-base sm:text-lg font-black text-red-700 leading-snug px-1 uppercase tracking-tight">
            &ldquo;kelangan mo na paamoy pwet mo kay allan&rdquo;
          </p>
          <p className="text-xs sm:text-sm font-bold text-amber-950 mt-1 tracking-wide">
            ei shichh u lose
          </p>
        </div>

        {/* Score Board Box */}
        <div className="w-full bg-amber-100/90 border-2 border-amber-900/60 rounded-xl p-4 my-2.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-900/20 pb-2 mb-2">
            <div className="text-left">
              <span className="text-[11px] font-bold text-amber-950/70 tracking-wider uppercase block">
                Score
              </span>
              <span className="font-arcade text-2xl text-amber-950 tabular-nums">
                {score}
              </span>
            </div>

            {/* Medal */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-amber-950/70 tracking-wider uppercase block">
                Medal
              </span>
              <div className="mt-0.5">
                {medal === 'platinum' && (
                  <div className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                    👑 Allan Crown
                  </div>
                )}
                {medal === 'gold' && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded border border-amber-400">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Gold
                  </div>
                )}
                {medal === 'silver' && (
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                    <Award className="w-3.5 h-3.5 text-slate-500" /> Silver
                  </div>
                )}
                {medal === 'bronze' && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-700/40">
                    <Award className="w-3.5 h-3.5 text-amber-700" /> Bronze
                  </div>
                )}
                {medal === 'none' && (
                  <span className="text-xs text-amber-900/50 font-semibold">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-amber-950/80 tracking-wider uppercase">
              Best Score
            </span>
            <div className="flex items-center gap-2">
              {isNewBest && (
                <span className="text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                  NEW!
                </span>
              )}
              <span className="font-arcade text-xl text-amber-950 tabular-nums">
                {bestScore}
              </span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <div className="w-full flex items-center justify-center my-1.5">
          <button
            onClick={handleShare}
            className="w-full py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-98 transition-all shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-600" />
                <span>Share Score</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full flex flex-col gap-2 mt-2">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-white font-arcade text-sm rounded-xl shadow-[0_4px_0_#065f46] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onMenu}
            className="w-full py-2 px-4 bg-amber-200/80 hover:bg-amber-300 active:translate-y-0.5 text-amber-950 font-bold text-xs rounded-xl border border-amber-900/30 transition-all"
          >
            Main Menu & Skins
          </button>
        </div>

        <div className="mt-3 text-[11px] text-amber-900/60 font-medium">
          Press <kbd className="px-1.5 py-0.5 bg-amber-200/70 border border-amber-400 rounded text-[10px] font-mono">SPACE</kbd> or <kbd className="px-1.5 py-0.5 bg-amber-200/70 border border-amber-400 rounded text-[10px] font-mono">ENTER</kbd> to restart
        </div>
      </div>
    </div>
  );
};
