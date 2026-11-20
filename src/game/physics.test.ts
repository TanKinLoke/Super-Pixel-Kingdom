import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialPlayer,
  evaluateEnemyCollision,
  getStompReward,
  PHYSICS,
  stepPlayerHorizPhysics,
  stepPlayerJumpPhysics,
  TILE_SIZE,
  validateZoneReachability,
} from './physics';
import { LEVELS } from './levels';
import { ActiveEnemy, InputState } from './types';

function emptyInput(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpHeld: false,
    jumpJustPressed: false,
    runHeld: false,
    runJustPressed: false,
  };
}

test('all 10 levels pass reachability, spawn, Star Coin, and objective checks', () => {
  assert.equal(LEVELS.length, 10, 'Expected exactly 10 levels');
  const expectedIds = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '5-1', '5-2'];

  LEVELS.forEach((level, idx) => {
    assert.equal(level.id, expectedIds[idx], `Level ${idx} id mismatch`);
    const report = validateZoneReachability(level.mainZone, { requireThreeStarCoins: true });
    assert.equal(
      report.valid,
      true,
      `Level ${level.id} (${level.name}) failed reachability: ${report.issues.join('; ')}`
    );
    assert.equal(report.starCoinCount, 3, `Level ${level.id} must have 3 Star Coins`);

    if (level.hasFlagpole) {
      assert.ok(level.flagpoleTx && level.flagpoleTx > 100, `Level ${level.id} missing flagpoleTx`);
      const groundUnderFlag = level.mainZone.tiles[12]?.[level.flagpoleTx] || level.mainZone.tiles[11]?.[level.flagpoleTx];
      assert.ok(groundUnderFlag && groundUnderFlag !== 'empty', `Level ${level.id} flagpole has no base`);
    } else {
      assert.ok(level.bossArena, `Level ${level.id} missing bossArena`);
      const axeTile = level.mainZone.tiles[level.bossArena.axeTy]?.[level.bossArena.axeTx];
      assert.equal(axeTile, 'axe', `Level ${level.id} missing axe switch tile`);
    }

    // Verify all non-chomper enemies don't spawn inside solid blocks
    for (const enemy of level.mainZone.enemies) {
      if (enemy.kind === 'chomper') continue;
      const tileAtSpawn = level.mainZone.tiles[enemy.ty]?.[enemy.tx];
      assert.ok(
        tileAtSpawn === 'empty' || tileAtSpawn === undefined,
        `Level ${level.id} enemy ${enemy.kind} at (${enemy.tx},${enemy.ty}) overlaps tile ${tileAtSpawn}`
      );
    }

    // Verify warp pipe integrity when bonusZone exists
    if (level.bonusZone) {
      assert.ok(level.mainZone.warps.length > 0, `Level ${level.id} has bonusZone but no entry warp`);
      assert.ok(level.bonusZone.warps.length > 0, `Level ${level.id} bonusZone missing exit warp`);
      const bonusReport = validateZoneReachability(level.bonusZone, {
        requireThreeStarCoins: false,
        isBonus: true,
      });
      assert.equal(
        bonusReport.valid,
        true,
        `Level ${level.id} bonus zone failed: ${bonusReport.issues.join('; ')}`
      );
    }
  });
});

test('coyote time allows jumping briefly after walking off a ledge', () => {
  const player = createInitialPlayer(3, 11, 'small');
  player.onGround = true;
  const input = emptyInput();

  // Frame 1: on ground -> primes coyoteTimer
  stepPlayerJumpPhysics(player, input, 0.016);
  assert.ok(player.coyoteTimer > 0);

  // Frame 2: walks off ledge (onGround=false) and waits 0.08s (< 0.11s coyote)
  player.onGround = false;
  stepPlayerJumpPhysics(player, input, 0.08);
  assert.ok(player.coyoteTimer > 0);

  // Frame 3: presses jump within coyote window
  input.jumpJustPressed = true;
  input.jumpHeld = true;
  const res = stepPlayerJumpPhysics(player, input, 0.016);
  assert.equal(res.jumped, true);
  assert.ok(player.vy <= PHYSICS.JUMP_VEL + 50);
});

