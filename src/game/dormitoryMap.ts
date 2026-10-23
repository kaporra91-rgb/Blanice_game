/**
 * 3D Architectural Model and Floor Layout for Kolej Blanice (VŠE Prague).
 * Features:
 * 1. Outside Plaza (spawn at Z = -34 facing Kolej Blanice facade, streetlights, pavers)
 * 2. Automatic Glass Entrance Doors
 * 3. Ground Floor Lobby with:
 *    - Vrátnice: Paní Kropáčková (Kolejbába) model, ledger, keys, argue for chip
 *    - Student Lounge: Honza & Maťo (Čech a Slovák) exchanging classic jokes
 *    - Menza (Canteen) with food counter (smažák, knedlíky) and dining students
 *    - Posilovna (Gym) with weight benches, dumbbells, and student working out
 *    - Plavecký Bazén (Swimming Pool) with tiled pool, water texture, lanes, swimmer
 *    - Ground Floor Elevator bank with chip scanner
 * 4. 3rd Floor Corridor & Rooms (dark, eerie, NF Professor entity, ISIC puzzle, InSIS terminal, breaker box, escape exit)
 */

import * as THREE from 'three';
import {
  createLinoleumTexture,
  createWallTexture,
  createDoorTexture,
  createNoticeboardTexture,
  createExitSignTexture,
  createOutsidePaverTexture,
  createGlassDoorTexture,
  createPoolWaterTexture,
  createFacilitySignTexture,
} from './textures';
import { DormInteractable } from './types';
export type { DormInteractable } from './types';

export interface DormitoryWorld {
  rootGroup: THREE.Group;
  colliders: THREE.Box3[];
  interactables: DormInteractable[];
  lightFlickerMeshes: THREE.PointLight[];
  spawnPoint: THREE.Vector3;
  examinerWaypoints: THREE.Vector3[];
}

export function buildDormitoryScene(): DormitoryWorld {
  const rootGroup = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const interactables: DormInteractable[] = [];
  const lightFlickerMeshes: THREE.PointLight[] = [];

  // Shared textures & materials
  const floorTex = createLinoleumTexture();
  floorTex.repeat.set(4, 18);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.35,
    metalness: 0.1,
  });

  const wallTex = createWallTexture();
  wallTex.repeat.set(8, 2);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xd6d1c4,
    roughness: 0.95,
  });

  // =========================================================================
  // 1. OUTSIDE PLAZA (Z = -38 to Z = -24)
  // =========================================================================
  buildOutsidePlaza(rootGroup, colliders, interactables);

  // =========================================================================
  // 2. GROUND FLOOR LOBBY & FACILITIES (Z = -24 to Z = -4)
  // =========================================================================
  buildGroundFloorFacilities(rootGroup, colliders, interactables, floorMat, wallMat, ceilingMat);

  // =========================================================================
  // 3. 3RD FLOOR DORMITORY CORRIDOR & ROOMS (Z = 4 to Z = 44)
  // =========================================================================
  buildThirdFloorCorridor(rootGroup, colliders, interactables, lightFlickerMeshes, floorMat, wallMat, ceilingMat);

  // Initial spawn point: outside before the dorms area facing South (+Z) towards the entrance
  const spawnPoint = new THREE.Vector3(0, 1.65, -34.0);

  // Waypoints for the NF Professor to stalk along on the 3rd floor
  const examinerWaypoints = [
    new THREE.Vector3(0, 0, 8.0),
    new THREE.Vector3(0, 0, 16.0),
    new THREE.Vector3(0, 0, 24.0),
    new THREE.Vector3(0, 0, 32.0),
    new THREE.Vector3(0, 0, 40.0),
    new THREE.Vector3(0, 0, 43.0),
  ];

  return {
    rootGroup,
    colliders,
    interactables,
    lightFlickerMeshes,
    spawnPoint,
    examinerWaypoints,
  };
}

// =========================================================================
// SECTION 1: OUTSIDE PLAZA & ENTRANCE FACADE
// =========================================================================

