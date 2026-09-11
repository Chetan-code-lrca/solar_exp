import { GameState, Planet, planets } from './types';
import { TerrainFeature } from './useGame';

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  terrain: TerrainFeature[],
  stars: { x: number; y: number; size: number; brightness: number }[],
  canvasW: number,
  canvasH: number,
  time: number
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  switch (state.mode) {
    case 'intro':
    case 'solar-system':
      renderSolarSystem(ctx, state, stars, canvasW, canvasH, time);
      break;
    case 'launch':
      renderLaunch(ctx, state, stars, canvasW, canvasH, time);
      break;
    case 'travel':
    case 'return-travel':
      renderTravel(ctx, state, stars, canvasW, canvasH, time);
      break;
    case 'orbit':
    case 'return-orbit':
      renderOrbit(ctx, state, canvasW, canvasH, time);
      break;
    case 'landing':
      renderLanding(ctx, state, canvasW, canvasH, time);
      break;
    case 'surface':
      renderSurface(ctx, state, terrain, canvasW, canvasH, time);
      break;
  }
}

// ============================================================
// SOLAR SYSTEM
// ============================================================

function renderSolarSystem(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  stars: { x: number; y: number; size: number; brightness: number }[],
  w: number,
  h: number,
  time: number
) {
  const cx = w / 2;
  const cy = h / 2;

  // Background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);

  // Stars
  renderStars(ctx, stars, cx, cy, 0, 0, w, h, time);

  // Scale factor to fit solar system
  const scale = Math.min(w, h) / 900;

  // Orbit paths
  planets.forEach((planet) => {
    ctx.beginPath();
    ctx.arc(cx, cy, planet.orbitRadius * scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 120, 180, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Sun
  renderSun(ctx, cx, cy, 25 * scale, time);

  // Planets
  planets.forEach((planet, i) => {
    const angle = state.planetAngles[i];
    const px = cx + Math.cos(angle) * planet.orbitRadius * scale;
    const py = cy + Math.sin(angle) * planet.orbitRadius * scale;
    const size = planet.size * scale;

    // Selection highlight
    if (state.selectedPlanetIndex === i) {
      ctx.beginPath();
      ctx.arc(px, py, size + 8 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#60a0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow
      const grad = ctx.createRadialGradient(px, py, size, px, py, size + 20);
      grad.addColorStop(0, planet.color + '40');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Visited indicator
    if (state.visitedPlanets.includes(planet.name)) {
      ctx.beginPath();
      ctx.arc(px, py, size + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#40ff80';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Planet body
    renderPlanetBody(ctx, px, py, size, planet, time);

    // Label
    ctx.fillStyle = 'rgba(200, 210, 230, 0.7)';
    ctx.font = `${10 * scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(planet.name, px, py + size + 14 * scale);
  });

  // Spaceship
  const shipX = cx + state.shipX * scale;
  const shipY = cy + state.shipY * scale;
  renderSpaceship(ctx, shipX, shipY, state.shipAngle, 1.2 * scale, state.particles, time, true);
}

// ============================================================
// LAUNCH
// ============================================================

function renderLaunch(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  stars: { x: number; y: number; size: number; brightness: number }[],
  w: number,
  h: number,
  time: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 900;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  renderStars(ctx, stars, cx, cy, 0, 0, w, h, time);

  // Sun
  renderSun(ctx, cx, cy, 25 * scale, time);

  // Planets
  planets.forEach((planet, i) => {
    const angle = state.planetAngles[i];
    const px = cx + Math.cos(angle) * planet.orbitRadius * scale;
    const py = cy + Math.sin(angle) * planet.orbitRadius * scale;
    renderPlanetBody(ctx, px, py, planet.size * scale, planet, time);
  });

  // Ship with launch effect
  const shipX = cx + state.shipX * scale;
  const shipY = cy + state.shipY * scale;

  // Launch glow
  const glowSize = 30 + state.modeTimer * 20;
  const grad = ctx.createRadialGradient(shipX, shipY, 0, shipX, shipY, glowSize);
  grad.addColorStop(0, 'rgba(255, 150, 50, 0.3)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(shipX - glowSize, shipY - glowSize, glowSize * 2, glowSize * 2);

  renderSpaceship(ctx, shipX, shipY, state.shipAngle, 1.5 * scale, state.particles, time, true);
}

// ============================================================
// TRAVEL
// ============================================================

function renderTravel(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  stars: { x: number; y: number; size: number; brightness: number }[],
  w: number,
  h: number,
  time: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 900;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);

  // Stars with slight streak effect
  const streakAmount = state.travelProgress * 3;
  renderStars(ctx, stars, cx, cy, -state.shipX * scale * 0.3, -state.shipY * scale * 0.3, w, h, time, streakAmount);

  // Destination planet growing
  if (state.currentPlanet) {
    const planetSize = state.currentPlanet.size * scale * (0.5 + state.travelProgress * 2);
    const planetX = cx + (state.travelEndX * scale - cx) * (0.3 + state.travelProgress * 0.7);
    const planetY = cy + (state.travelEndY * scale - cy) * (0.3 + state.travelProgress * 0.7);
    renderPlanetBody(ctx, planetX, planetY, planetSize, state.currentPlanet, time);
  }

  // Ship
  const shipX = cx + state.shipX * scale;
  const shipY = cy + state.shipY * scale;
  renderSpaceship(ctx, shipX, shipY, state.shipAngle, 1.5 * scale, state.particles, time, true);
}

// ============================================================
// ORBIT
// ============================================================

function renderOrbit(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
  time: number
) {
  const cx = w / 2;
  const cy = h / 2;

  // Dark space background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);

  // A few stars
  for (let i = 0; i < 50; i++) {
    const sx = ((i * 137.5) % w);
    const sy = ((i * 241.3) % h);
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(time * 2 + i) * 0.2})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  if (!state.currentPlanet) return;
  const planet = state.currentPlanet;

  // Large planet
  const planetRadius = Math.min(w, h) * 0.25;
  renderPlanetBody(ctx, cx, cy, planetRadius, planet, time);

  // Orbit ring
  ctx.beginPath();
  ctx.arc(cx, cy, state.orbitAltitude, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ship orbiting
  const shipX = cx + state.shipX;
  const shipY = cy + state.shipY;
  renderSpaceship(ctx, shipX, shipY, state.shipAngle, 1.2, state.particles, time, true);
}

// ============================================================
// LANDING
// ============================================================

function renderLanding(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
  time: number
) {
  if (!state.currentPlanet) return;
  const planet = state.currentPlanet;

  // Background gradient based on planet
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0a20');
  grad.addColorStop(0.5, planet.surfaceColors[0]);
  grad.addColorStop(1, planet.surfaceColors[1] || planet.surfaceColors[0]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Atmosphere effect for non-solid planets
  if (!planet.hasSolidSurface) {
    for (let i = 0; i < 10; i++) {
      const y = (h * 0.3) + (i / 10) * h * 0.7;
      ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + '20';
      ctx.fillRect(0, y, w, h * 0.1);
    }
  }

  // Ground approaching
  const groundY = h * (0.5 + state.landingProgress * 0.4);
  ctx.fillStyle = planet.surfaceColors[2] || planet.surfaceColors[0];
  ctx.fillRect(0, groundY, w, h - groundY);

  // Surface features appearing
  if (state.landingProgress > 0.3) {
    const featureAlpha = (state.landingProgress - 0.3) / 0.7;
    for (let i = 0; i < 8; i++) {
      const fx = (i * 137 + 50) % w;
      const fy = groundY + 20 + (i * 47 % 60);
      ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + Math.floor(featureAlpha * 200).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(fx, fy, 5 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ship descending
  const shipY = h * 0.2 + (1 - state.landingProgress) * h * 0.3;
  const shake = state.landingProgress < 0.9 ? Math.sin(time * 30) * (3 - state.landingProgress * 3) : 0;

  renderSpaceship(ctx, w / 2 + shake, shipY, 0, 1.5, state.particles, time, true);

  // Landing particles
  if (state.landingProgress > 0.5) {
    for (let i = 0; i < 5; i++) {
      const px = w / 2 + (Math.random() - 0.5) * 60;
      const py = shipY + 25;
      ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 50, ${0.5 - state.landingProgress * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ============================================================
// SURFACE
// ============================================================

function renderSurface(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  terrain: TerrainFeature[],
  w: number,
  h: number,
  time: number
) {
  if (!state.currentPlanet) return;
  const planet = state.currentPlanet;

  // Camera follows player
  const camX = state.playerX - w / 2;
  const camY = state.playerY - h / 2;

  // Background
  ctx.fillStyle = planet.surfaceColors[0];
  ctx.fillRect(0, 0, w, h);

  // Terrain texture (grid pattern)
  const gridSize = 40;
  for (let gx = Math.floor(camX / gridSize) * gridSize; gx < camX + w + gridSize; gx += gridSize) {
    for (let gy = Math.floor(camY / gridSize) * gridSize; gy < camY + h + gridSize; gy += gridSize) {
      const screenX = gx - camX;
      const screenY = gy - camY;
      const noise = Math.sin(gx * 0.01) * Math.cos(gy * 0.01) * 0.1;
      const colorIdx = Math.abs(Math.floor((gx + gy) * 0.01)) % planet.surfaceColors.length;
      ctx.fillStyle = planet.surfaceColors[colorIdx] + '30';
      ctx.fillRect(screenX, screenY, gridSize, gridSize);
      if (noise > 0.05) {
        ctx.fillStyle = planet.surfaceColors[(colorIdx + 1) % planet.surfaceColors.length] + '20';
        ctx.fillRect(screenX, screenY, gridSize, gridSize);
      }
    }
  }

  // Atmospheric haze for gas giants
  if (!planet.hasSolidSurface) {
    for (let i = 0; i < 5; i++) {
      const hazeY = (Math.sin(time * 0.3 + i * 2) * 50 + i * h / 5) - (camY % (h / 3));
      ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + '15';
      ctx.fillRect(0, hazeY, w, h / 4);
    }
  }

  // Terrain features
  terrain.forEach(feature => {
    const sx = feature.x - camX;
    const sy = feature.y - camY;
    if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) return;

    ctx.save();
    ctx.translate(sx, sy);

    switch (feature.type) {
      case 'rock':
        ctx.fillStyle = feature.color;
        ctx.beginPath();
        ctx.moveTo(-feature.size * 0.5, feature.size * 0.3);
        ctx.lineTo(-feature.size * 0.3, -feature.size * 0.4);
        ctx.lineTo(feature.size * 0.2, -feature.size * 0.5);
        ctx.lineTo(feature.size * 0.5, feature.size * 0.1);
        ctx.lineTo(feature.size * 0.3, feature.size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = feature.color + '80';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      case 'crater':
        ctx.beginPath();
        ctx.arc(0, 0, feature.size, 0, Math.PI * 2);
        ctx.fillStyle = feature.color + '60';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, feature.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = planet.surfaceColors[2] + '40';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-feature.size * 0.2, -feature.size * 0.2, feature.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
        break;
      case 'volcano':
        ctx.fillStyle = feature.color;
        ctx.beginPath();
        ctx.moveTo(-feature.size, feature.size * 0.5);
        ctx.lineTo(0, -feature.size);
        ctx.lineTo(feature.size, feature.size * 0.5);
        ctx.closePath();
        ctx.fill();
        // Lava glow
        ctx.beginPath();
        ctx.arc(0, -feature.size * 0.7, feature.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${100 + Math.sin(time * 3) * 50}, 0, 0.6)`;
        ctx.fill();
        break;
      case 'cloud':
        ctx.fillStyle = feature.color + '30';
        ctx.beginPath();
        ctx.ellipse(0, 0, feature.size, feature.size * 0.4, Math.sin(time * 0.2) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'tree':
        ctx.fillStyle = '#2a5020';
        ctx.fillRect(-2, 0, 4, feature.size * 0.5);
        ctx.fillStyle = feature.color;
        ctx.beginPath();
        ctx.arc(0, -feature.size * 0.2, feature.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.fillStyle = feature.color;
        ctx.beginPath();
        ctx.arc(0, 0, feature.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  });

  // Scan locations
  state.scanLocations.forEach((loc, i) => {
    const sx = loc.x - camX;
    const sy = loc.y - camY;
    if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) return;

    if (!loc.scanned) {
      // Pulsing marker
      const pulse = Math.sin(time * 3 + i) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, 15 + pulse * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100, 255, 150, ${pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner diamond
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(time * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fillStyle = `rgba(100, 255, 150, ${pulse * 0.8})`;
      ctx.fill();
      ctx.restore();

      // Label
      ctx.fillStyle = 'rgba(100, 255, 150, 0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(loc.label, sx, sy + 25);

      // Check if player is near
      const dist = Math.hypot(state.playerX - loc.x, state.playerY - loc.y);
      if (dist < 50) {
        ctx.fillStyle = 'rgba(100, 255, 150, 0.9)';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('[SPACE] SCAN', sx, sy - 25);
      }
    } else {
      // Scanned marker
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 255, 150, 0.3)';
      ctx.fill();
      ctx.fillStyle = '#40ff80';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✓', sx, sy + 5);
    }
  });

  // Ship at landing site
  const shipSX = state.shipSurfaceX - camX;
  const shipSY = state.shipSurfaceY - camY;
  if (shipSX > -50 && shipSX < w + 50 && shipSY > -50 && shipSY < h + 50) {
    renderSpaceship(ctx, shipSX, shipSY, -Math.PI / 2, 1.2, [], time, false);

    // "RETURN TO SHIP" indicator
    if (state.missionProgress >= state.missionTarget) {
      const dist = Math.hypot(state.playerX - state.shipSurfaceX, state.playerY - state.shipSurfaceY);
      if (dist < 80) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[SPACE] TAKE OFF', shipSX, shipSY - 35);
      }
    }
  }

  // Player rover
  renderRover(ctx, w / 2, h / 2, state.playerAngle, planet, time);

  // Particles (world-space)
  state.particles.forEach(p => {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ============================================================
// DRAWING HELPERS
// ============================================================

function renderStars(
  ctx: CanvasRenderingContext2D,
  stars: { x: number; y: number; size: number; brightness: number }[],
  cx: number,
  cy: number,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
  time: number,
  streak: number = 0
) {
  stars.forEach((star) => {
    const sx = ((star.x + offsetX * 0.1 + cx) % w + w) % w;
    const sy = ((star.y + offsetY * 0.1 + cy) % h + h) % h;
    const twinkle = Math.sin(time * 2 + star.x) * 0.3 + 0.7;
    const alpha = star.brightness * twinkle;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    if (streak > 0) {
      ctx.fillRect(sx, sy, star.size + streak, star.size * 0.5);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function renderSun(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number) {
  // Outer glow
  const outerGlow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 3);
  outerGlow.addColorStop(0, 'rgba(255, 200, 50, 0.3)');
  outerGlow.addColorStop(0.5, 'rgba(255, 100, 0, 0.1)');
  outerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fill();

  // Sun body
  const sunGrad = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, 0, x, y, radius);
  sunGrad.addColorStop(0, '#fffbe0');
  sunGrad.addColorStop(0.4, '#ffdd00');
  sunGrad.addColorStop(0.8, '#ff8c00');
  sunGrad.addColorStop(1, '#ff4500');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Corona effect
  ctx.save();
  ctx.globalAlpha = 0.3 + Math.sin(time * 2) * 0.1;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.5;
    const len = radius * (1.3 + Math.sin(time * 3 + i) * 0.3);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.9, y + Math.sin(angle) * radius * 0.9);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function renderPlanetBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  planet: Planet,
  time: number
) {
  // Planet shadow/glow
  const glow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.5);
  glow.addColorStop(0, planet.color + '20');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Planet body
  const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  grad.addColorStop(0, lightenColor(planet.color, 30));
  grad.addColorStop(0.7, planet.color);
  grad.addColorStop(1, planet.secondaryColor);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Surface details for larger planets
  if (radius > 10) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // Bands for gas giants
    if (!planet.hasSolidSurface) {
      for (let i = 0; i < 5; i++) {
        const bandY = y - radius + (i + 0.5) * (radius * 2 / 5);
        ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + '30';
        ctx.fillRect(x - radius, bandY, radius * 2, radius * 0.3);
      }
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(x + radius * 0.3, y + radius * 0.1, radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Saturn rings
  if (planet.name === 'Saturn' && radius > 5) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(210, 180, 120, 0.5)';
    ctx.lineWidth = radius * 0.15;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180, 160, 100, 0.3)';
    ctx.lineWidth = radius * 0.1;
    ctx.stroke();
    ctx.restore();
  }
}

function renderSpaceship(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  scale: number,
  particles: { x: number; y: number; life: number; maxLife: number; size: number; color: string }[],
  time: number,
  showEngine: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Engine glow
  if (showEngine) {
    const engineGlow = ctx.createRadialGradient(0, 12, 0, 0, 12, 15);
    engineGlow.addColorStop(0, 'rgba(100, 180, 255, 0.6)');
    engineGlow.addColorStop(0.5, 'rgba(50, 100, 255, 0.3)');
    engineGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(0, 12, 15 + Math.sin(time * 10) * 3, 0, Math.PI * 2);
    ctx.fill();

    // Engine flame
    ctx.fillStyle = `rgba(100, 200, 255, ${0.5 + Math.sin(time * 15) * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(0, 18 + Math.sin(time * 20) * 4);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 12) * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(-2, 10);
    ctx.lineTo(0, 14 + Math.sin(time * 25) * 2);
    ctx.lineTo(2, 10);
    ctx.closePath();
    ctx.fill();
  }

  // Ship body
  ctx.fillStyle = '#c0c8d8';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-8, 8);
  ctx.lineTo(-4, 12);
  ctx.lineTo(4, 12);
  ctx.lineTo(8, 8);
  ctx.lineTo(6, -4);
  ctx.closePath();
  ctx.fill();

  // Ship outline
  ctx.strokeStyle = '#8090a0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cockpit
  const cockpitGrad = ctx.createRadialGradient(0, -6, 0, 0, -6, 5);
  cockpitGrad.addColorStop(0, '#80d0ff');
  cockpitGrad.addColorStop(1, '#3060a0');
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.ellipse(0, -6, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = '#a0a8b8';
  ctx.beginPath();
  ctx.moveTo(-8, 4);
  ctx.lineTo(-14, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(14, 10);
  ctx.lineTo(8, 10);
  ctx.closePath();
  ctx.fill();

  // Detail lines
  ctx.strokeStyle = '#6070a0';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(-3, 8);
  ctx.moveTo(3, 0);
  ctx.lineTo(3, 8);
  ctx.stroke();

  ctx.restore();
}

function renderRover(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  planet: Planet,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#d0d8e0';
  ctx.fillRect(-10, -6, 20, 12);
  ctx.strokeStyle = '#8090a0';
  ctx.lineWidth = 1;
  ctx.strokeRect(-10, -6, 20, 12);

  // Top dome
  ctx.fillStyle = '#a0d0ff';
  ctx.beginPath();
  ctx.arc(0, -6, 6, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#6090c0';
  ctx.stroke();

  // Antenna
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, -10);
  ctx.lineTo(5, -18);
  ctx.stroke();
  ctx.fillStyle = '#ff4040';
  ctx.beginPath();
  ctx.arc(5, -18, 2, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#404040';
  ctx.beginPath();
  ctx.arc(-8, 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // Wheel rotation indicator
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  const wheelAngle = time * 5;
  [-8, 8].forEach(wx => {
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(wheelAngle) * 3, 8 + Math.sin(wheelAngle) * 3);
    ctx.lineTo(wx - Math.cos(wheelAngle) * 3, 8 - Math.sin(wheelAngle) * 3);
    ctx.stroke();
  });

  // Scanner light
  const scanPulse = Math.sin(time * 4) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(100, 255, 150, ${scanPulse * 0.5})`;
  ctx.beginPath();
  ctx.arc(0, 0, 15 + scanPulse * 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================
// UTILITY
// ============================================================

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
