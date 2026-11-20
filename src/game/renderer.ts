import { TILE_SIZE, WORLD_HEIGHT_PX } from './physics';
import {
  ActiveEnemy,
  ActiveFireball,
  ActiveMovingPlatform,
  ActivePowerUp,
  BumpedBlock,
  CoinSpawn,
  CrumbleTileState,
  FireBarDef,
  FloatingPopup,
  LevelDef,
  PlayerState,
  StarCoinSpawn,
  TileKind,
  WorldTheme,
  ZoneData,
} from './types';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'square' | 'circle' | 'star';
}

export class ParticlePool {
  private items: Particle[];
  private cursor = 0;

  constructor(capacity = 260) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#ffffff',
      life: 0,
      maxLife: 1,
      gravity: 0,
      shape: 'square',
    }));
  }

  public spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number,
    gravity = 600,
    shape: 'square' | 'circle' | 'star' = 'square'
  ): void {
    const p = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.gravity = gravity;
    p.shape = shape;
  }

  public burst(
    x: number,
    y: number,
    count: number,
    color: string,
    speed = 180,
    size = 5,
    gravity = 500,
    shape: 'square' | 'circle' | 'star' = 'square'
  ): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = speed * (0.5 + Math.random() * 0.7);
      this.spawn(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd - 60, size, color, 0.35 + Math.random() * 0.3, gravity, shape);
    }
  }

  public update(dt: number): void {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, camX: number): void {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      if (!p.active) continue;
      const sx = p.x - camX;
      if (sx < -20 || sx > ctx.canvas.width + 20) continue;
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(sx - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  public clear(): void {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].active = false;
    }
  }
}

interface ThemePalette {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  groundTop: string;
  groundBody: string;
  brickMain: string;
  brickMortar: string;
  accent: string;
}

const THEME_PALETTES: Record<WorldTheme, ThemePalette> = {
  meadow: {
    skyTop: '#38BDF8',
    skyBottom: '#BAE6FD',
    hillFar: '#4ADE80',
    hillNear: '#16A34A',
    groundTop: '#22C55E',
    groundBody: '#B45309',
    brickMain: '#C2410C',
    brickMortar: '#451A03',
    accent: '#FACC15',
  },
  cavern: {
    skyTop: '#0B1120',
    skyBottom: '#1E293B',
    hillFar: '#1E3A8A',
    hillNear: '#172554',
    groundTop: '#38BDF8',
    groundBody: '#1E3A8A',
    brickMain: '#0284C7',
    brickMortar: '#082F49',
    accent: '#67E8F9',
  },
  treetops: {
    skyTop: '#0EA5E9',
    skyBottom: '#E0F2FE',
    hillFar: '#86EFAC',
    hillNear: '#22C55E',
    groundTop: '#16A34A',
    groundBody: '#92400E',
    brickMain: '#D97706',
    brickMortar: '#451A03',
    accent: '#F43F5E',
  },
  beach: {
    skyTop: '#FB7185',
    skyBottom: '#FDE68A',
    hillFar: '#0284C7',
    hillNear: '#0369A1',
    groundTop: '#FDE047',
    groundBody: '#D97706',
    brickMain: '#EA580C',
    brickMortar: '#7C2D12',
    accent: '#2DD4BF',
  },
  canyon: {
    skyTop: '#F97316',
    skyBottom: '#FED7AA',
    hillFar: '#9A3412',
    hillNear: '#7C2D12',
    groundTop: '#EA580C',
    groundBody: '#7C2D12',
    brickMain: '#B45309',
    brickMortar: '#451A03',
    accent: '#FBBF24',
  },
  airship: {
    skyTop: '#1E3A8A',
    skyBottom: '#60A5FA',
    hillFar: '#93C5FD',
    hillNear: '#DBEAFE',
    groundTop: '#94A3B8',
    groundBody: '#475569',
    brickMain: '#B45309',
    brickMortar: '#451A03',
    accent: '#FACC15',
  },
  haunted: {
    skyTop: '#1E1B4B',
    skyBottom: '#312E81',
    hillFar: '#3730A3',
    hillNear: '#1E1B4B',
    groundTop: '#6366F1',
    groundBody: '#312E81',
    brickMain: '#475569',
    brickMortar: '#0F172A',
    accent: '#C084FC',
  },
  glacier: {
    skyTop: '#0F172A',
    skyBottom: '#38BDF8',
    hillFar: '#BAE6FD',
    hillNear: '#7DD3FC',
    groundTop: '#E0F2FE',
    groundBody: '#0284C7',
    brickMain: '#38BDF8',
    brickMortar: '#0C4A6E',
    accent: '#F0F9FF',
  },
  magma: {
    skyTop: '#1C0A09',
    skyBottom: '#450A0A',
    hillFar: '#7F1D1D',
    hillNear: '#450A0A',
    groundTop: '#64748B',
    groundBody: '#334155',
    brickMain: '#57534E',
    brickMortar: '#1C1917',
    accent: '#F97316',
  },
  castle: {
    skyTop: '#09090B',
    skyBottom: '#271010',
    hillFar: '#3F1414',
    hillNear: '#220A0A',
    groundTop: '#71717A',
    groundBody: '#3F3F46',
    brickMain: '#52525B',
    brickMortar: '#18181B',
    accent: '#EF4444',
  },
};