function buildOutsidePlaza(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const plazaGroup = new THREE.Group();

  // 1. Outside Concrete Paver Ground
  const paverTex = createOutsidePaverTexture();
  paverTex.repeat.set(6, 6);
  const paverMat = new THREE.MeshStandardMaterial({
    map: paverTex,
    roughness: 0.9,
    metalness: 0.05,
  });
  const groundGeo = new THREE.PlaneGeometry(24, 20);
  const groundMesh = new THREE.Mesh(groundGeo, paverMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, 0, -33);
  groundMesh.receiveShadow = true;
  plazaGroup.add(groundMesh);

  // 2. Streetlights along the walkway
  const lampPositions = [
    { x: -5, z: -32 },
    { x: 5, z: -32 },
    { x: -5, z: -27 },
    { x: 5, z: -27 },
  ];
  lampPositions.forEach((pos) => {
    const lamp = createStreetLamp();
    lamp.position.set(pos.x, 0, pos.z);
    plazaGroup.add(lamp);

    const light = new THREE.PointLight(0xffdf99, 1.4, 12, 1.2);
    light.position.set(pos.x, 3.8, pos.z);
    plazaGroup.add(light);
  });

  // 3. Outdoor benches and concrete planters
  [-6, 6].forEach((bx) => {
    const bench = createParkBench();
    bench.position.set(bx, 0, -30);
    bench.rotation.y = bx < 0 ? Math.PI / 2 : -Math.PI / 2;
    plazaGroup.add(bench);

    const planter = createPlanter();
    planter.position.set(bx, 0, -26);
    plazaGroup.add(planter);
  });

  // 4. Kolej Blanice Building Facade Wall at Z = -24
  const facadeMat = new THREE.MeshStandardMaterial({ color: 0x474e56, roughness: 0.9 });
  // Left facade wall
  const facadeLeft = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.4), facadeMat);
  facadeLeft.position.set(-6.5, 2.5, -24);
  plazaGroup.add(facadeLeft);
  colliders.push(new THREE.Box3().setFromObject(facadeLeft));

  // Right facade wall
  const facadeRight = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.4), facadeMat);
  facadeRight.position.set(6.5, 2.5, -24);
  plazaGroup.add(facadeRight);
  colliders.push(new THREE.Box3().setFromObject(facadeRight));

  // Header above glass doors
  const facadeHeader = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 0.4), facadeMat);
  facadeHeader.position.set(0, 3.9, -24);
  plazaGroup.add(facadeHeader);

  // 5. Entrance Canopy (Markýza)
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.7, roughness: 0.3 });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 3.0), canopyMat);
  canopy.position.set(0, 3.1, -25.5);
  plazaGroup.add(canopy);

  // Canopy downlight
  const canopyLight = new THREE.PointLight(0xfff5e0, 1.2, 8);
  canopyLight.position.set(0, 2.9, -25.5);
  plazaGroup.add(canopyLight);

  // 6. Illuminated 3D Sign: KOLEJ BLANICE · VŠE PRAHA · JIŽNÍ MĚSTO
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sCtx = signCanvas.getContext('2d')!;
  sCtx.fillStyle = '#0f141c';
  sCtx.fillRect(0, 0, 1024, 256);
  sCtx.strokeStyle = '#3867d6';
  sCtx.lineWidth = 10;
  sCtx.strokeRect(8, 8, 1008, 240);
  sCtx.fillStyle = '#45aaf2';
  sCtx.font = 'bold 56px sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText('KOLEJ BLANICE · VŠE PRAHA', 512, 100);
  sCtx.fillStyle = '#f7b731';
  sCtx.font = 'bold 36px monospace';
  sCtx.fillText('JIŽNÍ MĚSTO · BLOK B', 512, 175);
  const signTex = new THREE.CanvasTexture(signCanvas);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 3.75, -23.75);
  plazaGroup.add(signMesh);

  // 7. Automatic Sliding Glass Doors at Z = -24
  const glassTex = createGlassDoorTexture();
  const glassMat = new THREE.MeshStandardMaterial({
    map: glassTex,
    transparent: true,
    opacity: 0.88,
    roughness: 0.1,
    metalness: 0.4,
  });
  const glassGeo = new THREE.PlaneGeometry(1.4, 2.7);
  const doorL = new THREE.Mesh(glassGeo, glassMat);
  doorL.position.set(-0.7, 1.35, -24.0);
  plazaGroup.add(doorL);

  const doorR = new THREE.Mesh(glassGeo, glassMat);
  doorR.position.set(0.7, 1.35, -24.0);
  plazaGroup.add(doorR);

  interactables.push({
    id: 'door_glass_entrance',
    type: 'door',
    name: 'Automatické prosklené dveře',
    nameCs: 'Automatické prosklené dveře (Vstup na kolej)',
    prompt: 'Stiskni [E] pro průchod prosklenými dveřmi na kolej',
    position: new THREE.Vector3(0, 1.3, -24.0),
    radius: 2.8,
    mesh: doorL,
  });

  root.add(plazaGroup);
}

function createStreetLamp(): THREE.Group {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, metalness: 0.8, roughness: 0.3 });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8), postMat);
  base.position.set(0, 0.2, 0);
  group.add(base);

  // Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 8), postMat);
  shaft.position.set(0, 2.0, 0);
  group.add(shaft);

  // Lantern globe
  const globeMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), globeMat);
  globe.position.set(0, 3.8, 0);
  group.add(globe);

  return group;
}

function createParkBench(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.8 });

  // Seat slats
  for (let s = 0; s < 3; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.12), woodMat);
    slat.position.set(0, 0.45, -0.15 + s * 0.15);
    group.add(slat);
  }
  // Backrest slats
  for (let s = 0; s < 2; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.04), woodMat);
    slat.position.set(0, 0.65 + s * 0.15, 0.2);
    group.add(slat);
  }
  // Legs
  [-0.7, 0.7].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.45), ironMat);
    leg.position.set(lx, 0.25, 0);
    group.add(leg);
  });

  return group;
}

function createPlanter(): THREE.Group {
  const group = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ color: 0x636e72, roughness: 0.9 });
  const pot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.0), potMat);
  pot.position.set(0, 0.3, 0);
  group.add(pot);

  const bushMat = new THREE.MeshStandardMaterial({ color: 0x1e3820, roughness: 0.9 });
  const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4), bushMat);
  bush.position.set(0, 0.75, 0);
  group.add(bush);

  return group;
}

// =========================================================================
// SECTION 2: GROUND FLOOR LOBBY, RECEPTION & FACILITIES
// =========================================================================

function buildGroundFloorFacilities(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  floorMat: THREE.Material,
  wallMat: THREE.Material,
  ceilingMat: THREE.Material
) {
  const lobbyGroup = new THREE.Group();

  // 1. Central Lobby Hallway (Z = -24 to -4, Width = 4.0, Height = 2.8)
  const floorGeo = new THREE.PlaneGeometry(4.0, 20.0);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -14);
  floor.receiveShadow = true;
  lobbyGroup.add(floor);

  const ceilGeo = new THREE.PlaneGeometry(4.0, 20.0);
  const ceil = new THREE.Mesh(ceilGeo, ceilingMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, 2.8, -14);
  lobbyGroup.add(ceil);

  // Ceiling fluorescent fixtures in lobby
  [-21, -17, -13, -9, -5].forEach((lz) => {
    const fixture = createFluorescentFixture();
    fixture.position.set(0, 2.75, lz);
    lobbyGroup.add(fixture);

    const light = new THREE.PointLight(0xffeedd, 0.85, 8.0);
    light.position.set(0, 2.5, lz);
    lobbyGroup.add(light);
  });

  // 2. VRÁTNICE (PANÍ KROPÁČKOVÁ / KOLEJBÁBA) at X = -3.0, Z = -19
  buildVratniceBooth(lobbyGroup, colliders, interactables);

  // 3. STUDENT LOUNGE (HONZA & MAŤO) at X = 2.8, Z = -18
  buildStudentLounge(lobbyGroup, colliders, interactables);

  // 4. MENZA (CANTEEN) on right at X = 7.0, Z = -18
  buildMenzaRoom(lobbyGroup, colliders, interactables);

  // 5. POSILOVNA (GYM) on left at X = -7.0, Z = -18
  buildGymRoom(lobbyGroup, colliders, interactables);

  // 6. BAZÉN (SWIMMING POOL) on right at X = 7.0, Z = -9
  buildPoolRoom(lobbyGroup, colliders, interactables);

  // 7. Ground Floor Elevator Bank at Z = -4.5
  buildGroundFloorElevator(lobbyGroup, colliders, interactables);

  root.add(lobbyGroup);
}

