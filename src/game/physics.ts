import {
  ActiveMovingPlatform,
  ActiveEnemy,
  InputState,
  MovingPlatformDef,
  PlayerForm,
  PlayerState,
  TileKind,
  ZoneData,
} from './types';

export const TILE_SIZE = 32;
export const ZONE_HEIGHT_TILES = 15;
export const WORLD_HEIGHT_PX = ZONE_HEIGHT_TILES * TILE_SIZE; // 480px

export const PHYSICS = {
  GRAVITY: 1550,
  FALL_GRAVITY_MULT: 1.12,
  MAX_FALL_SPEED: 660,
  WALK_MAX_SPEED: 195,
  RUN_MAX_SPEED: 295,
  STAR_SPEED_MULT: 1.22,
  GROUND_ACCEL: 1050,
  RUN_ACCEL: 1420,
  GROUND_DECEL: 1200,
  AIR_ACCEL: 820,
  AIR_DECEL: 240,
  ICE_ACCEL: 440,
  ICE_DECEL: 145,
  SKID_DECEL: 1750,
  JUMP_VEL: -585,
  RUN_JUMP_VEL: -615,
  SPRING_VEL: -790,
  MUSHROOM_BOUNCE_VEL: -735,
  STOMP_BOUNCE_VEL: -420,
  STOMP_HIGH_BOUNCE_VEL: -590,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER_TIME: 0.12,
  INVULN_DURATION: 1.6,
  STAR_DURATION: 9.0,
  FIREBALL_SPEED: 380,
  FIREBALL_BOUNCE_VY: -310,
  FIRE_COOLDOWN: 0.24,
  SHELL_SPEED: 360,
} as const;

export function stepMovingPlatform(
  platform: ActiveMovingPlatform,
  definition: MovingPlatformDef,
  dt: number
): void {
  const pathX = definition.endX - definition.x;
  const pathY = definition.endY - definition.y;
  const pathLength = Math.hypot(pathX, pathY);
  const oldX = platform.x;
  const oldY = platform.y;

  if (pathLength < 1) {
    platform.dx = 0;
    platform.dy = 0;
    return;
  }

  platform.t += (platform.speed * dt / pathLength) * platform.dir;
  if (platform.t >= 1) {
    platform.t = 1;
    platform.dir = -1;
  } else if (platform.t <= 0) {
    platform.t = 0;
    platform.dir = 1;
  }

  platform.x = definition.x + pathX * platform.t;
  platform.y = definition.y + pathY * platform.t;
  platform.dx = platform.x - oldX;
  platform.dy = platform.y - oldY;
}

export const STOMP_COMBO_TABLE = [100, 200, 400, 800, 1000] as const;

export function getStompReward(comboIndex: number): { points: number; extraLife: boolean; label: string } {
  if (comboIndex >= STOMP_COMBO_TABLE.length) {
    return { points: 0, extraLife: true, label: '1-UP!' };
  }
  const pts = STOMP_COMBO_TABLE[Math.max(0, comboIndex)];
  return { points: pts, extraLife: false, label: `${pts}` };
}

export function getPlayerDimensions(form: PlayerForm, crouching: boolean): { w: number; h: number } {
  if (form === 'small') {
    return { w: 22, h: 28 };
  }
  if (crouching) {
    return { w: 24, h: 28 };
  }
  return { w: 24, h: 46 };
}

export function isSolidTile(tile: TileKind): boolean {
  switch (tile) {
    case 'ground':
    case 'brick':
    case 'question_coin':
    case 'question_powerup':
    case 'question_star':
    case 'question_1up':
    case 'used_block':
    case 'hard_block':
    case 'pipe_tl':
    case 'pipe_tr':
    case 'pipe_bl':
    case 'pipe_br':
    case 'ice':
    case 'bridge':
    case 'crumble':
    case 'spring':
    case 'castle_wall':
      return true;
    default:
      return false;
  }
}

export function isOneWayPlatform(tile: TileKind): boolean {
  return tile === 'mushroom_cap_l' || tile === 'mushroom_cap_m' || tile === 'mushroom_cap_r';
}

export function isHiddenBlock(tile: TileKind): boolean {
  return tile === 'hidden_1up' || tile === 'hidden_starcoin';
}

export function isQuestionBlock(tile: TileKind): boolean {
  return (
    tile === 'question_coin' ||
    tile === 'question_powerup' ||
    tile === 'question_star' ||
    tile === 'question_1up'
  );
}

export function isHazardTile(tile: TileKind): boolean {
  return tile === 'lava' || tile === 'spike';
}

