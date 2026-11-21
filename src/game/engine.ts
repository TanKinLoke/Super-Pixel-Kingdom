import { RetroAudioEngine } from './audio';
import { LEVELS } from './levels';
import {
  aabbOverlap,
  createInitialPlayer,
  evaluateEnemyCollision,
  getPlayerDimensions,
  getStompReward,
  isHazardTile,
  isHiddenBlock,
  isOneWayPlatform,
  isQuestionBlock,
  isSolidTile,
  PHYSICS,
  stepMovingPlatform,
  stepPlayerHorizPhysics,
  stepPlayerJumpPhysics,
  TILE_SIZE,
  WORLD_HEIGHT_PX,
} from './physics';
import { ParticlePool, renderGameFrame } from './renderer';
import {
  ActiveEnemy,
  ActiveFireball,
  ActiveMovingPlatform,
  ActivePowerUp,
  BumpedBlock,
  CoinSpawn,
  CrumbleTileState,
  FloatingPopup,
  GamePhase,
  HudSnapshot,
  InputState,
  LevelDef,
  LevelProgress,
  PlayerForm,
  PlayerState,
  PowerUpKind,
  ZoneData,
} from './types';

const STORAGE_KEY = 'super_pixel_kingdom_progress_v1';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio = new RetroAudioEngine();
  private particles = new ParticlePool(280);
  private onHudChange: (snap: HudSnapshot) => void;
  private onProgressChange: (prog: Record<string, LevelProgress>) => void;

  private rafId: number | null = null;
  private lastTime = 0;
  private simTime = 0;
  private hitstopTimer = 0;
  private shakeTrauma = 0;
  private nextEntityId = 1;

  // Game state
  private phase: GamePhase = 'title';
  private levelIndex = 0;
  private campaignMode = true;
  private inBonusRoom = false;
  private score = 0;
  private bestScore = 0;
  private coins = 0;
  private lives = 3;
  private timeLeft = 300;
  private damageTaken = 0;
  private enemiesDefeated = 0;
  private stompCombo = 0;
  private campaignCompleted = false;

  // Active level & zone state
  private level: LevelDef = LEVELS[0];
  private zone: ZoneData = LEVELS[0].mainZone;
  private workingTiles: ZoneData['tiles'] = [];
  private player: PlayerState = createInitialPlayer(3, 11, 'small');
  private enemies: ActiveEnemy[] = [];
  private powerUps: ActivePowerUp[] = [];
  private fireballs: ActiveFireball[] = [];
  private activeCoins: CoinSpawn[] = [];
  private collectedCoins = new Set<string>();
  private collectedStarCoins: [boolean, boolean, boolean] = [false, false, false];
  private movingPlatforms: ActiveMovingPlatform[] = [];
  private cannonTimers: number[] = [];
  private crumbleStates = new Map<string, CrumbleTileState>();
  private bumpedBlocks: BumpedBlock[] = [];
  private popups: FloatingPopup[] = [];

  // Sequences
  private camX = 0;
  private flagpolePhase: 'none' | 'sliding' | 'fireworks' = 'none';
  private flagSlideY: number | null = null;
  private sequenceTimer = 0;
  private fireworkCount = 0;
  private axeTriggered = false;
  private bridgeCollapseProgress = 0;

  // Persistent progress per level
  private progress: Record<string, LevelProgress> = {};

  // Input tracking
  private keysHeld = new Set<string>();
  private touchHeld = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    run: false,
  };
  private prevJumpHeld = false;
  private prevRunHeld = false;
  private lastHudKey = '';

  constructor(
    canvas: HTMLCanvasElement,
    onHudChange: (snap: HudSnapshot) => void,
    onProgressChange: (prog: Record<string, LevelProgress>) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize Canvas 2D context');
    this.ctx = ctx;
    this.onHudChange = onHudChange;
    this.onProgressChange = onProgressChange;

    this.loadProgress();
    this.loadLevel(0, false, 'small');
    this.bindEvents();
  }

  private loadProgress(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.progress = parsed.levels ?? {};
          this.bestScore = Number(parsed.bestScore ?? 0);
        }
      }
    } catch {
      // ignore storage failure
    }
    this.onProgressChange({ ...this.progress });
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ bestScore: this.bestScore, levels: this.progress })
      );
    } catch {
      // ignore storage failure
    }
    this.onProgressChange({ ...this.progress });
  }

  public getProgress(): Record<string, LevelProgress> {
    return { ...this.progress };
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.audio.stopMusic();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  private handleBlur = (): void => {
    this.clearInputs();
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.clearInputs();
    }
  };

  public clearInputs(): void {
    this.keysHeld.clear();
    this.touchHeld = { left: false, right: false, up: false, down: false, jump: false, run: false };
    this.prevJumpHeld = false;
    this.prevRunHeld = false;
  }

  public setTouchControl(control: keyof typeof this.touchHeld, active: boolean): void {
    this.audio.unlock();
    this.touchHeld[control] = active;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    if (
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'Space'
    ) {
      e.preventDefault();
    }

    if (this.phase === 'title' && (code === 'Enter' || code === 'Space')) {
      this.startCampaign();
      return;
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (this.phase === 'playing') {
        this.pauseGame();
        return;
      } else if (this.phase === 'paused') {
        this.resumeGame();
        return;
      }
    }

    if (code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (code === 'KeyR' && (this.phase === 'playing' || this.phase === 'paused')) {
      this.restartLevel();
      return;
    }

    if (this.phase === 'playing') {
      this.audio.unlock();
      this.audio.startThemeMusic(this.level.theme, this.inBonusRoom, this.player.starTimer > 0);
    }

    this.keysHeld.add(code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private readInput(): InputState {
    const left = this.keysHeld.has('ArrowLeft') || this.keysHeld.has('KeyA') || this.touchHeld.left;
    const right = this.keysHeld.has('ArrowRight') || this.keysHeld.has('KeyD') || this.touchHeld.right;
    const up = this.keysHeld.has('ArrowUp') || this.keysHeld.has('KeyW') || this.touchHeld.up;
    const down = this.keysHeld.has('ArrowDown') || this.keysHeld.has('KeyS') || this.touchHeld.down;
    const jumpHeld =
      this.keysHeld.has('Space') ||
      this.keysHeld.has('KeyZ') ||
      this.keysHeld.has('ArrowUp') ||
      this.keysHeld.has('KeyW') ||
      this.touchHeld.jump;
    const runHeld =
      this.keysHeld.has('ShiftLeft') ||
      this.keysHeld.has('ShiftRight') ||
      this.keysHeld.has('KeyX') ||
      this.touchHeld.run;

    const jumpJustPressed = jumpHeld && !this.prevJumpHeld;
    const runJustPressed = runHeld && !this.prevRunHeld;
    this.prevJumpHeld = jumpHeld;
    this.prevRunHeld = runHeld;

    return { left, right, up, down, jumpHeld, jumpJustPressed, runHeld, runJustPressed };
  }

  private lastRenderedPhase: GamePhase | null = null;

  public startLoop(): void {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);
      this.update(dt, now);
      if (this.phase !== 'paused' || this.lastRenderedPhase !== 'paused') {
        this.render();
        this.lastRenderedPhase = this.phase;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  // -------------------------------------------------------------------------
  // Public Shell Actions
  // -------------------------------------------------------------------------
  public startCampaign(fromUserGesture = true): void {
    if (fromUserGesture) {
      this.audio.unlock();
    }
    this.clearInputs();
    this.campaignMode = true;
    this.campaignCompleted = false;
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.loadLevel(0, false, 'small');
    this.setPhase('playing');
    this.audio.setPaused(false);
    if (fromUserGesture) {
      this.audio.startThemeMusic(this.level.theme, false, false);
    }
  }

  public startLevel(index: number, keepForm = false, campaign = false): void {
    this.audio.unlock();
    this.clearInputs();
    this.campaignMode = campaign;
    this.campaignCompleted = false;
    if (!keepForm) {
      this.score = 0;
      this.coins = 0;
      this.lives = 3;
    }
    const form = keepForm ? this.player.form : 'small';
    this.loadLevel(index, false, form);
    this.setPhase('playing');
    this.audio.setPaused(false);
    this.audio.startThemeMusic(this.level.theme, false, false);
  }

  public nextLevel(): void {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.startLevel(this.levelIndex + 1, true, this.campaignMode);
    } else {
      this.openWorldMap();
    }
  }

  public restartLevel(): void {
    this.audio.unlock();
    this.clearInputs();
    if (this.lives <= 0) {
      this.lives = 3;
      this.score = 0;
      this.coins = 0;
    }
    this.loadLevel(this.levelIndex, false, 'small');
    this.setPhase('playing');
    this.audio.setPaused(false);
    this.audio.startThemeMusic(this.level.theme, false, false);
  }

  public pauseGame(): void {
    if (this.phase !== 'playing') return;
    this.clearInputs();
    this.setPhase('paused');
    this.audio.setPaused(true);
  }

  public resumeGame(): void {
    if (this.phase !== 'paused') return;
    this.clearInputs();
    this.setPhase('playing');
    this.audio.setPaused(false);
  }

  public openWorldMap(): void {
    this.clearInputs();
    this.audio.stopMusic();
    this.setPhase('worldmap');
  }

  public returnToTitle(): void {
    this.clearInputs();
    this.audio.stopMusic();
    this.loadLevel(0, false, 'small');
    this.setPhase('title');
  }

  public toggleMute(): void {
    this.audio.unlock();
    this.audio.setMuted(!this.audio.isMuted());
    this.emitHud(true);
  }

  private setPhase(next: GamePhase): void {
    this.phase = next;
    const bodyState =
      next === 'playing'
        ? 'playing'
        : next === 'paused'
          ? 'paused'
          : next === 'victory' || next === 'gameover'
            ? 'gameover'
            : 'title';
    document.body.dataset.state = bodyState;
    document.body.dataset.screen = next;
    if (next === 'victory') {
      document.body.dataset.outcome = 'victory';
    } else if (next === 'gameover') {
      document.body.dataset.outcome = 'gameover';
    } else {
      delete document.body.dataset.outcome;
    }
    this.emitHud(true);
  }

  // -------------------------------------------------------------------------
  // Level & Zone Loading
  // -------------------------------------------------------------------------
  private loadLevel(index: number, isBonus: boolean, form: PlayerForm): void {
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    this.level = LEVELS[this.levelIndex];
    this.inBonusRoom = isBonus;
    this.timeLeft = this.level.timeLimit;
    this.damageTaken = 0;
    this.enemiesDefeated = 0;
    this.stompCombo = 0;
    this.collectedCoins.clear();
    this.collectedStarCoins = [false, false, false];
    this.flagpolePhase = 'none';
    this.flagSlideY = null;
    this.sequenceTimer = 0;
    this.fireworkCount = 0;
    this.axeTriggered = false;
    this.bridgeCollapseProgress = 0;

    this.setupZone(isBonus && this.level.bonusZone ? this.level.bonusZone : this.level.mainZone, form);
    this.emitHud(true);
  }

  private setupZone(zone: ZoneData, form: PlayerForm, customSpawn?: { tx: number; ty: number }): void {
    this.zone = zone;
    this.workingTiles = zone.tiles.map((row) => [...row]);
    const sx = customSpawn ? customSpawn.tx : zone.spawnX;
    const sy = customSpawn ? customSpawn.ty : zone.spawnY;
    this.player = createInitialPlayer(sx, sy, form);

    this.enemies = zone.enemies.map((sp) => this.spawnEnemyFromDef(sp.kind, sp.tx, sp.ty, sp.dir ?? -1));
    this.powerUps = [];
    this.fireballs = [];
    this.activeCoins = [...zone.coins];
    this.movingPlatforms = zone.movingPlatforms.map((mp) => ({
      ...mp,
      dx: 0,
      dy: 0,
      t: 0,
      dir: 1,
    }));
    this.cannonTimers = zone.cannons.map(() => 0.8 + Math.random() * 0.6);
    this.crumbleStates.clear();
    this.bumpedBlocks = [];
    this.popups = [];
    this.particles.clear();
    this.camX = Math.max(0, this.player.x - 180);
  }

  private spawnEnemyFromDef(kind: ActiveEnemy['kind'], tx: number, ty: number, dir: -1 | 1): ActiveEnemy {
    const id = this.nextEntityId++;
    if (kind === 'boss') {
      return {
        id,
        kind,
        x: tx * TILE_SIZE,
        y: (ty + 1) * TILE_SIZE - 52,
        vx: -55,
        vy: 0,
        w: 48,
        h: 52,
        facing: -1,
        onGround: true,
        alive: true,
        koTimer: 0,
        hp: 5,
        fireTimer: 1.6,
        jumpTimer: 2.2,
      };
    }
    if (kind === 'chomper') {
      const baseY = ty * TILE_SIZE;
      return {
        id,
        kind,
        x: tx * TILE_SIZE + 18,
        y: baseY,
        vx: 0,
        vy: 0,
        w: 28,
        h: 34,
        facing: -1,
        onGround: false,
        alive: true,
        koTimer: 0,
        baseY,
        phase: Math.random() * Math.PI * 2,
      };
    }
    if (kind === 'boo') {
      return {
        id,
        kind,
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        vx: 0,
        vy: 0,
        w: 28,
        h: 28,
        facing: -1,
        onGround: false,
        alive: true,
        koTimer: 0,
        phase: Math.random() * 5,
        frozen: false,
      };
    }
    if (kind === 'turtle') {
      return {
        id,
        kind,
        x: tx * TILE_SIZE + 3,
        y: (ty + 1) * TILE_SIZE - 34,
        vx: dir * 58,
        vy: 0,
        w: 26,
        h: 34,
        facing: dir,
        onGround: false,
        alive: true,
        koTimer: 0,
        shellState: 'walking',
      };
    }
    if (kind === 'jumper') {
      return {
        id,
        kind,
        x: tx * TILE_SIZE + 2,
        y: (ty + 1) * TILE_SIZE - 28,
        vx: dir * 65,
        vy: 0,
        w: 28,
        h: 28,
        facing: dir,
        onGround: false,
        alive: true,
        koTimer: 0,
        jumpTimer: 0.4,
      };
    }
    return {
      id,
      kind,
      x: tx * TILE_SIZE + 2,
      y: (ty + 1) * TILE_SIZE - 28,
      vx: dir * 55,
      vy: 0,
      w: 28,
      h: 28,
      facing: dir,
      onGround: false,
      alive: true,
      koTimer: 0,
    };
  }

  // -------------------------------------------------------------------------
  // Main Simulation Step
  // -------------------------------------------------------------------------
  private update(dt: number, now: number): void {
    this.simTime += dt;
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.4);
    this.particles.update(dt);
    this.updatePopups(dt);

    if (this.phase === 'title' || this.phase === 'worldmap') {
      // Live world parallax pan on Title screen
      const maxCam = Math.max(200, this.zone.width * TILE_SIZE - 900);
      this.camX = (Math.sin(this.simTime * 0.14) * 0.5 + 0.5) * Math.min(680, maxCam);
      return;
    }

    if (this.phase !== 'playing') {
      return;
    }

    // Hitstop pauses simulation physics briefly while visuals/particles continue
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    // Victory sequences (flagpole or bridge collapse)
    if (this.flagpolePhase !== 'none') {
      this.updateFlagpoleSequence(dt);
      return;
    }
    if (this.axeTriggered) {
      this.updateAxeCollapseSequence(dt);
      return;
    }

    // Death animation
    if (this.player.dead) {
      this.player.deathTimer += dt;
      this.player.vy += PHYSICS.GRAVITY * dt;
      this.player.y += this.player.vy * dt;
      if (this.player.deathTimer > 1.35) {
        this.handlePostDeath();
      }
      return;
    }

    // Timer countdown
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) {
      this.killPlayer();
      return;
    }

    const input = this.readInput();
    if (this.player.invulnTimer > 0) {
      this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);
    }
    if (this.player.starTimer > 0) {
      const prevStar = this.player.starTimer;
      this.player.starTimer = Math.max(0, this.player.starTimer - dt);
      if (Math.random() < 0.45) {
        const hue = Math.floor(this.simTime * 500) % 360;
        this.particles.spawn(
          this.player.x + Math.random() * this.player.w,
          this.player.y + Math.random() * this.player.h,
          (Math.random() - 0.5) * 40,
          -40,
          5,
          `hsl(${hue}, 95%, 65%)`,
          0.35,
          0,
          'star'
        );
      }
      if (prevStar > 0 && this.player.starTimer === 0) {
        this.audio.startThemeMusic(this.level.theme, this.inBonusRoom, false);
      }
    }
    if (this.player.fireCooldown > 0) {
      this.player.fireCooldown = Math.max(0, this.player.fireCooldown - dt);
    }

    // Shoot fireball
    if (this.player.form === 'fire' && input.runJustPressed && this.player.fireCooldown <= 0 && !this.player.crouching) {
      this.spawnPlayerFireball();
    }

    // Update Moving Platforms first so riding player moves smoothly
    this.updateMovingPlatforms(dt);
    this.updateCrumbleTiles(dt);
    this.updateBumpedBlocks(dt);

    // Move Player
    const prevBottom = this.player.y + this.player.h;
    const wasOnGround = this.player.onGround;
    stepPlayerHorizPhysics(this.player, input, dt);
    const { jumped } = stepPlayerJumpPhysics(this.player, input, dt);
    if (jumped) {
      this.audio.playJump(this.player.form !== 'small');
      this.particles.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h, 4, '#E2E8F0', 70, 4, 250);
    }
    if (this.player.skidding && Math.random() < 0.35) {
      this.particles.spawn(
        this.player.x + this.player.w / 2,
        this.player.y + this.player.h - 2,
        -this.player.vx * 0.25,
        -25,
        4,
        '#FEF3C7',
        0.25,
        120
      );
    }

    this.moveAndCollidePlayer(dt, prevBottom, wasOnGround);

    // Check Warp Pipe entry when pressing Down
    if (input.down && this.player.onGround) {
      this.checkWarpPipeEntry();
    }

    // Pit fall check
    if (this.player.y > WORLD_HEIGHT_PX + 24) {
      this.killPlayer();
      return;
    }

    // Update world systems
    this.updatePowerUps(dt);
    this.updateFireballs(dt);
    this.updateCannons(dt);
    this.updateEnemies(dt, prevBottom);
    this.checkCoinPickups();
    this.checkFireBarCollisions();
    this.checkObjectives();

    // Smooth camera follow
    const virtualW = this.getVirtualWidth();
    const targetCamX = Math.max(
      0,
      Math.min(this.zone.width * TILE_SIZE - virtualW, this.player.x - virtualW * 0.38)
    );
    this.camX += (targetCamX - this.camX) * Math.min(1, dt * 10);

    this.emitHud(false);
  }

  private getVirtualWidth(): number {
    const scale = Math.max(0.2, this.canvas.height / WORLD_HEIGHT_PX);
    return this.canvas.width / scale;
  }

  private moveAndCollidePlayer(dt: number, prevBottom: number, wasOnGround: boolean): void {
    const p = this.player;
    p.onGround = false;
    p.onIce = false;

    // Apply moving platform carry if riding one
    if (p.ridingPlatformId) {
      const mp = this.movingPlatforms.find((m) => m.id === p.ridingPlatformId);
      if (mp) {
        p.x += mp.dx;
        p.y += mp.dy;
      }
    }
    p.ridingPlatformId = null;

    // Horizontal step & resolve
    p.x += p.vx * dt;
    p.x = Math.max(0, Math.min(this.zone.width * TILE_SIZE - p.w, p.x));
    this.resolveTileHorizontal(p);

    // Vertical step & resolve
    p.y += p.vy * dt;
    this.resolveTileVertical(p, prevBottom, wasOnGround);

    // Moving platform landing check
    if (p.vy >= 0) {
      for (const mp of this.movingPlatforms) {
        const horizOverlap = p.x + p.w > mp.x + 2 && p.x < mp.x + mp.w - 2;
        if (horizOverlap && prevBottom <= mp.y + 8 && p.y + p.h >= mp.y && p.y + p.h <= mp.y + mp.h + 12) {
          p.y = mp.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.ridingPlatformId = mp.id;
          this.stompCombo = 0;
          break;
        }
      }
    }
  }

  private getTile(tx: number, ty: number): string {
    if (tx < 0 || tx >= this.zone.width) return 'hard_block';
    if (ty < 0) return 'empty';
    if (ty >= this.zone.height) return 'empty';
    const t = this.workingTiles[ty][tx];
    if (t === 'crumble') {
      const cs = this.crumbleStates.get(`${tx},${ty}`);
      if (cs && cs.state === 'fallen') return 'empty';
    }
    if (t === 'bridge' && this.axeTriggered) {
      const arena = this.level.bossArena;
      if (arena && tx >= arena.bridgeStartTx && tx <= arena.bridgeEndTx) {
        const idxFromRight = arena.bridgeEndTx - tx;
        if (this.bridgeCollapseProgress > idxFromRight * 0.05) return 'empty';
      }
    }
    return t;
  }

  private resolveTileHorizontal(p: PlayerState): void {
    const topTy = Math.floor((p.y + 3) / TILE_SIZE);
    const botTy = Math.floor((p.y + p.h - 3) / TILE_SIZE);
    const leftTx = Math.floor(p.x / TILE_SIZE);
    const rightTx = Math.floor((p.x + p.w) / TILE_SIZE);

    for (let ty = topTy; ty <= botTy; ty++) {
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const tile = this.getTile(tx, ty) as ZoneData['tiles'][0][0];
        if (isHazardTile(tile)) {
          if (aabbOverlap(p.x + 3, p.y + 3, p.w - 6, p.h - 6, tx * TILE_SIZE + 5, ty * TILE_SIZE + 8, 22, 24)) {
            if (tile === 'lava') this.killPlayer();
            else this.hurtPlayer();
            return;
          }
        }
        if (isSolidTile(tile)) {
          if (p.vx > 0) {
            p.x = tx * TILE_SIZE - p.w - 0.01;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = (tx + 1) * TILE_SIZE + 0.01;
            p.vx = 0;
          }
        }
      }
    }
  }

  private resolveTileVertical(p: PlayerState, prevBottom: number, wasOnGround: boolean): void {
    const leftTx = Math.floor((p.x + 2) / TILE_SIZE);
    const rightTx = Math.floor((p.x + p.w - 2) / TILE_SIZE);
    const topTy = Math.floor(p.y / TILE_SIZE);
    const botTy = Math.floor((p.y + p.h) / TILE_SIZE);

    if (p.vy >= 0) {
      // Landing check
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const tile = this.getTile(tx, botTy) as ZoneData['tiles'][0][0];
        if (isHazardTile(tile)) {
          if (aabbOverlap(p.x + 3, p.y + 3, p.w - 6, p.h - 6, tx * TILE_SIZE + 5, tyToPy(botTy) + 8, 22, 24)) {
            if (tile === 'lava') this.killPlayer();
            else this.hurtPlayer();
            return;
          }
        }

        const tileTop = botTy * TILE_SIZE;
        const oneWay = isOneWayPlatform(tile);
        if (isSolidTile(tile) || (oneWay && prevBottom <= tileTop + 10)) {
          if (tile === 'spring') {
            p.y = tileTop - p.h;
            p.vy = PHYSICS.SPRING_VEL;
            p.onGround = false;
            p.scaleX = 0.8;
            p.scaleY = 1.25;
            this.stompCombo = 0;
            this.audio.playSpring();
            this.particles.burst(tx * TILE_SIZE + 16, tileTop, 8, '#FACC15', 120, 4, 300);
            return;
          }
          if (oneWay && (tile === 'mushroom_cap_l' || tile === 'mushroom_cap_m' || tile === 'mushroom_cap_r')) {
            // Giant mushroom caps give a gentle fun bounce if holding Jump, else solid perch!
            if (this.readInputPeekJump()) {
              p.y = tileTop - p.h;
              p.vy = PHYSICS.MUSHROOM_BOUNCE_VEL;
              p.onGround = false;
              p.scaleX = 0.82;
              p.scaleY = 1.22;
              this.stompCombo = 0;
              this.audio.playSpring();
              return;
            }
          }

          p.y = tileTop - p.h;
          p.vy = 0;
          p.onGround = true;
          this.stompCombo = 0;
          if (!wasOnGround) {
            p.scaleX = 1.2;
            p.scaleY = 0.8;
          }
          if (tile === 'ice') p.onIce = true;
          if (tile === 'crumble') {
            const key = `${tx},${botTy}`;
            if (!this.crumbleStates.has(key)) {
              this.crumbleStates.set(key, { tx, ty: botTy, state: 'shaking', timer: 0.55 });
            }
          }
          break;
        }
      }
    } else if (p.vy < 0) {
      // Head bump check
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const tile = this.getTile(tx, topTy) as ZoneData['tiles'][0][0];
        if (isSolidTile(tile) || isHiddenBlock(tile)) {
          p.y = (topTy + 1) * TILE_SIZE + 0.01;
          p.vy = 0;
          this.hitBlockFromBelow(tx, topTy, tile);
          break;
        }
      }
    }
  }

  private readInputPeekJump(): boolean {
    return (
      this.keysHeld.has('Space') ||
      this.keysHeld.has('KeyZ') ||
      this.keysHeld.has('ArrowUp') ||
      this.keysHeld.has('KeyW') ||
      this.touchHeld.jump
    );
  }

  private hitBlockFromBelow(tx: number, ty: number, tile: ZoneData['tiles'][0][0]): void {
    const bx = tx * TILE_SIZE;
    const by = ty * TILE_SIZE;

    // Defeat any enemy standing directly on this bumped block!
    for (const e of this.enemies) {
      if (e.alive && e.onGround && e.x + e.w > bx && e.x < bx + TILE_SIZE && Math.abs(e.y + e.h - by) < 8) {
        this.defeatEnemyByImpact(e, 1);
      }
    }

    if (isQuestionBlock(tile) || isHiddenBlock(tile)) {
      this.workingTiles[ty][tx] = 'used_block';
      this.bumpedBlocks.push({ tx, ty, offsetY: -8, vy: -90 });

      if (tile === 'question_coin') {
        this.collectCoinAt(bx + 16, by);
      } else if (tile === 'question_powerup') {
        const kind: PowerUpKind = this.player.form === 'small' ? 'mushroom' : 'flower';
        this.spawnPowerUp(kind, bx, by);
      } else if (tile === 'question_star') {
        this.spawnPowerUp('star', bx, by);
      } else if (tile === 'question_1up' || tile === 'hidden_1up') {
        this.spawnPowerUp('oneup', bx, by);
      } else if (tile === 'hidden_starcoin') {
        this.collectCoinAt(bx + 16, by);
        this.addScore(500, bx + 16, by - 12, '#FACC15');
      }
      return;
    }

    if (tile === 'brick') {
      if (this.player.form !== 'small') {
        this.workingTiles[ty][tx] = 'empty';
        this.audio.playBrickBreak();
        this.addScore(50, bx + 16, by, '#FED7AA');
        this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.25);
        this.particles.burst(bx + 16, by + 16, 12, '#C2410C', 220, 7, 720);
      } else {
        this.audio.playBump();
        this.bumpedBlocks.push({ tx, ty, offsetY: -6, vy: -70 });
      }
      return;
    }

    this.audio.playBump();
  }

  private spawnPowerUp(kind: PowerUpKind, x: number, y: number): void {
    this.audio.playPowerUpSpawn();
    this.powerUps.push({
      id: this.nextEntityId++,
      kind,
      x: x + 2,
      y: y - 4,
      vx: kind === 'flower' ? 0 : 95,
      vy: 0,
      w: 28,
      h: 28,
      emergeTimer: 0.35,
      targetY: y - 30,
      collected: false,
    });
  }

  private spawnPlayerFireball(): void {
    this.player.fireCooldown = PHYSICS.FIRE_COOLDOWN;
    this.audio.playFireball();
    this.fireballs.push({
      id: this.nextEntityId++,
      x: this.player.x + (this.player.facing > 0 ? this.player.w : 0),
      y: this.player.y + this.player.h * 0.45,
      vx: this.player.facing * PHYSICS.FIREBALL_SPEED,
      vy: 90,
      fromBoss: false,
      life: 2.2,
    });
  }

  private checkWarpPipeEntry(): void {
    const p = this.player;
    const pCenterTx = Math.floor((p.x + p.w / 2) / TILE_SIZE);
    const footTy = Math.floor((p.y + p.h + 2) / TILE_SIZE);

    for (const w of this.zone.warps) {
      if ((pCenterTx === w.tx || pCenterTx === w.tx + 1) && footTy === w.ty) {
        this.audio.playPipeWarp();
        this.particles.burst(p.x + p.w / 2, p.y + p.h, 10, '#4ADE80', 110, 5, 200);
        if (w.targetZone === 'bonus' && this.level.bonusZone) {
          this.inBonusRoom = true;
          this.setupZone(this.level.bonusZone, p.form, { tx: w.destX, ty: w.destY });
          this.audio.startThemeMusic(this.level.theme, true, p.starTimer > 0);
        } else if (w.targetZone === 'main') {
          this.inBonusRoom = false;
          this.setupZone(this.level.mainZone, p.form, { tx: w.destX, ty: w.destY });
          this.audio.startThemeMusic(this.level.theme, false, p.starTimer > 0);
        }
        this.emitHud(true);
        return;
      }
    }
  }

  private updateMovingPlatforms(dt: number): void {
    for (const mp of this.movingPlatforms) {
      const def = this.zone.movingPlatforms.find((d) => d.id === mp.id);
      if (!def) continue;
      stepMovingPlatform(mp, def, dt);
    }
  }

  private updateCrumbleTiles(dt: number): void {
    for (const [key, cs] of this.crumbleStates.entries()) {
      cs.timer -= dt;
      if (cs.state === 'shaking' && cs.timer <= 0) {
        cs.state = 'fallen';
        cs.timer = 2.8;
        this.particles.burst(cs.tx * TILE_SIZE + 16, cs.ty * TILE_SIZE + 16, 6, '#B45309', 100, 5, 500);
      } else if (cs.state === 'fallen' && cs.timer <= 0) {
        this.crumbleStates.delete(key);
      }
    }
  }

  private updateBumpedBlocks(dt: number): void {
    for (let i = this.bumpedBlocks.length - 1; i >= 0; i--) {
      const b = this.bumpedBlocks[i];
      b.vy += 680 * dt;
      b.offsetY += b.vy * dt;
      if (b.offsetY >= 0) {
        this.bumpedBlocks.splice(i, 1);
      }
    }
  }

  private updatePowerUps(dt: number): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (pu.collected) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (pu.emergeTimer > 0) {
        pu.emergeTimer -= dt;
        pu.y += (pu.targetY - pu.y) * Math.min(1, dt * 12);
        if (pu.emergeTimer <= 0) {
          pu.y = pu.targetY;
        }
      } else if (pu.kind !== 'flower') {
        pu.vy = Math.min(PHYSICS.MAX_FALL_SPEED, pu.vy + PHYSICS.GRAVITY * dt);
        pu.x += pu.vx * dt;
        // Reverse on solid wall
        const sideTx = Math.floor((pu.vx > 0 ? pu.x + pu.w : pu.x) / TILE_SIZE);
        const midTy = Math.floor((pu.y + pu.h * 0.5) / TILE_SIZE);
        if (isSolidTile(this.getTile(sideTx, midTy) as ZoneData['tiles'][0][0])) {
          pu.vx *= -1;
        }

        pu.y += pu.vy * dt;
        const botTy = Math.floor((pu.y + pu.h) / TILE_SIZE);
        const leftTx = Math.floor((pu.x + 3) / TILE_SIZE);
        const rightTx = Math.floor((pu.x + pu.w - 3) / TILE_SIZE);
        for (let tx = leftTx; tx <= rightTx; tx++) {
          const tile = this.getTile(tx, botTy) as ZoneData['tiles'][0][0];
          if (isSolidTile(tile) || isOneWayPlatform(tile)) {
            pu.y = botTy * TILE_SIZE - pu.h;
            pu.vy = pu.kind === 'star' ? -360 : 0;
            break;
          }
        }
      }

      // Collect check
      if (aabbOverlap(this.player.x, this.player.y, this.player.w, this.player.h, pu.x, pu.y, pu.w, pu.h)) {
        pu.collected = true;
        this.collectPowerUp(pu);
      }
    }
  }

  private collectPowerUp(pu: ActivePowerUp): void {
    const p = this.player;
    this.particles.burst(pu.x + 14, pu.y + 14, 12, '#FDE047', 160, 5, 250, 'star');
    if (pu.kind === 'oneup') {
      this.lives++;
      this.audio.playOneUp();
      this.addScore(0, pu.x + 14, pu.y - 8, '#4ADE80', '1-UP!');
    } else if (pu.kind === 'star') {
      p.starTimer = PHYSICS.STAR_DURATION;
      this.audio.playPowerUpCollect();
      this.audio.startThemeMusic(this.level.theme, this.inBonusRoom, true);
      this.addScore(1000, pu.x + 14, pu.y - 8, '#FACC15');
    } else if (pu.kind === 'mushroom') {
      this.audio.playPowerUpCollect();
      this.hitstopTimer = 0.04;
      if (p.form === 'small') {
        const oldH = p.h;
        p.form = 'super';
        const dims = getPlayerDimensions('super', p.crouching);
        p.w = dims.w;
        p.h = dims.h;
        p.y -= p.h - oldH;
      }
      this.addScore(1000, pu.x + 14, pu.y - 8, '#FCA5A5');
    } else if (pu.kind === 'flower') {
      this.audio.playPowerUpCollect();
      this.hitstopTimer = 0.04;
      const oldH = p.h;
      p.form = 'fire';
      const dims = getPlayerDimensions('fire', p.crouching);
      p.w = dims.w;
      p.h = dims.h;
      p.y -= p.h - oldH;
      this.addScore(1000, pu.x + 14, pu.y - 8, '#FB923C');
    }
    this.emitHud(true);
  }

  private updateFireballs(dt: number): void {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const f = this.fireballs[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.fireballs.splice(i, 1);
        continue;
      }

      if (!f.fromBoss) {
        f.vy += PHYSICS.GRAVITY * 0.85 * dt;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Wall hit
      const tx = Math.floor(f.x / TILE_SIZE);
      const ty = Math.floor(f.y / TILE_SIZE);
      const tile = this.getTile(tx, ty) as ZoneData['tiles'][0][0];

      if (!f.fromBoss && tile === 'ice') {
        // Fireball melts ice secrets/blocks!
        this.particles.burst(f.x, f.y, 8, '#7DD3FC', 120, 5, 300);
        this.fireballs.splice(i, 1);
        continue;
      }

      if (isSolidTile(tile)) {
        // Check if it hit the floor (bounce) vs side wall (explode)
        if (!f.fromBoss && f.vy > 0 && f.y - f.vy * dt <= ty * TILE_SIZE + 4) {
          f.y = ty * TILE_SIZE - 2;
          f.vy = PHYSICS.FIREBALL_BOUNCE_VY;
        } else {
          this.particles.burst(f.x, f.y, 6, '#F97316', 110, 4, 250);
          this.fireballs.splice(i, 1);
          continue;
        }
      }

      if (f.fromBoss) {
        if (aabbOverlap(this.player.x, this.player.y, this.player.w, this.player.h, f.x - 7, f.y - 7, 14, 14)) {
          this.fireballs.splice(i, 1);
          this.hurtPlayer();
          continue;
        }
      } else {
        // Check enemy hits
        let hit = false;
        for (const e of this.enemies) {
          if (!e.alive || e.kind === 'boo') continue;
          if (aabbOverlap(f.x - 6, f.y - 6, 12, 12, e.x, e.y, e.w, e.h)) {
            hit = true;
            if (e.kind === 'boss') {
              e.hp = (e.hp ?? 5) - 1;
              e.hitFlash = 0.1;
              this.audio.playStomp(1);
              this.particles.burst(f.x, f.y, 10, '#FACC15', 140, 5, 300);
              if (e.hp <= 0) {
                this.defeatEnemyByImpact(e, Math.sign(f.vx));
                this.addScore(5000, e.x + 24, e.y, '#FACC15');
              }
            } else {
              this.defeatEnemyByImpact(e, Math.sign(f.vx));
              this.collectCoinAt(e.x + e.w / 2, e.y);
            }
            break;
          }
        }
        if (hit) {
          this.fireballs.splice(i, 1);
        }
      }
    }
  }

  private updateCannons(dt: number): void {
    const virtualW = this.getVirtualWidth();
    for (let i = 0; i < this.zone.cannons.length; i++) {
      const c = this.zone.cannons[i];
      const cx = c.tx * TILE_SIZE;
      if (Math.abs(cx - this.player.x) > virtualW * 0.9) continue;

      this.cannonTimers[i] -= dt;
      if (this.cannonTimers[i] <= 0) {
        this.cannonTimers[i] = c.interval;
        // Classic rule: don't fire if player is standing right beside/on the cannon
        if (Math.abs(this.player.x - cx) > 36) {
          const b = this.spawnEnemyFromDef('bullet', c.tx + c.direction, c.ty, c.direction);
          b.vx = c.direction * 195;
          b.y = c.ty * TILE_SIZE + 4;
          this.enemies.push(b);
          this.particles.burst(cx + (c.direction > 0 ? 32 : 0), c.ty * TILE_SIZE + 16, 6, '#E2E8F0', 90, 4, 50);
          this.audio.playBump();
        }
      }
    }
  }

  private updateEnemies(dt: number, prevPlayerBottom: number): void {
    const virtualW = this.getVirtualWidth();

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hitFlash && e.hitFlash > 0) {
        e.hitFlash = Math.max(0, e.hitFlash - dt);
      }

      if (!e.alive) {
        e.koTimer -= dt;
        if (e.kind !== 'shroom') {
          e.vy += PHYSICS.GRAVITY * dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        }
        if (e.koTimer <= 0) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Sleep enemies far offscreen except sliding shells
      if (e.shellState !== 'sliding_shell' && Math.abs(e.x - this.player.x) > virtualW * 1.15) {
        continue;
      }

      if (e.kind === 'chomper') {
        const pipeCenterX = e.x + e.w / 2;
        const nearPipe = Math.abs(this.player.x + this.player.w / 2 - pipeCenterX) < 38;
        e.phase = (e.phase ?? 0) + dt * 1.8;
        const cycle = Math.sin(e.phase);
        const baseY = e.baseY ?? e.y;
        const hiddenY = baseY + 8;
        const topY = baseY - 32;
        if (nearPipe && e.y >= baseY - 4) {
          e.y = hiddenY;
        } else {
          const t = Math.max(0, Math.min(1, cycle * 0.75 + 0.5));
          e.y = hiddenY + (topY - hiddenY) * t;
        }
      } else if (e.kind === 'bullet') {
        e.x += e.vx * dt;
        if (e.x < this.camX - 120 || e.x > this.camX + virtualW + 120) {
          this.enemies.splice(i, 1);
          continue;
        }
      } else if (e.kind === 'boo') {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        e.facing = dx >= 0 ? 1 : -1;
        // Boo freezes when player faces toward it!
        const playerLookingAtBoo =
          (dx < 0 && this.player.facing === 1) || (dx > 0 && this.player.facing === -1);
        e.frozen = playerLookingAtBoo;
        if (!e.frozen) {
          const len = Math.max(1, Math.hypot(dx, dy));
          e.x += (dx / len) * 68 * dt;
          e.y += (dy / len) * 68 * dt;
        }
      } else if (e.kind === 'boss') {
        this.updateBoss(e, dt);
      } else {
        // Standard ground / jumper / turtle / sliding shell physics
        e.vy = Math.min(PHYSICS.MAX_FALL_SPEED, e.vy + PHYSICS.GRAVITY * dt);
        e.x += e.vx * dt;

        // Horizontal wall bounce
        const sideTx = Math.floor((e.vx > 0 ? e.x + e.w : e.x) / TILE_SIZE);
        const topTy = Math.floor((e.y + 4) / TILE_SIZE);
        const midTy = Math.floor((e.y + e.h - 6) / TILE_SIZE);
        if (
          isSolidTile(this.getTile(sideTx, topTy) as ZoneData['tiles'][0][0]) ||
          isSolidTile(this.getTile(sideTx, midTy) as ZoneData['tiles'][0][0])
        ) {
          e.vx *= -1;
          e.facing = e.vx >= 0 ? 1 : -1;
          e.x += e.vx * dt * 2;
        }

        e.y += e.vy * dt;
        e.onGround = false;
        const botTy = Math.floor((e.y + e.h) / TILE_SIZE);
        const ltx = Math.floor((e.x + 2) / TILE_SIZE);
        const rtx = Math.floor((e.x + e.w - 2) / TILE_SIZE);
        for (let tx = ltx; tx <= rtx; tx++) {
          const tile = this.getTile(tx, botTy) as ZoneData['tiles'][0][0];
          if (isSolidTile(tile) || isOneWayPlatform(tile)) {
            e.y = botTy * TILE_SIZE - e.h;
            e.vy = 0;
            e.onGround = true;
            if (e.kind === 'jumper') {
              e.jumpTimer = (e.jumpTimer ?? 0) - dt;
              if (e.jumpTimer <= 0) {
                e.vy = -380;
                e.jumpTimer = 0.85;
              }
            }
            break;
          }
        }

        if (e.y > WORLD_HEIGHT_PX + 40) {
          this.enemies.splice(i, 1);
          continue;
        }

        // Sliding shell bowls over other enemies!
        if (e.kind === 'turtle' && e.shellState === 'sliding_shell') {
          for (const other of this.enemies) {
            if (other.id === e.id || !other.alive || other.kind === 'boss') continue;
            if (aabbOverlap(e.x, e.y, e.w, e.h, other.x, other.y, other.w, other.h)) {
              this.defeatEnemyByImpact(other, Math.sign(e.vx));
            }
          }
        }
      }

      // Player collision check
      const outcome = evaluateEnemyCollision(this.player, prevPlayerBottom, e);
      if (outcome === 'stomp') {
        this.handlePlayerStomp(e);
      } else if (outcome === 'kick_shell') {
        const kickDir = this.player.x + this.player.w / 2 < e.x + e.w / 2 ? 1 : -1;
        e.shellState = 'sliding_shell';
        e.vx = kickDir * PHYSICS.SHELL_SPEED;
        e.x += kickDir * 10;
        this.audio.playKickShell();
        this.addScore(400, e.x + e.w / 2, e.y - 8, '#4ADE80');
      } else if (outcome === 'star_kill') {
        this.defeatEnemyByImpact(e, this.player.facing);
      } else if (outcome === 'hurt') {
        this.hurtPlayer();
      }
    }
  }

  private updateBoss(boss: ActiveEnemy, dt: number): void {
    const arena = this.level.bossArena;
    const minX = arena ? arena.bridgeStartTx * TILE_SIZE + 8 : boss.x - 160;
    const maxX = arena ? arena.bridgeEndTx * TILE_SIZE - boss.w - 8 : boss.x + 160;

    boss.facing = this.player.x < boss.x ? -1 : 1;
    boss.x += boss.vx * dt;
    if (boss.x <= minX) {
      boss.x = minX;
      boss.vx = Math.abs(boss.vx);
    } else if (boss.x >= maxX) {
      boss.x = maxX;
      boss.vx = -Math.abs(boss.vx);
    }

    boss.vy += PHYSICS.GRAVITY * dt;
    boss.y += boss.vy * dt;
    const botTy = Math.floor((boss.y + boss.h) / TILE_SIZE);
    const midTx = Math.floor((boss.x + boss.w / 2) / TILE_SIZE);
    const tile = this.getTile(midTx, botTy) as ZoneData['tiles'][0][0];
    if (isSolidTile(tile)) {
      boss.y = botTy * TILE_SIZE - boss.h;
      boss.vy = 0;
      boss.onGround = true;
    }

    boss.jumpTimer = (boss.jumpTimer ?? 2) - dt;
    if (boss.jumpTimer <= 0 && boss.onGround) {
      boss.vy = -340;
      boss.jumpTimer = 2.0 + Math.random() * 1.2;
    }

    boss.fireTimer = (boss.fireTimer ?? 1.5) - dt;
    if (boss.fireTimer <= 0 && Math.abs(this.player.x - boss.x) < 420) {
      boss.fireTimer = 1.7 + Math.random() * 0.9;
      this.audio.playBossRoar();
      this.fireballs.push({
        id: this.nextEntityId++,
        x: boss.x + (boss.facing < 0 ? -4 : boss.w + 4),
        y: boss.y + 16,
        vx: boss.facing * 235,
        vy: 0,
        fromBoss: true,
        life: 3.0,
      });
    }
  }

  private handlePlayerStomp(e: ActiveEnemy): void {
    const p = this.player;
    const holdingJump = this.readInputPeekJump();
    p.vy = holdingJump ? PHYSICS.STOMP_HIGH_BOUNCE_VEL : PHYSICS.STOMP_BOUNCE_VEL;
    p.y = e.y - p.h - 1;
    p.scaleX = 1.15;
    p.scaleY = 0.85;

    const reward = getStompReward(this.stompCombo);
    this.audio.playStomp(this.stompCombo);
    this.stompCombo++;
    this.hitstopTimer = 0.035;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.16);

    if (reward.extraLife) {
      this.lives++;
      this.audio.playOneUp();
      this.addScore(0, e.x + e.w / 2, e.y - 10, '#4ADE80', '1-UP!');
    } else {
      this.addScore(reward.points, e.x + e.w / 2, e.y - 10, '#FDE047');
    }

    if (e.kind === 'turtle' && e.shellState !== 'idle_shell') {
      e.shellState = 'idle_shell';
      e.vx = 0;
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 6, '#4ADE80', 110, 4, 300);
    } else if (e.kind === 'jumper') {
      // Winged jumper turns into grounded shroom or defeats!
      e.alive = false;
      e.koTimer = 0.4;
      e.vy = -180;
      this.enemiesDefeated++;
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#F87171', 150, 5, 400);
    } else {
      e.alive = false;
      e.koTimer = 0.35;
      e.vx = 0;
      this.enemiesDefeated++;
      this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 8, '#FDE68A', 120, 4, 350);
    }
  }

  private defeatEnemyByImpact(e: ActiveEnemy, dir: number): void {
    e.alive = false;
    e.koTimer = 0.65;
    e.vx = dir * 130;
    e.vy = -260;
    this.enemiesDefeated++;
    this.hitstopTimer = 0.04;
    this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.22);
    this.audio.playKickShell();
    this.addScore(200, e.x + e.w / 2, e.y - 8, '#FACC15');
    this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, 10, '#FDE047', 160, 5, 420);
  }

  private hurtPlayer(): void {
    const p = this.player;
    if (p.invulnTimer > 0 || p.starTimer > 0 || p.dead) return;
    this.damageTaken++;

    if (p.form !== 'small') {
      this.audio.playHurt();
      this.hitstopTimer = 0.06;
      this.shakeTrauma = Math.min(1, this.shakeTrauma + 0.4);
      const oldH = p.h;
      p.form = 'small';
      p.crouching = false;
      const dims = getPlayerDimensions('small', false);
      p.w = dims.w;
      p.h = dims.h;
      p.y += oldH - p.h;
      p.invulnTimer = PHYSICS.INVULN_DURATION;
      p.vy = -240;
      this.particles.burst(p.x + p.w / 2, p.y + p.h / 2, 12, '#FCA5A5', 160, 5, 300);
      this.emitHud(true);
    } else {
      this.killPlayer();
    }
  }

  private killPlayer(): void {
    if (this.player.dead) return;
    this.player.dead = true;
    this.player.deathTimer = 0;
    this.player.vx = 0;
    this.player.vy = -460;
    this.damageTaken++;
    this.lives = Math.max(0, this.lives - 1);
    this.audio.stopMusic();
    this.audio.playDeath();
    this.shakeTrauma = 0.55;
    this.emitHud(true);
  }

  private handlePostDeath(): void {
    if (this.lives > 0) {
      this.loadLevel(this.levelIndex, false, 'small');
      this.audio.startThemeMusic(this.level.theme, false, false);
    } else {
      this.setPhase('gameover');
    }
  }

  private checkCoinPickups(): void {
    const p = this.player;
    for (const c of this.activeCoins) {
      const key = `${c.tx},${c.ty}`;
      if (this.collectedCoins.has(key)) continue;
      if (aabbOverlap(p.x, p.y, p.w, p.h, c.tx * TILE_SIZE + 5, c.ty * TILE_SIZE + 5, 22, 22)) {
        this.collectedCoins.add(key);
        this.collectCoinAt(c.tx * TILE_SIZE + 16, c.ty * TILE_SIZE + 16);
      }
    }

    for (const sc of this.zone.starCoins) {
      if (this.collectedStarCoins[sc.index]) continue;
      if (aabbOverlap(p.x, p.y, p.w, p.h, sc.tx * TILE_SIZE, sc.ty * TILE_SIZE, 32, 32)) {
        this.collectedStarCoins[sc.index] = true;
        this.audio.playStarCoin();
        this.hitstopTimer = 0.035;
        this.addScore(1000, sc.tx * TILE_SIZE + 16, sc.ty * TILE_SIZE, '#FACC15', 'STAR COIN!');
        this.particles.burst(sc.tx * TILE_SIZE + 16, sc.ty * TILE_SIZE + 16, 16, '#FDE047', 190, 6, 300, 'star');
        this.emitHud(true);
      }
    }
  }

  private collectCoinAt(x: number, y: number): void {
    this.coins++;
    this.audio.playCoin();
    this.particles.burst(x, y, 6, '#FDE047', 110, 4, 240, 'circle');
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
      this.audio.playOneUp();
      this.addScore(100, x, y - 10, '#4ADE80', '1-UP!');
    } else {
      this.addScore(100, x, y - 8, '#FDE047');
    }
    this.emitHud(false);
  }

  private checkFireBarCollisions(): void {
    if (this.player.starTimer > 0 || this.player.invulnTimer > 0) return;
    for (const fb of this.zone.fireBars) {
      const cx = fb.tx * TILE_SIZE + 16;
      const cy = fb.ty * TILE_SIZE + 16;
      const angle = (fb.startAngle ?? 0) + this.simTime * fb.speed;
      for (let i = 1; i < fb.length; i++) {
        const fx = cx + Math.cos(angle) * (i * 16);
        const fy = cy + Math.sin(angle) * (i * 16);
        if (aabbOverlap(this.player.x + 3, this.player.y + 3, this.player.w - 6, this.player.h - 6, fx - 5, fy - 5, 10, 10)) {
          this.hurtPlayer();
          return;
        }
      }
    }
  }

  private checkObjectives(): void {
    if (this.inBonusRoom) return;

    // Flagpole check
    if (this.level.hasFlagpole && this.level.flagpoleTx !== undefined) {
      const poleX = this.level.flagpoleTx * TILE_SIZE + 14;
      if (this.player.x + this.player.w >= poleX && this.player.x <= poleX + 10) {
        this.triggerFlagpoleVictory();
        return;
      }
    }

    // Boss Arena Axe check
    if (this.level.bossArena) {
      const axe = this.level.bossArena;
      if (
        aabbOverlap(
          this.player.x,
          this.player.y,
          this.player.w,
          this.player.h,
          axe.axeTx * TILE_SIZE,
          axe.axeTy * TILE_SIZE,
          32,
          32
        )
      ) {
        this.triggerAxeCollapse();
      }
    }
  }

  private triggerFlagpoleVictory(): void {
    this.flagpolePhase = 'sliding';
    this.sequenceTimer = 0;
    this.fireworkCount = 0;
    this.audio.stopMusic();
    this.audio.playFlagpole();

    const heightRatio = Math.max(0, Math.min(1, (11 * TILE_SIZE - this.player.y) / (7 * TILE_SIZE)));
    const flagPts = Math.round((100 + heightRatio * 4900) / 100) * 100;
    this.addScore(flagPts, this.player.x, this.player.y - 10, '#4ADE80', `${flagPts}`);
    this.flagSlideY = 4 * TILE_SIZE + 12;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.x = (this.level.flagpoleTx ?? 136) * TILE_SIZE - 10;
  }

  private updateFlagpoleSequence(dt: number): void {
    this.sequenceTimer += dt;
    if (this.flagpolePhase === 'sliding') {
      const groundY = 11 * TILE_SIZE - this.player.h;
      this.player.y = Math.min(groundY, this.player.y + 210 * dt);
      if (this.flagSlideY !== null) {
        this.flagSlideY = Math.min(10 * TILE_SIZE, this.flagSlideY + 210 * dt);
      }
      if (this.player.y >= groundY && this.sequenceTimer > 0.65) {
        this.flagpolePhase = 'fireworks';
        this.sequenceTimer = 0;
        this.audio.playVictoryFanfare();
        // Time bonus
        const timeBonus = Math.floor(this.timeLeft) * 10;
        if (timeBonus > 0) {
          this.addScore(timeBonus, this.player.x + 20, this.player.y - 24, '#FACC15', `+${timeBonus} TIME`);
        }
      }
    } else if (this.flagpolePhase === 'fireworks') {
      if (this.sequenceTimer > 0.35 * (this.fireworkCount + 1) && this.fireworkCount < 4) {
        this.fireworkCount++;
        const fx = this.camX + 200 + Math.random() * 450;
        const fy = 80 + Math.random() * 140;
        const colors = ['#EF4444', '#FACC15', '#38BDF8', '#4ADE80', '#C084FC'];
        this.particles.burst(fx, fy, 20, colors[this.fireworkCount % colors.length], 210, 6, 220, 'star');
        this.audio.playFirework();
      }
      if (this.sequenceTimer >= 2.2) {
        this.completeLevel();
      }
    }
  }

  private triggerAxeCollapse(): void {
    this.axeTriggered = true;
    this.bridgeCollapseProgress = 0;
    this.sequenceTimer = 0;
    this.audio.stopMusic();
    this.audio.playBridgeCollapse();
    this.shakeTrauma = 0.7;
    this.hitstopTimer = 0.06;
    this.addScore(5000, this.player.x, this.player.y - 16, '#FACC15', '5000');
  }

  private updateAxeCollapseSequence(dt: number): void {
    this.sequenceTimer += dt;
    this.bridgeCollapseProgress += dt * 1.4;
    for (const e of this.enemies) {
      if (e.kind === 'boss' && e.alive) {
        if (this.bridgeCollapseProgress > 0.25) {
          e.vy += PHYSICS.GRAVITY * dt;
          e.y += e.vy * dt;
          if (e.y > 13 * TILE_SIZE && e.alive) {
            e.alive = false;
            this.audio.playBossRoar();
            this.particles.burst(e.x + 24, 14 * TILE_SIZE, 24, '#F97316', 240, 7, 360);
          }
        }
      }
    }
    if (this.sequenceTimer > 1.0 && this.fireworkCount === 0) {
      this.fireworkCount = 1;
      this.audio.playVictoryFanfare();
    }
    if (this.sequenceTimer >= 2.5) {
      this.completeLevel();
    }
  }

  private completeLevel(): void {
    const clearTime = Math.max(1, Math.round(this.level.timeLimit - this.timeLeft));
    const prev = this.progress[this.level.id] ?? {
      cleared: false,
      bestScore: 0,
      bestTime: null,
      starCoins: [false, false, false],
    };
    this.progress[this.level.id] = {
      cleared: true,
      bestScore: Math.max(prev.bestScore, this.score),
      bestTime: prev.bestTime === null ? clearTime : Math.min(prev.bestTime, clearTime),
      starCoins: [
        prev.starCoins[0] || this.collectedStarCoins[0],
        prev.starCoins[1] || this.collectedStarCoins[1],
        prev.starCoins[2] || this.collectedStarCoins[2],
      ],
    };
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    this.saveProgress();
    this.campaignCompleted = this.levelIndex === LEVELS.length - 1;
    this.setPhase('victory');
  }

  private addScore(points: number, x: number, y: number, color: string, label?: string): void {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    this.popups.push({
      x,
      y,
      vy: -55,
      text: label ?? `${points}`,
      color,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  private updatePopups(dt: number): void {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.life -= dt;
      pop.y += pop.vy * dt;
      if (pop.life <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }

  private emitHud(force: boolean): void {
    const clearTime = Math.max(0, Math.round(this.level.timeLimit - this.timeLeft));
    const roundedScore = Math.round(this.score);
    const roundedBest = Math.round(this.bestScore);
    const ceilTime = Math.ceil(this.timeLeft);
    const starActive = this.player.starTimer > 0;
    const key = [
      this.phase,
      this.levelIndex,
      roundedScore,
      roundedBest,
      this.coins,
      this.lives,
      ceilTime,
      this.player.form,
      starActive ? 1 : 0,
      this.collectedStarCoins.map((b) => (b ? '1' : '0')).join(''),
      this.inBonusRoom ? 1 : 0,
      this.audio.isMuted() ? 1 : 0,
      this.campaignCompleted ? 1 : 0,
    ].join('|');

    if (force || key !== this.lastHudKey) {
      this.lastHudKey = key;
      this.onHudChange({
        phase: this.phase,
        levelIndex: this.levelIndex,
        levelId: this.level.id,
        levelName: this.level.name,
        theme: this.level.theme,
        score: roundedScore,
        bestScore: roundedBest,
        coins: this.coins,
        lives: this.lives,
        timeLeft: ceilTime,
        form: this.player.form,
        starActive,
        starCoinsCollected: [...this.collectedStarCoins],
        inBonusRoom: this.inBonusRoom,
        campaignMode: this.campaignMode,
        muted: this.audio.isMuted(),
        clearTime,
        damageTaken: this.damageTaken,
        enemiesDefeated: this.enemiesDefeated,
        campaignCompleted: this.campaignCompleted,
      });
    }
  }

  private render(): void {
    const shakeMag = this.shakeTrauma * this.shakeTrauma * 9;
    const shakeX = shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0;
    const shakeY = shakeMag > 0.1 ? (Math.random() * 2 - 1) * shakeMag : 0;

    renderGameFrame(this.ctx, this.canvas.width, this.canvas.height, {
      level: this.level,
      zone: { ...this.zone, tiles: this.workingTiles },
      inBonusRoom: this.inBonusRoom,
      player: this.player,
      enemies: this.enemies,
      powerUps: this.powerUps,
      fireballs: this.fireballs,
      coins: this.activeCoins,
      collectedCoins: this.collectedCoins,
      starCoins: this.zone.starCoins,
      collectedStarCoins: this.collectedStarCoins,
      movingPlatforms: this.movingPlatforms,
      fireBars: this.zone.fireBars,
      crumbleStates: this.crumbleStates,
      bumpedBlocks: this.bumpedBlocks,
      popups: this.popups,
      particles: this.particles,
      camX: this.camX,
      shakeX,
      shakeY,
      time: this.simTime,
      flagSlideY: this.flagSlideY,
      axeTriggered: this.axeTriggered,
      bridgeCollapseProgress: this.bridgeCollapseProgress,
    });
  }
}

function tyToPy(ty: number): number {
  return ty * TILE_SIZE;
}