/**
 * Builds Vrátnice (Reception Booth) with Paní Kropáčková 3D model
 */
function buildVratniceBooth(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const boothGroup = new THREE.Group();
  boothGroup.position.set(-2.8, 0, -19.0);

  // Counter desk
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x543821, roughness: 0.6 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.9), woodMat);
  counter.position.set(0, 0.475, 0);
  boothGroup.add(counter);
  colliders.push(new THREE.Box3().setFromObject(counter));

  // Glass partition screen
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x90caf9,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.05), glassMat);
  glass.position.set(0, 1.55, 0.4);
  boothGroup.add(glass);

  // Sign: VRÁTNICE
  const signTex = createFacilitySignTexture('VRÁTNICE', 'Noční služba: Pí Kropáčková');
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.4),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 2.3, 0.41);
  boothGroup.add(signMesh);

  // Banker's lamp with warm green shade
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.3 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.12), lampMat);
  lamp.position.set(-0.5, 1.05, 0.1);
  boothGroup.add(lamp);

  const deskLight = new THREE.PointLight(0xffdd99, 1.2, 3.5);
  deskLight.position.set(-0.5, 1.1, 0.1);
  boothGroup.add(deskLight);

  // Kniha nočních příchodů (Night arrival book)
  const bookMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.25), bookMat);
  book.position.set(0.1, 0.965, 0.15);
  boothGroup.add(book);

  // Cream rotary telephone
  const phoneMat = new THREE.MeshStandardMaterial({ color: 0xede6d6, roughness: 0.4 });
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), phoneMat);
  phone.position.set(0.5, 0.99, 0.1);
  boothGroup.add(phone);

  // 3D Model: Paní Kropáčková (Kolejbába) sitting behind desk
  const kolejbaba = createKolejbabaModel();
  kolejbaba.position.set(0, 0, -0.4);
  boothGroup.add(kolejbaba);

  // Interactable
  interactables.push({
    id: 'dialogue_kolejbaba',
    type: 'dialogue',
    name: 'Paní Kropáčková (Kolejbába)',
    nameCs: 'Paní Kropáčková (Noční Vrátná)',
    prompt: 'Stiskni [E] pro rozhovor a vyřízení nočního příchodu',
    position: new THREE.Vector3(-2.8, 1.3, -19.0),
    radius: 2.8,
    mesh: counter,
  });

  root.add(boothGroup);
}

/**
 * Procedural composite model of Paní Kropáčková (Kolejbába)
 */
function createKolejbabaModel(): THREE.Group {
  const group = new THREE.Group();

  // Chair
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), chairMat);
  chair.position.set(0, 0.25, 0);
  group.add(chair);

  // Cardigan / Housecoat torso (magenta/burgundy floral)
  const cardiganMat = new THREE.MeshStandardMaterial({ color: 0x802b54, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.65, 10), cardiganMat);
  torso.position.set(0, 0.8, 0);
  group.add(torso);

  // White polka-dot apron
  const apronMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.7 });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), apronMat);
  apron.position.set(0, 0.75, 0.2);
  group.add(apron);

  // Head
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf3cca3, roughness: 0.6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), headMat);
  head.position.set(0, 1.25, 0);
  group.add(head);

  // Grey Hair with bun
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xa4b0be, roughness: 0.9 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), hairMat);
  hair.position.set(0, 1.3, -0.04);
  group.add(hair);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), hairMat);
  bun.position.set(0, 1.42, -0.1);
  group.add(bun);

  // Gold wire glasses
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.02), glassMat);
  glasses.position.set(0, 1.26, 0.13);
  group.add(glasses);

  // Arms resting on desk
  const armMat = cardiganMat;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), armMat);
  armL.rotation.x = Math.PI / 4;
  armL.position.set(-0.24, 0.85, 0.18);
  group.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), armMat);
  armR.rotation.x = Math.PI / 4;
  armR.position.set(0.24, 0.85, 0.18);
  group.add(armR);

  return group;
}

/**
 * Builds Student Lounge with Honza (Czech) and Maťo (Slovak)
 */
