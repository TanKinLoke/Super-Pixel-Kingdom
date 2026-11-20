import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
  visible: boolean;
  onControl: (control: 'left' | 'right' | 'up' | 'down' | 'jump' | 'run', active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ visible, onControl }) => {
  if (!visible) return null;

  const bindTouch = (control: 'left' | 'right' | 'up' | 'down' | 'jump' | 'run') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      onControl(control, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onControl(control, false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      onControl(control, false);
    },
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-5 pointer-events-none select-none">
      {/* Left D-Pad */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          aria-label="Move Left"
          {...bindTouch('left')}
          className="w-14 h-14 rounded-xl bg-slate-950/75 active:bg-amber-400 active:text-slate-950 border-2 border-white/30 text-white flex items-center justify-center"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <button
          type="button"
          aria-label="Crouch or Enter Pipe"
          {...bindTouch('down')}
          className="w-12 h-12 rounded-xl bg-slate-950/75 active:bg-amber-400 active:text-slate-950 border-2 border-white/30 text-white flex items-center justify-center"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <button
          type="button"
          aria-label="Move Right"
          {...bindTouch('right')}
          className="w-14 h-14 rounded-xl bg-slate-950/75 active:bg-amber-400 active:text-slate-950 border-2 border-white/30 text-white flex items-center justify-center"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Right B (Run/Fire) + A (Jump) Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          aria-label="Run and Shoot Fireball"
          {...bindTouch('run')}
          className="w-14 h-14 rounded-full bg-orange-600/85 active:bg-orange-400 border-2 border-white/40 text-white font-display font-extrabold text-base flex items-center justify-center shadow-lg"
        >
          B
        </button>

        <button
          type="button"
          aria-label="Jump"
          {...bindTouch('jump')}
          className="w-16 h-16 rounded-full bg-emerald-600/90 active:bg-emerald-400 border-2 border-white/45 text-white font-display font-extrabold text-lg flex items-center justify-center shadow-lg"
        >
          A
        </button>
      </div>
    </div>
  );
};
