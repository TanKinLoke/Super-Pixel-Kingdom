import React from 'react';
import { ArrowRight, Home, Map as MapIcon, Play, RotateCcw, Star, Trophy } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface GameModalsProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onOpenWorldMap: () => void;
  onReturnTitle: () => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  hud,
  onResume,
  onRestart,
  onNextLevel,
  onOpenWorldMap,
  onReturnTitle,
}) => {
  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4 pointer-events-auto">
        <div className="arcade-card rounded-2xl w-full max-w-sm p-6 text-white">
          <div className="text-xs font-arcade text-amber-300 uppercase tracking-wider">
            World {hud.levelId} · {hud.levelName}
          </div>
          <h2 className="font-display font-extrabold text-2xl mt-1">Game Paused</h2>

          <div className="grid grid-cols-2 gap-3 my-5">
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Score</div>
              <div className="font-arcade font-bold text-lg text-white">
                {String(hud.score).padStart(6, '0')}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Star Coins</div>
              <div className="flex items-center gap-1 mt-1">
                {hud.starCoinsCollected.map((c, idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${c ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-base cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-white/15 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Level
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenWorldMap}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/15 cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                World Map
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/15 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Title
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'victory') {
    const isFinal = hud.campaignCompleted;
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-4 pointer-events-auto">
        <div className="arcade-card rounded-2xl w-full max-w-md p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-arcade text-emerald-400 uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            {isFinal ? 'Kingdom Rescued!' : `Course ${hud.levelId} Clear`}
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">
            {isFinal ? 'Campaign Complete!' : hud.levelName}
          </h2>

          <div className="grid grid-cols-3 gap-2.5 my-5">
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Score</div>
              <div className="font-arcade font-bold text-base text-white">
                {String(hud.score).padStart(6, '0')}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Clear Time</div>
              <div className="font-arcade font-bold text-base text-sky-300">{hud.clearTime}s</div>
            </div>
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Star Coins</div>
              <div className="flex items-center gap-1 mt-1">
                {hud.starCoinsCollected.map((c, idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${c ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {!isFinal ? (
              <button
                type="button"
                data-start="true"
                onClick={onNextLevel}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-base cursor-pointer"
              >
                Next Level
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                data-start="true"
                onClick={onOpenWorldMap}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-base cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                Explore World Map
              </button>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-white/15 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Replay
              </button>
              <button
                type="button"
                onClick={onOpenWorldMap}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/15 cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                World Map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'gameover') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/78 p-4 pointer-events-auto">
        <div className="arcade-card rounded-2xl w-full max-w-sm p-6 text-white">
          <div className="text-xs font-arcade text-rose-400 uppercase tracking-wider">
            World {hud.levelId} · {hud.levelName}
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">Game Over</h2>

          <div className="grid grid-cols-2 gap-3 my-5">
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Score</div>
              <div className="font-arcade font-bold text-lg text-white">
                {String(hud.score).padStart(6, '0')}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/90 border border-white/10 p-3">
              <div className="text-[11px] font-arcade text-slate-400 uppercase">Best Score</div>
              <div className="font-arcade font-bold text-lg text-amber-300">
                {String(hud.bestScore).padStart(6, '0')}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-base cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenWorldMap}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/15 cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                World Map
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-white/15 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Title
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
