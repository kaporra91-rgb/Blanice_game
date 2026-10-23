/**
 * Pure game rules, calculation, and state validation functions.
 * Decoupled from UI and Three.js for direct unit testing.
 */

import { InventoryItemId } from './types';

export const INSIS_ACCESS_CODE = '5214'; // From Microeconomics notes: 5 credits, 2 attempts, room 14
export const ESCAPE_REQUIRED_ITEMS: InventoryItemId[] = ['ISIC_CARD', 'MASTER_FUSE'];
export const GRACE_PERIOD_SECONDS = 300; // 5 minutes peace before ghost can kill

/**
 * Checks if the 5-minute peaceful exploration grace period is currently active.
 */
export function isGracePeriodActive(timeElapsedSeconds: number): boolean {
  return timeElapsedSeconds < GRACE_PERIOD_SECONDS;
}

/**
 * Returns remaining seconds in the peaceful exploration grace period.
 */
export function getRemainingGraceSeconds(timeElapsedSeconds: number): number {
  return Math.max(0, Math.ceil(GRACE_PERIOD_SECONDS - timeElapsedSeconds));
}

/**
 * Calculates battery drain per frame.
 * Flashlight drains battery over time. Slower rate so player can explore comfortably.
 */
export function calculateBatteryDrain(
  currentBattery: number,
  isFlashlightOn: boolean,
  dt: number,
  drainRatePerSec: number = 0.5
): number {
  if (!isFlashlightOn) return currentBattery;
  const newBattery = currentBattery - (drainRatePerSec * dt);
  return Math.max(0, Math.min(100, Math.round(newBattery * 100) / 100));
}

/**
 * Calculates sanity effect based on environment, darkness, proximity to the Examiner, hiding status,
 * and whether the 5-minute peaceful exploration grace period is active.
 */
export function calculateSanityDelta(
  currentSanity: number,
  isNearEntity: boolean,
  isPitchBlack: boolean,
  isHiding: boolean,
  dt: number,
  isGraceActive: boolean = false
): number {
  let rate = 0;

  if (isGraceActive) {
    // During 5-minute grace period, professor cannot harm the player fatally
    if (isHiding) {
      rate = 5.0;
    } else if (isPitchBlack) {
      rate = -1.0;
    } else {
      rate = 2.0; // Rapidly recovers in light
    }
    const updated = currentSanity + (rate * dt);
    // Never drops below 50 during 5-minute grace period
    return Math.max(50, Math.min(100, Math.round(updated * 10) / 10));
  }

  if (isHiding) {
    // Calming down inside wardrobe
    rate = 4.0;
  } else if (isNearEntity) {
    // Rapid panic when entity is nearby!
    rate = -14.0;
  } else if (isPitchBlack) {
    // Slow dread in pitch darkness
    rate = -3.5;
  } else {
    // Gentle recovery in lit areas or with flashlight
    rate = 1.0;
  }

  const updated = currentSanity + (rate * dt);
  return Math.max(0, Math.min(100, Math.round(updated * 10) / 10));
}

/**
 * Computes camera yaw and pitch from keyboard arrow keys.
 * ArrowLeft turns left (+yaw), ArrowRight turns right (-yaw).
 * ArrowUp tilts up (+pitch), ArrowDown tilts down (-pitch).
 */
export function computeKeyboardCameraRotation(
  currentYaw: number,
  currentPitch: number,
  turnLeft: boolean,
  turnRight: boolean,
  tiltUp: boolean,
  tiltDown: boolean,
  dt: number,
  turnSpeed: number = 2.0,
  tiltSpeed: number = 1.5
): { yaw: number; pitch: number } {
  let newYaw = currentYaw;
  let newPitch = currentPitch;

  if (turnLeft) newYaw += turnSpeed * dt;
  if (turnRight) newYaw -= turnSpeed * dt;
  if (tiltUp) newPitch += tiltSpeed * dt;
  if (tiltDown) newPitch -= tiltSpeed * dt;

  const maxPitch = Math.PI / 2.3;
  newPitch = Math.max(-maxPitch, Math.min(maxPitch, newPitch));

  return { yaw: newYaw, pitch: newPitch };
}

/**
 * Checks whether an inventory contains a specific item.
 */
export function hasInventoryItem(inventory: InventoryItemId[], item: InventoryItemId): boolean {
  return inventory.includes(item);
}

/**
 * Verifies if player has required key to unlock a specific door.
 */
export function canUnlockDoor(doorId: string, inventory: InventoryItemId[]): { allowed: boolean; reason?: string } {
  if (doorId === 'door_studovna') {
    if (inventory.includes('STUDY_KEY')) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Zamčeno. Potřebuješ klíč od studovny z kuchyňky (Study Room Key needed).' };
  }

  if (doorId === 'elevator_call' || doorId === 'door_elevator') {
    if (inventory.includes('ELEVATOR_CHIP')) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Výtah je zamčený na čip! Musíš jít k vrátnici a vyhádat si čip u paní vrátné (Kolejbáby).',
    };
  }

  if (doorId === 'door_fire_exit') {
    if (inventory.includes('ISIC_CARD') && inventory.includes('MASTER_FUSE')) {
      return { allowed: true };
    }
    if (!inventory.includes('ISIC_CARD')) {
      return { allowed: false, reason: 'Elektronický zámek vyžaduje platnou ISIC kartu VŠE (ISIC Card needed).' };
    }
    return { allowed: false, reason: 'Únikový východ nemá napájení. Nahlas pojistku do rozvodny (Power needed).' };
  }

  // Glass entrance doors, canteen (menza), gym (posilovna), pool (bazén)
  return { allowed: true };
}

