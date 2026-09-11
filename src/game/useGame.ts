import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameState,
  GameMode,
  KeyState,
  Planet,
  ScanLocation,
  Particle,
  planets,
  createInitialState,
} from './types';

// Generate scan locations for a planet surface
function generateScanLocations(planet: Planet, worldW: number, worldH: number): ScanLocation[] {
  const locations: ScanLocation[] = [];
  const labels = planet.missionType === 'atmosphere'
    ? ['Data Point Alpha', 'Data Point Beta', 'Data Point Gamma']
    : planet.missionType === 'rings'
    ? ['Ring Sector A', 'Ring Sector B', 'Ring Sector C']
    : ['Sample Site Alpha', 'Sample Site Beta', 'Sample Site Gamma'];

  for (let i = 0; i < 3; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = 200 + Math.random() * (worldW - 400);
      y = 200 + Math.random() * (worldH - 400);
      attempts++;
    } while (
      attempts < 50 &&
      locations.some(l => Math.hypot(l.x - x, l.y - y) < 300)
    );
    locations.push({ x, y, scanned: false, label: labels[i] });
  }
  return locations;
}

// Generate terrain features for a planet
export interface TerrainFeature {
  x: number;
  y: number;
  type: 'rock' | 'crater' | 'volcano' | 'cloud' | 'tree' | 'ice';
  size: number;
  color: string;
}

export function generateTerrain(planet: Planet, worldW: number, worldH: number): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  const count = planet.hasSolidSurface ? 40 : 30;

  for (let i = 0; i < count; i++) {
    const x = Math.random() * worldW;
    const y = Math.random() * worldH;
    const colorIdx = Math.floor(Math.random() * planet.featureColors.length);

    if (!planet.hasSolidSurface) {
      features.push({
        x, y,
        type: 'cloud',
        size: 30 + Math.random() * 80,
        color: planet.featureColors[colorIdx],
      });
    } else if (planet.name === 'Mercury' || planet.name === 'Mars') {
      features.push({
        x, y,
        type: Math.random() > 0.5 ? 'crater' : 'rock',
        size: 10 + Math.random() * 40,
        color: planet.featureColors[colorIdx],
      });
    } else if (planet.name === 'Venus') {
      features.push({
        x, y,
        type: Math.random() > 0.6 ? 'volcano' : 'rock',
        size: 15 + Math.random() * 35,
        color: planet.featureColors[colorIdx],
      });
    } else if (planet.name === 'Earth') {
      features.push({
        x, y,
        type: Math.random() > 0.5 ? 'tree' : 'rock',
        size: 10 + Math.random() * 25,
        color: planet.featureColors[colorIdx],
      });
    } else {
      features.push({
        x, y,
        type: 'rock',
        size: 10 + Math.random() * 30,
        color: planet.featureColors[colorIdx],
      });
    }
  }
  return features;
}

