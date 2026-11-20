import React from 'react';
import { ArrowLeft, Check, Play, Star } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { LevelProgress, WorldTheme } from '../game/types';

interface WorldMapScreenProps {
  progress: Record<string, LevelProgress>;
  onSelectLevel: (index: number) => void;
  onStartCampaign: () => void;
  onBackToTitle: () => void;
}

const THEME_ACCENTS: Record<WorldTheme, string> = {
  meadow: 'bg-emerald-600 border-emerald-300',
  cavern: 'bg-sky-700 border-sky-300',
  treetops: 'bg-lime-600 border-lime-300',
  beach: 'bg-amber-600 border-amber-200',
  canyon: 'bg-orange-700 border-orange-300',
  airship: 'bg-indigo-700 border-indigo-300',
  haunted: 'bg-purple-800 border-purple-300',
  glacier: 'bg-cyan-700 border-cyan-200',
  magma: 'bg-red-800 border-orange-300',
  castle: 'bg-rose-900 border-rose-300',
};

export const WorldMapScreen: React.FC<WorldMapScreenProps> = ({
  progress,
  onSelectLevel,
  onStartCampaign,
  onBackToTitle,
}) => {
  const totalCleared = LEVELS.filter((l) => progress[l.id]?.cleared).length;
  const totalStars = LEVELS.reduce((acc, l) => {
    const sc = progress[l.id]?.starCoins ?? [false, false, false];
    return acc + (sc[0] ? 1 : 0) + (sc[1] ? 1 : 0) + (sc[2] ? 1 : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-7 overflow-y-auto pointer-events-auto bg-slate-950/78">
      {/* Header Row */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToTitle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold border border-white/20 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Title
          </button>
          <div>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight">
              Kingdom World Map
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-arcade">
              {totalCleared}/10 Cleared · ★ {totalStars}/30 Star Coins
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartCampaign}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm border-2 border-slate-950 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          Play All Campaign
        </button>
      </div>

      {/* 10-Level Island Grid grouped cleanly across 5 Worlds */}
      <div className="max-w-5xl w-full mx-auto my-auto py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {LEVELS.map((lvl, idx) => {
          const p = progress[lvl.id];
          const stars = p?.starCoins ?? [false, false, false];
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onSelectLevel(idx)}
              className="group text-left rounded-xl bg-slate-900/95 hover:bg-slate-800 border-2 border-white/15 hover:border-amber-300 p-3.5 transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-arcade font-extrabold text-white border ${THEME_ACCENTS[lvl.theme]}`}
                >
                  {lvl.id}
                </span>
                {p?.cleared ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    Clear
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 group-hover:text-amber-300">
                    Play
                  </span>
                )}
              </div>

              <div>
                <div className="font-display font-bold text-base text-white leading-snug group-hover:text-amber-200">
                  {lvl.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{lvl.subtitle}</div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-1" aria-label={`Star coins collected`}>
                  {[0, 1, 2].map((sIdx) => (
                    <Star
                      key={sIdx}
                      className={`w-4 h-4 ${
                        stars[sIdx] ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-arcade text-slate-300">
                  {p?.bestScore ? String(p.bestScore).padStart(6, '0') : '------'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-w-5xl w-full mx-auto text-center text-xs text-slate-400">
        Select any stage from 1-1 to 5-2 to jump straight in, or play the full 10-stage Campaign.
      </div>
    </div>
  );
};
