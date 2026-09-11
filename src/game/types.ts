// ============================================================
// TYPES
// ============================================================

export type GameMode =
  | 'intro'
  | 'solar-system'
  | 'launch'
  | 'travel'
  | 'orbit'
  | 'landing'
  | 'surface'
  | 'mission-complete'
  | 'return-travel'
  | 'return-orbit';

export type MissionType = 'surface' | 'atmosphere' | 'rings';

export interface Planet {
  name: string;
  color: string;
  secondaryColor: string;
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
  difficulty: number; // 1-5
  surfaceColors: string[];
  featureColors: string[];
  hasSolidSurface: boolean;
}

export interface ScanLocation {
  x: number;
  y: number;
  scanned: boolean;
  label: string;
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
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

export interface GameState {
  mode: GameMode;
  fuel: number;
  maxFuel: number;
  hull: number;
  researchPoints: number;
  visitedPlanets: string[];
  completedMissions: string[];
  currentPlanet: Planet | null;
  missionProgress: number;
  missionTarget: number;
  scanLocations: ScanLocation[];
  selectedPlanetIndex: number | null;
  showIntro: boolean;
  // Ship state
  shipX: number;
  shipY: number;
  shipAngle: number;
  shipSpeed: number;
  // Player state (surface)
  playerX: number;
  playerY: number;
  playerAngle: number;
  // Travel
  travelProgress: number;
  travelStartX: number;
  travelStartY: number;
  travelEndX: number;
  travelEndY: number;
  // Orbit
  orbitAngle: number;
  orbitAltitude: number;
  // Landing
  landingAltitude: number;
  landingProgress: number;
  // Surface world
  surfaceWorldWidth: number;
  surfaceWorldHeight: number;
  // Ship landing position on surface
  shipSurfaceX: number;
  shipSurfaceY: number;
  // Animation timers
  modeTimer: number;
  // Particles
  particles: Particle[];
  // Planet angles for solar system
  planetAngles: number[];
  // Near ship indicator
  nearShip: boolean;
  // Message
  message: string;
  messageTimer: number;
}

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

// ============================================================
// PLANET DATA
// ============================================================

export const planets: Planet[] = [
  {
    name: 'Mercury',
    color: '#b5b5b5',
    secondaryColor: '#8a8a8a',
    size: 8,
    orbitRadius: 70,
    realDiameter: '4,879 km',
    distanceFromSun: '57.9 million km',
    orbitalPeriod: '88 days',
    description: 'The smallest planet and closest to the Sun. It has no atmosphere and extreme temperature variations.',
    gravity: '3.7 m/s²',
    temperature: '167°C (avg)',
    atmosphere: 'Virtually none',
    mission: 'Scan 3 crater formations',
    missionType: 'surface',
    difficulty: 2,
    surfaceColors: ['#3a3a3a', '#4a4a4a', '#2e2e2e', '#555555'],
    featureColors: ['#666666', '#777777', '#555555'],
    hasSolidSurface: true,
  },
  {
    name: 'Venus',
    color: '#e8cda0',
    secondaryColor: '#c4a060',
    size: 12,
    orbitRadius: 105,
    realDiameter: '12,104 km',
    distanceFromSun: '108.2 million km',
    orbitalPeriod: '225 days',
    description: 'The hottest planet with a thick toxic atmosphere. It rotates backwards compared to most planets.',
    gravity: '8.87 m/s²',
    temperature: '464°C',
    atmosphere: 'CO₂, sulfuric acid clouds',
    mission: 'Collect 3 atmospheric readings',
    missionType: 'surface',
    difficulty: 4,
    surfaceColors: ['#c4883a', '#d49840', '#a87030', '#e0a050'],
    featureColors: ['#ff6030', '#ff8040', '#cc4020'],
    hasSolidSurface: true,
  },
  {
    name: 'Earth',
    color: '#4fa4e8',
    secondaryColor: '#3a8a30',
    size: 13,
    orbitRadius: 145,
    realDiameter: '12,756 km',
    distanceFromSun: '149.6 million km',
    orbitalPeriod: '365.25 days',
    description: 'Our home planet! The only known planet with liquid water on its surface and life.',
    gravity: '9.81 m/s²',
    temperature: '15°C (avg)',
    atmosphere: 'N₂, O₂',
    mission: 'Survey the landing region',
    missionType: 'surface',
    difficulty: 1,
    surfaceColors: ['#3a7a30', '#4a8a40', '#2a6a20', '#5a9a50'],
    featureColors: ['#6ab060', '#80c070', '#4a9040'],
    hasSolidSurface: true,
  },
  {
    name: 'Mars',
    color: '#e07040',
    secondaryColor: '#c05030',
    size: 10,
    orbitRadius: 185,
    realDiameter: '6,792 km',
    distanceFromSun: '227.9 million km',
    orbitalPeriod: '687 days',
    description: 'The Red Planet, named for its rusty color. It has the largest volcano in the solar system.',
    gravity: '3.71 m/s²',
    temperature: '-63°C',
    atmosphere: 'CO₂ (thin)',
    mission: 'Collect 3 geological samples',
    missionType: 'surface',
    difficulty: 3,
    surfaceColors: ['#c05030', '#d06040', '#a04020', '#e07050'],
    featureColors: ['#8a3020', '#9a4030', '#703020'],
    hasSolidSurface: true,
  },
  {
    name: 'Jupiter',
    color: '#d4a574',
    secondaryColor: '#b08050',
    size: 28,
    orbitRadius: 245,
    realDiameter: '142,984 km',
    distanceFromSun: '778.6 million km',
    orbitalPeriod: '11.86 years',
    description: 'The largest planet with a Great Red Spot storm. It has at least 95 known moons.',
    gravity: '24.79 m/s²',
    temperature: '-110°C (cloud top)',
    atmosphere: 'H₂, He, ammonia clouds',
    mission: 'Deploy atmospheric probe',
    missionType: 'atmosphere',
    difficulty: 5,
    surfaceColors: ['#c49060', '#d4a070', '#b08050', '#e0b080'],
    featureColors: ['#ff6040', '#ff8060', '#cc4020'],
    hasSolidSurface: false,
  },
  {
    name: 'Saturn',
    color: '#e8d5a0',
    secondaryColor: '#c8b070',
    size: 24,
    orbitRadius: 310,
    realDiameter: '120,536 km',
    distanceFromSun: '1,433.5 million km',
    orbitalPeriod: '29.46 years',
    description: 'Famous for its beautiful ring system made of ice and rock. It could float in water!',
    gravity: '10.44 m/s²',
    temperature: '-140°C',
    atmosphere: 'H₂, He',
    mission: 'Scan 3 ring particle samples',
    missionType: 'rings',
    difficulty: 4,
    surfaceColors: ['#d4c090', '#e0d0a0', '#c0b080', '#e8d8b0'],
    featureColors: ['#a0c0e0', '#80b0d0', '#c0d0e0'],
    hasSolidSurface: false,
  },
  {
    name: 'Uranus',
    color: '#7de8e8',
    secondaryColor: '#50c0c0',
    size: 18,
    orbitRadius: 370,
    realDiameter: '51,118 km',
    distanceFromSun: '2,872.5 million km',
    orbitalPeriod: '84.01 years',
    description: 'An ice giant that rotates on its side. It has a blue-green color from methane in its atmosphere.',
    gravity: '8.69 m/s²',
    temperature: '-195°C',
    atmosphere: 'H₂, He, methane',
    mission: 'Collect 3 atmospheric data points',
    missionType: 'atmosphere',
    difficulty: 4,
    surfaceColors: ['#40b0b0', '#50c0c0', '#30a0a0', '#60d0d0'],
    featureColors: ['#80e0e0', '#60d0d0', '#a0f0f0'],
    hasSolidSurface: false,
  },
  {
    name: 'Neptune',
    color: '#4060e0',
    secondaryColor: '#3050c0',
    size: 17,
    orbitRadius: 420,
    realDiameter: '49,528 km',
    distanceFromSun: '4,495.1 million km',
    orbitalPeriod: '164.8 years',
    description: 'The windiest planet with speeds up to 2,100 km/h. It has a vivid blue color.',
    gravity: '11.15 m/s²',
    temperature: '-200°C',
    atmosphere: 'H₂, He, methane',
    mission: 'Measure high-speed atmospheric winds',
    missionType: 'atmosphere',
    difficulty: 5,
    surfaceColors: ['#2040a0', '#3050b0', '#1030a0', '#4060c0'],
    featureColors: ['#6080e0', '#4060d0', '#80a0f0'],
    hasSolidSurface: false,
  },
];

export const ORBITAL_SPEEDS: Record<string, string> = {
  Mercury: '47.4',
  Venus: '35.0',
  Earth: '29.8',
  Mars: '24.1',
  Jupiter: '13.1',
  Saturn: '9.7',
  Uranus: '6.8',
  Neptune: '5.4',
};

export function createInitialState(): GameState {
  return {
    mode: 'intro',
    fuel: 100,
    maxFuel: 100,
    hull: 100,
    researchPoints: 0,
    visitedPlanets: [],
    completedMissions: [],
    currentPlanet: null,
    missionProgress: 0,
    missionTarget: 3,
    scanLocations: [],
    selectedPlanetIndex: null,
    showIntro: true,
    shipX: 0,
    shipY: 145, // near Earth
    shipAngle: 0,
    shipSpeed: 0,
    playerX: 1000,
    playerY: 1000,
    playerAngle: 0,
    travelProgress: 0,
    travelStartX: 0,
    travelStartY: 0,
    travelEndX: 0,
    travelEndY: 0,
    orbitAngle: 0,
    orbitAltitude: 100,
    landingAltitude: 500,
    landingProgress: 0,
    surfaceWorldWidth: 2000,
    surfaceWorldHeight: 1500,
    shipSurfaceX: 1000,
    shipSurfaceY: 750,
    modeTimer: 0,
    particles: [],
    planetAngles: planets.map(() => Math.random() * Math.PI * 2),
    nearShip: false,
    message: '',
    messageTimer: 0,
  };
}
