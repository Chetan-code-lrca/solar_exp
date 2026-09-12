import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameState,
  GameMode,
  Planet,
  ScanTarget,
  Particle,
  PLANETS,
  createInitialState,
} from './types';

interface Keys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

// Seeded random for terrain
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateScanTargets(planet: Planet, worldW: number, worldH: number, seed: number): ScanTarget[] {
  const rng = seededRandom(seed);
  const targets: ScanTarget[] = [];
  const labels = planet.missionType === 'atmosphere'
    ? ['Data Point Alpha', 'Data Point Beta', 'Data Point Gamma']
    : planet.missionType === 'rings'
    ? ['Ring Sector A', 'Ring Sector B', 'Ring Sector C']
    : ['Sample Site Alpha', 'Sample Site Beta', 'Sample Site Gamma'];

  const types: ('sample' | 'formation' | 'reading' | 'probe')[] =
    planet.missionType === 'atmosphere' ? ['reading', 'reading', 'reading']
    : planet.missionType === 'rings' ? ['sample', 'sample', 'sample']
    : ['sample', 'formation', 'sample'];

  const cx = worldW / 2;
  const cy = worldH / 2;

  for (let i = 0; i < 3; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      const angle = rng() * Math.PI * 2;
      const dist = 300 + rng() * 600;
      x = cx + Math.cos(angle) * dist;
      y = cy + Math.sin(angle) * dist;
      attempts++;
    } while (
      attempts < 50 &&
      (x < 100 || x > worldW - 100 || y < 100 || y > worldH - 100 ||
       targets.some(t => Math.hypot(t.x - x, t.y - y) < 350))
    );
    targets.push({ id: i, x, y, scanned: false, label: labels[i], type: types[i] });
  }
  return targets;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function useGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const keysRef = useRef<Keys>({ up: false, down: false, left: false, right: false, space: false });
  const lastTimeRef = useRef(0);
  const rafRef = useRef(0);
  const canvasRef = useRef<{ w: number; h: number }>({ w: 800, h: 600 });

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': k.up = true; e.preventDefault(); break;
        case 's': case 'arrowdown': k.down = true; e.preventDefault(); break;
        case 'a': case 'arrowleft': k.left = true; e.preventDefault(); break;
        case 'd': case 'arrowright': k.right = true; e.preventDefault(); break;
        case ' ': k.space = true; e.preventDefault(); break;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': k.up = false; break;
        case 's': case 'arrowdown': k.down = false; break;
        case 'a': case 'arrowleft': k.left = false; break;
        case 'd': case 'arrowright': k.right = false; break;
        case ' ': k.space = false; break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Game loop
  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = ts;
      setState(prev => tick(prev, dt, keysRef.current, canvasRef.current));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setCanvasSize = useCallback((w: number, h: number) => {
    canvasRef.current = { w, h };
  }, []);

  // Actions
  const beginExpedition = useCallback(() => {
    setState(p => ({ ...p, mode: 'solar-system', modeTimer: 0 }));
  }, []);

  const selectPlanet = useCallback((idx: number) => {
    setState(p => ({ ...p, selectedPlanetIndex: idx }));
  }, []);

  const openBriefing = useCallback(() => {
    setState(p => {
      if (p.selectedPlanetIndex === null) return p;
      return { ...p, mode: 'briefing', modeTimer: 0 };
    });
  }, []);

  const cancelBriefing = useCallback(() => {
    setState(p => ({ ...p, mode: 'solar-system', modeTimer: 0 }));
  }, []);

  const launchMission = useCallback(() => {
    setState(p => {
      if (p.selectedPlanetIndex === null) return p;
      const planet = PLANETS[p.selectedPlanetIndex];
      if (p.fuel < planet.fuelCost) return p;
      const seed = Math.random() * 10000;
      return {
        ...p,
        mode: 'launch' as GameMode,
        modeTimer: 0,
        currentPlanet: planet,
        launchCountdown: 3,
        launchPhase: 'countdown' as const,
        fuel: p.fuel - planet.fuelCost,
        missionProgress: 0,
        missionTarget: 3,
        scanTargets: generateScanTargets(planet, p.worldWidth, p.worldHeight, seed),
        terrainSeed: seed,
        landingPhase: 'deorbit' as const,
        landingAltitude: 100000,
      };
    });
  }, []);

  const beginLanding = useCallback(() => {
    setState(p => ({ ...p, mode: 'landing', modeTimer: 0, landingPhase: 'deorbit', landingAltitude: 100000 }));
  }, []);

  const continueOrbit = useCallback(() => {
    setState(p => ({ ...p, modeTimer: 0 })); // reset timer, stay in orbit
  }, []);

  const beginSurface = useCallback(() => {
    setState(p => ({
      ...p,
      mode: 'surface',
      modeTimer: 0,
      playerX: p.landerX,
      playerY: p.landerY + 80,
      playerVX: 0,
      playerVY: 0,
      playerAngle: -Math.PI / 2,
    }));
  }, []);

  const boardShip = useCallback(() => {
    setState(p => ({ ...p, mode: 'takeoff', modeTimer: 0 }));
  }, []);

  const scanTarget = useCallback(() => {
    setState(p => {
      if (!p.nearTarget || p.nearTarget.scanned) return p;
      const newTargets = p.scanTargets.map(t =>
        t.id === p.nearTarget!.id ? { ...t, scanned: true } : t
      );
      const newProgress = p.missionProgress + 1;
      const complete = newProgress >= p.missionTarget;
      return {
        ...p,
        scanTargets: newTargets,
        missionProgress: newProgress,
        nearTarget: null,
        message: complete
          ? `MISSION COMPLETE — Return to lander!`
          : `+100 RP — ${p.nearTarget.label} scanned!`,
        messageTimer: 3,
        messageType: complete ? 'success' : 'info',
        researchPoints: p.researchPoints + 100,
        mode: complete ? 'mission-complete' : 'surface',
      };
    });
  }, []);

  const returnFromComplete = useCallback(() => {
    setState(p => ({ ...p, mode: 'surface', modeTimer: 0, message: 'Return to the lander to take off.', messageTimer: 3, messageType: 'info' as const }));
  }, []);

  const finishReturn = useCallback(() => {
    setState(p => {
      const cp = p.currentPlanet;
      const newVisited = cp && !p.visitedPlanets.includes(cp.name) ? [...p.visitedPlanets, cp.name] : p.visitedPlanets;
      const newCompleted = cp && p.missionProgress >= p.missionTarget && !p.completedMissions.includes(cp.name)
        ? [...p.completedMissions, cp.name] : p.completedMissions;
      const bonus = cp && p.missionProgress >= p.missionTarget ? 300 : 0;
      return {
        ...p,
        mode: 'solar-system',
        modeTimer: 0,
        currentPlanet: null,
        selectedPlanetIndex: null,
        visitedPlanets: newVisited,
        completedMissions: newCompleted,
        researchPoints: p.researchPoints + bonus,
        shipSolarX: 0,
        shipSolarY: 145,
      };
    });
  }, []);

  const setMobileKey = useCallback((key: keyof Keys, val: boolean) => {
    keysRef.current[key] = val;
  }, []);

  return {
    state,
    stateRef,
    canvasRef,
    setCanvasSize,
    keysRef,
    beginExpedition,
    selectPlanet,
    openBriefing,
    cancelBriefing,
    launchMission,
    beginLanding,
    continueOrbit,
    beginSurface,
    boardShip,
    scanTarget,
    returnFromComplete,
    finishReturn,
    setMobileKey,
  };
}

