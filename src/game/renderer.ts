import { GameState, Planet, PLANETS, Star, Particle, ScanTarget } from './types';

// ============================================================
// MAIN RENDER
// ============================================================

export function render(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  ctx.clearRect(0, 0, w, h);

  switch (s.mode) {
    case 'menu': renderMenu(ctx, s, w, h, time); break;
    case 'solar-system': renderSolarSystem(ctx, s, w, h, time); break;
    case 'briefing': renderSolarSystem(ctx, s, w, h, time); break;
    case 'launch': renderLaunch(ctx, s, w, h, time); break;
    case 'space-flight': renderSpaceFlight(ctx, s, w, h, time); break;
    case 'approach': renderApproach(ctx, s, w, h, time); break;
    case 'orbit': renderOrbit(ctx, s, w, h, time); break;
    case 'landing': renderLanding(ctx, s, w, h, time); break;
    case 'surface': renderSurface(ctx, s, w, h, time); break;
    case 'mission-complete': renderSurface(ctx, s, w, h, time); break;
    case 'takeoff': renderTakeoff(ctx, s, w, h, time); break;
    case 'returning': renderReturning(ctx, s, w, h, time); break;
  }
}

// ============================================================
// MENU
// ============================================================

function renderMenu(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  // Deep space background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#020210');
  bg.addColorStop(0.5, '#050520');
  bg.addColorStop(1, '#0a0a30');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Stars
  drawStarfield(ctx, s.stars, w, h, time, 0, 0);

  // Nebula glow
  const nebula = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, w * 0.5);
  nebula.addColorStop(0, 'rgba(60, 20, 100, 0.15)');
  nebula.addColorStop(0.5, 'rgba(30, 10, 60, 0.08)');
  nebula.addColorStop(1, 'transparent');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, w, h);

  // Large spaceship silhouette
  drawMenuShip(ctx, w / 2, h * 0.55, time);
}

function drawMenuShip(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Engine glow
  const glowSize = 40 + Math.sin(time * 2) * 5;
  const glow = ctx.createRadialGradient(0, 35, 0, 0, 35, glowSize);
  glow.addColorStop(0, 'rgba(80, 160, 255, 0.4)');
  glow.addColorStop(0.5, 'rgba(40, 80, 200, 0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 35, glowSize, 0, Math.PI * 2);
  ctx.fill();

  // Ship body
  ctx.fillStyle = '#c0c8d8';
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(-12, -20);
  ctx.lineTo(-18, 10);
  ctx.lineTo(-25, 30);
  ctx.lineTo(-15, 35);
  ctx.lineTo(-8, 30);
  ctx.lineTo(0, 32);
  ctx.lineTo(8, 30);
  ctx.lineTo(15, 35);
  ctx.lineTo(25, 30);
  ctx.lineTo(18, 10);
  ctx.lineTo(12, -20);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#8090a0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cockpit
  const cockpit = ctx.createRadialGradient(0, -25, 0, 0, -25, 12);
  cockpit.addColorStop(0, '#a0e0ff');
  cockpit.addColorStop(0.6, '#4080c0');
  cockpit.addColorStop(1, '#203060');
  ctx.fillStyle = cockpit;
  ctx.beginPath();
  ctx.ellipse(0, -25, 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#60a0d0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wings detail
  ctx.fillStyle = '#a0a8b8';
  ctx.beginPath();
  ctx.moveTo(-18, 10);
  ctx.lineTo(-35, 25);
  ctx.lineTo(-25, 30);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 10);
  ctx.lineTo(35, 25);
  ctx.lineTo(25, 30);
  ctx.closePath();
  ctx.fill();

  // Engine nozzles
  ctx.fillStyle = '#404850';
  ctx.fillRect(-10, 30, 6, 8);
  ctx.fillRect(4, 30, 6, 8);

  // Engine flame
  const flameH = 15 + Math.sin(time * 12) * 5;
  ctx.fillStyle = `rgba(100, 180, 255, ${0.6 + Math.sin(time * 15) * 0.2})`;
  ctx.beginPath();
  ctx.moveTo(-8, 38);
  ctx.lineTo(-7, 38 + flameH);
  ctx.lineTo(-4, 38);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, 38);
  ctx.lineTo(7, 38 + flameH);
  ctx.lineTo(10, 38);
  ctx.closePath();
  ctx.fill();

  // Detail lines
  ctx.strokeStyle = '#6070a0';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(-6, 20);
  ctx.moveTo(6, -10);
  ctx.lineTo(6, 20);
  ctx.stroke();

  ctx.restore();
}

