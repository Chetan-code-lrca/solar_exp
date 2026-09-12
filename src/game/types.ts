// ============================================================
// GAME TYPES — SOLARIS EXPEDITION
// ============================================================

export type GameMode =
  | 'menu'
  | 'solar-system'
  | 'briefing'
  | 'launch'
  | 'space-flight'
  | 'approach'
  | 'orbit'
  | 'landing'
  | 'surface'
  | 'atmospheric-probe'
  | 'mission-complete'
  | 'takeoff'
  | 'returning';

export type MissionType = 'surface' | 'atmosphere' | 'rings';

export interface Planet {
  name: string;
  color: string;
  secondaryColor: string;
  accentColor: string;
  size: number;
  orbitRadius: number;
  realDiameter: string;
  distanceFromSun: string;
  orbitalPeriod: string;
  description: string;
  gravity: string;
  temperature: string;
  atmosphere: string;
  mission: string;
  missionType: MissionType;
  difficulty: number;
  fuelCost: number;
  hasSolidSurface: boolean;
  // Surface rendering
  skyGradient: [string, string, string];
  groundColors: string[];
  featureColors: string[];
  hasAtmosphere: boolean;
  atmosphereColor: string;
  // Terrain features
  terrainType: 'craters' | 'volcanic' | 'forests' | 'dust' | 'gas' | 'rings' | 'ice';
}

export interface ScanTarget {
  id: number;
  x: number;
  y: number;
  scanned: boolean;
  label: string;
  type: 'sample' | 'formation' | 'reading' | 'probe';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type?: 'exhaust' | 'dust' | 'spark' | 'atmosphere';
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  layer: number; // parallax layer 0-2
}

export interface TerrainLayer {
  points: number[];
  color: string;
  speed: number;
  yOffset: number;
}

export interface GameState {
  mode: GameMode;
  modeTimer: number;
  prevMode: GameMode | null;

  // Progression
  fuel: number;
  hull: number;
  researchPoints: number;
  visitedPlanets: string[];
  completedMissions: string[];

  // Current mission
  currentPlanet: Planet | null;
  selectedPlanetIndex: number | null;
  missionProgress: number;
  missionTarget: number;
  scanTargets: ScanTarget[];

  // Solar system
  planetAngles: number[];
  shipSolarX: number;
  shipSolarY: number;
  shipSolarAngle: number;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
  targetCameraX: number;
  targetCameraY: number;
  targetCameraZoom: number;

  // Space flight
  flightProgress: number;
  flightDistance: number;
  flightTargetDistance: number;
  flightShipX: number;
  flightShipY: number;
  flightShipVX: number;
  flightShipVY: number;
  flightShipAngle: number;
  flightThrust: number;
  asteroids: { x: number; y: number; size: number; vx: number; vy: number }[];

  // Approach
  approachDistance: number;
  approachSpeed: number;

  // Orbit
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitTargetRadius: number;
  orbitStability: number;

  // Landing
  landingAltitude: number;
  landingVerticalSpeed: number;
  landingHorizontalSpeed: number;
  landingThrust: number;
  landingPhase: 'deorbit' | 'entry' | 'descent' | 'final' | 'touchdown' | 'crashed';
  landingShake: number;
  landingSuccess: boolean;

  // Surface
  playerX: number;
  playerY: number;
  playerVX: number;
  playerVY: number;
  playerAngle: number;
  playerMoving: boolean;
  surfaceCameraX: number;
  surfaceCameraY: number;
  worldWidth: number;
  worldHeight: number;
  landerX: number;
  landerY: number;
  nearTarget: ScanTarget | null;
  nearLander: boolean;
  terrainSeed: number;

  // Particles
  particles: Particle[];

  // UI
  message: string;
  messageTimer: number;
  messageType: 'info' | 'success' | 'warning';
  showControls: boolean;

  // Launch
  launchCountdown: number;
  launchPhase: 'countdown' | 'ignition' | 'liftoff';

  // Stars (persistent)
  stars: Star[];
  terrainLayers: TerrainLayer[];
}

// ============================================================
// PLANET DATA
// ============================================================