export function useGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const keysRef = useRef<KeyState>({
    up: false, down: false, left: false, right: false, space: false,
  });
  const terrainRef = useRef<TerrainFeature[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; brightness: number }[]>([]);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const canvasSizeRef = useRef({ w: 800, h: 600 });

  // Generate stars once
  useEffect(() => {
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 4000 - 2000,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.7 + 0.3,
    }));
    starsRef.current = stars;
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': k.up = true; e.preventDefault(); break;
        case 's': case 'arrowdown': k.down = true; e.preventDefault(); break;
        case 'a': case 'arrowleft': k.left = true; e.preventDefault(); break;
        case 'd': case 'arrowright': k.right = true; e.preventDefault(); break;
        case ' ': k.space = true; e.preventDefault(); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = keysRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': k.up = false; break;
        case 's': case 'arrowdown': k.down = false; break;
        case 'a': case 'arrowleft': k.left = false; break;
        case 'd': case 'arrowright': k.right = false; break;
        case ' ': k.space = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      setState(prev => updateGame(prev, dt, keysRef.current, canvasSizeRef.current));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setCanvasSize = useCallback((w: number, h: number) => {
    canvasSizeRef.current = { w, h };
  }, []);

  const beginExpedition = useCallback(() => {
    setState(prev => ({ ...prev, mode: 'solar-system', showIntro: false }));
  }, []);

  const selectPlanet = useCallback((index: number) => {
    setState(prev => ({ ...prev, selectedPlanetIndex: index }));
  }, []);

  const launchMission = useCallback(() => {
    setState(prev => {
      if (prev.selectedPlanetIndex === null) return prev;
      const planet = planets[prev.selectedPlanetIndex];
      const angle = prev.planetAngles[prev.selectedPlanetIndex];
      const targetX = Math.cos(angle) * planet.orbitRadius;
      const targetY = Math.sin(angle) * planet.orbitRadius;

      return {
        ...prev,
        mode: 'launch' as GameMode,
        currentPlanet: planet,
        travelStartX: prev.shipX,
        travelStartY: prev.shipY,
        travelEndX: targetX,
        travelEndY: targetY,
        travelProgress: 0,
        modeTimer: 0,
        missionProgress: 0,
        missionTarget: 3,
        scanLocations: generateScanLocations(planet, prev.surfaceWorldWidth, prev.surfaceWorldHeight),
        fuel: Math.max(0, prev.fuel - (planet.difficulty * 5)),
      };
    });
    terrainRef.current = [];
  }, []);

  const beginLanding = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'landing',
      landingAltitude: 500,
      landingProgress: 0,
      modeTimer: 0,
    }));
  }, []);

  const beginSurface = useCallback(() => {
    setState(prev => {
      const planet = prev.currentPlanet;
      if (!planet) return prev;
      terrainRef.current = generateTerrain(planet, prev.surfaceWorldWidth, prev.surfaceWorldHeight);
      const shipX = prev.surfaceWorldWidth / 2;
      const shipY = prev.surfaceWorldHeight / 2;
      return {
        ...prev,
        mode: 'surface',
        playerX: shipX,
        playerY: shipY + 60,
        playerAngle: 0,
        shipSurfaceX: shipX,
        shipSurfaceY: shipY,
        nearShip: true,
        modeTimer: 0,
      };
    });
  }, []);

  const returnToShip = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'return-orbit',
      modeTimer: 0,
      orbitAngle: 0,
      orbitAltitude: 60,
    }));
  }, []);

  const takeOff = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'return-orbit',
      modeTimer: 0,
      orbitAngle: 0,
      orbitAltitude: 60,
    }));
  }, []);

  const returnToSolarSystem = useCallback(() => {
    setState(prev => {
      const newCompleted = prev.currentPlanet && prev.missionProgress >= prev.missionTarget
        ? [...prev.completedMissions, prev.currentPlanet.name]
        : prev.completedMissions;
      const newVisited = prev.currentPlanet && !prev.visitedPlanets.includes(prev.currentPlanet.name)
        ? [...prev.visitedPlanets, prev.currentPlanet.name]
        : prev.visitedPlanets;
      const points = prev.currentPlanet && prev.missionProgress >= prev.missionTarget
        ? prev.researchPoints + 250
        : prev.researchPoints + 50;

      return {
        ...prev,
        mode: 'solar-system',
        currentPlanet: null,
        selectedPlanetIndex: null,
        completedMissions: newCompleted,
        visitedPlanets: newVisited,
        researchPoints: points,
        modeTimer: 0,
      };
    });
  }, []);

  const showMessage = useCallback((msg: string) => {
    setState(prev => ({ ...prev, message: msg, messageTimer: 3 }));
  }, []);

  return {
    state,
    stateRef,
    terrainRef,
    starsRef,
    canvasSizeRef,
    setCanvasSize,
    beginExpedition,
    selectPlanet,
    launchMission,
    beginLanding,
    beginSurface,
    returnToShip,
    takeOff,
    returnToSolarSystem,
    showMessage,
    keysRef,
  };
}

// ============================================================
// GAME UPDATE LOGIC
// ============================================================

function updateGame(state: GameState, dt: number, keys: KeyState, canvasSize: { w: number; h: number }): GameState {
  const s = { ...state };
  s.modeTimer += dt;
  s.particles = updateParticles(s.particles, dt);

  // Always update planet angles in solar system mode
  if (s.mode === 'solar-system') {
    s.planetAngles = s.planetAngles.map((angle, i) => {
      const speed = 0.3 / (i + 1);
      return angle + speed * dt;
    });
  }

  // Message timer
  if (s.messageTimer > 0) {
    s.messageTimer -= dt;
    if (s.messageTimer <= 0) {
      s.message = '';
      s.messageTimer = 0;
    }
  }

  switch (s.mode) {
    case 'launch':
      return updateLaunch(s, dt);
    case 'travel':
      return updateTravel(s, dt);
    case 'orbit':
      return updateOrbit(s, dt);
    case 'landing':
      return updateLanding(s, dt);
    case 'surface':
      return updateSurface(s, dt, keys, canvasSize);
    case 'return-travel':
      return updateReturnTravel(s, dt);
    case 'return-orbit':
      return updateReturnOrbit(s, dt);
    default:
      return s;
  }
}