test('jump buffering triggers jump immediately upon landing', () => {
  const player = createInitialPlayer(3, 11, 'small');
  player.onGround = false;
  player.coyoteTimer = 0;

  const input = emptyInput();
  input.jumpJustPressed = true;
  input.jumpHeld = true;

  // Press jump in midair 0.08s before landing
  let res = stepPlayerJumpPhysics(player, input, 0.016);
  assert.equal(res.jumped, false);
  assert.ok(player.jumpBufferTimer > 0);

  // Advance 0.06s still in midair
  input.jumpJustPressed = false;
  res = stepPlayerJumpPhysics(player, input, 0.06);
  assert.equal(res.jumped, false);

  // Land on ground -> buffered jump fires!
  player.onGround = true;
  res = stepPlayerJumpPhysics(player, input, 0.016);
  assert.equal(res.jumped, true);
  assert.ok(player.vy < -400);
});

test('variable jump height cuts upward velocity when jump is released early', () => {
  const pFull = createInitialPlayer(3, 11, 'small');
  pFull.onGround = true;
  const pShort = createInitialPlayer(3, 11, 'small');
  pShort.onGround = true;

  const holdInput = emptyInput();
  holdInput.jumpJustPressed = true;
  holdInput.jumpHeld = true;
  stepPlayerJumpPhysics(pFull, holdInput, 0.016);
  stepPlayerJumpPhysics(pShort, holdInput, 0.016);

  holdInput.jumpJustPressed = false;
  const releaseInput = emptyInput();

  for (let i = 0; i < 6; i++) {
    stepPlayerJumpPhysics(pFull, holdInput, 0.016);
    stepPlayerJumpPhysics(pShort, releaseInput, 0.016);
  }

  // Short hop loses upward speed much faster
  assert.ok(pShort.vy > pFull.vy + 120);
});

test('ice surface has noticeably lower deceleration than normal ground', () => {
  const normal = createInitialPlayer(3, 11, 'small');
  normal.onGround = true;
  normal.onIce = false;
  normal.vx = 200;

  const icy = createInitialPlayer(3, 11, 'small');
  icy.onGround = true;
  icy.onIce = true;
  icy.vx = 200;

  const idle = emptyInput();
  stepPlayerHorizPhysics(normal, idle, 0.1);
  stepPlayerHorizPhysics(icy, idle, 0.1);

  assert.ok(icy.vx > normal.vx + 80, 'Player should slide farther on ice');
});

test('forgiving stomp detection vs hurt and stomp combo rewards', () => {
  const player = createInitialPlayer(5, 10, 'small');
  const enemy: ActiveEnemy = {
    id: 1,
    kind: 'shroom',
    x: player.x,
    y: 11 * TILE_SIZE + 4,
    vx: -50,
    vy: 0,
    w: 28,
    h: 28,
    facing: -1,
    onGround: true,
    alive: true,
    koTimer: 0,
  };

  // Player descending onto top half of enemy -> stomp!
  player.vy = 180;
  player.y = enemy.y - player.h + 10;
  const prevBottom = enemy.y - 2;
  assert.equal(evaluateEnemyCollision(player, prevBottom, enemy), 'stomp');

  // Player walking into side of enemy -> hurt!
  player.vy = 0;
  player.y = enemy.y;
  assert.equal(evaluateEnemyCollision(player, player.y + player.h, enemy), 'hurt');

  // Star active -> star_kill even from side!
  player.starTimer = 5;
  assert.equal(evaluateEnemyCollision(player, player.y + player.h, enemy), 'star_kill');

  // Stomp combo chain: 100 -> 200 -> 400 -> 800 -> 1000 -> 1-UP!
  assert.equal(getStompReward(0).points, 100);
  assert.equal(getStompReward(1).points, 200);
  assert.equal(getStompReward(2).points, 400);
  assert.equal(getStompReward(3).points, 800);
  assert.equal(getStompReward(4).points, 1000);
  assert.equal(getStompReward(5).extraLife, true);
});