export const PLANETS: Planet[] = [
  {
    name: 'Mercury',
    color: '#b5b5b5',
    secondaryColor: '#8a8a8a',
    accentColor: '#d0d0d0',
    size: 8,
    orbitRadius: 70,
    realDiameter: '4,879 km',
    distanceFromSun: '57.9 million km',
    orbitalPeriod: '88 days',
    description: 'The smallest planet and closest to the Sun.',
    gravity: '3.7 m/s²',
    temperature: '167°C avg',
    atmosphere: 'Virtually none',
    mission: 'Scan 3 crater formations',
    missionType: 'surface',
    difficulty: 2,
    fuelCost: 12,
    hasSolidSurface: true,
    skyGradient: ['#0a0a15', '#1a1a2a', '#2a2a3a'],
    groundColors: ['#3a3a3a', '#4a4a4a', '#333333', '#505050'],
    featureColors: ['#606060', '#707070', '#555555', '#484848'],
    hasAtmosphere: false,
    atmosphereColor: 'transparent',
    terrainType: 'craters',
  },
  {
    name: 'Venus',
    color: '#e8cda0',
    secondaryColor: '#c4a060',
    accentColor: '#ffe0a0',
    size: 12,
    orbitRadius: 105,
    realDiameter: '12,104 km',
    distanceFromSun: '108.2 million km',
    orbitalPeriod: '225 days',
    description: 'The hottest planet with thick toxic atmosphere.',
    gravity: '8.87 m/s²',
    temperature: '464°C',
    atmosphere: 'CO₂, sulfuric acid',
    mission: 'Collect 3 atmospheric readings',
    missionType: 'surface',
    difficulty: 4,
    fuelCost: 18,
    hasSolidSurface: true,
    skyGradient: ['#4a2800', '#6a3800', '#8a4800'],
    groundColors: ['#8a5020', '#9a6030', '#7a4010', '#a07040'],
    featureColors: ['#ff5020', '#ff7040', '#cc3010', '#e06030'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(200, 120, 40, 0.15)',
    terrainType: 'volcanic',
  },
  {
    name: 'Earth',
    color: '#4fa4e8',
    secondaryColor: '#3a8a30',
    accentColor: '#80d0ff',
    size: 13,
    orbitRadius: 145,
    realDiameter: '12,756 km',
    distanceFromSun: '149.6 million km',
    orbitalPeriod: '365.25 days',
    description: 'Our home planet. The only known world with life.',
    gravity: '9.81 m/s²',
    temperature: '15°C avg',
    atmosphere: 'N₂, O₂',
    mission: 'Survey the landing region',
    missionType: 'surface',
    difficulty: 1,
    fuelCost: 5,
    hasSolidSurface: true,
    skyGradient: ['#1a3a6a', '#2a5a9a', '#4a8aca'],
    groundColors: ['#2a6a20', '#3a7a30', '#1a5a10', '#4a8a40'],
    featureColors: ['#5ab050', '#70c060', '#4a9040', '#80d070'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(100, 180, 255, 0.08)',
    terrainType: 'forests',
  },
  {
    name: 'Mars',
    color: '#e07040',
    secondaryColor: '#c05030',
    accentColor: '#ff9060',
    size: 10,
    orbitRadius: 185,
    realDiameter: '6,792 km',
    distanceFromSun: '227.9 million km',
    orbitalPeriod: '687 days',
    description: 'The Red Planet with the largest volcano.',
    gravity: '3.71 m/s²',
    temperature: '-63°C',
    atmosphere: 'CO₂ (thin)',
    mission: 'Collect 3 geological samples',
    missionType: 'surface',
    difficulty: 3,
    fuelCost: 15,
    hasSolidSurface: true,
    skyGradient: ['#2a1510', '#4a2520', '#6a3530'],
    groundColors: ['#a04020', '#b05030', '#903818', '#c06040'],
    featureColors: ['#802810', '#903820', '#702010', '#6a2a18'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(180, 80, 40, 0.06)',
    terrainType: 'dust',
  },
  {
    name: 'Jupiter',
    color: '#d4a574',
    secondaryColor: '#b08050',
    accentColor: '#ff8050',
    size: 28,
    orbitRadius: 245,
    realDiameter: '142,984 km',
    distanceFromSun: '778.6 million km',
    orbitalPeriod: '11.86 years',
    description: 'The largest planet with the Great Red Spot.',
    gravity: '24.79 m/s²',
    temperature: '-110°C',
    atmosphere: 'H₂, He, ammonia',
    mission: 'Deploy atmospheric probe',
    missionType: 'atmosphere',
    difficulty: 5,
    fuelCost: 25,
    hasSolidSurface: false,
    skyGradient: ['#3a2510', '#5a3520', '#7a4530'],
    groundColors: ['#c49060', '#d4a070', '#b08050', '#e0b080'],
    featureColors: ['#ff5030', '#ff7050', '#cc3020', '#e06040'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(200, 140, 80, 0.2)',
    terrainType: 'gas',
  },
  {
    name: 'Saturn',
    color: '#e8d5a0',
    secondaryColor: '#c8b070',
    accentColor: '#ffe8b0',
    size: 24,
    orbitRadius: 310,
    realDiameter: '120,536 km',
    distanceFromSun: '1,433.5 million km',
    orbitalPeriod: '29.46 years',
    description: 'Famous for its beautiful ring system.',
    gravity: '10.44 m/s²',
    temperature: '-140°C',
    atmosphere: 'H₂, He',
    mission: 'Scan 3 ring particle samples',
    missionType: 'rings',
    difficulty: 4,
    fuelCost: 22,
    hasSolidSurface: false,
    skyGradient: ['#1a1a2a', '#2a2a3a', '#3a3a4a'],
    groundColors: ['#d4c090', '#e0d0a0', '#c0b080', '#e8d8b0'],
    featureColors: ['#a0c0e0', '#80b0d0', '#c0d0e0', '#90b0c0'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(200, 180, 120, 0.1)',
    terrainType: 'rings',
  },
  {
    name: 'Uranus',
    color: '#7de8e8',
    secondaryColor: '#50c0c0',
    accentColor: '#a0ffff',
    size: 18,
    orbitRadius: 370,
    realDiameter: '51,118 km',
    distanceFromSun: '2,872.5 million km',
    orbitalPeriod: '84.01 years',
    description: 'An ice giant rotating on its side.',
    gravity: '8.69 m/s²',
    temperature: '-195°C',
    atmosphere: 'H₂, He, methane',
    mission: 'Collect 3 atmospheric data points',
    missionType: 'atmosphere',
    difficulty: 4,
    fuelCost: 22,
    hasSolidSurface: false,
    skyGradient: ['#0a2a2a', '#1a3a3a', '#2a4a4a'],
    groundColors: ['#40b0b0', '#50c0c0', '#30a0a0', '#60d0d0'],
    featureColors: ['#80e0e0', '#60d0d0', '#a0f0f0', '#70c8c8'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(100, 220, 220, 0.12)',
    terrainType: 'gas',
  },
  {
    name: 'Neptune',
    color: '#4060e0',
    secondaryColor: '#3050c0',
    accentColor: '#6080ff',
    size: 17,
    orbitRadius: 420,
    realDiameter: '49,528 km',
    distanceFromSun: '4,495.1 million km',
    orbitalPeriod: '164.8 years',
    description: 'The windiest planet in the solar system.',
    gravity: '11.15 m/s²',
    temperature: '-200°C',
    atmosphere: 'H₂, He, methane',
    mission: 'Measure high-speed atmospheric winds',
    missionType: 'atmosphere',
    difficulty: 5,
    fuelCost: 25,
    hasSolidSurface: false,
    skyGradient: ['#0a0a3a', '#1a1a5a', '#2a2a7a'],
    groundColors: ['#2040a0', '#3050b0', '#1030a0', '#4060c0'],
    featureColors: ['#6080e0', '#4060d0', '#80a0f0', '#5070d0'],
    hasAtmosphere: true,
    atmosphereColor: 'rgba(60, 80, 200, 0.15)',
    terrainType: 'gas',
  },
];

export function createInitialState(): GameState {
  const stars: Star[] = [];
  for (let i = 0; i < 400; i++) {
    stars.push({
      x: Math.random() * 3000 - 500,
      y: Math.random() * 3000 - 500,
      size: Math.random() * 1.8 + 0.3,
      brightness: Math.random() * 0.6 + 0.4,
      layer: Math.floor(Math.random() * 3),
    });
  }

  return {
    mode: 'menu',
    modeTimer: 0,
    prevMode: null,
    fuel: 100,
    hull: 100,
    researchPoints: 0,
    visitedPlanets: [],
    completedMissions: [],
    currentPlanet: null,
    selectedPlanetIndex: null,
    missionProgress: 0,
    missionTarget: 3,
    scanTargets: [],
    planetAngles: PLANETS.map(() => Math.random() * Math.PI * 2),
    shipSolarX: 0,
    shipSolarY: 145,
    shipSolarAngle: 0,
    cameraX: 0,
    cameraY: 0,
    cameraZoom: 1,
    targetCameraX: 0,
    targetCameraY: 0,
    targetCameraZoom: 1,
    flightProgress: 0,
    flightDistance: 0,
    flightTargetDistance: 1000,
    flightShipX: 0,
    flightShipY: 0,
    flightShipVX: 0,
    flightShipVY: 0,
    flightShipAngle: 0,
    flightThrust: 0,
    asteroids: [],
    approachDistance: 500000,
    approachSpeed: 0,
    orbitAngle: 0,
    orbitRadius: 180,
    orbitSpeed: 0.6,
    orbitTargetRadius: 180,
    orbitStability: 100,
    landingAltitude: 100000,
    landingVerticalSpeed: 0,
    landingHorizontalSpeed: 0,
    landingThrust: 0,
    landingPhase: 'deorbit',
    landingShake: 0,
    landingSuccess: false,
    playerX: 0,
    playerY: 0,
    playerVX: 0,
    playerVY: 0,
    playerAngle: 0,
    playerMoving: false,
    surfaceCameraX: 0,
    surfaceCameraY: 0,
    worldWidth: 3000,
    worldHeight: 2000,
    landerX: 1500,
    landerY: 1000,
    nearTarget: null,
    nearLander: false,
    terrainSeed: Math.random() * 10000,
    particles: [],
    message: '',
    messageTimer: 0,
    messageType: 'info',
    showControls: true,
    launchCountdown: 3,
    launchPhase: 'countdown',
    stars,
    terrainLayers: [],
  };
}