export function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createInitialPlayer(spawnX: number, spawnY: number, form: PlayerForm = 'small'): PlayerState {
  const dims = getPlayerDimensions(form, false);
  return {
    x: spawnX * TILE_SIZE + (TILE_SIZE - dims.w) / 2,
    y: (spawnY + 1) * TILE_SIZE - dims.h,
    vx: 0,
    vy: 0,
    w: dims.w,
    h: dims.h,
    facing: 1,
    form,
    onGround: false,
    onIce: false,
    crouching: false,
    skidding: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    invulnTimer: 0,
    starTimer: 0,
    fireCooldown: 0,
    scaleX: 1,
    scaleY: 1,
    walkDist: 0,
    dead: false,
    deathTimer: 0,
    ridingPlatformId: null,
  };
}

export function stepPlayerHorizPhysics(
  player: PlayerState,
  input: InputState,
  dt: number
): void {
  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const canCrouch = player.form !== 'small' && player.onGround && input.down && moveDir === 0;

  if (canCrouch !== player.crouching) {
    const oldH = player.h;
    player.crouching = canCrouch;
    const dims = getPlayerDimensions(player.form, canCrouch);
    player.w = dims.w;
    player.h = dims.h;
    player.y += oldH - player.h;
  }

  const starMult = player.starTimer > 0 ? PHYSICS.STAR_SPEED_MULT : 1;
  const maxSpeed = (input.runHeld ? PHYSICS.RUN_MAX_SPEED : PHYSICS.WALK_MAX_SPEED) * starMult;

  if (moveDir !== 0 && !player.crouching) {
    player.facing = moveDir as -1 | 1;
    const isSkidding = player.onGround && player.vx * moveDir < -35;
    player.skidding = isSkidding;

    let accel: number;
    if (!player.onGround) {
      accel = PHYSICS.AIR_ACCEL;
    } else if (player.onIce) {
      accel = isSkidding ? PHYSICS.ICE_ACCEL * 1.4 : PHYSICS.ICE_ACCEL;
    } else if (isSkidding) {
      accel = PHYSICS.SKID_DECEL;
    } else {
      accel = input.runHeld ? PHYSICS.RUN_ACCEL : PHYSICS.GROUND_ACCEL;
    }

    player.vx += moveDir * accel * dt;
    if (Math.abs(player.vx) > maxSpeed) {
      // Smoothly clamp down so speed boosts don't feel jarring
      const excess = Math.abs(player.vx) - maxSpeed;
      const clampStep = Math.min(excess, 1200 * dt);
      player.vx -= Math.sign(player.vx) * clampStep;
    }
  } else {
    player.skidding = false;
    const decel = !player.onGround
      ? PHYSICS.AIR_DECEL
      : player.onIce
        ? PHYSICS.ICE_DECEL
        : PHYSICS.GROUND_DECEL;
    if (Math.abs(player.vx) <= decel * dt) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * decel * dt;
    }
  }

  if (player.onGround) {
    player.walkDist += Math.abs(player.vx) * dt;
  }
}

export function stepPlayerJumpPhysics(
  player: PlayerState,
  input: InputState,
  dt: number
): { jumped: boolean } {
  let jumped = false;

  if (player.onGround) {
    player.coyoteTimer = PHYSICS.COYOTE_TIME;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    player.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    const speedRatio = Math.min(1, Math.abs(player.vx) / PHYSICS.RUN_MAX_SPEED);
    player.vy = PHYSICS.JUMP_VEL + (PHYSICS.RUN_JUMP_VEL - PHYSICS.JUMP_VEL) * speedRatio;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.scaleX = 0.84;
    player.scaleY = 1.18;
    jumped = true;
  }

  // Variable jump height cut when jump key is released mid-ascent
  if (!input.jumpHeld && player.vy < -170) {
    player.vy *= Math.pow(0.45, dt * 16);
  }

  // Gravity
  const gravMult = player.vy > 0 ? PHYSICS.FALL_GRAVITY_MULT : 1;
  player.vy = Math.min(PHYSICS.MAX_FALL_SPEED, player.vy + PHYSICS.GRAVITY * gravMult * dt);

  // Squash & stretch recovery
  player.scaleX += (1 - player.scaleX) * Math.min(1, dt * 14);
  player.scaleY += (1 - player.scaleY) * Math.min(1, dt * 14);

  return { jumped };
}

export type StompOutcome = 'none' | 'stomp' | 'kick_shell' | 'hurt' | 'star_kill';