/**
 * Validates player walking boundaries across Outside, Ground Floor, and 3rd Floor.
 */
export function isPositionWalkable(x: number, z: number): boolean {
  // 1. Outside Plaza (-38 <= z <= -24)
  if (z >= -38 && z <= -24) {
    return Math.abs(x) <= 8.0;
  }

  // 2. Entrance glass door portal (-24.5 <= z <= -23.5)
  if (z >= -24.5 && z <= -23.5) {
    return Math.abs(x) <= 1.8;
  }

  // 3. Ground floor complex (-24 <= z <= -4.2)
  if (z >= -24 && z <= -4.2) {
    // Main lobby central corridor
    if (Math.abs(x) <= 2.0) return true;
    // Vrátnice reception alcove
    if (z >= -21.5 && z <= -16.5 && x >= -4.2 && x <= -1.8) return true;
    // Student lounge alcove
    if (z >= -21.0 && z <= -15.5 && x >= 1.8 && x <= 4.2) return true;
    // Menza (Canteen) on right
    if (z >= -23.0 && z <= -14.0 && x >= 1.8 && x <= 11.0) return true;
    // Posilovna (Gym) on left
    if (z >= -23.0 && z <= -14.0 && x >= -11.0 && x <= -1.8) return true;
    // Bazén (Pool) on right
    if (z >= -13.5 && z <= -5.0 && x >= 1.8 && x <= 11.0) return true;
    // Elevator foyer
    if (z >= -6.0 && z <= -4.2 && Math.abs(x) <= 2.2) return true;
    return false;
  }

  // 4. Solid barrier / Elevator shaft between floors (-4.2 < z < 4.2) -> NOT walkable on foot
  if (z > -4.2 && z < 4.2) {
    return false;
  }

  // 5. 3rd Floor Dormitory Corridor & Rooms (4.2 <= z <= 44.5)
  if (z >= 4.2 && z <= 44.5) {
    // Main hallway
    if (Math.abs(x) <= 1.8) return true;
    // Room 312A (left)
    if (z >= 10.2 && z <= 13.8 && x >= -6.8 && x <= -1.6) return true;
    // Room 314 (left)
    if (z >= 26.2 && z <= 29.8 && x >= -6.8 && x <= -1.6) return true;
    // Kitchenette (right)
    if (z >= 10.2 && z <= 13.8 && x >= 1.6 && x <= 6.8) return true;
    // Laundry (right)
    if (z >= 26.2 && z <= 29.8 && x >= 1.6 && x <= 6.8) return true;
    // Study Room (right)
    if (z >= 34.2 && z <= 37.8 && x >= 1.6 && x <= 7.0) return true;
    return false;
  }

  return false;
}

/**
 * Validates InSIS student exam code entered on the terminal.
 */
export function validateInSisExamCode(code: string): boolean {
  return code.trim() === INSIS_ACCESS_CODE;
}

/**
 * Checks whether the final escape conditions are fulfilled.
 */
export function checkEscapeConditions(
  inventory: InventoryItemId[],
  fuseInstalled: boolean,
  atExitDoor: boolean
): boolean {
  return atExitDoor && fuseInstalled && inventory.includes('ISIC_CARD');
}

/**
 * Computes end-of-game score and rank.
 */
export function calculateEscapeScore(
  timeElapsedSeconds: number,
  remainingSanity: number,
  puzzlesCompleted: number
): { score: number; grade: 'A' | 'B' | 'C' | 'F'; message: string } {
  // Score formula: high sanity + fast time + completed puzzles
  const timeBonus = Math.max(0, 1000 - Math.round(timeElapsedSeconds * 2.5));
  const sanityBonus = Math.round(remainingSanity * 10);
  const puzzleBonus = puzzlesCompleted * 250;
  const score = Math.max(0, timeBonus + sanityBonus + puzzleBonus);

  let grade: 'A' | 'B' | 'C' | 'F' = 'F';
  let message = 'Neprospěl (Failed exam period)';

  if (score >= 1800) {
    grade = 'A';
    message = 'Výborně! Úspěšně jsi složil zkouškové a opustil Kolej Blanice s červeným diplomem!';
  } else if (score >= 1300) {
    grade = 'B';
    message = 'Velmi dobře! Utekl jsi před Zkoušejícím s platným zápočtem.';
  } else if (score >= 800) {
    grade = 'C';
    message = 'Dobře! Přežil jsi zkouškové období o vlásek.';
  }

  return { score, grade, message };
}
