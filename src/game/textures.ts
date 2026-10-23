/**
 * Procedural texture generator for Kolej Blanice Dormitory.
 * Generates high-detail procedural canvas textures:
 * - Linoleum flooring with institutional wear and seams
 * - Concrete panel wall texture with conduit and baseboards
 * - Wooden dorm doors with brass plates and room numbers
 * - VŠE student noticeboard with bulletins and memos
 * - Electrical fuse panel
 */

import * as THREE from 'three';

/**
 * Creates institutional dormitory linoleum texture
 */
export function createLinoleumTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base mottled dark teal / greenish-gray linoleum (standard Czech dorm color)
  ctx.fillStyle = '#24332c';
  ctx.fillRect(0, 0, 512, 512);

  // Stippled flecks & marble veins
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    const fleck = Math.random() < 0.08 ? (Math.random() > 0.5 ? 40 : -30) : 0;
    data[i] = Math.min(255, Math.max(0, data[i] + noise + fleck));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + fleck * 1.1));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + fleck * 0.9));
  }
  ctx.putImageData(imgData, 0, 0);

  // 1-meter floor tile grid seams
  ctx.strokeStyle = 'rgba(10, 15, 12, 0.65)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.moveTo(0, 256); ctx.lineTo(512, 256);
  ctx.stroke();

  // Subtle scuff marks
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 2;
  for (let s = 0; s < 8; s++) {
    const sx = Math.random() * 500;
    const sy = Math.random() * 500;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates aged concrete panel dorm wall texture
 */
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Aged institutional off-white / pale beige dorm wall
  ctx.fillStyle = '#c7c2b5';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle plaster grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.9));
  }
  ctx.putImageData(imgData, 0, 0);

  // Panel seam (panelák prefab joints)
  ctx.strokeStyle = 'rgba(70, 65, 55, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(508, 0); ctx.lineTo(508, 512);
  ctx.stroke();

  // Bottom dark baseboard strip (sokl)
  ctx.fillStyle = '#3a332a';
  ctx.fillRect(0, 480, 512, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates wooden dorm room door texture with custom room number plate
 */
export function createDoorTexture(label: string, subLabel: string = ''): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Laminated beech/oak wood grain background
  ctx.fillStyle = '#8f6742';
  ctx.fillRect(0, 0, 512, 1024);

  // Wood grain streaks
  for (let y = 0; y < 1024; y += 4) {
    const darkness = Math.sin(y * 0.05) * 20 + (Math.random() - 0.5) * 15;
    ctx.fillStyle = `rgba(60, 38, 18, ${Math.abs(darkness) / 100})`;
    ctx.fillRect(0, y, 512, 3);
  }

  // Door edge bevel frame
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 498, 1010);

  // Inner recessed panels
  ctx.strokeStyle = 'rgba(30, 15, 5, 0.5)';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 40, 452, 420);
  ctx.strokeRect(30, 500, 452, 470);

  // Door number plate (Czech dorm white-on-black or brass plaque)
  ctx.fillStyle = '#1c1b18';
  ctx.fillRect(146, 120, 220, 90);
  ctx.strokeStyle = '#c9a84d'; // Brass rim
  ctx.lineWidth = 4;
  ctx.strokeRect(146, 120, 220, 90);

  // Number text
  ctx.fillStyle = '#f4eedb';
  ctx.font = 'bold 38px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 155);

  if (subLabel) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#a89d84';
    ctx.fillText(subLabel, 256, 188);
  }

  // Brass door handle & escutcheon plate
  ctx.fillStyle = '#a6823b';
  ctx.fillRect(40, 540, 36, 130);
  ctx.strokeStyle = '#5c4516';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 540, 36, 130);

  // Handle lever
  ctx.fillStyle = '#c49e4d';
  ctx.fillRect(50, 580, 75, 18);

  // Keyhole
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(58, 630, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(55, 630, 6, 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates authentic VŠE student noticeboard texture
 */
export function createNoticeboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Cork board background
  ctx.fillStyle = '#a37c52';
  ctx.fillRect(0, 0, 1024, 512);

  // Cork grain
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 3 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? '#7a5a36' : '#bfa075';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aluminum frame
  ctx.strokeStyle = '#636566';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 1008, 496);

  // Notice 1: Official VŠE Exam Notice (Zkouškové období)
  ctx.fillStyle = '#f8f7f0';
  ctx.fillRect(40, 40, 280, 380);
  ctx.fillStyle = '#0f3260'; // VŠE Blue
  ctx.fillRect(40, 40, 280, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Vysoká škola ekonomická', 55, 72);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Harmonogram Zkoušek', 60, 120);
  ctx.font = '13px sans-serif';
  ctx.fillText('Zkouškové období: 2.1. - 7.2.', 60, 145);
  ctx.fillText('Přihlašování přes InSIS.', 60, 170);
  ctx.fillText('Mikroekonomie I (1EK211):', 60, 205);
  ctx.fillStyle = '#b32212';
  ctx.fillText('DŮLEŽITÉ UPOZORNĚNÍ:', 60, 235);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText('Studenti bez platné ISIC karty', 60, 260);
  ctx.fillText('nebudou připuštěni k zápočtu!', 60, 280);
  ctx.fillText('Kód k místnosti studovny:', 60, 320);
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#0f3260';
  ctx.fillText('KÓD = 5214 (MR=MC)', 60, 345);

  // Pushpins
  drawPin(ctx, 50, 48, '#e63946');

  // Notice 2: Lost & Found: Lost ISIC Card
  ctx.fillStyle = '#fff9c4'; // Yellow post-it
  ctx.fillRect(360, 60, 260, 240);
  drawPin(ctx, 490, 68, '#457b9d');
  ctx.fillStyle = '#111';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('ZTRÁTY A NÁLEZY!', 380, 100);
  ctx.font = '14px sans-serif';
  ctx.fillText('Ztratila se mi ISIC karta VŠE.', 380, 135);
  ctx.fillText('Pravděpodobně jsem ji nechal', 380, 160);
  ctx.fillText('v prádelně nebo u sporáku', 380, 185);
  ctx.fillText('ve společné kuchyňce.', 380, 210);
  ctx.font = 'italic 13px sans-serif';
  ctx.fillText('Kdo najde, ať nechá v buňce 314!', 380, 245);

  // Notice 3: Dormitory rules Kolej Blanice
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(660, 50, 310, 400);
  drawPin(ctx, 675, 60, '#2a9d8f');
  ctx.fillStyle = '#111';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('KOLEJ BLANICE · ŘÁD', 680, 85);
  ctx.font = '13px sans-serif';
  ctx.fillText('1. Noční klid platí od 22:00.', 680, 120);
  ctx.fillText('2. Zákaz vstupu do rozvodny.', 680, 150);
  ctx.fillText('3. V případě výpadku proudu:', 680, 180);
  ctx.font = 'italic 12px sans-serif';
  ctx.fillText('   Nahraďte 380V hlavní pojistku', 690, 205);
  ctx.fillText('   v elektrické skříni u únikového', 690, 225);
  ctx.fillText('   východu. Pojistka je uzamčena', 690, 245);
  ctx.fillText('   v trezoru ve studovně.', 690, 265);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#b32212';
  ctx.fillText('POZOR: Zkoušející kontroluje chodby!', 680, 310);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Creates emergency exit sign texture ("ÚNIKOVÝ VÝCHOD")
 */
export function createExitSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#008744'; // ISO Safety Green
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 236);

  // Running person pictogram silhouette
  ctx.fillStyle = '#ffffff';
  // Head
  ctx.beginPath();
  ctx.arc(110, 80, 18, 0, Math.PI * 2);
  ctx.fill();
  // Body & legs
  ctx.fillRect(100, 105, 18, 55);
  ctx.beginPath();
  ctx.moveTo(105, 150); ctx.lineTo(75, 200); ctx.lineTo(95, 205); ctx.lineTo(115, 160); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(115, 150); ctx.lineTo(145, 195); ctx.lineTo(130, 202); ctx.lineTo(105, 160); ctx.fill();
  // Door frame icon
  ctx.strokeRect(170, 50, 40, 150);

  // Arrow & Text
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ÚNIKOVÝ', 230, 110);
  ctx.fillText('VÝCHOD', 230, 160);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates outside concrete plaza pavers texture
 */
