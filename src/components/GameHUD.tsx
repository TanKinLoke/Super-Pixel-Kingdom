import React from 'react';
import { Map as MapIcon, Pause, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onOpenWorldMap: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  onToggleMute,
  onPause,
  onRestart,
  onOpenWorldMap,
}) => {
  return (
    <div className="fixed inset-x-0 top-0 z-10 pointer-events-none px-2.5 py-2 sm:px-5 sm:py-3">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Left Cluster: Lives, Coins, Star Coins, Active Power */}
        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-1 bg-slate-950/80 border border-white/20 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-white shadow-md shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true">
              <path d="M4 13 C4 7, 20 7, 20 13 Z" fill="#EF4444" stroke="#18181B" strokeWidth="2" />
              <rect x="3" y="12" width="18" height="4" rx="2" fill="#B91C1C" stroke="#18181B" strokeWidth="1.5" />
              <circle cx="12" cy="10" r="2.2" fill="#FFFFFF" />
            </svg>
            <span className="font-arcade font-bold text-xs sm:text-base whitespace-nowrap">×{hud.lives}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
              <ellipse cx="12" cy="12" rx="7" ry="9" fill="#FACC15" stroke="#92400E" strokeWidth="2" />
              <rect x="10.5" y="7" width="3" height="10" fill="#FEF08A" />
            </svg>
            <span className="font-arcade font-bold text-xs sm:text-base whitespace-nowrap">
              {String(hud.coins).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1" aria-label="Level Star Coins">
            {hud.starCoinsCollected.map((collected, idx) => (
              <Star
                key={idx}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  collected ? 'text-amber-300 fill-amber-400' : 'text-slate-600'
                }`}
              />
            ))}
          </div>

          {(hud.form !== 'small' || hud.starActive) && (
            <span className="text-[10px] sm:text-[11px] font-arcade font-bold text-amber-300 uppercase whitespace-nowrap">
              {hud.starActive ? 'STAR!' : hud.form === 'fire' ? 'FIRE' : 'SUPER'}
            </span>
          )}
        </div>

        {/* Center Cluster: World, Score, Time */}
        <div className="hidden md:flex items-center gap-6 bg-slate-950/80 border border-white/20 rounded-lg px-4 py-1.5 text-white shadow-md">
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[10px] font-arcade text-slate-400 uppercase tracking-wider">
              {hud.inBonusRoom ? 'BONUS' : `WORLD ${hud.levelId}`}
            </span>
            <span className="text-xs font-display font-bold text-amber-200 whitespace-nowrap">
              {hud.levelName}
            </span>
          </div>

          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] font-arcade text-slate-400 uppercase tracking-wider">SCORE</span>
            <span className="font-arcade font-bold text-sm text-white">
              {String(hud.score).padStart(6, '0')}
            </span>
          </div>

          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] font-arcade text-slate-400 uppercase tracking-wider">TIME</span>
            <span
              className={`font-arcade font-bold text-sm ${
                hud.timeLeft <= 45 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {String(hud.timeLeft).padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Right Cluster: Compact Mobile World/Score + Utility Icon Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
          <div className="flex md:hidden items-center gap-1.5 bg-slate-950/80 border border-white/20 rounded-lg px-2 py-1 text-[11px] font-arcade text-white whitespace-nowrap shrink-0">
            <span>{hud.levelId}</span>
            <span>·</span>
            <span>{String(hud.score).padStart(5, '0')}</span>
            <span>·</span>
            <span className={hud.timeLeft <= 45 ? 'text-rose-400' : ''}>{hud.timeLeft}s</span>
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
            title="Mute (M)"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-950/85 hover:bg-slate-800 border border-white/25 text-white cursor-pointer"
          >
            {hud.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            aria-label="Restart level"
            title="Restart (R)"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-slate-950/85 hover:bg-slate-800 border border-white/25 text-white cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenWorldMap();
            }}
            aria-label="Open world map"
            title="World Map"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-slate-950/85 hover:bg-slate-800 border border-white/25 text-white cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pause game"
            title="Pause (P / Esc)"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-950/85 hover:bg-slate-800 border border-white/25 text-white cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
