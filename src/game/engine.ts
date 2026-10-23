/**
 * Core 3D Game Engine for Kolej Blanice Dormitory Horror.
 * Manages Three.js scene, PBR renderer, RoomEnvironment, first-person kinematics,
 * flashlight spotlight, Night Examiner AI, and raycast interactions.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DormitoryWorld, buildDormitoryScene, DormInteractable } from './dormitoryMap';
import { soundEngine } from '../audio/soundEngine';
import { multiplayerNet } from './multiplayer';
import { PeerPlayer, FloorLocation } from './types';
import { isPositionWalkable } from './rules';

// Pre-allocated scratch vectors to prevent GC allocations in animation loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

export interface EngineCallbacks {
  onHoverInteractable: (target: DormInteractable | null) => void;
  onStatsUpdate: (
    sanity: number,
    battery: number,
    flashlightOn: boolean,
    isHiding: boolean,
    timeElapsed: number,
    graceRemaining: number
  ) => void;
  onExaminerAlert: (proximity: number, isAlerted: boolean) => void;
  onGameOver: (reason: string) => void;
  onVictory: () => void;
  onOpenTerminal: () => void;
  onOpenNoticeboard: () => void;
  onOpenDialogue: (dialogueId: string) => void;
  onUseElevator: () => void;
  onNotification?: (msg: string) => void;
}

export class DormitoryEngine {
  private mountElement: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // World state
  private world!: DormitoryWorld;
  private flashlightLight!: THREE.SpotLight;
  private flashlightConeMesh!: THREE.Mesh;
  private flashlightTarget!: THREE.Object3D;
  private examinerGroup!: THREE.Group;
  private examinerLight!: THREE.PointLight;
  private peerMeshes: Map<string, THREE.Group> = new Map();

  // Player kinematics
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.65, -17.0);
  public yaw: number = 0; // rotation around Y (facing South = 0)
  public pitch: number = 0; // look up/down
  private moveSpeed: number = 3.2;
  private sprintSpeed: number = 5.2;
  private keysHeld: Set<string> = new Set();
  private isPointerLocked: boolean = false;
  private headBobTimer: number = 0;
  private footstepTimer: number = 0;

  // Horror Stats
  public sanity: number = 100;
  public battery: number = 95;
  public isFlashlightOn: boolean = true;
  public isHiding: boolean = false;
  private flickerTimer: number = 0;

  // Examiner AI
  private examinerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 5.0);
  private currentWaypointIdx: number = 0;
  private examinerSpeed: number = 1.4;
  private examinerAlert: number = 0; // 0 to 100
  private keyRattleTimer: number = 0;

  // Callbacks
  private callbacks: EngineCallbacks;
  public gameState: 'title' | 'playing' | 'paused' | 'gameover' | 'victory' = 'title';

  // Raycaster
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  public currentHover: DormInteractable | null = null;

  constructor(mountElement: HTMLDivElement, callbacks: EngineCallbacks) {
    this.mountElement = mountElement;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch (e) {
        return true;
      }
    })();

    // 2. Setup WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.mountElement.clientWidth, this.mountElement.clientHeight);
    this.mountElement.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070a);
    this.scene.fog = new THREE.FogExp2(0x05070a, 0.085);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.mountElement.clientWidth / this.mountElement.clientHeight,
      0.1,
      60
    );
    this.camera.up.set(0, 1, 0);
    this.yaw = Math.PI; // Face South (+Z) down the 40m hallway towards noticeboard and rooms
    this.pitch = 0;
    this.camera.position.copy(this.position);
    this.camera.rotation.set(0, this.yaw, 0, 'YXZ');
    this.scene.add(this.camera);

    // 4. Procedural Studio Environment Reflection
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('Failed to generate RoomEnvironment:', e);
    }

    // 5. Ambient & Fill lighting (cold, subtle dormitory ambience)
    const hemiLight = new THREE.HemisphereLight(0x3a4856, 0x14181a, 0.45);
    this.scene.add(hemiLight);

    // 6. Build Dormitory Architecture
    this.world = buildDormitoryScene();
    this.scene.add(this.world.rootGroup);
    this.position.copy(this.world.spawnPoint);

    // 7. Flashlight Setup (Mounted to player camera)
    this.setupFlashlight();

    // 8. Build Night Examiner Entity
    this.setupExaminer();

    // 9. Input & Window Listeners
    this.setupInputs();

    // 10. Listen for multiplayer classmates
    multiplayerNet.onPeersUpdated((peers) => this.syncPeerMeshes(peers));

    // 11. Start Loop
    this.lastTime = performance.now();
    this.tick();
  }

  private setupFlashlight() {
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);

    this.flashlightLight = new THREE.SpotLight(0xfff6dd, 2.8, 16, Math.PI / 6, 0.4, 1.2);
    this.flashlightLight.castShadow = !this.isSoftwareGl;
    if (this.flashlightLight.castShadow) {
      this.flashlightLight.shadow.mapSize.width = 1024;
      this.flashlightLight.shadow.mapSize.height = 1024;
      this.flashlightLight.shadow.bias = -0.0005;
    }
    this.flashlightLight.target = this.flashlightTarget;
    this.camera.add(this.flashlightLight);
    this.flashlightLight.position.set(0.18, -0.15, 0.1);

    // Volumetric flashlight beam cone
    const coneGeo = new THREE.CylinderGeometry(0.04, 1.4, 7.0, 16, 1, true);
    coneGeo.rotateX(Math.PI / 2);
    coneGeo.translate(0, 0, 3.5);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff6dd,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.flashlightConeMesh = new THREE.Mesh(coneGeo, coneMat);
    this.camera.add(this.flashlightConeMesh);
    this.flashlightConeMesh.position.set(0.18, -0.15, 0.1);
  }

  /**
   * Builds the Professor from Národohospodářská fakulta (NF VŠE) procedural 3D model:
   * Tweed academic jacket, formal shirt & red tie, scholarly spectacles,
   * leather briefcase, exam papers clipboard, and red grading pen.
   */
  private setupExaminer() {
    this.examinerGroup = new THREE.Group();
    this.examinerPos.copy(this.world.examinerWaypoints[2]);
    this.examinerGroup.position.copy(this.examinerPos);

    // 1. Tweed Wool Professor Blazer Jacket (Primary silhouette)
    const jacketGeo = new THREE.CylinderGeometry(0.32, 0.42, 1.4, 12);
    const tweedMat = new THREE.MeshStandardMaterial({
      color: 0x4a3828, // Classic Czech brown tweed jacket
      roughness: 0.85,
      metalness: 0.1,
    });
    const jacket = new THREE.Mesh(jacketGeo, tweedMat);
    jacket.position.set(0, 1.1, 0);
    this.examinerGroup.add(jacket);

    // Dark trousers
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.9 });
    const legGeo = new THREE.BoxGeometry(0.18, 0.9, 0.2);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.12, 0.45, 0);
    this.examinerGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.12, 0.45, 0);
    this.examinerGroup.add(legR);

    // Leather shoes
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.1, 0.28);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
    shoeL.position.set(-0.12, 0.05, 0.04);
    this.examinerGroup.add(shoeL);
    const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
    shoeR.position.set(0.12, 0.05, 0.04);
    this.examinerGroup.add(shoeR);

    // 2. White Formal Shirt & Burgundy Tie (Secondary silhouette)
    const shirtGeo = new THREE.BoxGeometry(0.18, 0.4, 0.04);
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 1.45, 0.28);
    this.examinerGroup.add(shirt);

    const tieGeo = new THREE.BoxGeometry(0.06, 0.42, 0.03);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x8b1e1e, roughness: 0.5 }); // Burgundy VŠE NF tie
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 1.4, 0.31);
    this.examinerGroup.add(tie);

    // 3. Professor Head
    const headGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xecd0b5, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.95, 0);
    this.examinerGroup.add(head);

    // Graying hair / professor hairline
    const hairGeo = new THREE.SphereGeometry(0.21, 12, 12);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 2.02, -0.04);
    this.examinerGroup.add(hair);

    // 4. Scholarly Spectacles / Glasses (Wire frames)
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const rimGeo = new THREE.TorusGeometry(0.04, 0.008, 8, 16);
    const rimL = new THREE.Mesh(rimGeo, glassMat);
    rimL.position.set(-0.065, 1.95, 0.19);
    this.examinerGroup.add(rimL);
    const rimR = new THREE.Mesh(rimGeo, glassMat);
    rimR.position.set(0.065, 1.95, 0.19);
    this.examinerGroup.add(rimR);
    // Glasses bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), glassMat);
    bridge.position.set(0, 1.95, 0.195);
    this.examinerGroup.add(bridge);

    // Spectral aura (ghostly academic glow)
    this.examinerLight = new THREE.PointLight(0x70a1ff, 0.7, 4.5);
    this.examinerLight.position.set(0, 1.8, 0.3);
    this.examinerGroup.add(this.examinerLight);

    // 5. Classic Brown Leather Briefcase in Hand (Aktovka NF VŠE)
    const briefcaseMat = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.4 });
    const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.42), briefcaseMat);
    briefcase.position.set(-0.45, 0.85, 0.1);
    this.examinerGroup.add(briefcase);
    // Briefcase handle
    const bHandle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12), glassMat);
    bHandle.position.set(-0.45, 1.05, 0.1);
    bHandle.rotation.y = Math.PI / 2;
    this.examinerGroup.add(bHandle);

    // 6. Exam Ledger Clipboard in other hand ("Zkoušky NF VŠE - Makroekonomie")
    const clipboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.34, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x5a4530, roughness: 0.6 })
    );
    clipboard.position.set(0.35, 1.1, 0.25);
    clipboard.rotation.x = 0.35;
    this.examinerGroup.add(clipboard);

    // Red grading pen in hand
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.3 })
    );
    pen.position.set(0.38, 1.18, 0.35);
    pen.rotation.x = Math.PI / 3;
    this.examinerGroup.add(pen);

    this.scene.add(this.examinerGroup);
  }

  /**
   * Syncs remote classmates (other students in dorm)
   */
  private syncPeerMeshes(peers: PeerPlayer[]) {
    // Add or update
    peers.forEach((peer) => {
      let group = this.peerMeshes.get(peer.id);
      if (!group) {
        group = this.createClassmateModel(peer.name);
        this.peerMeshes.set(peer.id, group);
        this.scene.add(group);
      }
      group.position.set(peer.x, peer.y, peer.z);
      group.rotation.y = peer.rotationY;

      // Update their flashlight
      const flash = group.getObjectByName('peerFlashlight') as THREE.SpotLight;
      if (flash) {
        flash.visible = peer.flashlightOn;
      }
    });

    // Remove old
    for (const [id, group] of this.peerMeshes.entries()) {
      if (!peers.some((p) => p.id === id)) {
        this.scene.remove(group);
        this.peerMeshes.delete(id);
      }
    }
  }

  private createClassmateModel(name: string): THREE.Group {
    const group = new THREE.Group();

    // Student body (hoodie)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 1.3, 10),
      new THREE.MeshStandardMaterial({ color: 0x27496d, roughness: 0.7 })
    );
    body.position.set(0, 0.95, 0);
    group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xe0c39e, roughness: 0.6 })
    );
    head.position.set(0, 1.7, 0);
    group.add(head);

    // Flashlight
    const flash = new THREE.SpotLight(0xffeedd, 1.5, 10, Math.PI / 7, 0.5);
    flash.name = 'peerFlashlight';
    flash.position.set(0.2, 1.1, 0.2);
    group.add(flash);

    return group;
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    this.mountElement.addEventListener('click', () => {
      if (this.gameState === 'playing' && !this.isPointerLocked) {
        this.mountElement.requestPointerLock?.();
      }
    });

    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysHeld.add(e.code);

    if (e.code === 'KeyF') {
      // Toggle flashlight
      this.toggleFlashlight();
    }

    if (e.code === 'KeyE') {
      // Trigger interaction
      this.interactWithCurrentHover();
    }

    if (e.code === 'KeyM') {
      soundEngine.toggleMute();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handleBlur = () => {
    this.keysHeld.clear();
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.mountElement;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked || this.gameState !== 'playing') return;

    const sens = 0.0022;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;
    this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
  };

  private handleResize = () => {
    if (!this.mountElement || !this.renderer || !this.camera) return;
    const w = this.mountElement.clientWidth;
    const h = this.mountElement.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public toggleFlashlight() {
    if (this.battery <= 0 && !this.isFlashlightOn) {
      // Dead battery click sound
      soundEngine.playFlashlightClick(false);
      return;
    }
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlightLight.visible = this.isFlashlightOn;
    this.flashlightConeMesh.visible = this.isFlashlightOn;
    soundEngine.playFlashlightClick(this.isFlashlightOn);
  }

  public setFlashlight(state: boolean) {
    this.isFlashlightOn = state;
    this.flashlightLight.visible = state;
    this.flashlightConeMesh.visible = state;
  }

  public rechargeBattery() {
    this.battery = 100;
    this.isFlashlightOn = true;
    this.flashlightLight.visible = true;
    this.flashlightConeMesh.visible = true;
    soundEngine.playPickup();
  }

  public interactWithCurrentHover() {
    if (!this.currentHover) return;

    const t = this.currentHover;
    if (t.type === 'dialogue') {
      if (t.id === 'dialogue_kolejbaba') {
        this.callbacks.onOpenDialogue('kolejbaba_start');
      } else if (t.id === 'dialogue_students') {
        this.callbacks.onOpenDialogue('students_start');
      } else {
        this.callbacks.onOpenDialogue(t.id);
      }
    } else if (t.type === 'elevator') {
      this.callbacks.onUseElevator();
    } else if (t.id === 'door_glass_entrance') {
      soundEngine.playGlassDoorOpen();
      if (this.position.z < -23.0) {
        this.position.z = -22.5;
        this.callbacks.onNotification?.('Vstoupil jsi do budovy Koleje Blanice.');
      }
    } else if (t.type === 'terminal') {
      this.callbacks.onOpenTerminal();
    } else if (t.type === 'noticeboard') {
      this.callbacks.onOpenNoticeboard();
    } else if (t.type === 'wardrobe') {
      this.isHiding = !this.isHiding;
      soundEngine.playDoorCreak();
    } else if (t.type === 'pickup') {
      soundEngine.playPickup();
      // Hide picked up mesh
      t.mesh.visible = false;
    } else if (t.type === 'radio') {
      soundEngine.playRadioStatic();
      multiplayerNet.broadcastRadio('Tady buňka 314, slyší mě někdo? Kód 5214 funguje na InSIS!');
    }
  }

  public rideElevatorToFloor(floor: 'dorm_floor' | 'lobby') {
    soundEngine.playElevatorRide();
    if (floor === 'dorm_floor') {
      this.position.set(0, 1.65, 6.0);
      this.yaw = Math.PI; // Face South (+Z) down the 3rd floor corridor
      this.pitch = 0;
      this.callbacks.onNotification?.('Výtah tě vyvezl do 3. patra. Všude je tma a ticho...');
    } else {
      this.position.set(0, 1.65, -5.0);
      this.yaw = 0;
      this.pitch = 0;
    }
  }

  private lastTime: number = 0;

  private afterDraw(cb: () => void) {
    try {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 60);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } catch (e) {
      this.frameId = window.setTimeout(cb, 60);
    }
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    this.updateSimulation(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public timeElapsed: number = 0;

  private updateSimulation(dt: number) {
    if (this.gameState === 'title') {
      this.updateTitleCamera(dt);
      return;
    }

    if (this.gameState !== 'playing') return;

    this.timeElapsed += dt;
    const isGracePeriod = this.timeElapsed < 300; // 5 minutes peace
    const graceRemaining = Math.max(0, Math.ceil(300 - this.timeElapsed));

    // 1. Player Movement & Kinematics (WASD walk + Arrow keys camera turn)
    this.updatePlayerMovement(dt);

    // 2. Battery & Flashlight drain (extended life, slower drain)
    if (this.isFlashlightOn) {
      this.battery = Math.max(0, this.battery - (0.45 * dt));
      if (this.battery <= 0) {
        this.isFlashlightOn = false;
        this.flashlightLight.visible = false;
        this.flashlightConeMesh.visible = false;
        soundEngine.playLightFlicker();
      }
    }

    // 3. NF Professor AI
    this.updateExaminerAI(dt, isGracePeriod);

    // 4. Sanity update & Heartbeat - only active when on 3rd floor (z >= 0)
    const isPlayerOn3rdFloor = this.position.z >= 0;
    const distToExaminer = isPlayerOn3rdFloor ? this.position.distanceTo(this.examinerPos) : 999;
    const isNear = isPlayerOn3rdFloor && distToExaminer < 6.5;

    if (isGracePeriod) {
      // During 5-minute grace period, sanity is protected and cannot drop below 50
      if (this.isHiding) {
        this.sanity = Math.min(100, this.sanity + (4.0 * dt));
      } else {
        this.sanity = Math.max(50, Math.min(100, this.sanity + (0.8 * dt)));
      }
    } else {
      if (this.isHiding) {
        this.sanity = Math.min(100, this.sanity + (4.0 * dt));
      } else if (isNear) {
        this.sanity = Math.max(0, this.sanity - (10.0 * dt));
        this.examinerAlert = Math.min(100, this.examinerAlert + (16.0 * dt));
      } else if (!this.isFlashlightOn) {
        this.sanity = Math.max(0, this.sanity - (2.0 * dt));
      } else {
        this.sanity = Math.min(100, this.sanity + (0.5 * dt));
      }
    }

    soundEngine.updateHeartbeat(this.sanity, !isGracePeriod && isNear);

    // Check game over by panic or caught - ONLY AFTER 5 MINUTES GRACE PERIOD!
    if (!isGracePeriod) {
      if (this.sanity <= 0 || (distToExaminer < 1.4 && !this.isHiding)) {
        this.gameState = 'gameover';
        soundEngine.playExaminerThud(1.0);
        this.callbacks.onGameOver(
          this.sanity <= 0
            ? 'Zkouškový stres a otázky z makroekonomie tě zcela pohltily.'
            : 'Profesor z Národohospodářské fakulty (NF VŠE) tě vyhodil ze zkoušky se známkou F!'
        );
      }
    }

    // 5. Light flicker
    this.updateLightFlicker(dt);

    // 6. Raycast interactables
    this.updateRaycasting();

    // 7. Broadcast position to classmates
    multiplayerNet.broadcastPosition(
      this.position.x,
      this.position.y,
      this.position.z,
      this.yaw,
      this.isFlashlightOn
    );

    // 8. Push stats to HUD with grace period info
    this.callbacks.onStatsUpdate(
      this.sanity,
      this.battery,
      this.isFlashlightOn,
      this.isHiding,
      this.timeElapsed,
      graceRemaining
    );
    this.callbacks.onExaminerAlert(
      isGracePeriod ? 0 : Math.max(0, 1 - (distToExaminer / 15)),
      !isGracePeriod && isNear
    );
  }

  private updateTitleCamera(dt: number) {
    // Cinematic slow tracking pan down Kolej Blanice hallway
    this.headBobTimer += dt * 0.4;
    const titleZ = -16.0 + (Math.sin(this.headBobTimer) * 4.0);
    this.camera.position.set(Math.sin(this.headBobTimer * 0.8) * 0.4, 1.6, titleZ);
    this.camera.lookAt(0, 1.5, titleZ + 8.0);

    // Slow professor idle in background
    this.examinerGroup.position.set(0, 0, 0 + Math.sin(this.headBobTimer) * 1.5);
  }

  private updatePlayerMovement(dt: number) {
    if (this.isHiding) {
      // Confined inside wardrobe looking slightly through door crack
      this.camera.position.set(-3.2, 1.5, -10.7);
      this.camera.rotation.set(0, Math.PI / 2, 0);
      return;
    }

    // 1. Arrow Keys for Camera Turning and Tilting
    const arrowTurnSpeed = 2.4;
    const arrowTiltSpeed = 1.8;
    if (this.keysHeld.has('ArrowLeft')) {
      this.yaw += arrowTurnSpeed * dt; // Turn camera left
    }
    if (this.keysHeld.has('ArrowRight')) {
      this.yaw -= arrowTurnSpeed * dt; // Turn camera right
    }
    if (this.keysHeld.has('ArrowUp')) {
      this.pitch = Math.min(Math.PI / 2.3, this.pitch + arrowTiltSpeed * dt); // Tilt camera up
    }
    if (this.keysHeld.has('ArrowDown')) {
      this.pitch = Math.max(-Math.PI / 2.3, this.pitch - arrowTiltSpeed * dt); // Tilt camera down
    }

    // 2. WASD Movement: W = Forward, S = Backward, A = Left, D = Right
    const isSprinting = this.keysHeld.has('ShiftLeft') || this.keysHeld.has('ShiftRight');
    const speed = isSprinting ? this.sprintSpeed : this.moveSpeed;

    _v1.set(0, 0, 0);
    if (this.keysHeld.has('KeyW')) _v1.z += 1;
    if (this.keysHeld.has('KeyS')) _v1.z -= 1;
    if (this.keysHeld.has('KeyA')) _v1.x -= 1; // A = left
    if (this.keysHeld.has('KeyD')) _v1.x += 1; // D = right

    const isMoving = _v1.lengthSq() > 0;
    if (isMoving) {
      _v1.normalize();

      // Compute forward & strafe directions from camera yaw
      this.camera.getWorldDirection(_camDir);
      _camDir.y = 0;
      _camDir.normalize();
      const right = _v2.crossVectors(_camDir, this.camera.up).normalize();

      const moveX = (_camDir.x * _v1.z + right.x * _v1.x) * speed * dt;
      const moveZ = (_camDir.z * _v1.z + right.z * _v1.x) * speed * dt;

      // New candidate position with wall-sliding collision
      const newX = this.position.x + moveX;
      const newZ = this.position.z + moveZ;

      if (isPositionWalkable(newX, newZ)) {
        this.position.x = newX;
        this.position.z = newZ;
      } else if (isPositionWalkable(newX, this.position.z)) {
        this.position.x = newX;
      } else if (isPositionWalkable(this.position.x, newZ)) {
        this.position.z = newZ;
      }

      // Head-bob & footsteps
      this.headBobTimer += dt * (isSprinting ? 12 : 8);
      this.footstepTimer += dt * (isSprinting ? 1.6 : 1.0);
      if (this.footstepTimer > 0.48) {
        this.footstepTimer = 0;
        soundEngine.playFootstep(isSprinting);
      }
    }

    // Camera orientation - ensure rotation.z is strictly 0
    this.camera.position.set(
      this.position.x,
      this.position.y + (isMoving ? Math.sin(this.headBobTimer) * 0.05 : 0),
      this.position.z
    );

    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // Flashlight target pointing along camera forward
    this.camera.getWorldDirection(_camDir);
    this.flashlightTarget.position.copy(this.camera.position).add(_camDir.multiplyScalar(6));
  }

  private updateExaminerAI(dt: number, isGracePeriod: boolean = false) {
    if (this.position.z < 0) return; // Entity stays dormant upstairs while player is outside/in lobby
    const waypoints = this.world.examinerWaypoints;
    // During 5-minute grace period, professor stays in far study wing reviewing papers
    const activeWaypoints = isGracePeriod ? waypoints.slice(3) : waypoints;
    const targetWp = activeWaypoints[this.currentWaypointIdx % activeWaypoints.length];

    const dir = _v2.subVectors(targetWp, this.examinerPos);
    dir.y = 0;
    const dist = dir.length();

    const speed = isGracePeriod ? 0.6 : this.examinerSpeed;

    if (dist < 0.4) {
      this.currentWaypointIdx = (this.currentWaypointIdx + 1) % activeWaypoints.length;
    } else {
      dir.normalize();
      this.examinerPos.add(dir.multiplyScalar(speed * dt));
      this.examinerGroup.position.copy(this.examinerPos);

      // Face movement direction
      const angle = Math.atan2(dir.x, dir.z);
      this.examinerGroup.rotation.y = angle;
    }

    // Key rattle audio pulse only when active exam period starts
    if (!isGracePeriod) {
      this.keyRattleTimer += dt;
      if (this.keyRattleTimer > 3.5 + Math.random() * 2.0) {
        this.keyRattleTimer = 0;
        const playerDist = this.position.distanceTo(this.examinerPos);
        if (playerDist < 18) {
          soundEngine.playKeyRattle(Math.max(0.1, 1 - playerDist / 18));
        }
      }
    }
  }

  private updateLightFlicker(dt: number) {
    this.flickerTimer += dt;
    if (this.flickerTimer > 2.8) {
      this.flickerTimer = 0;
      if (Math.random() < 0.4) {
        soundEngine.playLightFlicker();
        const light = this.world.lightFlickerMeshes[2];
        if (light) {
          light.intensity = 0.05;
          setTimeout(() => {
            if (light) light.intensity = 0.4;
          }, 120);
        }
      }
    }
  }

  private updateRaycasting() {
    this.camera.getWorldDirection(_rayDir);
    _rayOrigin.copy(this.camera.position);

    let nearest: DormInteractable | null = null;
    let minDistance = 2.4;

    for (const item of this.world.interactables) {
      if (!item.mesh.visible) continue;
      const d = this.position.distanceTo(item.position);
      if (d < item.radius && d < minDistance) {
        nearest = item;
        minDistance = d;
      }
    }

    if (nearest !== this.currentHover) {
      this.currentHover = nearest;
      this.callbacks.onHoverInteractable(nearest);
    }
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);

    this.renderer.dispose();
  }
}