export interface RenderState {
  level: LevelDef;
  zone: ZoneData;
  inBonusRoom: boolean;
  player: PlayerState;
  enemies: ActiveEnemy[];
  powerUps: ActivePowerUp[];
  fireballs: ActiveFireball[];
  coins: CoinSpawn[];
  collectedCoins: Set<string>;
  starCoins: StarCoinSpawn[];
  collectedStarCoins: [boolean, boolean, boolean];
  movingPlatforms: ActiveMovingPlatform[];
  fireBars: FireBarDef[];
  crumbleStates: Map<string, CrumbleTileState>;
  bumpedBlocks: BumpedBlock[];
  popups: FloatingPopup[];
  particles: ParticlePool;
  camX: number;
  shakeX: number;
  shakeY: number;
  time: number;
  flagSlideY: number | null;
  axeTriggered: boolean;
  bridgeCollapseProgress: number;
}

export function renderGameFrame(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  state: RenderState
): void {
  const scale = viewH / WORLD_HEIGHT_PX;
  const virtualW = viewW / scale;

  ctx.save();
  ctx.scale(scale, scale);

  const pal = state.inBonusRoom ? THEME_PALETTES.cavern : THEME_PALETTES[state.level.theme];
  const camX = state.camX + state.shakeX;
  const camY = state.shakeY;

  // 1. Sky / Backdrop gradient
  const grad = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT_PX);
  grad.addColorStop(0, pal.skyTop);
  grad.addColorStop(1, pal.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, virtualW, WORLD_HEIGHT_PX);

  ctx.save();
  ctx.translate(0, camY);

  // 2. Parallax Background Layers
  drawParallaxBackground(ctx, virtualW, camX, state.time, state.inBonusRoom ? 'cavern' : state.level.theme, pal);

  // 3. Flagpole & End Castle (behind foreground tiles)
  if (!state.inBonusRoom && state.level.hasFlagpole && state.level.flagpoleTx !== undefined) {
    drawFlagpoleAndCastle(ctx, state.level.flagpoleTx, camX, state.flagSlideY, state.time);
  }

  // 4. Tiles
  const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const endTx = Math.min(state.zone.width - 1, Math.ceil((camX + virtualW) / TILE_SIZE) + 1);

  for (let ty = 0; ty < state.zone.height; ty++) {
    for (let tx = startTx; tx <= endTx; tx++) {
      const tile = state.zone.tiles[ty][tx];
      if (tile === 'empty' || tile === 'hidden_1up' || tile === 'hidden_starcoin') continue;

      if (tile === 'crumble') {
        const cs = state.crumbleStates.get(`${tx},${ty}`);
        if (cs && cs.state === 'fallen') continue;
      }

      if (tile === 'bridge' && state.axeTriggered) {
        const arena = state.level.bossArena;
        if (arena && tx >= arena.bridgeStartTx && tx <= arena.bridgeEndTx) {
          const idxFromRight = arena.bridgeEndTx - tx;
          if (state.bridgeCollapseProgress > idxFromRight * 0.05) continue;
        }
      }

      let bumpOffset = 0;
      for (const b of state.bumpedBlocks) {
        if (b.tx === tx && b.ty === ty) {
          bumpOffset = b.offsetY;
          break;
        }
      }

      let shakeOffset = 0;
      if (tile === 'crumble') {
        const cs = state.crumbleStates.get(`${tx},${ty}`);
        if (cs && cs.state === 'shaking') {
          shakeOffset = Math.sin(state.time * 55) * 2.5;
        }
      }

      const sx = tx * TILE_SIZE - camX + shakeOffset;
      const sy = ty * TILE_SIZE + bumpOffset;
      const tileAbove = ty > 0 ? state.zone.tiles[ty - 1][tx] : 'empty';
      const isTopExposed = tileAbove !== tile;
      drawTile(ctx, tile, sx, sy, tx, ty, pal, state.time, state.axeTriggered, isTopExposed);
    }
  }

  // 5. Moving Platforms
  for (const mp of state.movingPlatforms) {
    const sx = mp.x - camX;
    if (sx + mp.w < -20 || sx > virtualW + 20) continue;
    drawMovingPlatform(ctx, sx, mp.y, mp.w, mp.h, pal);
  }

  // 6. Coins & Giant Star Coins
  for (const c of state.coins) {
    if (state.collectedCoins.has(`${c.tx},${c.ty}`)) continue;
    const sx = c.tx * TILE_SIZE - camX + 16;
    if (sx < -24 || sx > virtualW + 24) continue;
    const sy = c.ty * TILE_SIZE + 16 + Math.sin(state.time * 5 + c.tx * 0.6) * 2.5;
    drawCoin(ctx, sx, sy, state.time, 1);
  }

  for (const sc of state.starCoins) {
    if (state.collectedStarCoins[sc.index]) continue;
    const sx = sc.tx * TILE_SIZE - camX + 16;
    if (sx < -32 || sx > virtualW + 32) continue;
    const sy = sc.ty * TILE_SIZE + 16 + Math.sin(state.time * 3.5 + sc.index) * 3.5;
    drawStarCoin(ctx, sx, sy, state.time);
  }

  // 7. Pipe Chompers (drawn before pipes? Actually pipes already drawn, let's draw chomper emerging from pipe rim? Wait: if chomper is drawn BEFORE pipes, pipes occlude the stem! Let's draw pipe rims over chompers!)
  for (const e of state.enemies) {
    if (!e.alive && e.koTimer <= 0) continue;
    if (e.kind === 'chomper') {
      drawEnemy(ctx, e, camX, state.time);
    }
  }
  // Re-draw pipe tops over chomper bottom stem cleanly
  for (let ty = 0; ty < state.zone.height; ty++) {
    for (let tx = startTx; tx <= endTx; tx++) {
      const tile = state.zone.tiles[ty][tx];
      if (tile === 'pipe_tl' || tile === 'pipe_tr') {
        drawTile(ctx, tile, tx * TILE_SIZE - camX, ty * TILE_SIZE, tx, ty, pal, state.time, false, true);
      }
    }
  }

  // 8. PowerUps
  for (const pu of state.powerUps) {
    if (pu.collected) continue;
    drawPowerUp(ctx, pu, camX, state.time);
  }

  // 9. Enemies (non-chomper)
  for (const e of state.enemies) {
    if (!e.alive && e.koTimer <= 0) continue;
    if (e.kind === 'chomper') continue;
    drawEnemy(ctx, e, camX, state.time);
  }

  // 10. Spinning Fire-Bars
  for (const fb of state.fireBars) {
    const cx = fb.tx * TILE_SIZE - camX + 16;
    if (cx < -220 || cx > virtualW + 220) continue;
    const cy = fb.ty * TILE_SIZE + 16;
    const angle = (fb.startAngle ?? 0) + state.time * fb.speed;
    for (let i = 0; i < fb.length; i++) {
      const dist = i * 16;
      const fx = cx + Math.cos(angle) * dist;
      const fy = cy + Math.sin(angle) * dist;
      drawFireOrb(ctx, fx, fy, state.time + i * 0.4, 7);
    }
  }

  // 11. Fireballs
  for (const f of state.fireballs) {
    const sx = f.x - camX;
    if (sx < -20 || sx > virtualW + 20) continue;
    drawFireOrb(ctx, sx, f.y, state.time * 2, f.fromBoss ? 9 : 6);
  }

  // 12. Player
  drawPlayer(ctx, state.player, camX, state.time);

  // 13. Particles & Floating Popups
  state.particles.draw(ctx, camX);
  for (const pop of state.popups) {
    const sx = pop.x - camX;
    ctx.save();
    ctx.globalAlpha = Math.min(1, pop.life / (pop.maxLife * 0.4));
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.strokeText(pop.text, sx, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, sx, pop.y);
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  virtualW: number,
  camX: number,
  time: number,
  theme: WorldTheme,
  pal: ThemePalette
): void {
  // Sun / Moon / Starfield
  if (theme === 'haunted' || theme === 'cavern' || theme === 'magma' || theme === 'castle' || theme === 'glacier') {
    // Twinkling stars or glowing embers
    for (let i = 0; i < 24; i++) {
      const px = ((i * 97 - camX * 0.12) % (virtualW + 80) + (virtualW + 80)) % (virtualW + 80) - 40;
      const py = 28 + ((i * 53) % 210);
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + i));
      ctx.globalAlpha = pulse * 0.7;
      ctx.fillStyle = theme === 'magma' || theme === 'castle' ? '#FB923C' : '#E2E8F0';
      const sz = theme === 'magma' || theme === 'castle' ? 3 : 2;
      ctx.fillRect(px, py - (theme === 'magma' ? (time * 18 + i * 11) % 60 : 0), sz, sz);
    }
    ctx.globalAlpha = 1;

    if (theme === 'haunted') {
      // Spooky Crescent Moon
      const moonX = virtualW * 0.78 - (camX * 0.04) % 120;
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(moonX, 82, 34, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Soft drifting clouds
    ctx.fillStyle = theme === 'beach' ? 'rgba(255,237,213,0.75)' : 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 210 - camX * 0.22 - time * 8) % (virtualW + 180) + (virtualW + 180)) % (virtualW + 180) - 90;
      const cy = 52 + (i % 3) * 42;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy - 8, 22, 0, Math.PI * 2);
      ctx.arc(cx + 38, cy, 17, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Far parallax silhouettes (hills / peaks / arches / waves)
  ctx.fillStyle = pal.hillFar;
  const farSpan = 260;
  const farStart = Math.floor((camX * 0.3) / farSpan) - 1;
  for (let i = farStart; i < farStart + Math.ceil(virtualW / farSpan) + 3; i++) {
    const x = i * farSpan - camX * 0.3;
    if (theme === 'canyon' || theme === 'glacier') {
      // Jagged mesas / glacier peaks
      ctx.beginPath();
      ctx.moveTo(x, WORLD_HEIGHT_PX);
      ctx.lineTo(x + 70, 220);
      ctx.lineTo(x + 150, 220);
      ctx.lineTo(x + 230, WORLD_HEIGHT_PX);
      ctx.fill();
    } else if (theme === 'castle' || theme === 'magma' || theme === 'cavern') {
      // Stalactites / castle pillars
      ctx.fillRect(x + 30, 60, 48, WORLD_HEIGHT_PX - 60);
      ctx.beginPath();
      ctx.moveTo(x + 120, 0);
      ctx.lineTo(x + 145, 95);
      ctx.lineTo(x + 170, 0);
      ctx.fill();
    } else {
      // Rolling hills
      ctx.beginPath();
      ctx.arc(x + 110, WORLD_HEIGHT_PX - 70, 120, Math.PI, 0);
      ctx.fill();
    }
  }

  // Near parallax bushes / silhouettes
  ctx.fillStyle = pal.hillNear;
  const nearSpan = 200;
  const nearStart = Math.floor((camX * 0.5) / nearSpan) - 1;
  for (let i = nearStart; i < nearStart + Math.ceil(virtualW / nearSpan) + 3; i++) {
    const x = i * nearSpan - camX * 0.5;
    if (theme === 'beach') {
      ctx.fillRect(x, WORLD_HEIGHT_PX - 92, nearSpan + 2, 92);
    } else if (theme === 'airship') {
      // Distant floating airship hull silhouettes
      ctx.fillRect(x + 40, 290, 90, 22);
      ctx.fillRect(x + 78, 250, 4, 40);
    } else {
      ctx.beginPath();
      ctx.arc(x + 70, WORLD_HEIGHT_PX - 80, 68, Math.PI, 0);
      ctx.fill();
    }
  }
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: TileKind,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  pal: ThemePalette,
  time: number,
  axeTriggered: boolean,
  isTopExposed: boolean
): void {
  const s = TILE_SIZE;
  switch (tile) {
    case 'ground': {
      ctx.fillStyle = pal.groundBody;
      ctx.fillRect(sx, sy, s, s);
      if (isTopExposed) {
        ctx.fillStyle = pal.groundTop;
        ctx.fillRect(sx, sy, s, 8);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(sx + 4, sy + 14, 6, 4);
      ctx.fillRect(sx + 18, sy + 22, 7, 4);
      break;
    }
    case 'ice': {
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(sx, sy, s, s);
      if (isTopExposed) {
        ctx.fillStyle = '#F0F9FF';
        ctx.fillRect(sx, sy, s, 7);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(sx + 5, sy + 12, 10, 3);
      ctx.fillRect(sx + 18, sy + 20, 8, 3);
      break;
    }
    case 'castle_wall': {
      ctx.fillStyle = pal.groundBody;
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(sx, sy + 15, s, 2);
      ctx.fillRect(sx + 15, sy, 2, 16);
      ctx.fillRect(sx + 30, sy + 16, 2, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(sx, sy, s, 2);
      break;
    }
    case 'brick': {
      ctx.fillStyle = pal.brickMain;
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = pal.brickMortar;
      ctx.fillRect(sx, sy + 14, s, 3);
      ctx.fillRect(sx + 14, sy, 3, 14);
      ctx.fillRect(sx + 6, sy + 17, 3, 15);
      ctx.fillRect(sx + 24, sy + 17, 3, 15);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(sx, sy, s, 2);
      break;
    }
    case 'hard_block': {
      ctx.fillStyle = '#64748B';
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(sx + 2, sy + 2, s - 4, 4);
      ctx.fillRect(sx + 2, sy + 2, 4, s - 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(sx + 2, sy + s - 5, s - 4, 3);
      ctx.fillRect(sx + s - 5, sy + 2, 3, s - 4);
      break;
    }
    case 'crumble': {
      ctx.fillStyle = '#B45309';
      ctx.fillRect(sx, sy, s, s);
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + 4);
      ctx.lineTo(sx + 14, sy + 15);
      ctx.lineTo(sx + 10, sy + 26);
      ctx.moveTo(sx + 22, sy + 6);
      ctx.lineTo(sx + 16, sy + 18);
      ctx.stroke();
      break;
    }
    case 'question_coin':
    case 'question_powerup':
    case 'question_star':
    case 'question_1up': {
      const pulse = Math.sin(time * 6) > 0.2 ? '#FDE047' : '#F59E0B';
      ctx.fillStyle = pulse;
      ctx.fillRect(sx, sy, s, s);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx + 1, sy + 1, s - 2, s - 2);
      // Corner rivets
      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx + 4, sy + 4, 3, 3);
      ctx.fillRect(sx + s - 7, sy + 4, 3, 3);
      ctx.fillRect(sx + 4, sy + s - 7, 3, 3);
      ctx.fillRect(sx + s - 7, sy + s - 7, 3, 3);
      // '?' mark
      ctx.fillStyle = '#78350F';
      ctx.font = '800 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', sx + s / 2 + 1, sy + s / 2 + 2);
      ctx.fillStyle = '#FFFBEB';
      ctx.fillText('?', sx + s / 2, sy + s / 2 + 1);
      break;
    }
    case 'used_block': {
      ctx.fillStyle = '#57534E';
      ctx.fillRect(sx, sy, s, s);
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, s - 2, s - 2);
      ctx.fillStyle = '#292524';
      ctx.fillRect(sx + 4, sy + 4, 3, 3);
      ctx.fillRect(sx + s - 7, sy + 4, 3, 3);
      ctx.fillRect(sx + 4, sy + s - 7, 3, 3);
      ctx.fillRect(sx + s - 7, sy + s - 7, 3, 3);
      break;
    }
    case 'pipe_tl':
    case 'pipe_tr': {
      const isLeft = tile === 'pipe_tl';
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = isLeft ? '#4ADE80' : '#15803D';
      ctx.fillRect(sx + (isLeft ? 4 : 18), sy + 2, isLeft ? 8 : 10, s - 4);
      ctx.strokeStyle = '#052E16';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx + 1, sy + 1, s - 2, s - 10);
      // Lower lip
      ctx.fillStyle = '#052E16';
      ctx.fillRect(sx, sy + s - 9, s, 2);
      break;
    }
    case 'pipe_bl':
    case 'pipe_br': {
      const isLeft = tile === 'pipe_bl';
      ctx.fillStyle = '#15803D';
      ctx.fillRect(sx + (isLeft ? 3 : 0), sy, s - 3, s);
      ctx.fillStyle = isLeft ? '#4ADE80' : '#14532D';
      ctx.fillRect(sx + (isLeft ? 7 : 18), sy, isLeft ? 7 : 10, s);
      ctx.fillStyle = '#052E16';
      if (isLeft) ctx.fillRect(sx + 2, sy, 2, s);
      else ctx.fillRect(sx + s - 4, sy, 2, s);
      break;
    }
    case 'mushroom_cap_l':
    case 'mushroom_cap_m':
    case 'mushroom_cap_r': {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(sx, sy, s, 22);
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(sx, sy, s, 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(sx, sy + 20, s, 4);
      break;
    }
    case 'mushroom_stem': {
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(sx + 4, sy, s - 8, s);
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(sx + 18, sy, 6, s);
      break;
    }
    case 'bridge': {
      ctx.fillStyle = '#92400E';
      ctx.fillRect(sx, sy, s, 14);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(sx + 2, sy + 2, s - 4, 4);
      ctx.fillStyle = '#451A03';
      ctx.fillRect(sx + 14, sy, 3, 14);
      break;
    }
    case 'lava': {
      const wave = Math.sin(time * 4 + tx * 0.9) * 3;
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(sx, sy + 6 + wave, s, s - 6 - wave);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(sx, sy + 4 + wave, s, 6);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(sx + 4, sy + 4 + wave, 12, 3);
      break;
    }
    case 'spike': {
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.moveTo(sx + 2, sy + s);
      ctx.lineTo(sx + 10, sy + 6);
      ctx.lineTo(sx + 16, sy + s);
      ctx.lineTo(sx + 23, sy + 8);
      ctx.lineTo(sx + 30, sy + s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'spring': {
      // Base + coiled spring + red bounce pad
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 4, sy + s - 6, s - 8, 6);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + s - 6);
      ctx.lineTo(sx + 24, sy + s - 12);
      ctx.lineTo(sx + 8, sy + s - 18);
      ctx.lineTo(sx + 24, sy + 10);
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(sx + 2, sy + 6, s - 4, 7);
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(sx + 4, sy + 6, s - 8, 2);
      break;
    }
    case 'axe': {
      if (axeTriggered) break;
      const bob = Math.sin(time * 5) * 2;
      // Handle
      ctx.fillStyle = '#D97706';
      ctx.fillRect(sx + 14, sy + 8 + bob, 4, 22);
      // Gleaming Axe Blade
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(sx + 14, sy + 4 + bob);
      ctx.lineTo(sx + 4, sy + 2 + bob);
      ctx.lineTo(sx + 4, sy + 18 + bob);
      ctx.lineTo(sx + 14, sy + 15 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(sx + 13, sy + 6 + bob, 6, 6);
      break;
    }
  }
}