export function evaluateEnemyCollision(
  player: PlayerState,
  prevPlayerBottom: number,
  enemy: ActiveEnemy
): StompOutcome {
  if (!enemy.alive) return 'none';

  // Slightly forgiving enemy hitbox
  const padX = enemy.kind === 'boss' ? 4 : 2;
  const padY = 2;
  if (
    !aabbOverlap(
      player.x,
      player.y,
      player.w,
      player.h,
      enemy.x + padX,
      enemy.y + padY,
      enemy.w - padX * 2,
      enemy.h - padY
    )
  ) {
    return 'none';
  }

  if (player.starTimer > 0) {
    return 'star_kill';
  }

  // Stationary turtle shell can be kicked from any side!
  if (enemy.kind === 'turtle' && enemy.shellState === 'idle_shell') {
    return 'kick_shell';
  }

  // Chomper & Boss cannot be safely stomped from above (boss has spikes, chomper has teeth)
  // Actually let's make Chomper unstompable (classic Piranha rule) and Boss can be stomped OR bypassed via Axe!
  // Let's keep Chomper unstompable; Boss hurts unless stomped? Classic Bowser hurts on touch—you jump OVER Boss to hit the Axe (or hit with Fireballs)!
  const canStomp = enemy.kind !== 'chomper' && enemy.kind !== 'boss';

  if (canStomp) {
    const playerBottom = player.y + player.h;
    const enemyStompLine = enemy.y + enemy.h * 0.6;
    const isDescending = player.vy >= -25;
    if (isDescending && (prevPlayerBottom <= enemyStompLine + 6 || playerBottom <= enemyStompLine + 4)) {
      return 'stomp';
    }
  }

  return 'hurt';
}

export interface ZoneValidationReport {
  valid: boolean;
  issues: string[];
  starCoinCount: number;
  maxGapTiles: number;
}

/**
 * Algorithmic reachability & playability audit for a ZoneData.
 * Checks spawn clearance, Star Coin count, and verifies no pit/gap exceeds jump envelope.
 */
export function validateZoneReachability(
  zone: ZoneData,
  options: { requireThreeStarCoins?: boolean; isBonus?: boolean } = {}
): ZoneValidationReport {
  const issues: string[] = [];
  const { width, height, tiles, spawnX, spawnY } = zone;

  if (height !== ZONE_HEIGHT_TILES) {
    issues.push(`Expected height ${ZONE_HEIGHT_TILES}, got ${height}`);
  }
  if (tiles.length !== height) {
    issues.push(`Tile rows (${tiles.length}) !== height (${height})`);
  }
  for (let y = 0; y < tiles.length; y++) {
    if (tiles[y].length !== width) {
      issues.push(`Row ${y} width (${tiles[y].length}) !== ${width}`);
      break;
    }
  }

  // Check spawn clearance
  if (spawnX < 0 || spawnX >= width || spawnY < 1 || spawnY >= height) {
    issues.push(`Spawn (${spawnX}, ${spawnY}) out of bounds`);
  } else {
    const spawnTile = tiles[spawnY]?.[spawnX];
    const aboveSpawn = tiles[spawnY - 1]?.[spawnX];
    const belowSpawn = tiles[spawnY + 1]?.[spawnX];
    if (isSolidTile(spawnTile) || isSolidTile(aboveSpawn)) {
      issues.push(`Spawn (${spawnX}, ${spawnY}) is blocked by solid tile`);
    }
    if (!belowSpawn || (!isSolidTile(belowSpawn) && !isOneWayPlatform(belowSpawn))) {
      issues.push(`Spawn (${spawnX}, ${spawnY}) has no solid ground underneath`);
    }
  }

  // Check Star Coins
  if (options.requireThreeStarCoins && zone.starCoins.length !== 3) {
    issues.push(`Expected 3 Star Coins, found ${zone.starCoins.length}`);
  }

  // Measure horizontal gaps where there is no ground/platform/moving-platform bridge
  // Max clearable horizontal pit without spring/moving-platform is 6 tiles (at sprint speed ~7.1 tiles)
  let currentGap = 0;
  let maxGapTiles = 0;
  for (let x = 0; x < width; x++) {
    let hasSupport = false;
    for (let y = Math.floor(height / 2); y < height; y++) {
      const t = tiles[y]?.[x];
      if (t && (isSolidTile(t) || isOneWayPlatform(t)) && !isHazardTile(t)) {
        hasSupport = true;
        break;
      }
    }
    // Also count moving platforms covering column x
    if (!hasSupport) {
      const pxStart = x * TILE_SIZE;
      const pxEnd = (x + 1) * TILE_SIZE;
      for (const mp of zone.movingPlatforms) {
        const minX = Math.min(mp.x, mp.endX);
        const maxX = Math.max(mp.x, mp.endX) + mp.w;
        if (maxX >= pxStart && minX <= pxEnd) {
          hasSupport = true;
          break;
        }
      }
    }

    if (!hasSupport) {
      currentGap++;
      if (currentGap > maxGapTiles) maxGapTiles = currentGap;
    } else {
      if (currentGap > 5 && !options.isBonus) {
        issues.push(`Wide unsupported pit of ${currentGap} tiles ending at tx=${x}`);
      }
      currentGap = 0;
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    starCoinCount: zone.starCoins.length,
    maxGapTiles,
  };
}
