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
    setState(p => {
      if (!p.currentPlanet) return p;

      // Gas giants don't have solid surfaces - use atmospheric probe mode
      if (!p.currentPlanet.hasSolidSurface) {
        return {
          ...p,
          mode: 'atmospheric-probe',
          modeTimer: 0,
          landingAltitude: 100000,
          landingVerticalSpeed: 0,
          landingHorizontalSpeed: 0,
          landingThrust: 0,
          nearTarget: null,
        };
      }

      // Terrestrial planets - normal landing
      return {
        ...p,
        mode: 'landing',
        modeTimer: 0,
        landingPhase: 'deorbit',
        landingAltitude: 100000,
        landingVerticalSpeed: 0,
        landingHorizontalSpeed: 0,
        landingThrust: 0,
        landingSuccess: false,
      };
    });
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
    setState(p => {
      // For atmospheric probes, go directly to returning
      if (p.mode === 'atmospheric-probe' || !p.currentPlanet?.hasSolidSurface) {
        return {
          ...p,
          mode: 'returning',
          modeTimer: 0,
          flightProgress: 0,
        };
      }
      // For surface missions, go through takeoff
      return { ...p, mode: 'takeoff', modeTimer: 0 };
    });
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
    case 'orbit': return tickOrbit(n, dt, keys);
    case 'landing': return tickLanding(n, dt, keys, canvas);
    case 'surface': return tickSurface(n, dt, keys, canvas);
    case 'atmospheric-probe': return tickAtmosphericProbe(n, dt, keys, canvas);
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
      s.flightDistance = 0;
      // Set target distance based on planet
      s.flightTargetDistance = s.currentPlanet ? s.currentPlanet.fuelCost * 50 : 1000;
      s.flightShipX = canvas.w / 2;
      s.flightShipY = canvas.h / 2;
      s.flightShipVX = 0;
      s.flightShipVY = 0;
      s.flightShipAngle = 0;
      s.flightThrust = 0;
      // Generate initial asteroids
      s.asteroids = Array.from({ length: 6 }, () => ({
        x: canvas.w + Math.random() * 400,
        y: Math.random() * canvas.h,
        size: 4 + Math.random() * 12,
        vx: -(40 + Math.random() * 60),
        vy: (Math.random() - 0.5) * 30,
      }));
    }    // Lots of exhaust
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
  // Player thrust control
  const thrustPower = 300;
  s.flightThrust = 0;

  if (keys.up) {
    s.flightShipVY -= thrustPower * dt;
    s.flightThrust = 1;
    s.fuel = Math.max(0, s.fuel - dt * 2); // Fuel consumption
  }
  if (keys.down) {
    s.flightShipVY += thrustPower * dt;
    s.flightThrust = 1;
    s.fuel = Math.max(0, s.fuel - dt * 2);
  }
  if (keys.left) {
    s.flightShipVX -= thrustPower * dt;
    s.flightThrust = 1;
    s.fuel = Math.max(0, s.fuel - dt * 2);
  }
  if (keys.right) {
    s.flightShipVX += thrustPower * dt;
    s.flightThrust = 1;
    s.fuel = Math.max(0, s.fuel - dt * 2);
  }

  // Calculate ship angle based on velocity
  if (Math.abs(s.flightShipVX) > 1 || Math.abs(s.flightShipVY) > 1) {
    s.flightShipAngle = Math.atan2(s.flightShipVY, s.flightShipVX) - Math.PI / 2;
  }

  // Light damping (space has no friction, but we add minimal drag for playability)
  s.flightShipVX *= 0.98;
  s.flightShipVY *= 0.98;

  // Update position
  s.flightShipX += s.flightShipVX * dt;
  s.flightShipY += s.flightShipVY * dt;

  // Clamp to screen bounds
  const margin = 50;
  s.flightShipX = Math.max(margin, Math.min(canvas.w - margin, s.flightShipX));
  s.flightShipY = Math.max(margin, Math.min(canvas.h - margin, s.flightShipY));

  // Distance tracking - ship moves forward automatically
  const forwardSpeed = 150; // Base forward speed
  s.flightDistance += forwardSpeed * dt;
  s.flightProgress = Math.min(1, s.flightDistance / s.flightTargetDistance);

  // Move asteroids toward player (simulating forward movement)
  s.asteroids = s.asteroids.map(a => {
    let nx = a.x + a.vx * dt - forwardSpeed * dt * 0.5;
    let ny = a.y + a.vy * dt;
    // Respawn asteroids that go off-screen
    if (nx < -100) {
      nx = canvas.w + 50 + Math.random() * 200;
      ny = Math.random() * canvas.h;
    }
    return { ...a, x: nx, y: ny };
  });

  // Spawn new asteroids periodically
  if (Math.random() < dt * 0.5 && s.asteroids.length < 12) {
    s.asteroids.push({
      x: canvas.w + 50,
      y: Math.random() * canvas.h,
      size: 4 + Math.random() * 12,
      vx: -(40 + Math.random() * 60),
      vy: (Math.random() - 0.5) * 30,
    });
  }

  // Check asteroid collision
  for (const a of s.asteroids) {
    const dist = Math.hypot(a.x - s.flightShipX, a.y - s.flightShipY);
    if (dist < a.size + 15) {
      s.hull = Math.max(0, s.hull - dt * 15);
      // Spark particles
      for (let i = 0; i < 3; i++) {
        s.particles.push(makeParticle(
          s.flightShipX, s.flightShipY,
          (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150,
          0.4, 2.5, '#ffaa00', 'spark'
        ));
      }
      // Bounce off asteroid
      const angle = Math.atan2(s.flightShipY - a.y, s.flightShipX - a.x);
      s.flightShipVX += Math.cos(angle) * 100;
      s.flightShipVY += Math.sin(angle) * 100;
    }
  }

  // Exhaust particles
  if (s.flightThrust > 0 && Math.random() > 0.3) {
    const exhaustAngle = s.flightShipAngle + Math.PI;
    s.particles.push(makeParticle(
      s.flightShipX + Math.cos(exhaustAngle) * 15,
      s.flightShipY + Math.sin(exhaustAngle) * 15,
      Math.cos(exhaustAngle) * 80 + (Math.random() - 0.5) * 30,
      Math.sin(exhaustAngle) * 80 + (Math.random() - 0.5) * 30,
      0.3 + Math.random() * 0.3, 2 + Math.random() * 2,
      `hsl(${200 + Math.random() * 40}, 80%, ${60 + Math.random() * 30}%)`,
      'exhaust'
    ));
  }

  // Check if flight complete
  if (s.flightProgress >= 1) {
    s.mode = 'approach';
    s.modeTimer = 0;
    s.approachDistance = 500000;
    s.approachSpeed = 80000;
  }

  // Check if out of fuel or hull destroyed
  if (s.fuel <= 0 || s.hull <= 0) {
    s.message = s.fuel <= 0 ? 'OUT OF FUEL - Mission failed' : 'HULL BREACHED - Mission failed';
    s.messageTimer = 3;
    s.messageType = 'warning';
    // Return to solar system
    s.mode = 'returning';
    s.modeTimer = 0;
    s.flightProgress = 0;
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
    s.orbitTargetRadius = s.orbitRadius;
    s.orbitSpeed = 0.6;
    s.orbitStability = 100;
  }
  return s;
}