// ============================================================
// GAME TICK
// ============================================================

function tick(s: GameState, dt: number, keys: Keys, canvas: { w: number; h: number }): GameState {
  const n = { ...s };
  n.modeTimer += dt;

  // Message timer
  if (n.messageTimer > 0) {
    n.messageTimer -= dt;
    if (n.messageTimer <= 0) { n.message = ''; n.messageTimer = 0; }
  }

  // Particles
  n.particles = n.particles
    .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt, vy: p.vy + (p.type === 'dust' ? 20 : 0) * dt }))
    .filter(p => p.life > 0)
    .slice(-150);

  // Planet angles always update in solar system
  if (n.mode === 'solar-system') {
    n.planetAngles = n.planetAngles.map((a, i) => a + (0.2 / (i + 1)) * dt);
  }

  // Camera smoothing
  n.cameraX = lerp(n.cameraX, n.targetCameraX, dt * 3);
  n.cameraY = lerp(n.cameraY, n.targetCameraY, dt * 3);
  n.cameraZoom = lerp(n.cameraZoom, n.targetCameraZoom, dt * 3);

  switch (n.mode) {
    case 'menu': return tickMenu(n, dt);
    case 'solar-system': return tickSolarSystem(n, dt, keys);
    case 'briefing': return n;
    case 'launch': return tickLaunch(n, dt, canvas);
    case 'space-flight': return tickSpaceFlight(n, dt, keys, canvas);
    case 'approach': return tickApproach(n, dt, canvas);
    case 'orbit': return tickOrbit(n, dt);
    case 'landing': return tickLanding(n, dt, canvas);
    case 'surface': return tickSurface(n, dt, keys, canvas);
    case 'mission-complete': return n;
    case 'takeoff': return tickTakeoff(n, dt, canvas);
    case 'returning': return tickReturning(n, dt);
    default: return n;
  }
}