function updateLaunch(s: GameState, dt: number): GameState {
  // Launch animation: 2 seconds then travel
  if (s.modeTimer > 2) {
    s.mode = 'travel';
    s.modeTimer = 0;
    s.travelProgress = 0;
  }
  // Add engine particles
  if (Math.random() > 0.3) {
    s.particles = addExhaustParticle(s.particles, s.shipX, s.shipY + 15, s.shipAngle);
  }
  return s;
}

function updateTravel(s: GameState, dt: number): GameState {
  const travelDuration = 4; // seconds
  s.travelProgress = Math.min(1, s.modeTimer / travelDuration);

  // Interpolate ship position
  const t = easeInOutCubic(s.travelProgress);
  s.shipX = s.travelStartX + (s.travelEndX - s.travelStartX) * t;
  s.shipY = s.travelStartY + (s.travelEndY - s.travelStartY) * t;

  // Calculate angle toward destination
  const dx = s.travelEndX - s.shipX;
  const dy = s.travelEndY - s.shipY;
  s.shipAngle = Math.atan2(dy, dx) - Math.PI / 2;

  // Exhaust particles
  if (Math.random() > 0.2) {
    s.particles = addExhaustParticle(s.particles, s.shipX, s.shipY, s.shipAngle);
  }

  // Fuel decreases
  s.fuel = Math.max(0, s.fuel - dt * 2);

  if (s.travelProgress >= 1) {
    s.mode = 'orbit';
    s.modeTimer = 0;
    s.orbitAngle = 0;
    s.orbitAltitude = 120;
  }
  return s;
}

function updateOrbit(s: GameState, dt: number): GameState {
  s.orbitAngle += dt * 0.8;
  s.orbitAltitude = 120 + Math.sin(s.modeTimer * 0.5) * 5;

  // Ship orbits around planet (planet is at center in orbit view)
  s.shipX = Math.cos(s.orbitAngle) * s.orbitAltitude;
  s.shipY = Math.sin(s.orbitAngle) * s.orbitAltitude;
  s.shipAngle = s.orbitAngle + Math.PI / 2;

  return s;
}

function updateLanding(s: GameState, dt: number): GameState {
  const landDuration = 3;
  s.landingProgress = Math.min(1, s.modeTimer / landDuration);
  s.landingAltitude = 500 * (1 - easeInOutCubic(s.landingProgress));

  // Engine particles during landing
  if (Math.random() > 0.3) {
    s.particles = [
      ...s.particles,
      {
        x: (Math.random() - 0.5) * 20,
        y: 20 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 30,
        vy: 20 + Math.random() * 40,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 2 + Math.random() * 3,
        color: `hsl(${30 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`,
      },
    ];
  }

  if (s.landingProgress >= 1) {
    // Landed!
    if (!s.visitedPlanets.includes(s.currentPlanet?.name || '')) {
      // Will be added on return
    }
  }
  return s;
}

function updateSurface(s: GameState, dt: number, keys: KeyState, canvasSize: { w: number; h: number }): GameState {
  const speed = 150;
  let dx = 0, dy = 0;

  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    s.playerX += dx * speed * dt;
    s.playerY += dy * speed * dt;
    s.playerAngle = Math.atan2(dy, dx);

    // Clamp to world bounds
    s.playerX = Math.max(20, Math.min(s.surfaceWorldWidth - 20, s.playerX));
    s.playerY = Math.max(20, Math.min(s.surfaceWorldHeight - 20, s.playerY));
  }

  // Check proximity to ship
  const distToShip = Math.hypot(s.playerX - s.shipSurfaceX, s.playerY - s.shipSurfaceY);
  s.nearShip = distToShip < 60;

  // Check proximity to scan locations
  if (keys.space) {
    keys.space = false; // consume
    for (let i = 0; i < s.scanLocations.length; i++) {
      const loc = s.scanLocations[i];
      if (!loc.scanned) {
        const dist = Math.hypot(s.playerX - loc.x, s.playerY - loc.y);
        if (dist < 50) {
          s.scanLocations = s.scanLocations.map((l, idx) =>
            idx === i ? { ...l, scanned: true } : l
          );
          s.missionProgress += 1;
          s.message = `+1 SAMPLE — ${loc.label} scanned!`;
          s.messageTimer = 2.5;

          // Check mission complete
          if (s.missionProgress >= s.missionTarget) {
            s.message = 'MISSION COMPLETE! +250 Research Points — Return to ship!';
            s.messageTimer = 4;
          }
          break;
        }
      }
    }
  }

  // Dust particles when moving
  if ((dx !== 0 || dy !== 0) && s.currentPlanet?.hasSolidSurface && Math.random() > 0.6) {
    s.particles = [
      ...s.particles,
      {
        x: s.playerX + (Math.random() - 0.5) * 10,
        y: s.playerY + (Math.random() - 0.5) * 10,
        vx: -dx * 20 + (Math.random() - 0.5) * 20,
        vy: -dy * 20 + (Math.random() - 0.5) * 20,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 1 + Math.random() * 2,
        color: s.currentPlanet.surfaceColors[0] + '80',
      },
    ];
  }

  return s;
}