export function createOutsidePaverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 512, 512);

  // Concrete noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Paver grid
  ctx.strokeStyle = '#0e1012';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates entrance glass doors texture with yellow warning safety stripe
 */
export function createGlassDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Semi-transparent tinted glass
  ctx.fillStyle = 'rgba(20, 35, 45, 0.4)';
  ctx.fillRect(0, 0, 512, 1024);

  // Aluminum frame
  ctx.strokeStyle = '#718093';
  ctx.lineWidth = 20;
  ctx.strokeRect(10, 10, 492, 1004);

  // Yellow eye-level safety band (Czech safety standard)
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(20, 480, 472, 40);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AUTOMATICKÉ DVEŘE · VSTUP NA KOLEJ', 256, 507);

  // Handle bar
  ctx.fillStyle = '#dcdde1';
  ctx.fillRect(40, 400, 24, 300);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates swimming pool water texture
 */
export function createPoolWaterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0984e3';
  ctx.fillRect(0, 0, 512, 512);

  // Tile grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }

  // Wave ripple highlights
  ctx.strokeStyle = 'rgba(223, 249, 251, 0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const rx = Math.random() * 450;
    const ry = Math.random() * 450;
    ctx.beginPath();
    ctx.arc(rx, ry, Math.random() * 30 + 10, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates Czech facility sign texture (VRÁTNICE, MENZA, POSILOVNA, BAZÉN)
 */
export function createFacilitySignTexture(title: string, sub: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e272e';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#d2dae2';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 244);

  // White text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 110);

  if (sub) {
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#f5cd79';
    ctx.fillText(sub, 256, 165);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
