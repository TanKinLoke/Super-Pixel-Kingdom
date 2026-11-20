import { ZONE_HEIGHT_TILES } from './physics';
import {
  CannonDef,
  CoinSpawn,
  EnemyKind,
  EnemySpawn,
  FireBarDef,
  LevelDef,
  MovingPlatformDef,
  PipeWarp,
  StarCoinSpawn,
  TileKind,
  ZoneData,
} from './types';

class ZoneBuilder {
  width: number;
  height: number = ZONE_HEIGHT_TILES;
  tiles: TileKind[][];
  enemies: EnemySpawn[] = [];
  coins: CoinSpawn[] = [];
  starCoins: StarCoinSpawn[] = [];
  movingPlatforms: MovingPlatformDef[] = [];
  fireBars: FireBarDef[] = [];
  cannons: CannonDef[] = [];
  warps: PipeWarp[] = [];
  spawnX = 3;
  spawnY = 11;

  constructor(width: number) {
    this.width = width;
    this.tiles = Array.from({ length: this.height }, () =>
      Array.from({ length: width }, () => 'empty' as TileKind)
    );
  }

  set(tx: number, ty: number, tile: TileKind): this {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.tiles[ty][tx] = tile;
    }
    return this;
  }

  fill(x1: number, y1: number, x2: number, y2: number, tile: TileKind): this {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        this.set(x, y, tile);
      }
    }
    return this;
  }

  ground(x1: number, x2: number, topY = 12, tile: TileKind = 'ground'): this {
    return this.fill(x1, topY, x2, this.height - 1, tile);
  }

  row(x1: number, x2: number, y: number, tile: TileKind): this {
    return this.fill(x1, y, x2, y, tile);
  }

  stairsUp(startX: number, baseBottomY: number, height: number, tile: TileKind = 'hard_block'): this {
    for (let i = 0; i < height; i++) {
      this.fill(startX + i, baseBottomY - i, startX + i, baseBottomY, tile);
    }
    return this;
  }

  stairsDown(startX: number, baseBottomY: number, height: number, tile: TileKind = 'hard_block'): this {
    for (let i = 0; i < height; i++) {
      this.fill(startX + i, baseBottomY - (height - 1 - i), startX + i, baseBottomY, tile);
    }
    return this;
  }

  pipe(tx: number, topY: number, bottomY = 11, chomper = false): this {
    this.set(tx, topY, 'pipe_tl');
    this.set(tx + 1, topY, 'pipe_tr');
    for (let y = topY + 1; y <= bottomY; y++) {
      this.set(tx, y, 'pipe_bl');
      this.set(tx + 1, y, 'pipe_br');
    }
    if (chomper) {
      this.enemies.push({ kind: 'chomper', tx, ty: topY });
    }
    return this;
  }

  mushroomPlatform(centerX: number, capY: number, halfWidth: number, stemBottomY = 14): this {
    this.set(centerX - halfWidth, capY, 'mushroom_cap_l');
    for (let x = centerX - halfWidth + 1; x <= centerX + halfWidth - 1; x++) {
      this.set(x, capY, 'mushroom_cap_m');
    }
    this.set(centerX + halfWidth, capY, 'mushroom_cap_r');
    for (let y = capY + 1; y <= stemBottomY; y++) {
      this.set(centerX, y, 'mushroom_stem');
    }
    return this;
  }

  enemy(kind: EnemyKind, tx: number, ty: number, dir: -1 | 1 = -1): this {
    this.enemies.push({ kind, tx, ty, dir });
    return this;
  }

  coinArc(startX: number, peakY: number, count: number): this {
    for (let i = 0; i < count; i++) {
      const arcOffset = i === 0 || i === count - 1 ? 1 : 0;
      this.coins.push({ tx: startX + i, ty: peakY + arcOffset });
    }
    return this;
  }

  coinLine(x1: number, x2: number, y: number): this {
    for (let x = x1; x <= x2; x++) {
      this.coins.push({ tx: x, ty: y });
    }
    return this;
  }

  starCoin(index: 0 | 1 | 2, tx: number, ty: number): this {
    this.starCoins.push({ index, tx, ty });
    return this;
  }

  platform(id: string, tx: number, ty: number, wTiles: number, endTx: number, endTy: number, speed = 75): this {
    this.movingPlatforms.push({
      id,
      x: tx * 32,
      y: ty * 32,
      w: wTiles * 32,
      h: 16,
      endX: endTx * 32,
      endY: endTy * 32,
      speed,
    });
    return this;
  }

  fireBar(tx: number, ty: number, length = 5, speed = 1.9, startAngle = 0): this {
    this.fireBars.push({ tx, ty, length, speed, startAngle });
    return this;
  }

  cannon(tx: number, ty: number, direction: -1 | 1 = -1, interval = 2.6): this {
    this.set(tx, ty, 'hard_block');
    this.cannons.push({ tx, ty, direction, interval });
    return this;
  }

  warp(tx: number, ty: number, targetZone: 'bonus' | 'main', destX: number, destY: number): this {
    this.warps.push({ tx, ty, targetZone, destX, destY });
    return this;
  }

  spawn(tx: number, ty: number): this {
    this.spawnX = tx;
    this.spawnY = ty;
    return this;
  }

  build(): ZoneData {
    return {
      width: this.width,
      height: this.height,
      tiles: this.tiles,
      enemies: this.enemies,
      coins: this.coins,
      starCoins: this.starCoins,
      movingPlatforms: this.movingPlatforms,
      fireBars: this.fireBars,
      cannons: this.cannons,
      warps: this.warps,
      spawnX: this.spawnX,
      spawnY: this.spawnY,
    };
  }
}

