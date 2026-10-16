import React from 'react';
import { BirdSkin, GameDifficulty, GameSettings } from '../types/game';
import { Play, Volume2, VolumeX, Sparkles, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio';

interface TitleScreenProps {
  onStart: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  bestScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  settings,
  onUpdateSettings,
  bestScore,
}) => {
  const skins: { id: BirdSkin; name: string; tag: string; color: string; icon: string }[] = [
    { id: 'classic', name: 'Hachiware', tag: 'Classic :3', color: 'bg-sky-400', icon: '🐱' },
    { id: 'sasumata', name: 'Sasumata', tag: 'Chiikawa Spear', color: 'bg-blue-500', icon: '🔱' },
    { id: 'allan', name: 'Allan Royale', tag: 'Crown & Shades', color: 'bg-amber-400', icon: '👑' },
    { id: 'pajama', name: 'Pajama Cat', tag: 'Cozy Sleeper', color: 'bg-pink-400', icon: '🌙' },
  ];

  const difficulties: { id: GameDifficulty; label: string; desc: string }[] = [
    { id: 'easy', label: 'Chill', desc: 'Wider gaps' },
    { id: 'classic', label: 'Classic', desc: 'Authentic 2014' },
    { id: 'hard', label: 'Allan Pro', desc: 'Moving pipes!' },
  ];

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    sound.soundEnabled = next;
    onUpdateSettings({ soundEnabled: next });
    if (next) sound.playScore();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 sm:p-6 text-slate-800 pointer-events-auto">
      
      {/* Top Utility Bar */}
      <div className="w-full max-w-sm flex items-center justify-between bg-black/40 backdrop-blur-sm px-3.5 py-2 rounded-xl text-white">
        <div className="text-xs font-bold tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>BEST SCORE:</span>
          <span className="font-arcade text-yellow-400 tabular-nums">{bestScore}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound Effects"
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs flex items-center gap-1.5 font-bold"
          >
            {settings.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">SFX ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="text-[11px] text-white/70">MUTED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Title Centerpiece */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Floating Title Lockup */}
        <div className="relative mb-2 flex flex-col items-center">
          <h1 className="font-arcade text-2xl sm:text-3xl text-sky-300 retro-text-stroke-lg tracking-wider transform -rotate-2">
            FLAPPY HACHIWARE
          </h1>
          <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded border border-amber-400/40 mt-1">
            ALLAN'S MINECRAFT CHALLENGE
          </span>
        </div>

        {/* Humorous Penalty Warning */}
        <div className="max-w-[290px] bg-red-600/90 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg border border-red-400/80 mb-5 flex items-start gap-2 text-left animate-bounce-slow">
          <AlertTriangle className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
          <div>
            <span className="uppercase tracking-wide text-[10px] text-yellow-200 block font-black">
              HIGH STAKES WARNING:
            </span>
            <p className="leading-tight text-[11px]">
              Kapag nabangga ka: <span className="underline decoration-yellow-300 font-extrabold">&ldquo;kelangan mo na paamoy pwet mo kay allan&rdquo;</span>
            </p>
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 active:translate-y-1 text-white font-arcade text-base sm:text-lg rounded-2xl shadow-[0_6px_0_#065f46] hover:shadow-[0_4px_0_#065f46] transition-all flex items-center gap-3 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>START FLAP</span>
        </button>

        <span className="mt-3 text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Press <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/40 rounded text-[11px] font-mono">SPACE</kbd> or Tap Screen
        </span>
      </div>

      {/* Bottom Setup Panel: Skins & Difficulty */}
      <div className="w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-white flex flex-col gap-3">
        {/* Skin Selector */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-white/80 mb-1.5 px-0.5">
            <span>CHOOSE BIRD SKIN</span>
            <span className="text-[10px] text-yellow-400">{settings.skin.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {skins.map(s => {
              const active = settings.skin === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onUpdateSettings({ skin: s.id })}
                  className={`py-1.5 px-1 rounded-xl flex flex-col items-center border transition-all ${
                    active
                      ? 'bg-white/20 border-sky-400 shadow-sm scale-102'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${s.color} border border-black/40 mb-1 flex items-center justify-center text-xs shadow-sm`}>
                    {s.icon}
                  </div>
                  <span className="text-[10px] font-bold truncate max-w-full">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-white/80 mb-1 px-0.5">
            <span>DIFFICULTY MODE</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {difficulties.map(d => {
              const active = settings.difficulty === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onUpdateSettings({ difficulty: d.id })}
                  className={`py-1.5 px-2 rounded-lg text-center border transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-300'
                      : 'bg-white/5 text-white/70 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="text-[11px] leading-none">{d.label}</div>
                  <div className="text-[9px] opacity-75 mt-0.5 leading-none">{d.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