function tickOrbit(s: GameState, dt: number, keys: Keys): GameState {
  // Player controls orbital maneuvers
  const orbitAdjustSpeed = 50;

  // W/S to adjust orbital radius (altitude)
  if (keys.up) {
    s.orbitTargetRadius = Math.min(300, s.orbitTargetRadius + orbitAdjustSpeed * dt);
    s.fuel = Math.max(0, s.fuel - dt * 1);
  }
  if (keys.down) {
    s.orbitTargetRadius = Math.max(100, s.orbitTargetRadius - orbitAdjustSpeed * dt);
    s.fuel = Math.max(0, s.fuel - dt * 1);
  }

  // A/D to adjust orbital speed
  if (keys.left) {
    s.orbitSpeed = Math.max(0.2, s.orbitSpeed - 0.5 * dt);
    s.fuel = Math.max(0, s.fuel - dt * 0.5);
  }
  if (keys.right) {
    s.orbitSpeed = Math.min(1.5, s.orbitSpeed + 0.5 * dt);
    s.fuel = Math.max(0, s.fuel - dt * 0.5);
  }

  // Smooth orbit radius transition
  s.orbitRadius = lerp(s.orbitRadius, s.orbitTargetRadius, dt * 2);

  // Calculate orbit stability based on speed and radius
  const idealSpeed = Math.sqrt(1000 / s.orbitRadius) * 0.5;
  const speedDiff = Math.abs(s.orbitSpeed - idealSpeed);
  s.orbitStability = Math.max(0, 100 - speedDiff * 50);

  // Update orbit angle
  s.orbitAngle += s.orbitSpeed * dt;

  // Warning if stability is low
  if (s.orbitStability < 50 && s.modeTimer % 2 < 0.1) {
    s.message = 'WARNING: Orbit unstable!';
    s.messageTimer = 0.5;
    s.messageType = 'warning';
  }

  return s;
}