function tickMenu(s: GameState, _dt: number): GameState { return s; }

function tickSolarSystem(s: GameState, _dt: number, _keys: Keys): GameState {
  // Ship idles near Earth
  const earthAngle = s.planetAngles[2];
  s.shipSolarX = Math.cos(earthAngle) * PLANETS[2].orbitRadius;
  s.shipSolarY = Math.sin(earthAngle) * PLANETS[2].orbitRadius;
  s.shipSolarAngle = earthAngle + Math.PI / 2;
  return s;
}

function tickLaunch(s: GameState, dt: number, canvas: { w: number; h: number }): GameState {
  if (s.launchPhase === 'countdown') {
    s.launchCountdown -= dt;
    if (s.launchCountdown <= 0) {
      s.launchPhase = 'ignition';
      s.modeTimer = 0;
    }
  } else if (s.launchPhase === 'ignition') {
    // Engine buildup for 1.5s
    if (s.modeTimer > 1.5) {
      s.launchPhase = 'liftoff';
      s.modeTimer = 0;
    }
    // Engine particles
    for (let i = 0; i < 3; i++) {
      s.particles.push(makeParticle(
        canvas.w / 2 + (Math.random() - 0.5) * 10,
        canvas.h * 0.55 + 20,
        (Math.random() - 0.5) * 40,
        60 + Math.random() * 80,
        0.4 + Math.random() * 0.3,
        2 + Math.random() * 3,
        `hsl(${20 + Math.random() * 30}, 100%, ${50 + Math.random() * 40}%)`,
        'exhaust'
      ));
    }
  } else if (s.launchPhase === 'liftoff') {
    // Ship rises for 2s then transition
    if (s.modeTimer > 2) {
      s.mode = 'space-flight';
      s.modeTimer = 0;
      s.flightProgress = 0;
      s.flightShipX = canvas.w / 2;
      s.flightShipY = canvas.h / 2;
      s.flightShipVX = 0;
      s.flightShipVY = 0;
      // Generate asteroids
      s.asteroids = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.w * 2 - canvas.w * 0.5,
        y: Math.random() * canvas.h,
        size: 4 + Math.random() * 12,
        vx: -(20 + Math.random() * 40),
        vy: (Math.random() - 0.5) * 20,
      }));
    }
    // Lots of exhaust
    for (let i = 0; i < 4; i++) {
      s.particles.push(makeParticle(
        canvas.w / 2 + (Math.random() - 0.5) * 14,
        canvas.h * 0.55 + 20 + s.modeTimer * 50,
        (Math.random() - 0.5) * 60,
        80 + Math.random() * 120,
        0.3 + Math.random() * 0.4,
        2 + Math.random() * 4,
        `hsl(${15 + Math.random() * 35}, 100%, ${50 + Math.random() * 40}%)`,
        'exhaust'
      ));
    }
  }
  return s;
}