function buildStudentLounge(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const loungeGroup = new THREE.Group();
  loungeGroup.position.set(2.8, 0, -18.0);

  // Lounge table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 0.2, roughness: 0.5 });
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.04, 16), tableMat);
  tableTop.position.set(0, 0.72, 0);
  loungeGroup.add(tableTop);

  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8), tableMat);
  leg.position.set(0, 0.36, 0);
  loungeGroup.add(leg);

  // Bowl of Čučoriedky (blueberries) on table
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0x2f3542 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.06, 12), bowlMat);
  bowl.position.set(0.1, 0.76, 0.1);
  loungeGroup.add(bowl);

  const berryMat = new THREE.MeshStandardMaterial({ color: 0x371b58, roughness: 0.3 });
  const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), berryMat);
  berry.position.set(0.1, 0.8, 0.1);
  loungeGroup.add(berry);

  // Can of Kofola
  const kofolaMat = new THREE.MeshStandardMaterial({ color: 0x4a2511, metalness: 0.7, roughness: 0.3 });
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.11, 10), kofolaMat);
  can.position.set(-0.15, 0.78, -0.1);
  loungeGroup.add(can);

  // Student 1: Honza (Czech student in blue VŠE hoodie)
  const honza = createHonzaStudentModel();
  honza.position.set(-0.55, 0, 0);
  honza.rotation.y = Math.PI / 2.5;
  loungeGroup.add(honza);

  // Student 2: Maťo (Slovak student in red FIS shirt)
  const mato = createMatoStudentModel();
  mato.position.set(0.55, 0, 0);
  mato.rotation.y = -Math.PI / 2.5;
  loungeGroup.add(mato);

  // Dialogue Interactable
  interactables.push({
    id: 'dialogue_students',
    type: 'dialogue',
    name: 'Honza & Maťo (Spolužáci)',
    nameCs: 'Honza a Maťo (Čech a Slovák z VŠE)',
    prompt: 'Stiskni [E] pro pokec se spolužáky a česko-slovenské vtipy',
    position: new THREE.Vector3(2.8, 1.3, -18.0),
    radius: 2.8,
    mesh: tableTop,
  });

  root.add(loungeGroup);
}

function createHonzaStudentModel(): THREE.Group {
  const group = new THREE.Group();
  // Chair
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), chairMat);
  chair.position.set(0, 0.225, 0);
  group.add(chair);

  // Blue VŠE Hoodie
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.65, 8), hoodieMat);
  torso.position.set(0, 0.78, 0);
  group.add(torso);

  // Head & backwards cap
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), headMat);
  head.position.set(0, 1.25, 0);
  group.add(head);

  const capMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8), capMat);
  cap.position.set(0, 1.34, 0);
  group.add(cap);

  return group;
}

function createMatoStudentModel(): THREE.Group {
  const group = new THREE.Group();
  // Chair
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), chairMat);
  chair.position.set(0, 0.225, 0);
  group.add(chair);

  // Red Slovak / FIS T-shirt
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.65, 8), shirtMat);
  torso.position.set(0, 0.78, 0);
  group.add(torso);

  // Head
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), headMat);
  head.position.set(0, 1.25, 0);
  group.add(head);

  // Headphones around neck
  const phoneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  const headphones = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), phoneMat);
  headphones.rotation.x = Math.PI / 2;
  headphones.position.set(0, 1.15, 0);
  group.add(headphones);

  return group;
}

/**
 * Builds Menza (Canteen) with food trays (smažák, guláš) and dining students
 */
function buildMenzaRoom(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const menzaGroup = new THREE.Group();
  menzaGroup.position.set(6.5, 0, -18.5);

  // Sign above entrance
  const signTex = createFacilitySignTexture('MENZA BLANICE', 'Výdej teplých jídel · Smažený sýr 85 Kč');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(-2.5, 2.3, 0);
  sign.rotation.y = -Math.PI / 2;
  menzaGroup.add(sign);

  // Food serving counter with stainless steel hot wells
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.85, roughness: 0.2 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.95, 3.5), steelMat);
  counter.position.set(0, 0.475, 0);
  menzaGroup.add(counter);

  // Food trays on counter: 1. Golden fried cheese (smažák) with fries
  const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.6 });
  const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.35), cheeseMat);
  cheese.position.set(0, 0.98, -0.6);
  menzaGroup.add(cheese);

  // Food tray 2: Beef goulash with bread dumplings
  const goulashMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00, roughness: 0.5 });
  const goulash = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.35), goulashMat);
  goulash.position.set(0, 0.98, 0.6);
  menzaGroup.add(goulash);

  // Dining table with chairs
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 1.8), new THREE.MeshStandardMaterial({ color: 0xbdc3c7 }));
  table.position.set(2.4, 0.36, 0);
  menzaGroup.add(table);

  // Student dining model
  const student = createHonzaStudentModel();
  student.position.set(2.4, 0, 1.2);
  student.rotation.y = Math.PI;
  menzaGroup.add(student);

  interactables.push({
    id: 'menza_menu',
    type: 'noticeboard',
    name: 'Jídelní lístek Menzy',
    nameCs: 'Jídelní lístek Menzy (Dnešní nabídka)',
    prompt: 'Stiskni [E] pro prohlédnutí nabídky menzy',
    position: new THREE.Vector3(4.0, 1.4, -18.5),
    radius: 2.5,
    mesh: sign,
  });

  root.add(menzaGroup);
}

/**
 * Builds Posilovna (Gym) with Olympic weight bench, barbell and dumbbells
 */
function buildGymRoom(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const gymGroup = new THREE.Group();
  gymGroup.position.set(-6.5, 0, -18.5);

  // Sign above entrance
  const signTex = createFacilitySignTexture('POSILOVNA', 'Kolejní fitness Blanice · Vstup volný');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(2.5, 2.3, 0);
  sign.rotation.y = Math.PI / 2;
  gymGroup.add(sign);

  // Weight bench frame
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const benchPad = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 1.4), benchMat);
  benchPad.position.set(0, 0.225, 0);
  gymGroup.add(benchPad);

  // Barbell uprights
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.8, roughness: 0.2 });
  [-0.35, 0.35].forEach((ux) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.06), steelMat);
    post.position.set(ux, 0.55, -0.5);
    gymGroup.add(post);
  });

  // Olympic barbell bar across uprights
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 10), steelMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.05, -0.5);
  gymGroup.add(bar);

  // 20kg black Olympic weight plates on bar
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  [-0.7, -0.62, 0.62, 0.7].forEach((px) => {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), plateMat);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(px, 1.05, -0.5);
    gymGroup.add(plate);
  });

  // Dumbbell rack on back wall
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.4), steelMat);
  rack.position.set(0, 0.4, 1.4);
  gymGroup.add(rack);

  interactables.push({
    id: 'gym_equipment',
    type: 'noticeboard',
    name: 'Řád posilovny a činky',
    nameCs: 'Posilovna Blanice (Fitness)',
    prompt: 'Stiskni [E] pro prohlédnutí posilovny',
    position: new THREE.Vector3(-4.0, 1.4, -18.5),
    radius: 2.5,
    mesh: sign,
  });

  root.add(gymGroup);
}

