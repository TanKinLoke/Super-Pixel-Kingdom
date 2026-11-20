export type GamePhase = 'title' | 'worldmap' | 'playing' | 'paused' | 'victory' | 'gameover';

export type PlayerForm = 'small' | 'super' | 'fire';

export type WorldTheme =
  | 'meadow'
  | 'cavern'
  | 'treetops'
  | 'beach'
  | 'canyon'
  | 'airship'
  | 'haunted'
  | 'glacier'
  | 'magma'
  | 'castle';

export type TileKind =
  | 'empty'
  | 'ground'
  | 'brick'
  | 'question_coin'
  | 'question_powerup'
  | 'question_star'
  | 'question_1up'
  | 'used_block'
  | 'hard_block'
  | 'hidden_1up'
  | 'hidden_starcoin'
  | 'pipe_tl'
  | 'pipe_tr'
  | 'pipe_bl'
  | 'pipe_br'
  | 'mushroom_cap_l'
  | 'mushroom_cap_m'
  | 'mushroom_cap_r'
  | 'mushroom_stem'
  | 'ice'
  | 'bridge'
  | 'lava'
  | 'spike'
  | 'crumble'
  | 'spring'
  | 'axe'
  | 'castle_wall';

export type EnemyKind =
  | 'shroom'       // Goomba-style walker
  | 'turtle'       // Koopa-style patrol -> shell
  | 'chomper'      // Piranha-style emerging from pipe
  | 'jumper'       // Winged bouncing enemy
  | 'bullet'       // Cannon Bill horizontal projectile
  | 'boo'          // Ghost that freezes when player faces it
  | 'boss';        // King Bowser-style final boss

export type PowerUpKind = 'mushroom' | 'flower' | 'star' | 'oneup';

export interface PipeWarp {
  /** Tile X of pipe top-left */
  tx: number;
  /** Tile Y of pipe top */
  ty: number;
  /** Target zone: 'bonus' or 'main' */
  targetZone: 'bonus' | 'main';
  /** Spawn tile X in target zone */
  destX: number;
  /** Spawn tile Y in target zone */
  destY: number;
}

export interface MovingPlatformDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  endX: number;
  endY: number;
  speed: number;
}

export interface FireBarDef {
  tx: number;
  ty: number;
  length: number; // number of fireballs
  speed: number;  // radians per second
  startAngle?: number;
}

export interface CannonDef {
  tx: number;
  ty: number;
  interval: number;
  direction: -1 | 1;
}

export interface EnemySpawn {
  kind: EnemyKind;
  tx: number;
  ty: number;
  dir?: -1 | 1;
}

export interface StarCoinSpawn {
  index: 0 | 1 | 2;
  tx: number;
  ty: number;
}

export interface CoinSpawn {
  tx: number;
  ty: number;
}

export interface ZoneData {
  width: number;  // in tiles
  height: number; // in tiles (15 tiles = 480px at 32px/tile)
  tiles: TileKind[][]; // [y][x]
  enemies: EnemySpawn[];
  coins: CoinSpawn[];
  starCoins: StarCoinSpawn[];
  movingPlatforms: MovingPlatformDef[];
  fireBars: FireBarDef[];
  cannons: CannonDef[];
  warps: PipeWarp[];
  spawnX: number; // tile X
  spawnY: number; // tile Y
}

export interface LevelDef {
  id: string;       // '1-1' .. '5-2'
  index: number;    // 0 .. 9
  worldNum: number; // 1 .. 5
  stageNum: number; // 1 .. 2
  name: string;
  subtitle: string;
  theme: WorldTheme;
  timeLimit: number;
  hasFlagpole: boolean;
  flagpoleTx?: number;
  bossArena?: {
    bridgeStartTx: number;
    bridgeEndTx: number;
    bridgeTy: number;
    axeTx: number;
    axeTy: number;
    bossTx: number;
    bossTy: number;
  };
  mainZone: ZoneData;
  bonusZone?: ZoneData;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  runHeld: boolean;
  runJustPressed: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: -1 | 1;
  form: PlayerForm;
  onGround: boolean;
  onIce: boolean;
  crouching: boolean;
  skidding: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  invulnTimer: number;
  starTimer: number;
  fireCooldown: number;
  scaleX: number;
  scaleY: number;
  walkDist: number;
  dead: boolean;
  deathTimer: number;
  ridingPlatformId: string | null;
}

export interface ActiveEnemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: -1 | 1;
  onGround: boolean;
  alive: boolean;
  koTimer: number;
  shellState?: 'walking' | 'idle_shell' | 'sliding_shell';
  baseY?: number;
  phase?: number;
  pipePause?: boolean;
  frozen?: boolean;
  hp?: number;
  fireTimer?: number;
  jumpTimer?: number;
  hitFlash?: number;
}

export interface ActivePowerUp {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  emergeTimer: number;
  targetY: number;
  collected: boolean;
}

export interface ActiveFireball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromBoss: boolean;
  life: number;
}

export interface ActiveMovingPlatform extends MovingPlatformDef {
  dx: number;
  dy: number;
  t: number;
  dir: 1 | -1;
}

export interface CrumbleTileState {
  tx: number;
  ty: number;
  state: 'solid' | 'shaking' | 'fallen';
  timer: number;
}

export interface BumpedBlock {
  tx: number;
  ty: number;
  offsetY: number;
  vy: number;
}

export interface FloatingPopup {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface LevelProgress {
  cleared: boolean;
  bestScore: number;
  bestTime: number | null;
  starCoins: [boolean, boolean, boolean];
}

export interface HudSnapshot {
  phase: GamePhase;
  levelIndex: number;
  levelId: string;
  levelName: string;
  theme: WorldTheme;
  score: number;
  bestScore: number;
  coins: number;
  lives: number;
  timeLeft: number;
  form: PlayerForm;
  starActive: boolean;
  starCoinsCollected: [boolean, boolean, boolean];
  inBonusRoom: boolean;
  campaignMode: boolean;
  muted: boolean;
  clearTime: number;
  damageTaken: number;
  enemiesDefeated: number;
  campaignCompleted: boolean;
}