function updateReturnTravel(s: GameState, dt: number): GameState {
  const travelDuration = 3;
  s.travelProgress = Math.min(1, s.modeTimer / travelDuration);

  if (s.travelProgress >= 1) {
    // Add visited and points before clearing
    const cp = s.currentPlanet;
    if (cp) {
      if (!s.visitedPlanets.includes(cp.name)) {
        s.visitedPlanets = [...s.visitedPlanets, cp.name];
      }
      if (s.missionProgress >= s.missionTarget && !s.completedMissions.includes(cp.name)) {
        s.completedMissions = [...s.completedMissions, cp.name];
        s.researchPoints += 250;
      } else {
        s.researchPoints += 50;
      }
    }
    s.mode = 'solar-system';
    s.currentPlanet = null;
    s.selectedPlanetIndex = null;
    s.modeTimer = 0;
  }

  // Travel back to destination (Earth)
  const t = easeInOutCubic(s.travelProgress);
  const endX = s.travelEndX || 0;
  const endY = s.travelEndY || 145;
  s.shipX = s.travelStartX + (endX - s.travelStartX) * t;
  s.shipY = s.travelStartY + (endY - s.travelStartY) * t;
  const ddx = endX - s.shipX;
  const ddy = endY - s.shipY;
  if (Math.abs(ddx) > 0.1 || Math.abs(ddy) > 0.1) {
    s.shipAngle = Math.atan2(ddy, ddx) - Math.PI / 2;
  }

  if (Math.random() > 0.3) {
    s.particles = addExhaustParticle(s.particles, s.shipX, s.shipY, s.shipAngle);
  }

  return s;
}

function updateReturnOrbit(s: GameState, dt: number): GameState {
  s.orbitAngle += dt * 1.2;
  s.orbitAltitude += dt * 30;

  s.shipX = Math.cos(s.orbitAngle) * s.orbitAltitude;
  s.shipY = Math.sin(s.orbitAngle) * s.orbitAltitude;
  s.shipAngle = s.orbitAngle + Math.PI / 2;

  if (s.modeTimer > 3) {
    // Transition to return travel - set start to planet position, end to Earth
    s.mode = 'return-travel';
    s.modeTimer = 0;
    s.travelProgress = 0;
    // Planet position in solar system coords
    if (s.currentPlanet) {
      const planetIdx = planets.indexOf(s.currentPlanet);
      if (planetIdx >= 0) {
        const angle = s.planetAngles[planetIdx];
        s.travelStartX = Math.cos(angle) * s.currentPlanet.orbitRadius;
        s.travelStartY = Math.sin(angle) * s.currentPlanet.orbitRadius;
      } else {
        s.travelStartX = s.shipX;
        s.travelStartY = s.shipY;
      }
    } else {
      s.travelStartX = 0;
      s.travelStartY = 0;
    }
    s.travelEndX = 0;
    s.travelEndY = 145; // Earth's orbit radius
    s.shipX = s.travelStartX;
    s.shipY = s.travelStartY;
  }
  return s;
}

// ============================================================
// HELPERS
// ============================================================

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function addExhaustParticle(particles: Particle[], x: number, y: number, angle: number): Particle[] {
  const spread = 0.5;
  const backAngle = angle + Math.PI;
  const newP: Particle = {
    x: x + Math.cos(backAngle) * 12,
    y: y + Math.sin(backAngle) * 12,
    vx: Math.cos(backAngle + (Math.random() - 0.5) * spread) * (40 + Math.random() * 30),
    vy: Math.sin(backAngle + (Math.random() - 0.5) * spread) * (40 + Math.random() * 30),
    life: 0.3 + Math.random() * 0.4,
    maxLife: 0.7,
    size: 1.5 + Math.random() * 2.5,
    color: `hsl(${20 + Math.random() * 30}, 100%, ${50 + Math.random() * 40}%)`,
  };
  return [...particles.slice(-80), newP]; // limit particles
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - dt,
    }))
    .filter(p => p.life > 0);
}