/**
 * Builds Plavecký Bazén (Swimming Pool) with tiled pool, water texture, lanes
 */
function buildPoolRoom(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const poolGroup = new THREE.Group();
  poolGroup.position.set(6.5, 0, -9.0);

  // Sign above entrance
  const signTex = createFacilitySignTexture('PLAVECKÝ BAZÉN', 'Plavecký bazén Jižní Město · 25m');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(-2.5, 2.3, 0);
  sign.rotation.y = -Math.PI / 2;
  poolGroup.add(sign);

  // Blue water surface
  const waterTex = createPoolWaterTexture();
  waterTex.repeat.set(2, 4);
  const waterMat = new THREE.MeshStandardMaterial({
    map: waterTex,
    color: 0x29b6f6,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 6.0), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0.8, 0.08, 0);
  poolGroup.add(water);

  // Underwater cyan glow
  const aquaLight = new THREE.PointLight(0x00e5ff, 1.5, 6.0);
  aquaLight.position.set(0.8, 0.3, 0);
  poolGroup.add(aquaLight);

  // Starting block
  const blockMat = new THREE.MeshStandardMaterial({ color: 0x34495e });
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), blockMat);
  block.position.set(-1.2, 0.225, 0);
  poolGroup.add(block);

  // Pool ladder handrails
  const railMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.9, roughness: 0.1 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), railMat);
  rail.position.set(-0.8, 0.5, 1.2);
  poolGroup.add(rail);

  interactables.push({
    id: 'pool_notice',
    type: 'noticeboard',
    name: 'Nástěnka plaveckého bazénu',
    nameCs: 'Plavecký bazén Jižní Město (25m)',
    prompt: 'Stiskni [E] pro prohlédnutí bazénu',
    position: new THREE.Vector3(4.0, 1.4, -9.0),
    radius: 2.5,
    mesh: sign,
  });

  root.add(poolGroup);
}

/**
 * Builds Ground Floor Elevator bank with RFID chip terminal
 */
function buildGroundFloorElevator(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[]
) {
  const elevGroup = new THREE.Group();
  elevGroup.position.set(0, 0, -4.2);

  // Solid back barrier separating ground floor from upper floors
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d434a, roughness: 0.8 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.8, 0.4), wallMat);
  wall.position.set(0, 1.4, 0);
  elevGroup.add(wall);
  colliders.push(new THREE.Box3().setFromObject(wall));

  // Double stainless steel elevator doors
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8a9199, roughness: 0.3, metalness: 0.7 });
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.05), doorMat);
  doorL.position.set(-0.5, 1.1, 0.16);
  elevGroup.add(doorL);

  const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.05), doorMat);
  doorR.position.set(0.5, 1.1, 0.16);
  elevGroup.add(doorR);

  // Floor display: "0" (Přízemí)
  const indCanvas = document.createElement('canvas');
  indCanvas.width = 128; indCanvas.height = 64;
  const ctx = indCanvas.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = '#00ff66'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('0', 64, 32);
  const indTex = new THREE.CanvasTexture(indCanvas);
  const indMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.04), new THREE.MeshBasicMaterial({ map: indTex }));
  indMesh.position.set(0, 2.35, 0.18);
  elevGroup.add(indMesh);

  // RFID Contactless chip reader panel
  const rfidMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.6 });
  const rfid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.05), rfidMat);
  rfid.position.set(1.1, 1.25, 0.18);
  elevGroup.add(rfid);

  const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
  led.position.set(1.1, 1.3, 0.21);
  elevGroup.add(led);

  interactables.push({
    id: 'elevator_call',
    type: 'elevator',
    name: 'Výtah do 3. patra',
    nameCs: 'Přivolávač výtahu do 3. patra (Elevator)',
    prompt: 'Stiskni [E] pro přiložení čipu a přivolání výtahu do 3. patra',
    position: new THREE.Vector3(0, 1.3, -4.5),
    radius: 2.8,
    mesh: elevGroup,
  });

  root.add(elevGroup);
}

// =========================================================================
// SECTION 3: 3RD FLOOR DORMITORY CORRIDOR & MYSTERY ROOMS (Z = 4 to 44)
// =========================================================================