function drawMovingPlatform(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  w: number,
  h: number,
  pal: ThemePalette
): void {
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(sx, sy, w, h);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(sx + 2, sy + 2, w - 4, 4);
  ctx.strokeStyle = pal.brickMortar;
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy + 1, w - 2, h - 2);
}

function drawCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number, scale: number): void {
  const spin = Math.max(0.25, Math.abs(Math.cos(time * 5)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(spin * scale, scale);
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-2, -6, 4, 12);
  ctx.restore();
}

function drawStarCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number): void {
  const spin = Math.max(0.35, Math.abs(Math.cos(time * 3.5)));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(spin, 1);
  // Outer golden disc
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Star emblem inside
  ctx.fillStyle = '#B45309';
  drawStarShape(ctx, 0, 0, 5, 7, 3.5);
  ctx.restore();
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
): void {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

function drawFireOrb(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 8);
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlagpoleAndCastle(
  ctx: CanvasRenderingContext2D,
  flagTx: number,
  camX: number,
  flagSlideY: number | null,
  time: number
): void {
  const px = flagTx * TILE_SIZE - camX + 16;
  const topY = 4 * TILE_SIZE;
  const baseY = 11 * TILE_SIZE;
  // Pole
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(px - 2, topY, 4, baseY - topY);
  // Finial sphere
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(px, topY, 7, 0, Math.PI * 2);
  ctx.fill();

  // Pennant Flag
  const fy = flagSlideY !== null ? flagSlideY : topY + 12;
  const wave = Math.sin(time * 6) * 2;
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.moveTo(px - 2, fy);
  ctx.lineTo(px - 34, fy + 10 + wave);
  ctx.lineTo(px - 2, fy + 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  drawStarShape(ctx, px - 14, fy + 11 + wave * 0.4, 5, 5, 2.2);

  // End Castle behind flagpole (+6 tiles right)
  const cx = (flagTx + 5) * TILE_SIZE - camX;
  const cy = 7 * TILE_SIZE;
  ctx.fillStyle = '#9CA3AF';
  ctx.fillRect(cx, cy + 32, 128, 128);
  ctx.fillStyle = '#6B7280';
  ctx.fillRect(cx + 24, cy, 80, 48);
  // Battlements
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(cx + i * 26, cy + 20, 16, 14);
  }
  // Arch Door
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(cx + 64, cy + 122, 18, Math.PI, 0);
  ctx.lineTo(cx + 82, cy + 160);
  ctx.lineTo(cx + 46, cy + 160);
  ctx.closePath();
  ctx.fill();
}

function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  pu: ActivePowerUp,
  camX: number,
  time: number
): void {
  const sx = pu.x - camX;
  const sy = pu.y;
  const w = pu.w;
  const h = pu.h;

  if (pu.kind === 'mushroom' || pu.kind === 'oneup') {
    const capColor = pu.kind === 'oneup' ? '#22C55E' : '#EF4444';
    // Stem
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(sx + 6, sy + h * 0.48, w - 12, h * 0.52);
    // Cap
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(sx + w / 2, sy + h * 0.48, w / 2, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Spots
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sx + w * 0.3, sy + h * 0.28, 4, 0, Math.PI * 2);
    ctx.arc(sx + w * 0.7, sy + h * 0.28, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#18181B';
    ctx.fillRect(sx + 10, sy + h * 0.58, 2, 5);
    ctx.fillRect(sx + w - 12, sy + h * 0.58, 2, 5);
  } else if (pu.kind === 'flower') {
    // Stem & leaves
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(sx + w / 2 - 2, sy + h * 0.48, 4, h * 0.52);
    ctx.beginPath();
    ctx.ellipse(sx + w * 0.28, sy + h * 0.75, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.ellipse(sx + w * 0.72, sy + h * 0.75, 6, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Blazing Flower Head
    ctx.fillStyle = Math.sin(time * 12) > 0 ? '#F97316' : '#EF4444';
    ctx.beginPath();
    ctx.ellipse(sx + w / 2, sy + h * 0.32, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.ellipse(sx + w / 2, sy + h * 0.32, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (pu.kind === 'star') {
    const hue = Math.floor(time * 360) % 360;
    ctx.fillStyle = `hsl(${hue}, 95%, 60%)`;
    drawStarShape(ctx, sx + w / 2, sy + h / 2, 5, 14, 6.5);
    ctx.fillStyle = '#18181B';
    ctx.fillRect(sx + w / 2 - 4, sy + h / 2 - 3, 2, 5);
    ctx.fillRect(sx + w / 2 + 2, sy + h / 2 - 3, 2, 5);
  }
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: ActiveEnemy,
  camX: number,
  time: number
): void {
  const sx = e.x - camX;
  const sy = e.y;
  const w = e.w;
  const h = e.h;

  ctx.save();
  if (e.hitFlash && e.hitFlash > 0) {
    ctx.globalAlpha = 0.6;
  }

  switch (e.kind) {
    case 'shroom': {
      if (!e.alive) {
        // Flattened!
        ctx.fillStyle = '#92400E';
        ctx.fillRect(sx, sy + h - 8, w, 8);
        break;
      }
      const waddle = Math.sin(time * 10) * 2;
      // Feet
      ctx.fillStyle = '#18181B';
      ctx.fillRect(sx + 3, sy + h - 6 + (waddle > 0 ? -1 : 0), 8, 6);
      ctx.fillRect(sx + w - 11, sy + h - 6 + (waddle < 0 ? -1 : 0), 8, 6);
      // Stem
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(sx + 7, sy + h * 0.45, w - 14, h * 0.4);
      // Cap
      ctx.fillStyle = '#9A3412';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + h * 0.5, w / 2, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      // Angry brow & eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 7, sy + h * 0.3, 5, 6);
      ctx.fillRect(sx + w - 12, sy + h * 0.3, 5, 6);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(sx + 9, sy + h * 0.33, 2, 4);
      ctx.fillRect(sx + w - 11, sy + h * 0.33, 2, 4);
      break;
    }
    case 'turtle': {
      const isShell = e.shellState === 'idle_shell' || e.shellState === 'sliding_shell';
      if (isShell) {
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.72, w * 0.48, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(sx + 3, sy + h * 0.72, w - 6, 5);
        ctx.strokeStyle = '#052E16';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 3, sy + h * 0.7, w - 6, 6);
      } else {
        // Walking Koopa-style turtle
        const bob = Math.abs(Math.sin(time * 9)) * 2;
        // Body/head
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(sx + (e.facing > 0 ? w - 12 : 2), sy + 4 - bob, 10, 14);
        ctx.fillStyle = '#18181B';
        ctx.fillRect(sx + (e.facing > 0 ? w - 6 : 4), sy + 7 - bob, 3, 4);
        // Green shell
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.58 - bob, 11, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Feet
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(sx + 5, sy + h - 6, 7, 6);
        ctx.fillRect(sx + w - 12, sy + h - 6, 7, 6);
      }
      break;
    }
    case 'chomper': {
      // Stem
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(sx + w / 2 - 4, sy + h * 0.45, 8, h * 0.55);
      // Red spotted head with teeth
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + 12, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 9, 3, 0, Math.PI * 2);
      ctx.arc(sx + w - 8, sy + 9, 3, 0, Math.PI * 2);
      ctx.fill();
      // Mouth bite
      const bite = Math.abs(Math.sin(time * 8)) * 5;
      ctx.fillStyle = '#18181B';
      ctx.fillRect(sx + 4, sy + 6, w - 8, 4 + bite);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 6, sy + 6, 3, 3);
      ctx.fillRect(sx + w - 9, sy + 6, 3, 3);
      break;
    }
    case 'jumper': {
      const flap = Math.sin(time * 16) * 5;
      // Wings
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(sx + 4, sy + 8 + flap, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.ellipse(sx + w - 4, sy + 8 + flap, 7, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Purple Jumper Body
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 8, sy + 10, 4, 5);
      ctx.fillRect(sx + w - 12, sy + 10, 4, 5);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(sx + 9, sy + 11, 2, 3);
      ctx.fillRect(sx + w - 11, sy + 11, 2, 3);
      break;
    }
    case 'bullet': {
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.roundRect(sx, sy + 2, w, h - 4, 8);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 4, sy + 4, w - 8, 4);
      // Angry Eyes
      ctx.fillStyle = '#FFFFFF';
      const ex = e.facing < 0 ? sx + 5 : sx + w - 11;
      ctx.fillRect(ex, sy + 9, 6, 5);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(ex + 2, sy + 10, 2, 3);
      break;
    }
    case 'boo': {
      const floatY = Math.sin(time * 4 + (e.phase ?? 0)) * 4;
      ctx.globalAlpha = e.frozen ? 0.8 : 0.95;
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + h / 2 + floatY, w * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.stroke();

      const eyeX = e.facing > 0 ? sx + w * 0.55 : sx + w * 0.25;
      if (e.frozen) {
        // Shy / covered face!
        ctx.fillStyle = '#F472B6';
        ctx.fillRect(eyeX - 2, sy + 14 + floatY, 5, 3);
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#64748B';
        ctx.fillRect(eyeX - 1, sy + 8 + floatY, 12, 8);
        ctx.strokeRect(eyeX - 1, sy + 8 + floatY, 12, 8);
      } else {
        // Grinning chase face!
        ctx.fillStyle = '#18181B';
        ctx.fillRect(eyeX, sy + 9 + floatY, 4, 5);
        ctx.fillRect(eyeX + 7, sy + 9 + floatY, 4, 5);
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(eyeX + 5, sy + 19 + floatY, 6, 0, Math.PI);
        ctx.fill();
      }
      break;
    }
    case 'boss': {
      // King Boss (48x52)
      const step = Math.sin(time * 7) * 2;
      // Spiked Shell
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(sx + w / 2 + (e.facing > 0 ? -4 : 4), sy + h * 0.52, w * 0.45, 0, Math.PI * 2);
      ctx.fill();
      // Shell Spikes
      ctx.fillStyle = '#F8FAFC';
      for (let i = 0; i < 3; i++) {
        const spY = sy + 10 + i * 11;
        const spX = e.facing < 0 ? sx + w - 4 : sx + 4;
        ctx.beginPath();
        ctx.moveTo(spX, spY);
        ctx.lineTo(spX + (e.facing < 0 ? 9 : -9), spY + 4);
        ctx.lineTo(spX, spY + 8);
        ctx.fill();
      }
      // Muscular Body & Belly
      ctx.fillStyle = '#EAB308';
      ctx.fillRect(sx + 8, sy + 16, w - 16, h - 22);
      // Head & Horns
      const hx = e.facing < 0 ? sx + 2 : sx + w - 24;
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(hx, sy + 4, 22, 18);
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.moveTo(hx + 4, sy + 4);
      ctx.lineTo(hx, sy - 6);
      ctx.lineTo(hx + 9, sy + 4);
      ctx.fill();
      // Glowing Red Eyes
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(hx + (e.facing < 0 ? 4 : 12), sy + 9, 5, 4);
      // Feet
      ctx.fillStyle = '#CA8A04';
      ctx.fillRect(sx + 8, sy + h - 8 + step, 12, 8);
      ctx.fillRect(sx + w - 20, sy + h - 8 - step, 12, 8);
      break;
    }
  }
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  camX: number,
  time: number
): void {
  if (p.invulnTimer > 0 && Math.floor(time * 20) % 2 === 0 && !p.dead) {
    return;
  }

  const sx = p.x - camX + p.w / 2;
  const sy = p.y + p.h;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(p.facing * p.scaleX, p.scaleY);

  const isStar = p.starTimer > 0;
  let primaryRed = p.form === 'fire' ? '#FFFFFF' : '#EF4444';
  let overallsBlue = p.form === 'fire' ? '#DC2626' : '#2563EB';
  let skin = '#FDBA74';

  if (isStar) {
    const hue = Math.floor(time * 720) % 360;
    primaryRed = `hsl(${hue}, 95%, 58%)`;
    overallsBlue = `hsl(${(hue + 140) % 360}, 95%, 55%)`;
  }

  const w = p.w;
  const h = p.h;
  const walkCycle = p.onGround && Math.abs(p.vx) > 15 ? Math.sin(p.walkDist * 0.22) : 0;

  // Boots / Feet
  ctx.fillStyle = '#78350F';
  if (!p.onGround) {
    ctx.fillRect(-w / 2 + 1, -8, 9, 7);
    ctx.fillRect(2, -10, 9, 7);
  } else {
    ctx.fillRect(-w / 2 + 1 + walkCycle * 4, -7, 9, 7);
    ctx.fillRect(2 - walkCycle * 4, -7, 9, 7);
  }

  // Overalls / Torso
  const torsoH = h * 0.44;
  ctx.fillStyle = overallsBlue;
  ctx.fillRect(-w / 2 + 2, -7 - torsoH, w - 4, torsoH);
  // Gold overall buttons
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(-3, -7 - torsoH + 4, 3, 3);
  ctx.fillRect(2, -7 - torsoH + 4, 3, 3);

  // Shirt / Arms
  ctx.fillStyle = primaryRed;
  ctx.fillRect(-w / 2, -7 - torsoH - 4, w, 9);

  // Head
  const headY = -h + 4;
  const headH = Math.max(12, h * 0.36);
  ctx.fillStyle = skin;
  ctx.fillRect(-w / 2 + 2, headY, w - 4, headH);

  // Eye & Mustache
  ctx.fillStyle = '#18181B';
  ctx.fillRect(3, headY + 4, 3, 4);
  ctx.fillStyle = '#451A03';
  ctx.fillRect(1, headY + headH - 5, 8, 3);

  // Classic Cap + Visor
  ctx.fillStyle = primaryRed;
  ctx.fillRect(-w / 2 + 1, headY - 5, w - 2, 7);
  ctx.fillRect(2, headY - 1, w / 2 + 2, 3); // Cap brim

  // White emblem on cap
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, headY - 4, 5, 4);

  ctx.restore();
}