function tickSpaceFlight(s: GameState, dt: number, keys: Keys, canvas: { w: number; h: number }): GameState {
  const duration = 6;
  s.flightProgress = Math.min(1, s.modeTimer / duration);

  // Player control
  const accel = 200;
  if (keys.left) s.flightShipVX -= accel * dt;
  if (keys.right) s.flightShipVX += accel * dt;
  if (keys.up) s.flightShipVY -= accel * dt;
  if (keys.down) s.flightShipVY += accel * dt;

  // Damping
  s.flightShipVX *= 0.95;
  s.flightShipVY *= 0.95;

  // Clamp to center area
  const maxOffset = 100;
  s.flightShipX = Math.max(canvas.w / 2 - maxOffset, Math.min(canvas.w / 2 + maxOffset, s.flightShipX + s.flightShipVX * dt));
  s.flightShipY = Math.max(canvas.h / 2 - maxOffset, Math.min(canvas.h / 2 + maxOffset, s.flightShipY + s.flightShipVY * dt));

  // Move asteroids
  s.asteroids = s.asteroids.map(a => {
    let nx = a.x + a.vx * dt * (1 + s.flightProgress * 3);
    let ny = a.y + a.vy * dt;
    if (nx < -50) { nx = canvas.w + 50; ny = Math.random() * canvas.h; }
    return { ...a, x: nx, y: ny };
  });

  // Check asteroid collision
  for (const a of s.asteroids) {
    const dist = Math.hypot(a.x - s.flightShipX, a.y - s.flightShipY);
    if (dist < a.size + 15) {
      s.hull = Math.max(0, s.hull - dt * 10);
      // Spark particles
      for (let i = 0; i < 2; i++) {
        s.particles.push(makeParticle(
          s.flightShipX, s.flightShipY,
          (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100,
          0.3, 2, '#ffaa00', 'spark'
        ));
      }
    }
  }

  // Exhaust
  if (Math.random() > 0.3) {
    s.particles.push(makeParticle(
      s.flightShipX, s.flightShipY + 18,
      (Math.random() - 0.5) * 20, 40 + Math.random() * 60,
      0.3 + Math.random() * 0.3, 2 + Math.random() * 2,
      `hsl(${200 + Math.random() * 40}, 80%, ${60 + Math.random() * 30}%)`,
      'exhaust'
    ));
  }

  if (s.flightProgress >= 1) {
    s.mode = 'approach';
    s.modeTimer = 0;
    s.approachDistance = 500000;
    s.approachSpeed = 80000;
  }
  return s;
}

function tickApproach(s: GameState, dt: number, canvas: { w: number; h: number }): GameState {
  const duration = 3;
  const t = Math.min(1, s.modeTimer / duration);
  s.approachDistance = 500000 * (1 - easeInOut(t));

  if (t >= 1) {
    s.mode = 'orbit';
    s.modeTimer = 0;
    s.orbitAngle = 0;
    s.orbitRadius = Math.min(canvas.w, canvas.h) * 0.32;
  }
  return s;
}

function tickOrbit(s: GameState, dt: number): GameState {
  s.orbitAngle += s.orbitSpeed * dt;
  return s;
}

function tickLanding(s: GameState, dt: number, canvas: { w: number; h: number }): GameState {
  const totalDuration = 5;
  const t = Math.min(1, s.modeTimer / totalDuration);

  // Phase transitions
  if (t < 0.15) {
    s.landingPhase = 'deorbit';
    s.landingAltitude = lerp(100000, 50000, t / 0.15);
  } else if (t < 0.4) {
    s.landingPhase = 'entry';
    s.landingAltitude = lerp(50000, 10000, (t - 0.15) / 0.25);
    s.landingShake = 3;
    // Atmospheric particles
    if (s.currentPlanet?.hasAtmosphere && Math.random() > 0.5) {
      s.particles.push(makeParticle(
        canvas.w / 2 + (Math.random() - 0.5) * canvas.w,
        -10,
        (Math.random() - 0.5) * 30,
        200 + Math.random() * 200,
        0.5 + Math.random() * 0.5,
        1 + Math.random() * 2,
        s.currentPlanet.atmosphereColor.replace(/[\d.]+\)$/, '0.5)'),
        'atmosphere'
      ));
    }
  } else if (t < 0.75) {
    s.landingPhase = 'descent';
    s.landingAltitude = lerp(10000, 500, (t - 0.4) / 0.35);
    s.landingShake = 2 * (1 - (t - 0.4) / 0.35);
  } else if (t < 0.95) {
    s.landingPhase = 'final';
    s.landingAltitude = lerp(500, 10, (t - 0.75) / 0.2);
    s.landingShake = 1 * (1 - (t - 0.75) / 0.2);
    // Engine dust
    for (let i = 0; i < 2; i++) {
      s.particles.push(makeParticle(
        canvas.w / 2 + (Math.random() - 0.5) * 30,
        canvas.h * 0.6 + 15,
        (Math.random() - 0.5) * 60,
        20 + Math.random() * 40,
        0.4 + Math.random() * 0.3,
        2 + Math.random() * 3,
        s.currentPlanet?.groundColors[0] || '#888',
        'dust'
      ));
    }
  } else {
    s.landingPhase = 'touchdown';
    s.landingAltitude = 0;
    s.landingShake = 0;
  }

  // Engine particles during landing
  if (t < 0.95 && Math.random() > 0.4) {
    s.particles.push(makeParticle(
      canvas.w / 2 + (Math.random() - 0.5) * 12,
      canvas.h * 0.45 + 20,
      (Math.random() - 0.5) * 30,
      40 + Math.random() * 60,
      0.3 + Math.random() * 0.3,
      2 + Math.random() * 3,
      `hsl(${20 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`,
      'exhaust'
    ));
  }

  if (t >= 1 && s.landingPhase === 'touchdown' && s.modeTimer > totalDuration + 0.5) {
    // Auto transition to surface
    s.mode = 'surface';
    s.modeTimer = 0;
    s.playerX = s.landerX;
    s.playerY = s.landerY + 80;
    s.playerVX = 0;
    s.playerVY = 0;
    s.playerAngle = -Math.PI / 2;
    s.message = `LANDED ON ${s.currentPlanet?.name.toUpperCase()}`;
    s.messageTimer = 2.5;
    s.messageType = 'success';
  }

  return s;
}

