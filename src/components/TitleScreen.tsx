import React from 'react';
import { Volume2, VolumeX, Map as MapIcon, Play } from 'lucide-react';

interface TitleScreenProps {
  bestScore: number;
  totalStarCoins: number;
  muted: boolean;
  onStartCampaign: () => void;
  onOpenWorldMap: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  bestScore,
  totalStarCoins,
  muted,
  onStartCampaign,
  onOpenWorldMap,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none p-5 sm:p-8">
      {/* Top-right sound button & quiet best score readout */}
      <div className="flex items-center justify-between">
        <div className="text-xs sm:text-sm font-arcade text-white arcade-text-shadow">
          {bestScore > 0 ? `BEST ${String(bestScore).padStart(6, '0')} · ★ ${totalStarCoins}/30` : '10 HANDCRAFTED WORLDS · ★ 0/30'}
        </div>
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-lg bg-slate-950/85 border-2 border-white/25 text-white hover:bg-slate-900 hover:border-amber-300 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Center-upper negative space emblem & primary CTA */}
      <div className="flex flex-col items-center justify-start pt-6 sm:pt-10 my-auto pb-16 sm:pb-24">
        {/* Custom Inline SVG Arcade Title Lockup */}
        <svg
          viewBox="0 0 640 210"
          className="w-full max-w-[560px] drop-shadow-[0_10px_22px_rgba(0,0,0,0.65)] mb-6"
          role="img"
          aria-label="Super Pixel Kingdom"
        >
          {/* Outer Crest Plaque */}
          <rect x="28" y="18" width="584" height="168" rx="18" fill="#B91C1C" stroke="#1E1B4B" strokeWidth="8" />
          <rect x="38" y="28" width="564" height="148" rx="12" fill="#DC2626" stroke="#FDE047" strokeWidth="4" />
          {/* Corner Rivets */}
          <circle cx="56" cy="46" r="6" fill="#FDE047" stroke="#78350F" strokeWidth="2" />
          <circle cx="584" cy="46" r="6" fill="#FDE047" stroke="#78350F" strokeWidth="2" />
          <circle cx="56" cy="158" r="6" fill="#FDE047" stroke="#78350F" strokeWidth="2" />
          <circle cx="584" cy="158" r="6" fill="#FDE047" stroke="#78350F" strokeWidth="2" />

          {/* Star Emblem */}
          <polygon
            points="320,2 330,22 352,24 335,38 340,60 320,49 300,60 305,38 288,24 310,22"
            fill="#FACC15"
            stroke="#1E1B4B"
            strokeWidth="4"
          />

          {/* Top Line: SUPER */}
          <text
            x="320"
            y="84"
            textAnchor="middle"
            fill="#FEF08A"
            stroke="#1E1B4B"
            strokeWidth="8"
            paintOrder="stroke"
            fontFamily="Bricolage Grotesque, system-ui, sans-serif"
            fontWeight="800"
            fontSize="36"
            letterSpacing="6"
          >
            SUPER
          </text>

          {/* Main Line: PIXEL KINGDOM */}
          <text
            x="320"
            y="148"
            textAnchor="middle"
            fill="#FFFFFF"
            stroke="#1E1B4B"
            strokeWidth="11"
            paintOrder="stroke"
            fontFamily="Bricolage Grotesque, system-ui, sans-serif"
            fontWeight="800"
            fontSize="58"
            letterSpacing="2"
          >
            PIXEL KINGDOM
          </text>
        </svg>

        {/* Primary & Secondary Actions */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartCampaign();
            }}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 text-slate-950 font-display font-extrabold text-lg tracking-wide border-2 border-slate-950 shadow-[0_6px_0_#1e1b4b] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-5 h-5 fill-current" />
            Play Campaign
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenWorldMap();
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 active:translate-y-0.5 text-white font-display font-bold text-lg border-2 border-white/30 shadow-[0_6px_0_#0f172a] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <MapIcon className="w-5 h-5 text-sky-300" />
            World Map
          </button>
        </div>
      </div>

      {/* Bottom Safe-Margin Flat Control Hint */}
      <div className="text-center text-xs sm:text-sm font-semibold text-white arcade-text-shadow bg-slate-950/65 rounded-lg py-1.5 px-4 mx-auto">
        Arrows / WASD Move · Space / Z Jump · Shift / X Run &amp; Fire · Down on Pipe Warp · P / Esc Pause
      </div>
    </div>
  );
};
