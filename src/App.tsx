import { useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameModals } from './components/GameModals';
import { TitleScreen } from './components/TitleScreen';
import { TouchControls } from './components/TouchControls';
import { WorldMapScreen } from './components/WorldMapScreen';
import { GameEngine } from './game/engine';
import { LEVELS } from './game/levels';
import { HudSnapshot, LevelProgress } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  levelIndex: 0,
  levelId: '1-1',
  levelName: 'Sunny Meadow',
  theme: 'meadow',
  score: 0,
  bestScore: 0,
  coins: 0,
  lives: 3,
  timeLeft: 300,
  form: 'small',
  starActive: false,
  starCoinsCollected: [false, false, false],
  inBonusRoom: false,
  campaignMode: true,
  muted: false,
  clearTime: 0,
  damageTaken: 0,
  enemiesDefeated: 0,
  campaignCompleted: false,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [progress, setProgress] = useState<Record<string, LevelProgress>>({});
  const [showTouchControls, setShowTouchControls] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const isCoarse =
        typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches ||
          'ontouchstart' in window ||
          window.innerWidth < 900);
      setShowTouchControls(Boolean(isCoarse));
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width * dpr));
      const h = Math.max(240, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    const engine = new GameEngine(
      canvas,
      (snap) => setHud(snap),
      (prog) => setProgress(prog)
    );
    engineRef.current = engine;
    engine.startLoop();

    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startCampaign(false);
    }

    return () => {
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const totalStarCoins = LEVELS.reduce((acc, lvl) => {
    const sc = progress[lvl.id]?.starCoins ?? [false, false, false];
    return acc + (sc[0] ? 1 : 0) + (sc[1] ? 1 : 0) + (sc[2] ? 1 : 0);
  }, 0);

  return (
    <main className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Isolated Canvas Mount */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          className="block w-full h-full"
        />
      </div>

      {/* Title Screen */}
      {hud.phase === 'title' && (
        <TitleScreen
          bestScore={hud.bestScore}
          totalStarCoins={totalStarCoins}
          muted={hud.muted}
          onStartCampaign={() => engineRef.current?.startCampaign()}
          onOpenWorldMap={() => engineRef.current?.openWorldMap()}
          onToggleMute={() => engineRef.current?.toggleMute()}
        />
      )}

      {/* World Map / Level Select */}
      {hud.phase === 'worldmap' && (
        <WorldMapScreen
          progress={progress}
          onSelectLevel={(idx) => engineRef.current?.startLevel(idx, false, false)}
          onStartCampaign={() => engineRef.current?.startCampaign()}
          onBackToTitle={() => engineRef.current?.returnToTitle()}
        />
      )}

      {/* Active Playing HUD */}
      {(hud.phase === 'playing' || hud.phase === 'paused' || hud.phase === 'victory' || hud.phase === 'gameover') && (
        <GameHUD
          hud={hud}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onPause={() => engineRef.current?.pauseGame()}
          onRestart={() => engineRef.current?.restartLevel()}
          onOpenWorldMap={() => engineRef.current?.openWorldMap()}
        />
      )}

      {/* Responsive Touch Controls on mobile / touch screens */}
      <TouchControls
        visible={showTouchControls && hud.phase === 'playing'}
        onControl={(ctrl, active) => engineRef.current?.setTouchControl(ctrl, active)}
      />

      {/* Pause / Victory / Game Over Modals */}
      <GameModals
        hud={hud}
        onResume={() => engineRef.current?.resumeGame()}
        onRestart={() => engineRef.current?.restartLevel()}
        onNextLevel={() => engineRef.current?.nextLevel()}
        onOpenWorldMap={() => engineRef.current?.openWorldMap()}
        onReturnTitle={() => engineRef.current?.returnToTitle()}
      />
    </main>
  );
}