// ============================================================
// SOLAR SYSTEM
// ============================================================

function renderSolarSystem(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 920;

  // Background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h));
  bg.addColorStop(0, '#0a0a20');
  bg.addColorStop(1, '#020208');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Stars
  drawStarfield(ctx, s.stars, w, h, time, s.cameraX, s.cameraY);

  // Orbit paths
  PLANETS.forEach((p) => {
    ctx.beginPath();
    ctx.arc(cx, cy, p.orbitRadius * scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80, 100, 160, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Sun
  drawSun(ctx, cx, cy, 28 * scale, time);

  // Planets
  PLANETS.forEach((planet, i) => {
    const angle = s.planetAngles[i];
    const px = cx + Math.cos(angle) * planet.orbitRadius * scale;
    const py = cy + Math.sin(angle) * planet.orbitRadius * scale;
    const size = planet.size * scale;

    // Selection highlight
    if (s.selectedPlanetIndex === i) {
      ctx.beginPath();
      ctx.arc(px, py, size + 10 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const glow = ctx.createRadialGradient(px, py, size, px, py, size + 25);
      glow.addColorStop(0, planet.color + '30');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, size + 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Visited indicator
    if (s.visitedPlanets.includes(planet.name)) {
      ctx.beginPath();
      ctx.arc(px, py, size + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80, 255, 120, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Planet body
    drawPlanet(ctx, px, py, size, planet, time);

    // Label
    ctx.fillStyle = 'rgba(180, 200, 230, 0.6)';
    ctx.font = `${Math.max(9, 10 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(planet.name, px, py + size + 14 * scale);
  });

  // Spaceship near Earth
  const shipAngle = s.planetAngles[2];
  const shipDist = PLANETS[2].orbitRadius * scale + 20 * scale;
  const shipX = cx + Math.cos(shipAngle) * shipDist;
  const shipY = cy + Math.sin(shipAngle) * shipDist;
  drawSpaceship(ctx, shipX, shipY, shipAngle + Math.PI / 2, 1.2 * scale, time, true);
}

// ============================================================
// LAUNCH
// ============================================================

function renderLaunch(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  // Space background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);
  drawStarfield(ctx, s.stars, w, h, time, 0, 0);

  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 920;

  // Sun
  drawSun(ctx, cx, cy, 28 * scale, time);

  // Planets
  PLANETS.forEach((planet, i) => {
    const angle = s.planetAngles[i];
    const px = cx + Math.cos(angle) * planet.orbitRadius * scale;
    const py = cy + Math.sin(angle) * planet.orbitRadius * scale;
    drawPlanet(ctx, px, py, planet.size * scale, planet, time);
  });

  // Ship position based on launch phase
  let shipX = cx;
  let shipY = h * 0.55;
  let shipAngle = -Math.PI / 2;
  let shipScale = 1.5;

  if (s.launchPhase === 'liftoff') {
    shipY = h * 0.55 - s.modeTimer * 80;
    shipScale = 1.5 - s.modeTimer * 0.2;
  }

  // Launch glow
  if (s.launchPhase === 'ignition' || s.launchPhase === 'liftoff') {
    const glowR = 50 + s.modeTimer * 30;
    const glow = ctx.createRadialGradient(shipX, shipY + 20, 0, shipX, shipY + 20, glowR);
    glow.addColorStop(0, 'rgba(255, 150, 50, 0.3)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(shipX - glowR, shipY + 20 - glowR, glowR * 2, glowR * 2);
  }

  // Shake during ignition
  const shake = s.launchPhase === 'ignition' ? Math.sin(time * 30) * 2 : 0;

  drawSpaceship(ctx, shipX + shake, shipY, shipAngle, shipScale, time, true);

  // Particles
  drawParticles(ctx, s.particles);

  // Countdown overlay
  if (s.launchPhase === 'countdown') {
    const num = Math.ceil(s.launchCountdown);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pulse = 1 + Math.sin(time * 8) * 0.05;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(pulse, pulse);
    ctx.fillText(num > 0 ? `T-${num}` : 'IGNITION', 0, 0);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}

// ============================================================
// SPACE FLIGHT
// ============================================================

function renderSpaceFlight(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  // Dark space
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, w, h);

  // Moving stars with streaks
  const speed = 1 + s.flightProgress * 4;
  drawStarfield(ctx, s.stars, w, h, time, -s.flightProgress * 500, 0, speed);

  // Destination planet growing
  if (s.currentPlanet) {
    const planetSize = 5 + s.flightProgress * s.flightProgress * 80;
    const planetX = w * 0.8 - s.flightProgress * w * 0.1;
    const planetY = h * 0.3 + s.flightProgress * h * 0.05;

    // Planet glow
    const glow = ctx.createRadialGradient(planetX, planetY, planetSize * 0.5, planetX, planetY, planetSize * 2);
    glow.addColorStop(0, s.currentPlanet.color + '20');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetSize * 2, 0, Math.PI * 2);
    ctx.fill();

    drawPlanet(ctx, planetX, planetY, planetSize, s.currentPlanet, time);
  }

  // Asteroids
  s.asteroids.forEach(a => {
    ctx.fillStyle = '#555566';
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444455';
    ctx.beginPath();
    ctx.arc(a.x - a.size * 0.2, a.y - a.size * 0.2, a.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship in center
  drawSpaceship(ctx, s.flightShipX || w / 2, s.flightShipY || h / 2, -Math.PI / 2, 1.3, time, true);

  // Particles
  drawParticles(ctx, s.particles);

  // Cockpit frame
  drawCockpitFrame(ctx, w, h);
}

function drawCockpitFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Subtle vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Corner brackets
  ctx.strokeStyle = 'rgba(80, 120, 180, 0.2)';
  ctx.lineWidth = 1;
  const m = 30;
  const l = 40;
  // Top-left
  ctx.beginPath(); ctx.moveTo(m, m + l); ctx.lineTo(m, m); ctx.lineTo(m + l, m); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(w - m - l, m); ctx.lineTo(w - m, m); ctx.lineTo(w - m, m + l); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(m, h - m - l); ctx.lineTo(m, h - m); ctx.lineTo(m + l, h - m); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(w - m - l, h - m); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m, h - m - l); ctx.stroke();
}

// ============================================================
// APPROACH
// ============================================================

function renderApproach(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, w, h);
  drawStarfield(ctx, s.stars, w, h, time, 0, 0);

  if (!s.currentPlanet) return;

  // Planet grows from distance
  const t = Math.min(1, s.modeTimer / 3);
  const planetSize = 10 + easeInOut(t) * Math.min(w, h) * 0.35;
  const cx = w / 2;
  const cy = h / 2;

  // Atmospheric glow
  if (s.currentPlanet.hasAtmosphere) {
    const atmoGlow = ctx.createRadialGradient(cx, cy, planetSize * 0.9, cx, cy, planetSize * 1.4);
    atmoGlow.addColorStop(0, s.currentPlanet.atmosphereColor);
    atmoGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = atmoGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, planetSize * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlanet(ctx, cx, cy, planetSize, s.currentPlanet, time);

  // Ship approaching from bottom
  const shipY = h * 0.85 - t * h * 0.2;
  drawSpaceship(ctx, w / 2, shipY, -Math.PI / 2, 1.2, time, true);
  drawParticles(ctx, s.particles);
}

// ============================================================
// ORBIT
// ============================================================

function renderOrbit(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  // Space background
  ctx.fillStyle = '#030310';
  ctx.fillRect(0, 0, w, h);
  drawStarfield(ctx, s.stars, w, h, time, 0, 0);

  if (!s.currentPlanet) return;

  const cx = w / 2;
  const cy = h / 2;
  const planetRadius = Math.min(w, h) * 0.28;

  // Atmospheric glow
  if (s.currentPlanet.hasAtmosphere) {
    const atmo = ctx.createRadialGradient(cx, cy, planetRadius * 0.95, cx, cy, planetRadius * 1.3);
    atmo.addColorStop(0, s.currentPlanet.atmosphereColor);
    atmo.addColorStop(1, 'transparent');
    ctx.fillStyle = atmo;
    ctx.beginPath();
    ctx.arc(cx, cy, planetRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Planet
  drawPlanet(ctx, cx, cy, planetRadius, s.currentPlanet, time);

  // Orbit path
  ctx.beginPath();
  ctx.arc(cx, cy, s.orbitRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ship on orbit
  const shipX = cx + Math.cos(s.orbitAngle) * s.orbitRadius;
  const shipY = cy + Math.sin(s.orbitAngle) * s.orbitRadius;
  const shipAngle = s.orbitAngle + Math.PI / 2;
  drawSpaceship(ctx, shipX, shipY, shipAngle, 1.0, time, true);
  drawParticles(ctx, s.particles);
}

// ============================================================
// LANDING
// ============================================================

function renderLanding(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  if (!s.currentPlanet) return;
  const planet = s.currentPlanet;

  // Sky gradient based on altitude
  const altFactor = s.landingAltitude / 100000;
  const skyTop = lerpColor('#020210', planet.skyGradient[0], 1 - altFactor);
  const skyBot = lerpColor('#0a0a20', planet.skyGradient[2], 1 - altFactor);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, skyTop);
  bg.addColorStop(1, skyBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Stars fade as we descend
  if (altFactor > 0.3) {
    ctx.globalAlpha = altFactor;
    drawStarfield(ctx, s.stars, w, h, time, 0, 0);
    ctx.globalAlpha = 1;
  }

  // Ground approaching
  const groundY = h * (0.5 + (1 - altFactor) * 0.35);
  if (altFactor < 0.5) {
    // Terrain
    const terrainGrad = ctx.createLinearGradient(0, groundY, 0, h);
    terrainGrad.addColorStop(0, planet.groundColors[0]);
    terrainGrad.addColorStop(1, planet.groundColors[1] || planet.groundColors[0]);
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Surface features
    if (altFactor < 0.2) {
      const featureAlpha = 1 - altFactor * 5;
      for (let i = 0; i < 12; i++) {
        const fx = ((i * 173 + s.terrainSeed * 10) % w);
        const fy = groundY + 20 + ((i * 67) % (h - groundY - 40));
        ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + Math.floor(featureAlpha * 180).toString(16).padStart(2, '0');
        ctx.beginPath();
        if (planet.terrainType === 'craters' || planet.terrainType === 'dust') {
          ctx.arc(fx, fy, 5 + i * 2, 0, Math.PI * 2);
        } else {
          ctx.ellipse(fx, fy, 8 + i * 2, 4 + i, 0, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
  }

  // Atmospheric entry effects
  if (s.landingPhase === 'entry') {
    // Heat shield glow
    const heatGlow = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, 60);
    heatGlow.addColorStop(0, 'rgba(255, 100, 30, 0.3)');
    heatGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = heatGlow;
    ctx.fillRect(w / 2 - 60, h * 0.45 - 60, 120, 120);

    // Streaking atmosphere
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h * 0.5;
      ctx.strokeStyle = planet.atmosphereColor.replace(/[\d.]+\)$/, `${0.2 + Math.random() * 0.3})`);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 20, sy + 40);
      ctx.stroke();
    }
  }

  // Ship with shake
  const shake = s.landingShake;
  const sx = w / 2 + (Math.random() - 0.5) * shake * 4;
  const sy = h * 0.45 + (Math.random() - 0.5) * shake * 2;
  drawSpaceship(ctx, sx, sy, 0, 1.5, time, true);

  // Particles
  drawParticles(ctx, s.particles);
}

// ============================================================
// SURFACE
// ============================================================

function renderSurface(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  if (!s.currentPlanet) return;
  const planet = s.currentPlanet;

  const camX = s.surfaceCameraX;
  const camY = s.surfaceCameraY;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, planet.skyGradient[0]);
  sky.addColorStop(0.4, planet.skyGradient[1]);
  sky.addColorStop(1, planet.skyGradient[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars for airless bodies
  if (!planet.hasAtmosphere) {
    ctx.globalAlpha = 0.5;
    drawStarfield(ctx, s.stars, w, h, time, camX * 0.02, camY * 0.02);
    ctx.globalAlpha = 1;
  }

  // Background mountains/hills (parallax layer 1)
  drawTerrainLayer(ctx, planet, w, h, camX * 0.3, camY * 0.1, 0.6, time, 'far');

  // Mid-ground terrain (parallax layer 2)
  drawTerrainLayer(ctx, planet, w, h, camX * 0.6, camY * 0.3, 0.8, time, 'mid');

  // Ground
  const groundBaseY = h * 0.65 - camY * 0.05;
  const groundGrad = ctx.createLinearGradient(0, groundBaseY, 0, h);
  groundGrad.addColorStop(0, planet.groundColors[0]);
  groundGrad.addColorStop(0.5, planet.groundColors[1] || planet.groundColors[0]);
  groundGrad.addColorStop(1, planet.groundColors[2] || planet.groundColors[0]);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundBaseY, w, h - groundBaseY);

  // Foreground terrain details (parallax layer 3)
  drawTerrainLayer(ctx, planet, w, h, camX * 0.9, camY * 0.6, 1.0, time, 'near');

  // Atmospheric haze
  if (planet.hasAtmosphere) {
    ctx.fillStyle = planet.atmosphereColor;
    ctx.fillRect(0, 0, w, h);

    // Dust/atmosphere particles
    for (let i = 0; i < 5; i++) {
      const px = ((time * 20 + i * 200) % (w + 100)) - 50;
      const py = h * 0.3 + Math.sin(time * 0.5 + i) * 50;
      ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + '10';
      ctx.beginPath();
      ctx.ellipse(px, py, 60 + i * 20, 20 + i * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Scan targets (world space)
  s.scanTargets.forEach((target) => {
    const sx = target.x - camX;
    const sy = target.y - camY;
    if (sx < -80 || sx > w + 80 || sy < -80 || sy > h + 80) return;

    if (!target.scanned) {
      // Pulsing beacon
      const pulse = Math.sin(time * 3 + target.id * 2) * 0.3 + 0.7;
      const beaconSize = 18 + pulse * 6;

      // Outer ring
      ctx.beginPath();
      ctx.arc(sx, sy, beaconSize + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100, 255, 150, ${pulse * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner diamond
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(time * 0.8);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fillStyle = `rgba(100, 255, 150, ${pulse * 0.7})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(100, 255, 150, ${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Glow
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30);
      glow.addColorStop(0, `rgba(100, 255, 150, ${pulse * 0.2})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = `rgba(100, 255, 150, ${pulse * 0.8})`;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(target.label, sx, sy + 30);

      // Distance
      const dist = Math.round(Math.hypot(s.playerX - target.x, s.playerY - target.y));
      ctx.fillText(`${dist}m`, sx, sy + 42);
    } else {
      // Scanned marker
      ctx.fillStyle = 'rgba(100, 255, 150, 0.3)';
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#40ff80';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✓', sx, sy + 5);
    }
  });

  // Lander
  const landerSX = s.landerX - camX;
  const landerSY = s.landerY - camY;
  if (landerSX > -60 && landerSX < w + 60 && landerSY > -60 && landerSY < h + 60) {
    drawLander(ctx, landerSX, landerSY, planet, time);

    // Navigation marker
    const distToLander = Math.round(Math.hypot(s.playerX - s.landerX, s.playerY - s.landerY));
    if (distToLander > 100) {
      ctx.fillStyle = 'rgba(255, 200, 50, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`LANDER ${distToLander}m`, landerSX, landerSY - 40);
    }

    // Board prompt
    if (s.nearLander && s.missionProgress >= s.missionTarget) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE] BOARD SHIP', landerSX, landerSY - 50);
    }
  }

  // Player rover
  const roverSX = s.playerX - camX;
  const roverSY = s.playerY - camY;
  drawRover(ctx, roverSX, roverSY, s.playerAngle, s.playerMoving, planet, time);

  // Particles (world space)
  s.particles.forEach(p => {
    const px = p.x - camX;
    const py = p.y - camY;
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Scan prompt
  if (s.nearTarget && !s.nearTarget.scanned) {
    ctx.fillStyle = '#60ff90';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[SPACE] SCAN ${s.nearTarget.label.toUpperCase()}`, w / 2, h - 60);
  }
}

function drawTerrainLayer(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  w: number,
  h: number,
  offsetX: number,
  _offsetY: number,
  scale: number,
  time: number,
  layer: 'far' | 'mid' | 'near'
) {
  const baseY = h * (layer === 'far' ? 0.5 : layer === 'mid' ? 0.58 : 0.65);
  const amplitude = layer === 'far' ? 40 : layer === 'mid' ? 25 : 15;
  const freq = layer === 'far' ? 0.003 : layer === 'mid' ? 0.005 : 0.008;
  const colorIdx = layer === 'far' ? 3 : layer === 'mid' ? 1 : 0;
  const alpha = layer === 'far' ? 0.4 : layer === 'mid' ? 0.6 : 0.8;

  ctx.beginPath();
  ctx.moveTo(0, h);

  for (let x = 0; x <= w; x += 4) {
    const worldX = x + offsetX;
    let y = baseY;
    y += Math.sin(worldX * freq) * amplitude;
    y += Math.sin(worldX * freq * 2.3 + 1.5) * amplitude * 0.4;
    y += Math.sin(worldX * freq * 0.5 + 3.0) * amplitude * 0.7;

    if (planet.terrainType === 'volcanic' && layer === 'mid') {
      // Add volcano shapes
      const volcanoX = ((worldX * 0.001 + planet.size) % 3);
      if (volcanoX < 0.3) {
        y -= (0.3 - volcanoX) * 100 * scale;
      }
    }

    ctx.lineTo(x, y);
  }

  ctx.lineTo(w, h);
  ctx.closePath();

  const color = planet.groundColors[colorIdx] || planet.groundColors[0];
  ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
  ctx.fill();
}

function drawLander(ctx: CanvasRenderingContext2D, x: number, y: number, planet: Planet, time: number) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#808890';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-15, 10); ctx.lineTo(-22, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(22, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 22); ctx.stroke();

  // Body
  ctx.fillStyle = '#d0d8e0';
  ctx.beginPath();
  ctx.moveTo(-18, 5);
  ctx.lineTo(-15, -15);
  ctx.lineTo(15, -15);
  ctx.lineTo(18, 5);
  ctx.lineTo(15, 12);
  ctx.lineTo(-15, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8090a0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top dome
  ctx.fillStyle = '#a0d0ff';
  ctx.beginPath();
  ctx.arc(0, -15, 10, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#6090c0';
  ctx.stroke();

  // Antenna
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, -20);
  ctx.lineTo(12, -35);
  ctx.stroke();
  ctx.fillStyle = '#ff4040';
  ctx.beginPath();
  ctx.arc(12, -35, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Status light
  const blink = Math.sin(time * 3) > 0;
  ctx.fillStyle = blink ? '#40ff80' : '#206040';
  ctx.beginPath();
  ctx.arc(-8, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRover(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  moving: boolean,
  planet: Planet,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  const wheelRot = moving ? time * 8 : 0;
  ctx.fillStyle = '#303030';
  [-12, 12].forEach(wx => {
    ctx.save();
    ctx.translate(wx, 8);
    ctx.rotate(wheelRot);
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
    ctx.moveTo(0, -4); ctx.lineTo(0, 4);
    ctx.stroke();
    ctx.restore();
  });

  // Body
  ctx.fillStyle = '#d8dce4';
  const bodyGrad = ctx.createLinearGradient(-14, -8, 14, 8);
  bodyGrad.addColorStop(0, '#e8ecf0');
  bodyGrad.addColorStop(1, '#b0b8c0');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-14, -6, 28, 14, 3);
  ctx.fill();
  ctx.strokeStyle = '#8090a0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top equipment
  ctx.fillStyle = '#a0a8b0';
  ctx.fillRect(-8, -10, 16, 5);

  // Camera dome
  ctx.fillStyle = '#80c0ff';
  ctx.beginPath();
  ctx.arc(0, -10, 5, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#5090c0';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Antenna
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, -10);
  ctx.lineTo(10, -22);
  ctx.stroke();

  // Antenna tip
  ctx.fillStyle = '#ff3030';
  ctx.beginPath();
  ctx.arc(10, -22, 2, 0, Math.PI * 2);
  ctx.fill();

  // Headlights
  const lightPulse = moving ? 0.7 + Math.sin(time * 4) * 0.2 : 0.4;
  ctx.fillStyle = `rgba(255, 255, 200, ${lightPulse})`;
  ctx.beginPath();
  ctx.arc(-10, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  // Scanner ring
  if (moving) {
    const scanPulse = Math.sin(time * 5) * 0.3 + 0.3;
    ctx.strokeStyle = `rgba(100, 255, 150, ${scanPulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================
// TAKEOFF
// ============================================================

function renderTakeoff(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  if (!s.currentPlanet) return;
  const planet = s.currentPlanet;
  const t = s.modeTimer / 3;

  // Sky transitions from surface to space
  const skyTop = lerpColor(planet.skyGradient[0], '#020210', t);
  const skyBot = lerpColor(planet.skyGradient[2], '#050520', t);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, skyTop);
  bg.addColorStop(1, skyBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Ground receding
  const groundY = h * (0.7 + t * 0.5);
  if (groundY < h) {
    ctx.fillStyle = planet.groundColors[0];
    ctx.fillRect(0, groundY, w, h - groundY);
  }

  // Stars appearing
  if (t > 0.3) {
    ctx.globalAlpha = (t - 0.3) / 0.7;
    drawStarfield(ctx, s.stars, w, h, time, 0, 0);
    ctx.globalAlpha = 1;
  }

  // Ship rising
  const shipY = h * 0.6 - t * h * 0.4;
  const shipScale = 1.5 - t * 0.5;
  drawSpaceship(ctx, w / 2, shipY, -Math.PI / 2, shipScale, time, true);

  // Particles
  drawParticles(ctx, s.particles);
}

// ============================================================
// RETURNING
// ============================================================

function renderReturning(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, time: number) {
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, w, h);

  // Stars with streaks
  const speed = 1 + s.flightProgress * 3;
  drawStarfield(ctx, s.stars, w, h, time, 0, -s.flightProgress * 300, speed);

  // Solar system appearing at end
  if (s.flightProgress > 0.5) {
    const alpha = (s.flightProgress - 0.5) * 2;
    ctx.globalAlpha = alpha;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 920 * alpha;

    drawSun(ctx, cx, cy, 20 * scale, time);
    PLANETS.forEach((planet, i) => {
      const angle = s.planetAngles[i];
      const px = cx + Math.cos(angle) * planet.orbitRadius * scale;
      const py = cy + Math.sin(angle) * planet.orbitRadius * scale;
      drawPlanet(ctx, px, py, planet.size * scale * 0.8, planet, time);
    });
    ctx.globalAlpha = 1;
  }

  // Ship
  drawSpaceship(ctx, w / 2, h / 2, -Math.PI / 2, 1.2, time, true);
  drawParticles(ctx, s.particles);
}

// ============================================================
// DRAWING HELPERS
// ============================================================

function drawStarfield(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  w: number,
  h: number,
  time: number,
  offsetX: number,
  offsetY: number,
  streak: number = 0
) {
  stars.forEach(star => {
    const parallax = 0.3 + star.layer * 0.35;
    const sx = ((star.x - offsetX * parallax) % w + w) % w;
    const sy = ((star.y - offsetY * parallax) % h + h) % h;
    const twinkle = Math.sin(time * 1.5 + star.x * 0.1) * 0.2 + 0.8;
    const alpha = star.brightness * twinkle;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    if (streak > 1) {
      const len = star.size * streak;
      ctx.fillRect(sx, sy, len, star.size * 0.4);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number) {
  // Outer glow
  const outer = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
  outer.addColorStop(0, 'rgba(255, 200, 50, 0.25)');
  outer.addColorStop(0.5, 'rgba(255, 100, 0, 0.08)');
  outer.addColorStop(1, 'transparent');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
  grad.addColorStop(0, '#fffbe0');
  grad.addColorStop(0.4, '#ffdd00');
  grad.addColorStop(0.8, '#ff8c00');
  grad.addColorStop(1, '#ff4500');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Corona
  ctx.save();
  ctx.globalAlpha = 0.2 + Math.sin(time * 2) * 0.05;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + time * 0.3;
    const len = r * (1.2 + Math.sin(time * 2.5 + i) * 0.3);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * r * 0.9, y + Math.sin(angle) * r * 0.9);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, planet: Planet, time: number) {
  if (r < 1) return;

  // Glow
  const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.5);
  glow.addColorStop(0, planet.color + '15');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, lighten(planet.color, 40));
  grad.addColorStop(0.6, planet.color);
  grad.addColorStop(1, planet.secondaryColor);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Surface details
  if (r > 6) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    if (!planet.hasSolidSurface) {
      // Gas giant bands
      for (let i = 0; i < 6; i++) {
        const bandY = y - r + (i + 0.5) * (r * 2 / 6);
        const bandH = r * 0.2;
        ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + '25';
        ctx.fillRect(x - r, bandY, r * 2, bandH);
      }
      // Great spot for Jupiter
      if (planet.name === 'Jupiter' && r > 15) {
        ctx.fillStyle = 'rgba(200, 60, 30, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + r * 0.3, y + r * 0.2, r * 0.25, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Rocky surface patches
      for (let i = 0; i < 4; i++) {
        const px = x + Math.cos(i * 1.8 + planet.size) * r * 0.4;
        const py = y + Math.sin(i * 2.1 + planet.size) * r * 0.3;
        ctx.fillStyle = planet.featureColors[i % planet.featureColors.length] + '20';
        ctx.beginPath();
        ctx.arc(px, py, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(x + r * 0.3, y + r * 0.1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Saturn rings
  if (planet.name === 'Saturn' && r > 4) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(210, 180, 120, 0.5)';
    ctx.lineWidth = r * 0.12;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180, 160, 100, 0.3)';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    ctx.restore();
  }
}

function drawSpaceship(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number, time: number, showEngine: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Engine glow
  if (showEngine) {
    const engineGlow = ctx.createRadialGradient(0, 14, 0, 0, 14, 18);
    engineGlow.addColorStop(0, 'rgba(80, 160, 255, 0.5)');
    engineGlow.addColorStop(0.5, 'rgba(40, 80, 200, 0.2)');
    engineGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(0, 14, 18 + Math.sin(time * 10) * 3, 0, Math.PI * 2);
    ctx.fill();

    // Flame
    const flameH = 10 + Math.sin(time * 15) * 4;
    ctx.fillStyle = `rgba(100, 200, 255, ${0.5 + Math.sin(time * 12) * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(0, 12 + flameH);
    ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 18) * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(-2, 12);
    ctx.lineTo(0, 12 + flameH * 0.6);
    ctx.lineTo(2, 12);
    ctx.closePath();
    ctx.fill();
  }

  // Body
  const bodyGrad = ctx.createLinearGradient(-8, -14, 8, 14);
  bodyGrad.addColorStop(0, '#d8dce8');
  bodyGrad.addColorStop(1, '#a0a8b8');
  ctx.fillStyle = bodyGrad;
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
  ctx.strokeStyle = '#7080a0';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Cockpit
  const cockpitGrad = ctx.createRadialGradient(0, -6, 0, 0, -6, 5);
  cockpitGrad.addColorStop(0, '#a0e0ff');
  cockpitGrad.addColorStop(1, '#3060a0');
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.ellipse(0, -6, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = '#b0b8c8';
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

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ============================================================
// UTILITIES
// ============================================================

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function lerpColor(a: string, b: string, t: number): string {
  const an = parseInt(a.replace('#', ''), 16);
  const bn = parseInt(b.replace('#', ''), 16);
  const r = Math.round(((an >> 16) & 0xff) + (((bn >> 16) & 0xff) - ((an >> 16) & 0xff)) * t);
  const g = Math.round(((an >> 8) & 0xff) + (((bn >> 8) & 0xff) - ((an >> 8) & 0xff)) * t);
  const bl = Math.round((an & 0xff) + ((bn & 0xff) - (an & 0xff)) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