function tickSurface(s: GameState, dt: number, keys: Keys, _canvas: { w: number; h: number }): GameState {
  const speed = 180;
  const friction = 0.88;
  let ax = 0, ay = 0;

  if (keys.left) ax -= 1;
  if (keys.right) ax += 1;
  if (keys.up) ay -= 1;
  if (keys.down) ay += 1;

  if (ax !== 0 || ay !== 0) {
    const len = Math.hypot(ax, ay);
    ax /= len;
    ay /= len;
    s.playerVX += ax * speed * dt * 5;
    s.playerVY += ay * speed * dt * 5;
    s.playerAngle = Math.atan2(ay, ax);
    s.playerMoving = true;
  } else {
    s.playerMoving = false;
  }

  s.playerVX *= friction;
  s.playerVY *= friction;

  const maxSpeed = speed;
  const spd = Math.hypot(s.playerVX, s.playerVY);
  if (spd > maxSpeed) {
    s.playerVX = (s.playerVX / spd) * maxSpeed;
    s.playerVY = (s.playerVY / spd) * maxSpeed;
  }

  s.playerX += s.playerVX * dt;
  s.playerY += s.playerVY * dt;

  // Clamp
  s.playerX = Math.max(50, Math.min(s.worldWidth - 50, s.playerX));
  s.playerY = Math.max(50, Math.min(s.worldHeight - 50, s.playerY));

  // Camera follows player with smoothing
  const targetCamX = s.playerX - _canvas.w / 2;
  const targetCamY = s.playerY - _canvas.h / 2;
  s.surfaceCameraX = lerp(s.surfaceCameraX, targetCamX, dt * 4);
  s.surfaceCameraY = lerp(s.surfaceCameraY, targetCamY, dt * 4);

  // Check proximity to scan targets
  s.nearTarget = null;
  for (const t of s.scanTargets) {
    if (!t.scanned && Math.hypot(s.playerX - t.x, s.playerY - t.y) < 60) {
      s.nearTarget = t;
      break;
    }
  }

  // Check proximity to lander
  s.nearLander = Math.hypot(s.playerX - s.landerX, s.playerY - s.landerY) < 70;

  // Space key for scanning or boarding
  if (keys.space) {
    keys.space = false;
    if (s.nearTarget && !s.nearTarget.scanned) {
      // Will be handled by scanTarget action
    } else if (s.nearLander && s.mode === 'mission-complete') {
      // Board ship handled by boardShip action
    }
  }

  // Dust particles when moving on solid surface
  if (s.playerMoving && s.currentPlanet?.hasSolidSurface && Math.random() > 0.5) {
    s.particles.push(makeParticle(
      s.playerX + (Math.random() - 0.5) * 15,
      s.playerY + 10,
      -s.playerVX * 0.2 + (Math.random() - 0.5) * 20,
      -s.playerVY * 0.2 + (Math.random() - 0.5) * 10,
      0.3 + Math.random() * 0.3,
      1.5 + Math.random() * 2,
      s.currentPlanet.groundColors[0] + '80',
      'dust'
    ));
  }

  return s;
}