function buildThirdFloorCorridor(
  rootGroup: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  lightFlickerMeshes: THREE.PointLight[],
  floorMat: THREE.Material,
  wallMat: THREE.Material,
  ceilingMat: THREE.Material
) {
  const corridorWidth = 3.2;
  const corridorLength = 40.0;
  const corridorHeight = 2.8;
  const corridorCenterZ = 24.0; // Spans Z = 4 to Z = 44

  // Floor & Ceiling for 3rd floor
  const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, corridorCenterZ);
  floorMesh.receiveShadow = true;
  rootGroup.add(floorMesh);

  const ceilingGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
  const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.set(0, corridorHeight, corridorCenterZ);
  rootGroup.add(ceilingMesh);

  // 3rd Floor Elevator Bank at Z = 4.0
  buildElevatorBank(rootGroup, colliders, 0, 0, 4.0, corridorWidth, corridorHeight);

  // 3rd Floor Fire Exit at Z = 44.0
  buildFireExitWall(rootGroup, colliders, interactables, 0, 0, 44.0, corridorWidth, corridorHeight);

  // Left and Right walls along corridor
  buildWallWithOpenings(rootGroup, colliders, -corridorWidth / 2, corridorHeight, 24.0, true, wallMat);
  buildWallWithOpenings(rootGroup, colliders, corridorWidth / 2, corridorHeight, 24.0, false, wallMat);

  // Ceiling Light Fixtures on 3rd floor (flickering, cold, eerie)
  const lightZPositions = [8, 14, 20, 26, 32, 38];
  lightZPositions.forEach((zPos, index) => {
    const fixtureGroup = createFluorescentFixture();
    fixtureGroup.position.set(0, corridorHeight - 0.05, zPos);
    rootGroup.add(fixtureGroup);

    const pointLight = new THREE.PointLight(
      index % 2 === 0 ? 0xfff4d6 : 0xccdcff,
      index === 2 ? 0.35 : 0.85,
      7.0,
      1.5
    );
    pointLight.position.set(0, corridorHeight - 0.2, zPos);
    rootGroup.add(pointLight);
    lightFlickerMeshes.push(pointLight);
  });

  // Noticeboard on 3rd floor right wall at Z = 18
  const noticeboard = createNoticeboardProp();
  noticeboard.position.set(corridorWidth / 2 - 0.04, 1.45, 18);
  noticeboard.rotation.y = -Math.PI / 2;
  rootGroup.add(noticeboard);
  interactables.push({
    id: 'noticeboard',
    type: 'noticeboard',
    name: 'Nástěnka VŠE',
    nameCs: 'Nástěnka VŠE (Exam notices)',
    prompt: 'Stiskni [E] pro přečtení nástěnky a termínů zkoušek',
    position: new THREE.Vector3(corridorWidth / 2 - 0.5, 1.4, 18),
    radius: 2.2,
    mesh: noticeboard,
  });

  // Fire Hydrant at Z = 22
  const hydrant = createHydrantCabinet();
  hydrant.position.set(-corridorWidth / 2 + 0.1, 1.3, 22);
  hydrant.rotation.y = Math.PI / 2;
  rootGroup.add(hydrant);

  // Room 312: Student Double Room at Z = 12 on left
  buildStudentRoom(rootGroup, colliders, interactables, -4.5, 0, 12, '312A', true);

  // Room 314: Mysterious room with Tesla radio and Microeconomics textbook at Z = 28 on left
  buildStudentRoom(rootGroup, colliders, interactables, -4.5, 0, 28, '314', false);

  // Communal Kitchenette at Z = 12 on right
  buildKitchenette(rootGroup, colliders, interactables, 4.5, 0, 12);

  // Communal Laundry at Z = 28 on right
  buildLaundryRoom(rootGroup, colliders, interactables, 4.5, 0, 28);

  // Study Room at Z = 36 on right
  buildStudyRoom(rootGroup, colliders, interactables, 4.8, 0, 36);

  // Maintenance Breaker Box near emergency exit at Z = 42
  buildElectricalBreakerBox(rootGroup, interactables, -corridorWidth / 2 + 0.12, 1.5, 42);

  // 9V Battery pickup on maintenance cart at Z = 10
  const batteryCart = createMaintenanceCartWithBattery(interactables);
  batteryCart.position.set(corridorWidth / 2 - 0.6, 0, 10);
  rootGroup.add(batteryCart);

  // Doors along the corridor
  buildCorridorDoor(rootGroup, interactables, -corridorWidth / 2, 0, 12, '312A', 'Buňka');
  buildCorridorDoor(rootGroup, interactables, -corridorWidth / 2, 0, 28, '314', 'Pokoj');
  buildCorridorDoor(rootGroup, interactables, corridorWidth / 2, 0, 12, 'KUCHYŇKA', 'Společná');
  buildCorridorDoor(rootGroup, interactables, corridorWidth / 2, 0, 28, 'PRÁDELNA', 'Automatická');
  buildCorridorDoor(rootGroup, interactables, corridorWidth / 2, 0, 36, 'STUDOVNA', 'Vstup na klíč');
}

function createFluorescentFixture(): THREE.Group {
  const group = new THREE.Group();
  const casingGeo = new THREE.BoxGeometry(0.35, 0.08, 1.4);
  const casingMat = new THREE.MeshStandardMaterial({ color: 0x94999c, metalness: 0.6, roughness: 0.4 });
  const casing = new THREE.Mesh(casingGeo, casingMat);
  group.add(casing);

  const tubeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8);
  tubeGeo.rotateX(Math.PI / 2);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf0f5ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const tube1 = new THREE.Mesh(tubeGeo, tubeMat);
  tube1.position.set(-0.08, -0.04, 0);
  group.add(tube1);

  const tube2 = new THREE.Mesh(tubeGeo, tubeMat);
  tube2.position.set(0.08, -0.04, 0);
  group.add(tube2);

  const wireGeo = new THREE.BoxGeometry(0.32, 0.01, 1.3);
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.5 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  wire.position.set(0, -0.06, 0);
  group.add(wire);

  return group;
}

function createNoticeboardProp(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(2.4, 1.2, 0.04);
  const tex = createNoticeboardTexture();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.1 });
  return new THREE.Mesh(geo, mat);
}

function createHydrantCabinet(): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.75, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xb51a1a, roughness: 0.4, metalness: 0.3 })
  );
  group.add(box);

  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1, metalness: 0.9 })
  );
  win.position.set(0, 0, 0.105);
  group.add(win);

  return group;
}

