import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBatteryDrain,
  calculateSanityDelta,
  hasInventoryItem,
  canUnlockDoor,
  validateInSisExamCode,
  checkEscapeConditions,
  calculateEscapeScore,
  INSIS_ACCESS_CODE,
  isGracePeriodActive,
  getRemainingGraceSeconds,
  computeKeyboardCameraRotation,
  isPositionWalkable
} from './rules';

test('calculateBatteryDrain drains battery when flashlight is on and preserves when off', () => {
  const drainRate = 2.0;
  // Flashlight on
  const b1 = calculateBatteryDrain(100, true, 1.0, drainRate);
  assert.equal(b1, 98);

  // Flashlight off
  const b2 = calculateBatteryDrain(50, false, 5.0, drainRate);
  assert.equal(b2, 50);

  // Cannot drain below zero
  const b3 = calculateBatteryDrain(1, true, 2.0, drainRate);
  assert.equal(b3, 0);
});

test('calculateSanityDelta decreases rapidly near entity, slowly in dark, and recovers in hiding', () => {
  // Near entity
  const sPanic = calculateSanityDelta(80, true, false, false, 1.0);
  assert.ok(sPanic < 80);

  // In dark
  const sDark = calculateSanityDelta(80, false, true, false, 1.0);
  assert.ok(sDark < 80 && sDark > sPanic);

  // Hiding in wardrobe
  const sCalm = calculateSanityDelta(50, false, false, true, 1.0);
  assert.ok(sCalm > 50);

  // Grace period preserves minimum sanity >= 50
  const sGrace = calculateSanityDelta(50, true, true, false, 1.0, true);
  assert.ok(sGrace >= 50);
});

test('grace period lasts 300 seconds (5 minutes)', () => {
  assert.equal(isGracePeriodActive(0), true);
  assert.equal(isGracePeriodActive(150), true);
  assert.equal(isGracePeriodActive(299), true);
  assert.equal(isGracePeriodActive(300), false);
  assert.equal(isGracePeriodActive(350), false);
  assert.equal(getRemainingGraceSeconds(200), 100);
});

test('computeKeyboardCameraRotation updates yaw with ArrowLeft/Right and pitch with ArrowUp/Down', () => {
  // Turn left increases yaw
  const rLeft = computeKeyboardCameraRotation(0, 0, true, false, false, false, 0.5, 2.0, 1.5);
  assert.ok(rLeft.yaw > 0);

  // Turn right decreases yaw
  const rRight = computeKeyboardCameraRotation(0, 0, false, true, false, false, 0.5, 2.0, 1.5);
  assert.ok(rRight.yaw < 0);

  // Tilt up increases pitch
  const rUp = computeKeyboardCameraRotation(0, 0, false, false, true, false, 0.5, 2.0, 1.5);
  assert.ok(rUp.pitch > 0);

  // Tilt down decreases pitch
  const rDown = computeKeyboardCameraRotation(0, 0, false, false, false, true, 0.5, 2.0, 1.5);
  assert.ok(rDown.pitch < 0);
});

test('inventory checks handle missing and present items', () => {
  assert.equal(hasInventoryItem(['BATTERY_9V', 'ISIC_CARD'], 'ISIC_CARD'), true);
  assert.equal(hasInventoryItem(['BATTERY_9V'], 'MASTER_FUSE'), false);
});

test('canUnlockDoor requires STUDY_KEY for studovna, ELEVATOR_CHIP for elevator, and ISIC_CARD + MASTER_FUSE for fire exit', () => {
  // Studovna without key
  const r1 = canUnlockDoor('door_studovna', ['BATTERY_9V']);
  assert.equal(r1.allowed, false);

  // Studovna with key
  const r2 = canUnlockDoor('door_studovna', ['STUDY_KEY']);
  assert.equal(r2.allowed, true);

  // Elevator without chip
  const rElev1 = canUnlockDoor('door_elevator', []);
  assert.equal(rElev1.allowed, false);

  // Elevator with chip
  const rElev2 = canUnlockDoor('door_elevator', ['ELEVATOR_CHIP']);
  assert.equal(rElev2.allowed, true);

  // Fire exit without items
  const r3 = canUnlockDoor('door_fire_exit', []);
  assert.equal(r3.allowed, false);

  // Fire exit with ISIC only (no fuse)
  const r4 = canUnlockDoor('door_fire_exit', ['ISIC_CARD']);
  assert.equal(r4.allowed, false);

  // Fire exit with both
  const r5 = canUnlockDoor('door_fire_exit', ['ISIC_CARD', 'MASTER_FUSE']);
  assert.equal(r5.allowed, true);
});

test('validateInSisExamCode matches expected VŠE code', () => {
  assert.equal(validateInSisExamCode(INSIS_ACCESS_CODE), true);
  assert.equal(validateInSisExamCode('0000'), false);
  assert.equal(validateInSisExamCode(`  ${INSIS_ACCESS_CODE} `), true);
});

test('checkEscapeConditions verifies all prerequisites', () => {
  assert.equal(checkEscapeConditions(['ISIC_CARD'], true, true), true);
  assert.equal(checkEscapeConditions(['ISIC_CARD'], false, true), false);
  assert.equal(checkEscapeConditions([], true, true), false);
  assert.equal(checkEscapeConditions(['ISIC_CARD'], true, false), false);
});

test('calculateEscapeScore generates appropriate academic grades', () => {
  const resultA = calculateEscapeScore(60, 90, 5);
  assert.equal(resultA.grade, 'A');

  const resultF = calculateEscapeScore(1000, 10, 0);
  assert.equal(resultF.grade, 'F');
});

test('isPositionWalkable validates outside, ground floor lobby, and 3rd floor boundaries', () => {
  // Outside spawn point
  assert.equal(isPositionWalkable(0, -36), true);
  // Outside out-of-bounds
  assert.equal(isPositionWalkable(15, -36), false);

  // Entrance door portal
  assert.equal(isPositionWalkable(0, -24), true);

  // Ground floor reception
  assert.equal(isPositionWalkable(-2.8, -19), true);
  // Ground floor canteen (menza)
  assert.equal(isPositionWalkable(5.0, -18), true);
  // Ground floor gym (posilovna)
  assert.equal(isPositionWalkable(-5.0, -18), true);
  // Ground floor pool (bazén)
  assert.equal(isPositionWalkable(5.0, -9), true);
  // Ground floor elevator call
  assert.equal(isPositionWalkable(0, -5.0), true);

  // Solid floor barrier (elevator shaft between floors)
  assert.equal(isPositionWalkable(0, 0), false);

  // 3rd floor corridor
  assert.equal(isPositionWalkable(0, 12), true);
  // 3rd floor room 312A
  assert.equal(isPositionWalkable(-4.5, 12), true);
  // 3rd floor study room
  assert.equal(isPositionWalkable(4.5, 36), true);
  // 3rd floor outside boundary
  assert.equal(isPositionWalkable(15, 20), false);
});