function createBonusRoom(returnTx: number, returnTy: number, starCoinIdx?: 0 | 1 | 2): ZoneData {
  const b = new ZoneBuilder(24);
  b.spawn(3, 11);
  b.fill(0, 0, 0, 14, 'brick');
  b.fill(23, 0, 23, 14, 'brick');
  b.row(1, 22, 1, 'brick');
  b.ground(0, 23, 12, 'ground');
  // Floating brick stage full of coins
  b.row(5, 14, 8, 'brick');
  b.coinLine(5, 14, 7);
  b.coinLine(5, 14, 6);
  b.coinLine(6, 13, 11);
  if (starCoinIdx !== undefined) {
    b.starCoin(starCoinIdx, 9, 4);
    b.set(9, 8, 'question_powerup');
  } else {
    b.set(9, 8, 'question_1up');
  }
  // Exit pipe on the right
  b.pipe(19, 10, 11, false);
  b.warp(19, 10, 'main', returnTx, returnTy);
  return b.build();
}

// ---------------------------------------------------------------------------
// LEVEL 1-1: SUNNY MEADOW
// ---------------------------------------------------------------------------
function buildLevel1_1(): LevelDef {
  const m = new ZoneBuilder(150);
  m.spawn(3, 11);
  m.ground(0, 52, 12);
  m.ground(56, 74, 12); // 3-tile pit
  m.ground(78, 118, 12); // 3-tile pit
  m.ground(122, 149, 12); // 3-tile pit

  // Classic opening ? block & brick cluster
  m.set(14, 8, 'question_coin');
  m.set(18, 8, 'brick');
  m.set(19, 8, 'question_powerup'); // First Mushroom!
  m.set(20, 8, 'brick');
  m.set(21, 8, 'question_coin');
  m.set(22, 8, 'brick');
  m.set(20, 5, 'question_coin');

  // Pipes (pipe at tx=38 is a warp pipe to Bonus Coin Room!)
  m.pipe(27, 10, 11, false);
  m.pipe(33, 9, 11, false);
  m.pipe(38, 9, 11, false);
  m.warp(38, 9, 'bonus', 3, 10);
  m.pipe(46, 9, 11, true);

  // Hidden 1-UP block above safe gap before first pit
  m.set(50, 8, 'hidden_1up');

  // First Star Coin high over brick bridge
  m.row(59, 64, 9, 'brick');
  m.set(61, 5, 'question_powerup');
  m.starCoin(0, 61, 7);
  m.coinArc(54, 9, 3);

  // Mid-section enemy bowling alley + high route
  m.row(67, 72, 8, 'brick');
  m.coinLine(68, 71, 7);
  m.set(70, 5, 'question_star'); // First Star!

  // Second pit + Star Coin 2
  m.coinArc(75, 9, 3);
  m.row(80, 86, 9, 'brick');
  m.set(83, 9, 'question_coin');
  m.starCoin(1, 83, 5);
  m.set(83, 6, 'hidden_starcoin'); // secret stepping stone or coin above

  // Staircase + high Star Coin 3 before finale
  m.stairsUp(94, 11, 4);
  m.stairsDown(99, 11, 4);
  m.pipe(107, 10, 11, true);
  m.row(111, 115, 9, 'brick');
  m.set(113, 9, 'question_coin');
  m.starCoin(2, 120, 7); // Over final 3-tile pit!
  m.coinArc(119, 8, 3);

  // Flagpole staircase & castle
  m.stairsUp(126, 11, 5);
  m.fill(131, 7, 131, 11, 'hard_block');
  // Flagpole at tx=136
  m.set(136, 11, 'hard_block');

  // Enemies
  m.enemy('shroom', 20, 11, -1);
  m.enemy('shroom', 31, 11, -1);
  m.enemy('shroom', 43, 11, -1);
  m.enemy('turtle', 60, 11, -1);
  m.enemy('shroom', 64, 11, -1);
  m.enemy('shroom', 69, 7, -1);
  m.enemy('turtle', 82, 11, -1);
  m.enemy('shroom', 88, 11, -1);
  m.enemy('shroom', 91, 11, -1);
  m.enemy('shroom', 105, 11, -1);
  m.enemy('turtle', 113, 11, -1);

  return {
    id: '1-1',
    index: 0,
    worldNum: 1,
    stageNum: 1,
    name: 'Sunny Meadow',
    subtitle: 'First Steps in the Kingdom',
    theme: 'meadow',
    timeLimit: 300,
    hasFlagpole: true,
    flagpoleTx: 136,
    mainZone: m.build(),
    bonusZone: createBonusRoom(46, 8),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 1-2: CRYSTAL CAVERN
// ---------------------------------------------------------------------------
function buildLevel1_2(): LevelDef {
  const m = new ZoneBuilder(155);
  m.spawn(3, 11);
  // Underground ceiling bricks (with gap for ceiling run!)
  m.row(0, 42, 1, 'brick');
  m.row(48, 115, 1, 'brick');
  m.row(122, 154, 1, 'brick');

  m.ground(0, 44, 12);
  m.ground(48, 70, 12); // 3-tile pit
  m.ground(74, 96, 12); // 3-tile pit
  m.ground(108, 154, 12); // 11-tile chasm bridged by moving lift!

  // Early powerup & brick-smashing staircase
  m.set(10, 9, 'question_powerup');
  m.set(12, 9, 'question_coin');
  m.set(14, 9, 'question_coin');
  m.fill(18, 9, 21, 11, 'brick');
  m.coinLine(18, 21, 8);

  // Ceiling shortcut path!
  m.stairsUp(26, 11, 3, 'hard_block');
  m.row(30, 45, 5, 'brick');
  m.coinLine(32, 42, 4);
  m.starCoin(0, 38, 3); // Star Coin 1 on upper cavern ledge

  // Lower cavern path
  m.pipe(34, 10, 11, true);
  m.set(41, 9, 'question_1up');
  m.pipe(41, 10, 11, false);
  m.warp(41, 10, 'bonus', 3, 10);

  // Pit 1 + Star Coin 2
  m.row(52, 58, 9, 'brick');
  m.set(55, 9, 'question_powerup');
  m.set(61, 8, 'brick');
  m.set(62, 8, 'question_coin');
  m.set(63, 8, 'brick');
  m.starCoin(1, 62, 5);

  // Pit 2 + Chomper pipes
  m.pipe(76, 9, 11, true);
  m.pipe(84, 10, 11, true);
  m.row(88, 94, 8, 'brick');
  m.set(91, 8, 'question_star');

  // Moving Lift Chasm (tx 97..107)
  m.platform('cavern_lift_1', 97, 11, 3, 104, 9, 80);
  m.starCoin(2, 102, 6);
  m.coinArc(100, 7, 5);

  // Final stretch to underground exit flagpole
  m.row(113, 120, 9, 'brick');
  m.coinLine(114, 119, 8);
  m.stairsUp(128, 11, 4, 'hard_block');
  m.set(138, 11, 'hard_block');

  m.enemy('shroom', 15, 11, -1);
  m.enemy('turtle', 24, 11, -1);
  m.enemy('shroom', 37, 11, -1);
  m.enemy('shroom', 54, 11, -1);
  m.enemy('turtle', 66, 11, -1);
  m.enemy('shroom', 80, 11, -1);
  m.enemy('shroom', 115, 11, -1);
  m.enemy('turtle', 120, 11, -1);

  return {
    id: '1-2',
    index: 1,
    worldNum: 1,
    stageNum: 2,
    name: 'Crystal Cavern',
    subtitle: 'Subterranean Brick Shortcuts',
    theme: 'cavern',
    timeLimit: 300,
    hasFlagpole: true,
    flagpoleTx: 138,
    mainZone: m.build(),
    bonusZone: createBonusRoom(50, 8),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 2-1: GIANT MUSHROOM TREETOPS
// ---------------------------------------------------------------------------
function buildLevel2_1(): LevelDef {
  const m = new ZoneBuilder(155);
  m.spawn(3, 11);
  m.ground(0, 18, 12);

  // Giant Mushroom Treetop Islands (caps are bouncy & one-way!)
  m.mushroomPlatform(24, 10, 3);
  m.mushroomPlatform(33, 8, 3);
  m.mushroomPlatform(42, 10, 4);
  m.set(42, 6, 'question_powerup');
  m.starCoin(0, 33, 5);

  // Mid island
  m.ground(50, 66, 12);
  m.set(55, 9, 'question_coin');
  m.set(56, 9, 'brick');
  m.set(57, 9, 'question_coin');
  m.pipe(61, 10, 11, true);

  // High altitude mushroom canopy
  m.mushroomPlatform(72, 11, 3);
  m.mushroomPlatform(80, 9, 3);
  m.mushroomPlatform(88, 7, 3);
  m.coinArc(75, 6, 4);
  m.starCoin(1, 88, 4);
  m.mushroomPlatform(96, 9, 3);

  // Ground island with Winged Jumpers & hidden 1-UP
  m.ground(102, 118, 12);
  m.set(106, 9, 'question_powerup');
  m.set(112, 8, 'hidden_1up');
  m.row(109, 115, 9, 'brick');

  // Final mushroom hop to flagpole island
  m.mushroomPlatform(123, 10, 2);
  m.mushroomPlatform(130, 9, 2);
  m.starCoin(2, 126, 6);
  m.ground(135, 154, 12);
  m.stairsUp(137, 11, 3);
  m.set(143, 11, 'hard_block');

  m.enemy('shroom', 14, 11, -1);
  m.enemy('jumper', 42, 9, -1);
  m.enemy('turtle', 54, 11, -1);
  m.enemy('jumper', 80, 8, -1);
  m.enemy('jumper', 96, 8, -1);
  m.enemy('shroom', 108, 11, -1);
  m.enemy('turtle', 114, 11, -1);

  return {
    id: '2-1',
    index: 2,
    worldNum: 2,
    stageNum: 1,
    name: 'Giant Mushroom Treetops',
    subtitle: 'Sky-High Canopy Leaps',
    theme: 'treetops',
    timeLimit: 320,
    hasFlagpole: true,
    flagpoleTx: 143,
    mainZone: m.build(),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 2-2: SUNSET CORAL BEACH
// ---------------------------------------------------------------------------
function buildLevel2_2(): LevelDef {
  const m = new ZoneBuilder(155);
  m.spawn(3, 11);
  m.ground(0, 32, 12);

  // Tropical bridge 1 over water
  m.row(33, 44, 11, 'bridge');
  m.coinArc(36, 8, 5);
  m.ground(45, 76, 12);

  // Bowling lane: Shell Turtle in front of 5 Shroom Walkers!
  m.set(16, 9, 'question_powerup');
  m.pipe(24, 10, 11, true);
  m.enemy('turtle', 48, 11, -1);
  m.enemy('shroom', 54, 11, -1);
  m.enemy('shroom', 57, 11, -1);
  m.enemy('shroom', 60, 11, -1);
  m.enemy('shroom', 63, 11, -1);
  m.starCoin(0, 58, 7);

  // Springboard high island!
  m.set(72, 11, 'spring');
  m.row(76, 85, 6, 'brick');
  m.coinLine(77, 84, 5);
  m.starCoin(1, 80, 4);

  // Lower coral bridge option too so spring isn't mandatory
  m.row(77, 86, 11, 'bridge');
  m.ground(87, 112, 12);

  m.pipe(92, 9, 11, true);
  m.pipe(98, 10, 11, false);
  m.warp(98, 10, 'bonus', 3, 10); // Secret Coral Grotto coin room!
  m.set(104, 9, 'question_powerup');
  m.set(106, 9, 'question_star');

  // Final tropical bridges & spring to Star Coin 3
  m.row(113, 122, 11, 'bridge');
  m.set(118, 10, 'spring');
  m.starCoin(2, 121, 5);
  m.ground(123, 154, 12);
  m.pipe(127, 10, 11, true);
  m.stairsUp(134, 11, 4);
  m.set(143, 11, 'hard_block');

  m.enemy('shroom', 14, 11, -1);
  m.enemy('turtle', 20, 11, -1);
  m.enemy('jumper', 38, 9, -1);
  m.enemy('turtle', 82, 10, -1);
  m.enemy('shroom', 102, 11, -1);
  m.enemy('jumper', 115, 9, -1);
  m.enemy('shroom', 131, 11, -1);

  return {
    id: '2-2',
    index: 3,
    worldNum: 2,
    stageNum: 2,
    name: 'Sunset Coral Beach',
    subtitle: 'Shell Bowling & Springboard Waves',
    theme: 'beach',
    timeLimit: 320,
    hasFlagpole: true,
    flagpoleTx: 143,
    mainZone: m.build(),
    bonusZone: createBonusRoom(101, 8),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 3-1: WINDY CANYON RUINS
// ---------------------------------------------------------------------------
function buildLevel3_1(): LevelDef {
  const m = new ZoneBuilder(160);
  m.spawn(3, 11);
  m.ground(0, 22, 12);
  m.set(12, 9, 'question_powerup');
  m.stairsUp(16, 11, 3);

  // Crumbling ruin bridge 1
  m.row(23, 27, 9, 'crumble');
  m.ground(28, 36, 10);
  m.starCoin(0, 32, 7);
  m.set(34, 7, 'question_star'); // Star run across crumbling ruins!

  // Crumbling stepping stones
  m.row(39, 42, 10, 'crumble');
  m.row(45, 48, 9, 'crumble');
  m.ground(51, 70, 12);
  m.set(56, 9, 'question_coin');
  m.set(58, 9, 'question_powerup');
  m.pipe(64, 10, 11, true);

  // Vertical ruin climb!
  m.ground(73, 86, 12);
  m.row(75, 79, 9, 'hard_block');
  m.row(80, 84, 6, 'hard_block');
  m.starCoin(1, 82, 4);
  m.set(77, 6, 'question_1up');

  // High canyon bridge with crumbling tiles & moving platform
  m.row(87, 91, 7, 'crumble');
  m.platform('canyon_lift', 93, 9, 3, 101, 9, 85);
  m.ground(104, 122, 11);
  m.set(110, 8, 'question_powerup');
  m.coinArc(113, 8, 4);

  // Final crumbling dash
  m.row(125, 128, 11, 'crumble');
  m.row(131, 134, 10, 'crumble');
  m.starCoin(2, 132, 7);
  m.ground(137, 159, 12);
  m.stairsUp(141, 11, 4);
  m.set(149, 11, 'hard_block');

  m.enemy('shroom', 10, 11, -1);
  m.enemy('jumper', 31, 9, -1);
  m.enemy('turtle', 58, 11, -1);
  m.enemy('shroom', 61, 11, -1);
  m.enemy('jumper', 78, 8, -1);
  m.enemy('turtle', 112, 10, -1);
  m.enemy('shroom', 117, 10, -1);
  m.enemy('jumper', 140, 11, -1);

  return {
    id: '3-1',
    index: 4,
    worldNum: 3,
    stageNum: 1,
    name: 'Windy Canyon Ruins',
    subtitle: 'Crumbling Cliffs & Vertical Ascents',
    theme: 'canyon',
    timeLimit: 340,
    hasFlagpole: true,
    flagpoleTx: 149,
    mainZone: m.build(),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 3-2: SKY PIRATE AIRSHIP
// ---------------------------------------------------------------------------
function buildLevel3_2(): LevelDef {
  const m = new ZoneBuilder(160);
  m.spawn(3, 10);
  // Airship Deck 1
  m.ground(0, 32, 11, 'hard_block');
  m.set(10, 8, 'question_powerup');
  m.cannon(20, 10, -1, 2.5);
  m.cannon(28, 9, -1, 2.8);
  m.coinArc(14, 8, 4);

  // Moving sky gondola between decks
  m.platform('airship_1', 34, 11, 3, 42, 9, 95);
  m.starCoin(0, 39, 6);

  // Airship Deck 2 (Flagship)
  m.ground(45, 82, 10, 'hard_block');
  m.fill(52, 7, 56, 7, 'brick');
  m.set(54, 7, 'question_powerup');
  m.cannon(62, 9, -1, 2.3);
  m.cannon(70, 8, -1, 2.6);
  m.set(76, 9, 'spring');
  m.starCoin(1, 78, 4);
  m.coinLine(64, 68, 6);

  // Moving deck bridge 2
  m.platform('airship_2', 84, 10, 3, 93, 10, 100);
  m.platform('airship_3', 96, 9, 3, 104, 8, 95);

  // Airship Deck 3
  m.ground(107, 134, 10, 'hard_block');
  m.set(112, 7, 'question_star');
  m.cannon(120, 9, -1, 2.1);
  m.cannon(126, 8, -1, 2.4);
  m.starCoin(2, 126, 5);
  m.coinArc(115, 6, 4);

  // Final landing deck
  m.ground(138, 159, 11, 'hard_block');
  m.stairsUp(141, 10, 3);
  m.set(149, 10, 'hard_block');

  m.enemy('turtle', 15, 10, -1);
  m.enemy('shroom', 49, 9, -1);
  m.enemy('jumper', 58, 9, -1);
  m.enemy('turtle', 74, 9, -1);
  m.enemy('shroom', 114, 9, -1);
  m.enemy('jumper', 129, 9, -1);

  return {
    id: '3-2',
    index: 5,
    worldNum: 3,
    stageNum: 2,
    name: 'Sky Pirate Airship',
    subtitle: 'Cannon Decks & Moving Gondolas',
    theme: 'airship',
    timeLimit: 340,
    hasFlagpole: true,
    flagpoleTx: 149,
    mainZone: m.build(),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 4-1: HAUNTED BOO WOODS
// ---------------------------------------------------------------------------
function buildLevel4_1(): LevelDef {
  const m = new ZoneBuilder(155);
  m.spawn(3, 11);
  m.ground(0, 44, 12);
  m.ground(48, 88, 12);
  m.ground(92, 122, 12);
  m.ground(126, 154, 12);

  m.set(12, 9, 'question_powerup');
  m.set(18, 9, 'brick');
  m.set(19, 9, 'question_coin');
  m.set(20, 9, 'brick');

  // Ghost ambush zone
  m.enemy('boo', 26, 8, -1);
  m.pipe(32, 10, 11, false);
  m.warp(32, 10, 'bonus', 3, 10);
  m.starCoin(0, 38, 6);
  m.row(36, 41, 9, 'brick');

  // Pit 1 + Haunted Treetop shortcut
  m.coinArc(45, 9, 3);
  m.enemy('boo', 55, 7, -1);
  m.row(54, 62, 9, 'brick');
  m.set(58, 9, 'question_powerup');
  m.set(60, 5, 'question_star');
  m.enemy('shroom', 66, 11, -1);

  // Haunted Bridge + Boo pair
  m.row(72, 82, 8, 'bridge');
  m.starCoin(1, 77, 6);
  m.enemy('boo', 78, 6, -1);
  m.set(77, 11, 'spring'); // Bounce up to the haunted bridge!

  // Final eerie woods stretch
  m.enemy('boo', 98, 8, -1);
  m.enemy('turtle', 105, 11, -1);
  m.row(108, 115, 9, 'brick');
  m.set(111, 9, 'question_1up');
  m.starCoin(2, 124, 7);
  m.coinArc(123, 8, 3);
  m.enemy('boo', 131, 7, -1);

  m.stairsUp(135, 11, 4);
  m.set(144, 11, 'hard_block');

  return {
    id: '4-1',
    index: 6,
    worldNum: 4,
    stageNum: 1,
    name: 'Haunted Boo Woods',
    subtitle: 'Don’t Turn Your Back on the Ghosts',
    theme: 'haunted',
    timeLimit: 340,
    hasFlagpole: true,
    flagpoleTx: 144,
    mainZone: m.build(),
    bonusZone: createBonusRoom(35, 8),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 4-2: FROSTBITE GLACIER
// ---------------------------------------------------------------------------
function buildLevel4_2(): LevelDef {
  const m = new ZoneBuilder(155);
  m.spawn(3, 11);

  // Slippery ice ground segments!
  m.ground(0, 38, 12, 'ice');
  m.ground(42, 74, 12, 'ice');
  m.ground(85, 116, 12, 'ice');
  m.ground(120, 154, 12, 'ice');

  m.set(11, 9, 'question_powerup');
  m.set(15, 9, 'question_powerup'); // Fire Flower if already Super!
  m.row(20, 26, 9, 'brick');
  m.set(23, 11, 'spike'); // Icicle hazard on floor
  m.set(24, 11, 'spike');
  m.starCoin(0, 23, 7);

  // Icicle valley
  m.pipe(32, 10, 11, true);
  m.coinArc(39, 9, 3);
  m.set(48, 11, 'spike');
  m.set(49, 11, 'spike');
  m.row(46, 52, 9, 'ice');
  m.set(49, 6, 'question_coin');

  // Ice slide + Star Coin 2
  m.set(60, 9, 'question_powerup');
  m.set(64, 11, 'spike');
  m.starCoin(1, 64, 8);
  m.row(67, 72, 9, 'brick');

  // Frozen Chasm moving platform
  m.platform('glacier_lift', 75, 11, 3, 82, 10, 85);
  m.coinArc(77, 8, 4);

  // Ice fortress climb
  m.stairsUp(92, 11, 3, 'ice');
  m.row(97, 106, 8, 'ice');
  m.set(101, 5, 'question_star');
  m.starCoin(2, 101, 7);
  m.set(104, 11, 'spike');
  m.set(105, 11, 'spike');

  // Final slide to flagpole
  m.coinArc(117, 9, 3);
  m.stairsUp(132, 11, 4, 'hard_block');
  m.set(142, 11, 'hard_block');

  m.enemy('shroom', 17, 11, -1);
  m.enemy('turtle', 29, 11, -1);
  m.enemy('jumper', 54, 10, -1);
  m.enemy('shroom', 70, 11, -1);
  m.enemy('turtle', 88, 11, -1);
  m.enemy('jumper', 111, 10, -1);
  m.enemy('shroom', 126, 11, -1);

  return {
    id: '4-2',
    index: 7,
    worldNum: 4,
    stageNum: 2,
    name: 'Frostbite Glacier',
    subtitle: 'Slippery Ice & Icicle Hazards',
    theme: 'glacier',
    timeLimit: 340,
    hasFlagpole: true,
    flagpoleTx: 142,
    mainZone: m.build(),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 5-1: MAGMA GAUNTLET
// ---------------------------------------------------------------------------
function buildLevel5_1(): LevelDef {
  const m = new ZoneBuilder(160);
  m.spawn(3, 11);
  // Castle stone ceiling
  m.row(0, 159, 1, 'castle_wall');

  // Lava floor fills pits visually at row 14
  m.fill(0, 14, 159, 14, 'lava');

  m.ground(0, 24, 12, 'castle_wall');
  m.set(11, 9, 'question_powerup');
  m.fireBar(18, 11, 5, 2.0, 0);

  // Lava platforming with fire-bars
  m.ground(28, 42, 11, 'castle_wall');
  m.fireBar(35, 10, 5, -2.1, 1.5);
  m.starCoin(0, 35, 6);

  // Moving platform over lava lake
  m.platform('magma_lift_1', 44, 11, 3, 53, 11, 90);
  m.coinArc(47, 8, 4);

  m.ground(56, 80, 12, 'castle_wall');
  m.set(62, 9, 'question_powerup');
  m.fireBar(67, 11, 6, 2.2, 0);
  m.set(74, 9, 'question_star');
  m.starCoin(1, 74, 6);

  // Gauntlet of crumbling castle ledges & cannons
  m.row(84, 88, 11, 'crumble');
  m.ground(91, 108, 11, 'castle_wall');
  m.cannon(98, 10, -1, 2.2);
  m.fireBar(104, 10, 5, 2.4, 0.7);

  m.platform('magma_lift_2', 111, 11, 3, 120, 9, 95);
  m.starCoin(2, 116, 6);

  m.ground(123, 159, 12, 'castle_wall');
  m.fireBar(130, 11, 5, -2.1, 0);
  m.stairsUp(136, 11, 4, 'castle_wall');
  m.set(146, 11, 'hard_block');

  m.enemy('turtle', 21, 11, -1);
  m.enemy('shroom', 31, 10, -1);
  m.enemy('jumper', 60, 10, -1);
  m.enemy('turtle', 77, 11, -1);
  m.enemy('shroom', 95, 10, -1);
  m.enemy('shroom', 127, 11, -1);

  return {
    id: '5-1',
    index: 8,
    worldNum: 5,
    stageNum: 1,
    name: 'Magma Gauntlet',
    subtitle: 'Spinning Fire-Bars & Molten Gaps',
    theme: 'magma',
    timeLimit: 360,
    hasFlagpole: true,
    flagpoleTx: 146,
    mainZone: m.build(),
  };
}

// ---------------------------------------------------------------------------
// LEVEL 5-2: KING'S CASTLE (FINAL BOSS ARENA)
// ---------------------------------------------------------------------------
function buildLevel5_2(): LevelDef {
  const m = new ZoneBuilder(155);
  m.spawn(3, 11);
  m.row(0, 154, 1, 'castle_wall');
  m.fill(0, 14, 154, 14, 'lava');

  // Castle Approach
  m.ground(0, 26, 12, 'castle_wall');
  m.set(10, 9, 'question_powerup');
  m.set(14, 9, 'question_powerup'); // Guaranteed Fire Flower if Super!
  m.fireBar(19, 11, 5, 2.2, 0);

  // Lava Leap 1
  m.ground(30, 46, 11, 'castle_wall');
  m.fireBar(38, 10, 5, -2.3, 1.0);
  m.starCoin(0, 38, 6);

  // Moving lift over magma
  m.platform('castle_lift_1', 49, 11, 3, 57, 10, 95);
  m.ground(60, 82, 12, 'castle_wall');
  m.cannon(68, 11, -1, 2.2);
  m.set(74, 9, 'question_powerup');
  m.row(72, 77, 9, 'brick');
  m.starCoin(1, 74, 6);

  // Pre-Boss Crumble & Fire-bar
  m.row(86, 90, 11, 'crumble');
  m.ground(93, 106, 12, 'castle_wall');
  m.fireBar(100, 11, 5, 2.4, 0);
  m.set(104, 9, 'question_powerup');

  // BOSS ARENA (tx 110..150)
  // Entry platform
  m.ground(110, 119, 11, 'castle_wall');
  // Collapsible Bridge! (tx 120..136 at ty=11)
  m.row(120, 136, 11, 'bridge');
  // High brick overhang for jumping over Boss OR grabbing Star Coin 3!
  m.row(124, 132, 7, 'brick');
  m.starCoin(2, 128, 5);
  m.coinLine(125, 131, 6);

  // Far platform with Axe Switch!
  m.ground(137, 154, 11, 'castle_wall');
  m.set(139, 10, 'axe');

  // Enemies before boss
  m.enemy('turtle', 22, 11, -1);
  m.enemy('jumper', 34, 10, -1);
  m.enemy('shroom', 64, 11, -1);
  m.enemy('turtle', 79, 11, -1);
  m.enemy('shroom', 96, 11, -1);
  // Final Boss on the bridge!
  m.enemy('boss', 132, 10, -1);

  return {
    id: '5-2',
    index: 9,
    worldNum: 5,
    stageNum: 2,
    name: "King's Castle",
    subtitle: 'Final Boss Arena & The Bridge Axe',
    theme: 'castle',
    timeLimit: 400,
    hasFlagpole: false,
    bossArena: {
      bridgeStartTx: 120,
      bridgeEndTx: 136,
      bridgeTy: 11,
      axeTx: 139,
      axeTy: 10,
      bossTx: 132,
      bossTy: 10,
    },
    mainZone: m.build(),
  };
}

export const LEVELS: LevelDef[] = [
  buildLevel1_1(),
  buildLevel1_2(),
  buildLevel2_1(),
  buildLevel2_2(),
  buildLevel3_1(),
  buildLevel3_2(),
  buildLevel4_1(),
  buildLevel4_2(),
  buildLevel5_1(),
  buildLevel5_2(),
];

export const WORLD_NAMES: Record<number, string> = {
  1: 'World 1 · Grass & Crystal',
  2: 'World 2 · Canopy & Coral',
  3: 'World 3 · Canyon & Sky',
  4: 'World 4 · Woods & Glacier',
  5: 'World 5 · Magma Citadel',
};