function buildElevatorBank(
  root: THREE.Group,
  colliders: THREE.Box3[],
  x: number,
  y: number,
  z: number,
  width: number,
  height: number
) {
  const bankGroup = new THREE.Group();
  bankGroup.position.set(x, y, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6e747a, roughness: 0.7, metalness: 0.2 });
  const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), wallMat);
  wallMesh.position.set(0, height / 2, 0);
  bankGroup.add(wallMesh);
  colliders.push(new THREE.Box3().setFromObject(wallMesh));

  const doorGeo = new THREE.BoxGeometry(1.0, 2.2, 0.05);
  const metalDoorMat = new THREE.MeshStandardMaterial({ color: 0x8a9199, roughness: 0.3, metalness: 0.7 });

  const elevator1 = new THREE.Mesh(doorGeo, metalDoorMat);
  elevator1.position.set(-0.75, 1.1, 0.16);
  bankGroup.add(elevator1);

  const elevator2 = new THREE.Mesh(doorGeo, metalDoorMat);
  elevator2.position.set(0.75, 1.1, 0.16);
  bankGroup.add(elevator2);

  const indCanvas = document.createElement('canvas');
  indCanvas.width = 128; indCanvas.height = 64;
  const ctx = indCanvas.getContext('2d')!;
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = '#ff3311'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('3', 64, 32);
  const indTex = new THREE.CanvasTexture(indCanvas);
  const indMat = new THREE.MeshBasicMaterial({ map: indTex });

  const ind1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.04), indMat);
  ind1.position.set(-0.75, 2.35, 0.18);
  bankGroup.add(ind1);

  const ind2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.04), indMat);
  ind2.position.set(0.75, 2.35, 0.18);
  bankGroup.add(ind2);

  root.add(bankGroup);
}

function buildFireExitWall(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  x: number,
  y: number,
  z: number,
  width: number,
  height: number
) {
  const exitGroup = new THREE.Group();
  exitGroup.position.set(x, y, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4e52, roughness: 0.8, metalness: 0.1 });
  const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), wallMat);
  wallMesh.position.set(0, height / 2, 0);
  exitGroup.add(wallMesh);
  colliders.push(new THREE.Box3().setFromObject(wallMesh));

  const doorGeo = new THREE.BoxGeometry(1.6, 2.2, 0.08);
  const greenDoorMat = new THREE.MeshStandardMaterial({ color: 0x1d472b, roughness: 0.5, metalness: 0.4 });
  const exitDoor = new THREE.Mesh(doorGeo, greenDoorMat);
  exitDoor.position.set(0, 1.1, -0.16);
  exitGroup.add(exitDoor);

  const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 12);
  barGeo.rotateZ(Math.PI / 2);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.6, roughness: 0.3 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, 1.0, -0.22);
  exitGroup.add(bar);

  const exitSignTex = createExitSignTexture();
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.35),
    new THREE.MeshBasicMaterial({ map: exitSignTex })
  );
  signMesh.position.set(0, 2.45, -0.17);
  signMesh.rotation.y = Math.PI;
  exitGroup.add(signMesh);

  const rfidGeo = new THREE.BoxGeometry(0.12, 0.2, 0.05);
  const rfidMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.4 });
  const rfid = new THREE.Mesh(rfidGeo, rfidMat);
  rfid.position.set(1.0, 1.25, -0.16);
  exitGroup.add(rfid);

  root.add(exitGroup);

  interactables.push({
    id: 'door_fire_exit',
    type: 'door',
    name: 'Únikový východ (Fire Escape)',
    nameCs: 'Únikový východ (Elektronický zámek)',
    prompt: 'Stiskni [E] pro přiložení ISIC karty a otevření únikového východu',
    position: new THREE.Vector3(x, 1.2, z - 1.0),
    radius: 2.2,
    mesh: exitDoor,
  });
}

function buildWallWithOpenings(
  root: THREE.Group,
  colliders: THREE.Box3[],
  wallX: number,
  height: number,
  centerZ: number,
  isLeft: boolean,
  wallMat: THREE.Material
) {
  const wallThick = 0.2;
  const segments = [
    { startZ: 4.0, endZ: 10.5 },
    { startZ: 13.5, endZ: 26.5 },
    { startZ: 29.5, endZ: 34.5 },
    { startZ: 37.5, endZ: 44.0 },
  ];

  segments.forEach((seg) => {
    const segLen = seg.endZ - seg.startZ;
    const midZ = (seg.startZ + seg.endZ) / 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, segLen), wallMat);
    mesh.position.set(wallX, height / 2, midZ);
    root.add(mesh);
    colliders.push(new THREE.Box3().setFromObject(mesh));
  });

  const doorZCenters = [12, 28, 36];
  doorZCenters.forEach((zCenter) => {
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(wallThick, 0.7, 3.0), wallMat);
    lintel.position.set(wallX, height - 0.35, zCenter);
    root.add(lintel);
  });
}

function buildCorridorDoor(
  root: THREE.Group,
  interactables: DormInteractable[],
  x: number,
  y: number,
  z: number,
  roomNum: string,
  subLabel: string
) {
  const doorWidth = 0.95;
  const doorHeight = 2.05;
  const doorTex = createDoorTexture(roomNum, subLabel);
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTex,
    roughness: 0.6,
    metalness: 0.1,
  });
  const doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, doorHeight), doorMat);
  doorMesh.position.set(x > 0 ? x - 0.02 : x + 0.02, y + doorHeight / 2, z);
  doorMesh.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
  root.add(doorMesh);
}