function tickTakeoff(s: GameState, dt: number, canvas: { w: number; h: number }): GameState {
  // 3 second takeoff animation
  if (s.modeTimer > 3) {
    s.mode = 'returning';
    s.modeTimer = 0;
    s.flightProgress = 0;
  }

  // Engine particles
  for (let i = 0; i < 3; i++) {
    s.particles.push(makeParticle(
      canvas.w / 2 + (Math.random() - 0.5) * 14,
      canvas.h * 0.5 + s.modeTimer * 30,
      (Math.random() - 0.5) * 50,
      60 + Math.random() * 100,
      0.3 + Math.random() * 0.4,
      2 + Math.random() * 3,
      `hsl(${15 + Math.random() * 30}, 100%, ${50 + Math.random() * 40}%)`,
      'exhaust'
    ));
  }

  // Dust cloud at start
  if (s.modeTimer < 1 && Math.random() > 0.3) {
    for (let i = 0; i < 2; i++) {
      s.particles.push(makeParticle(
        canvas.w / 2 + (Math.random() - 0.5) * 80,
        canvas.h * 0.7,
        (Math.random() - 0.5) * 80,
        -(10 + Math.random() * 30),
        0.5 + Math.random() * 0.5,
        3 + Math.random() * 4,
        s.currentPlanet?.groundColors[0] + '60',
        'dust'
      ));
    }
  }

  return s;
}

function tickReturning(s: GameState, dt: number): GameState {
  const duration = 4;
  s.flightProgress = Math.min(1, s.modeTimer / duration);

  if (s.flightProgress >= 1) {
    // Complete the mission
    const cp = s.currentPlanet;
    let newVisited = s.visitedPlanets;
    let newCompleted = s.completedMissions;
    let rp = s.researchPoints;

    if (cp) {
      if (!newVisited.includes(cp.name)) newVisited = [...newVisited, cp.name];
      if (s.missionProgress >= s.missionTarget && !newCompleted.includes(cp.name)) {
        newCompleted = [...newCompleted, cp.name];
        rp += 300; // Mission completion bonus
      }
    }

    s.mode = 'solar-system';
    s.modeTimer = 0;
    s.currentPlanet = null;
    s.selectedPlanetIndex = null;
    s.visitedPlanets = newVisited;
    s.completedMissions = newCompleted;
    s.researchPoints = rp;
    s.shipSolarX = 0;
    s.shipSolarY = 145;
    s.message = `Expedition complete! +${cp && s.missionProgress >= s.missionTarget ? 300 : 0} bonus RP`;
    s.messageTimer = 3;
    s.messageType = 'success';
  }

  // Exhaust
  if (Math.random() > 0.4) {
    s.particles.push(makeParticle(
      400 + (Math.random() - 0.5) * 10,
      300 + 18,
      (Math.random() - 0.5) * 20,
      40 + Math.random() * 50,
      0.3, 2,
      `hsl(${200 + Math.random() * 40}, 80%, ${60 + Math.random() * 30}%)`,
      'exhaust'
    ));
  }

  return s;
}

// ============================================================
// HELPERS
// ============================================================

function makeParticle(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, type: Particle['type'] = 'exhaust'): Particle {
  return { x, y, vx, vy, life, maxLife: life, size, color, type };
}