function tickLanding(s: GameState, dt: number, keys: Keys, canvas: { w: number; h: number }): GameState {
  // Gravity increases as we get closer to surface
  const gravity = 30 + (10000 - s.landingAltitude) * 0.005;

  // Player thrust control
  s.landingThrust = 0;
  if (keys.up) {
    s.landingThrust = 1;
    s.landingVerticalSpeed -= 80 * dt; // Thrust upward
    s.fuel = Math.max(0, s.fuel - dt * 3);
  }

  // Horizontal correction
  if (keys.left) {
    s.landingHorizontalSpeed -= 40 * dt;
    s.fuel = Math.max(0, s.fuel - dt * 1);
  }
  if (keys.right) {
    s.landingHorizontalSpeed += 40 * dt;
    s.fuel = Math.max(0, s.fuel - dt * 1);
  }

  // Apply gravity
  s.landingVerticalSpeed += gravity * dt;

  // Damping on horizontal speed
  s.landingHorizontalSpeed *= 0.95;

  // Update altitude
  s.landingAltitude -= s.landingVerticalSpeed * dt;

  // Determine landing phase based on altitude
  if (s.landingAltitude > 50000) {
    s.landingPhase = 'deorbit';
    s.landingShake = 0;
  } else if (s.landingAltitude > 10000) {
    s.landingPhase = 'entry';
    s.landingShake = 2;
    // Atmospheric particles
    if (s.currentPlanet?.hasAtmosphere && Math.random() > 0.6) {
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
  } else if (s.landingAltitude > 500) {
    s.landingPhase = 'descent';
    s.landingShake = 1;
  } else if (s.landingAltitude > 10) {
    s.landingPhase = 'final';
    s.landingShake = 0.5;
    // Engine dust
    if (s.landingThrust > 0 && Math.random() > 0.5) {
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
    }
  }

  // Engine particles when thrusting
  if (s.landingThrust > 0 && Math.random() > 0.4) {
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

  // Check landing conditions
  if (s.landingAltitude <= 0) {
    s.landingAltitude = 0;
    const verticalSpeedSafe = Math.abs(s.landingVerticalSpeed) < 30;
    const horizontalSpeedSafe = Math.abs(s.landingHorizontalSpeed) < 20;

    if (verticalSpeedSafe && horizontalSpeedSafe) {
      // Successful landing
      s.landingPhase = 'touchdown';
      s.landingShake = 0;
      s.landingSuccess = true;
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
    } else {
      // Crash landing
      s.landingPhase = 'crashed';
      s.landingShake = 5;
      s.hull = Math.max(0, s.hull - 30);
      s.message = 'LANDING FAILED - Too fast!';
      s.messageTimer = 3;
      s.messageType = 'warning';

      // Explosion particles
      for (let i = 0; i < 20; i++) {
        s.particles.push(makeParticle(
          canvas.w / 2 + (Math.random() - 0.5) * 50,
          canvas.h * 0.5 + (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          0.5 + Math.random() * 0.5,
          3 + Math.random() * 4,
          `hsl(${Math.random() * 60}, 100%, ${50 + Math.random() * 30}%)`,
          'spark'
        ));
      }

      // Return to orbit to try again
      setTimeout(() => {
        s.mode = 'orbit';
        s.modeTimer = 0;
        s.landingAltitude = 100000;
        s.landingVerticalSpeed = 0;
        s.landingHorizontalSpeed = 0;
      }, 2000);
    }
  }

  // Out of fuel check
  if (s.fuel <= 0 && s.landingAltitude > 0) {
    s.message = 'OUT OF FUEL - Landing failed!';
    s.messageTimer = 3;
    s.messageType = 'warning';
    s.mode = 'orbit';
    s.modeTimer = 0;
    s.landingAltitude = 100000;
    s.landingVerticalSpeed = 0;
    s.landingHorizontalSpeed = 0;
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

function tickAtmosphericProbe(s: GameState, dt: number, keys: Keys, canvas: { w: number; h: number }): GameState {
  // Atmospheric probe mission - player controls a probe descending through atmosphere
  // Similar to landing but with mission objectives

  const gravity = 20;
  const thrustPower = 60;

  // Player thrust control
  s.landingThrust = 0;
  if (keys.up) {
    s.landingThrust = 1;
    s.landingVerticalSpeed -= thrustPower * dt;
    s.fuel = Math.max(0, s.fuel - dt * 2);
  }
  if (keys.down) {
    s.landingVerticalSpeed += thrustPower * 0.5 * dt;
  }
  if (keys.left) {
    s.landingHorizontalSpeed -= 30 * dt;
    s.fuel = Math.max(0, s.fuel - dt * 1);
  }
  if (keys.right) {
    s.landingHorizontalSpeed += 30 * dt;
    s.fuel = Math.max(0, s.fuel - dt * 1);
  }

  // Apply gravity
  s.landingVerticalSpeed += gravity * dt;
  s.landingHorizontalSpeed *= 0.95;

  // Update altitude
  s.landingAltitude -= s.landingVerticalSpeed * dt;

  // Atmospheric particles
  if (Math.random() > 0.5) {
    s.particles.push(makeParticle(
      canvas.w / 2 + (Math.random() - 0.5) * canvas.w,
      -10,
      (Math.random() - 0.5) * 50 + s.landingHorizontalSpeed,
      150 + Math.random() * 200,
      0.6 + Math.random() * 0.4,
      2 + Math.random() * 3,
      s.currentPlanet?.atmosphereColor.replace(/[\d.]+\)$/, '0.4)') || 'rgba(100,100,100,0.4)',
      'atmosphere'
    ));
  }

  // Engine particles
  if (s.landingThrust > 0 && Math.random() > 0.4) {
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

  // Check scan targets (atmospheric data points)
  s.nearTarget = null;
  for (const t of s.scanTargets) {
    if (!t.scanned) {
      // For atmospheric probes, targets are at specific altitudes
      const targetAltitude = 80000 - t.id * 25000; // Different altitudes
      if (Math.abs(s.landingAltitude - targetAltitude) < 2000 && Math.abs(s.landingHorizontalSpeed) < 30) {
        s.nearTarget = t;
        break;
      }
    }
  }

  // Space key to scan
  if (keys.space && s.nearTarget && !s.nearTarget.scanned) {
    keys.space = false;
    s.scanTargets = s.scanTargets.map(t =>
      t.id === s.nearTarget!.id ? { ...t, scanned: true } : t
    );
    s.missionProgress++;
    s.researchPoints += 100;
    s.message = `+100 RP — ${s.nearTarget.label} collected!`;
    s.messageTimer = 2;
    s.messageType = 'info';
    s.nearTarget = null;

    if (s.missionProgress >= s.missionTarget) {
      s.mode = 'mission-complete';
      s.message = 'ATMOSPHERIC SURVEY COMPLETE!';
      s.messageTimer = 3;
      s.messageType = 'success';
    }
  }

  // Check if probe reached too deep (crash)
  if (s.landingAltitude <= 0) {
    s.message = 'PROBE LOST - Descended too deep!';
    s.messageTimer = 3;
    s.messageType = 'warning';
    s.hull = Math.max(0, s.hull - 20);

    // Return to orbit
    setTimeout(() => {
      s.mode = 'orbit';
      s.modeTimer = 0;
      s.landingAltitude = 100000;
      s.landingVerticalSpeed = 0;
      s.landingHorizontalSpeed = 0;
    }, 2000);
  }

  // Out of fuel
  if (s.fuel <= 0) {
    s.message = 'OUT OF FUEL - Probe failed!';
    s.messageTimer = 3;
    s.messageType = 'warning';
    s.mode = 'orbit';
    s.modeTimer = 0;
    s.landingAltitude = 100000;
    s.landingVerticalSpeed = 0;
    s.landingHorizontalSpeed = 0;
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