function buildStudentRoom(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  roomCenterX: number,
  roomCenterY: number,
  roomCenterZ: number,
  roomLabel: string,
  hasWardrobe: boolean
) {
  const roomGroup = new THREE.Group();
  roomGroup.position.set(roomCenterX, roomCenterY, roomCenterZ);

  const roomW = 4.0;
  const roomL = 4.0;
  const roomH = 2.8;

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d4b45, roughness: 0.6 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomL), floorMat);
  floor.rotation.x = -Math.PI / 2;
  roomGroup.add(floor);

  const deskMat = new THREE.MeshStandardMaterial({ color: 0x7c5b36, roughness: 0.7 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.7), deskMat);
  desk.position.set(-1.0, 0.375, -1.2);
  roomGroup.add(desk);

  const bedMat = new THREE.MeshStandardMaterial({ color: 0x3b5998, roughness: 0.8 });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.9), bedMat);
  bed.position.set(0.8, 0.225, 1.2);
  roomGroup.add(bed);

  if (hasWardrobe) {
    const wardMat = new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.6 });
    const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.0, 0.6), wardMat);
    wardrobe.position.set(1.3, 1.0, -1.2);
    roomGroup.add(wardrobe);

    interactables.push({
      id: `wardrobe_${roomLabel}`,
      type: 'wardrobe',
      name: 'Šatní skříň (Úkryt)',
      nameCs: 'Šatní skříň (Wardrobe hiding spot)',
      prompt: 'Stiskni [E] pro schování se do skříně před Zkoušejícím',
      position: new THREE.Vector3(roomCenterX + 1.3, 1.2, roomCenterZ - 1.2),
      radius: 1.8,
      mesh: wardrobe,
    });
  }

  if (roomLabel === '314') {
    const radioMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.4, metalness: 0.3 });
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.15), radioMat);
    radio.position.set(-1.0, 0.84, -1.2);
    roomGroup.add(radio);

    interactables.push({
      id: 'radio_tesla',
      type: 'radio',
      name: 'Rádio Tesla 420A',
      nameCs: 'Rádio Tesla 420A (Vysílačka spolužáků)',
      prompt: 'Stiskni [E] pro naladění nouzového hlášení studentů',
      position: new THREE.Vector3(roomCenterX - 1.0, 1.0, roomCenterZ - 1.2),
      radius: 1.8,
      mesh: radio,
    });
  }

  root.add(roomGroup);
}

function buildKitchenette(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  x: number,
  y: number,
  z: number
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const counterMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.3, metalness: 0.6 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.65), counterMat);
  counter.position.set(0, 0.45, 1.2);
  group.add(counter);

  const keyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
  const key = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), keyMat);
  key.position.set(-0.6, 0.92, 1.2);
  group.add(key);

  interactables.push({
    id: 'pickup_study_key',
    type: 'pickup',
    name: 'Klíč od studovny VŠE',
    nameCs: 'Mosazný klíč (Study Room Key)',
    prompt: 'Stiskni [E] pro sebrání klíče od studovny',
    position: new THREE.Vector3(x - 0.6, y + 1.0, z + 1.2),
    radius: 1.8,
    mesh: key,
    data: { itemId: 'STUDY_KEY' },
  });

  root.add(group);
}

function buildLaundryRoom(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  x: number,
  y: number,
  z: number
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const washerMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
  const washer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), washerMat);
  washer.position.set(0, 0.45, 1.2);
  group.add(washer);

  const isicMat = new THREE.MeshStandardMaterial({ color: 0x0055a5, roughness: 0.4 });
  const isicCard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.01, 0.06), isicMat);
  isicCard.position.set(0, 0.91, 1.2);
  group.add(isicCard);

  interactables.push({
    id: 'pickup_isic',
    type: 'pickup',
    name: 'Studentská ISIC karta VŠE',
    nameCs: 'Ztracená ISIC karta VŠE',
    prompt: 'Stiskni [E] pro sebrání ISIC karty s čipem pro únikový východ',
    position: new THREE.Vector3(x, y + 1.0, z + 1.2),
    radius: 1.8,
    mesh: isicCard,
    data: { itemId: 'ISIC_CARD' },
  });

  root.add(group);
}

function buildStudyRoom(
  root: THREE.Group,
  colliders: THREE.Box3[],
  interactables: DormInteractable[],
  x: number,
  y: number,
  z: number
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const deskMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.7 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.8), deskMat);
  desk.position.set(0, 0.375, 1.2);
  group.add(desk);

  const termMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4 });
  const terminal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.1), termMat);
  terminal.position.set(0, 0.92, 1.2);
  group.add(terminal);

  interactables.push({
    id: 'terminal_insis',
    type: 'terminal',
    name: 'Terminál InSIS VŠE',
    nameCs: 'Terminál InSIS (Zkouškový systém)',
    prompt: 'Stiskni [E] pro přihlášení do InSIS a vyřešení zkouškového kódu',
    position: new THREE.Vector3(x, y + 1.0, z + 1.2),
    radius: 2.0,
    mesh: terminal,
  });

  root.add(group);
}

function buildElectricalBreakerBox(
  root: THREE.Group,
  interactables: DormInteractable[],
  x: number,
  y: number,
  z: number
) {
  const boxGroup = new THREE.Group();
  boxGroup.position.set(x, y, z);

  const boxMat = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.7, roughness: 0.3 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.45), boxMat);
  boxGroup.add(box);

  interactables.push({
    id: 'fusebox_main',
    type: 'fusebox',
    name: 'Hlavní rozvodná skříň 380V',
    nameCs: 'Hlavní rozvodná skříň (Circuit Breaker)',
    prompt: 'Stiskni [E] pro vložení 380V pojistky a obnovení napájení',
    position: new THREE.Vector3(x + 0.5, y, z),
    radius: 2.0,
    mesh: boxGroup,
  });

  root.add(boxGroup);
}

function createMaintenanceCartWithBattery(interactables: DormInteractable[]): THREE.Group {
  const group = new THREE.Group();
  const cartMat = new THREE.MeshStandardMaterial({ color: 0x3d444d, metalness: 0.6, roughness: 0.4 });

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.45), cartMat);
  shelf.position.set(0, 0.72, 0);
  group.add(shelf);

  const battGeo = new THREE.BoxGeometry(0.06, 0.1, 0.04);
  const battMat = new THREE.MeshStandardMaterial({ color: 0xd9822b, metalness: 0.6, roughness: 0.3 });
  const battery = new THREE.Mesh(battGeo, battMat);
  battery.position.set(0, 0.79, 0);
  group.add(battery);

  interactables.push({
    id: 'pickup_battery',
    type: 'pickup',
    name: '9V Baterie do svítilny',
    nameCs: '9V Baterie (Flashlight Battery)',
    prompt: 'Stiskni [E] pro sebrání 9V baterie a dobití svítilny',
    position: new THREE.Vector3(1.0, 0.9, 10),
    radius: 1.8,
    mesh: battery,
    data: { itemId: 'BATTERY_9V' },
  });

  return group;
}
