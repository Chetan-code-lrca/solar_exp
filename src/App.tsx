import { useState, useEffect, useCallback, useRef } from 'react';

interface Planet {
  name: string;
  color: string;
  size: number; // visual size in px
  orbitRadius: number; // visual orbit radius in px
  realDiameter: string; // km
  distanceFromSun: string; // million km
  orbitalPeriod: string;
  orbitalPeriodDays: number;
  description: string;
  emoji: string;
  ringColor?: string;
}

const planets: Planet[] = [
  {
    name: 'Mercury',
    color: '#b5b5b5',
    size: 8,
    orbitRadius: 70,
    realDiameter: '4,879 km',
    distanceFromSun: '57.9 million km',
    orbitalPeriod: '88 days',
    orbitalPeriodDays: 88,
    description: 'The smallest planet and closest to the Sun. It has no atmosphere and extreme temperature variations.',
    emoji: '☿',
  },
  {
    name: 'Venus',
    color: '#e8cda0',
    size: 12,
    orbitRadius: 105,
    realDiameter: '12,104 km',
    distanceFromSun: '108.2 million km',
    orbitalPeriod: '225 days',
    orbitalPeriodDays: 225,
    description: 'The hottest planet with a thick toxic atmosphere. It rotates backwards compared to most planets.',
    emoji: '♀',
  },
  {
    name: 'Earth',
    color: '#4fa4e8',
    size: 13,
    orbitRadius: 145,
    realDiameter: '12,756 km',
    distanceFromSun: '149.6 million km',
    orbitalPeriod: '365.25 days',
    orbitalPeriodDays: 365,
    description: 'Our home planet! The only known planet with liquid water on its surface and life.',
    emoji: '🌍',
  },
  {
    name: 'Mars',
    color: '#e07040',
    size: 10,
    orbitRadius: 185,
    realDiameter: '6,792 km',
    distanceFromSun: '227.9 million km',
    orbitalPeriod: '687 days',
    orbitalPeriodDays: 687,
    description: 'The Red Planet, named for its rusty color. It has the largest volcano in the solar system.',
    emoji: '♂',
  },
  {
    name: 'Jupiter',
    color: '#d4a574',
    size: 28,
    orbitRadius: 245,
    realDiameter: '142,984 km',
    distanceFromSun: '778.6 million km',
    orbitalPeriod: '11.86 years',
    orbitalPeriodDays: 4333,
    description: 'The largest planet with a Great Red Spot storm. It has at least 95 known moons.',
    emoji: '♃',
  },
  {
    name: 'Saturn',
    color: '#e8d5a0',
    size: 24,
    orbitRadius: 310,
    realDiameter: '120,536 km',
    distanceFromSun: '1,433.5 million km',
    orbitalPeriod: '29.46 years',
    orbitalPeriodDays: 10759,
    description: 'Famous for its beautiful ring system made of ice and rock. It could float in water!',
    emoji: '♄',
    ringColor: 'rgba(210, 180, 120, 0.5)',
  },
  {
    name: 'Uranus',
    color: '#7de8e8',
    size: 18,
    orbitRadius: 370,
    realDiameter: '51,118 km',
    distanceFromSun: '2,872.5 million km',
    orbitalPeriod: '84.01 years',
    orbitalPeriodDays: 30687,
    description: 'An ice giant that rotates on its side. It has a blue-green color from methane in its atmosphere.',
    emoji: '♅',
  },
  {
    name: 'Neptune',
    color: '#4060e0',
    size: 17,
    orbitRadius: 420,
    realDiameter: '49,528 km',
    distanceFromSun: '4,495.1 million km',
    orbitalPeriod: '164.8 years',
    orbitalPeriodDays: 60190,
    description: 'The windiest planet with speeds up to 2,100 km/h. It has a vivid blue color.',
    emoji: '♆',
  },
];

export default function App() {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [angles, setAngles] = useState<number[]>(
    planets.map(() => Math.random() * 360)
  );
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [showStars, setShowStars] = useState<{ x: number; y: number; size: number; opacity: number }[]>([]);

  // Generate stars
  useEffect(() => {
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
    }));
    setShowStars(stars);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setAngles(prev =>
        prev.map((angle, i) => {
          // Base speed: Earth completes orbit in ~20 seconds at speed 1
          const baseSpeed = (360 / (planets[i].orbitalPeriodDays / 365 * 20)) * (delta / 1000);
          return (angle + baseSpeed * speed) % 360;
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [isPlaying, speed]);

  const handlePlanetClick = useCallback((planet: Planet) => {
    setSelectedPlanet(prev => prev?.name === planet.name ? null : planet);
  }, []);

  const getPlanetPosition = (planet: Planet, index: number) => {
    const angle = (angles[index] * Math.PI) / 180;
    const x = Math.cos(angle) * planet.orbitRadius;
    const y = Math.sin(angle) * planet.orbitRadius;
    return { x, y };
  };

  return (
    <div className="w-full h-screen bg-gray-950 overflow-hidden relative flex flex-col">
      {/* Star background */}
      <div className="absolute inset-0 overflow-hidden">
        {showStars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 text-center py-3 px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
          🌌 Interactive Solar System Explorer
        </h1>
        <p className="text-gray-400 text-sm mt-1">Click on any planet to learn more about it</p>
      </header>

      {/* Main content */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Solar System Container */}
        <div className="relative" style={{ width: '860px', height: '860px' }}>
          {/* Sun */}
          <div
            className="absolute rounded-full cursor-pointer"
            style={{
              width: '50px',
              height: '50px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, #fff700 0%, #ff8c00 50%, #ff4500 100%)',
              boxShadow: '0 0 40px 15px rgba(255, 165, 0, 0.5), 0 0 80px 30px rgba(255, 69, 0, 0.3)',
            }}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#ff8c00' }} />
          </div>

          {/* Orbit paths */}
          {planets.map((planet, i) => (
            <div
              key={`orbit-${i}`}
              className="absolute rounded-full border border-gray-700/40"
              style={{
                width: `${planet.orbitRadius * 2}px`,
                height: `${planet.orbitRadius * 2}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}

          {/* Planets */}
          {planets.map((planet, i) => {
            const pos = getPlanetPosition(planet, i);
            const isHovered = hoveredPlanet === planet.name;
            const isSelected = selectedPlanet?.name === planet.name;
            return (
              <div
                key={planet.name}
                className="absolute cursor-pointer transition-transform duration-200"
                style={{
                  width: `${planet.size}px`,
                  height: `${planet.size}px`,
                  left: `calc(50% + ${pos.x}px - ${planet.size / 2}px)`,
                  top: `calc(50% + ${pos.y}px - ${planet.size / 2}px)`,
                  transform: `scale(${isHovered || isSelected ? 1.5 : 1})`,
                  zIndex: isHovered || isSelected ? 20 : 10,
                }}
                onClick={() => handlePlanetClick(planet)}
                onMouseEnter={() => setHoveredPlanet(planet.name)}
                onMouseLeave={() => setHoveredPlanet(null)}
              >
                {/* Planet body */}
                <div
                  className="w-full h-full rounded-full relative"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${planet.color}, ${adjustColor(planet.color, -40)})`,
                    boxShadow: isSelected
                      ? `0 0 15px 5px rgba(255,255,255,0.4), 0 0 8px 2px ${planet.color}`
                      : isHovered
                      ? `0 0 10px 3px ${planet.color}`
                      : `0 0 4px 1px ${planet.color}40`,
                  }}
                >
                  {/* Saturn's ring */}
                  {planet.ringColor && (
                    <div
                      className="absolute rounded-full border-2"
                      style={{
                        width: `${planet.size * 1.8}px`,
                        height: `${planet.size * 0.6}px`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%) rotateX(60deg)',
                        borderColor: planet.ringColor,
                        borderTop: 'none',
                      }}
                    />
                  )}
                </div>

                {/* Planet label */}
                {(isHovered || isSelected) && (
                  <div
                    className="absolute text-xs text-white font-medium whitespace-nowrap pointer-events-none"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)',
                      top: `${planet.size + 4}px`,
                      textShadow: '0 0 4px rgba(0,0,0,0.8)',
                    }}
                  >
                    {planet.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Panel */}
        {selectedPlanet && (
          <div className="absolute top-4 right-4 w-72 md:w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-5 shadow-2xl z-30 animate-fade-in">
            <button
              onClick={() => setSelectedPlanet(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${selectedPlanet.color}, ${adjustColor(selectedPlanet.color, -40)})`,
                  boxShadow: `0 0 12px 4px ${selectedPlanet.color}60`,
                }}
              />
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPlanet.name}</h2>
                <p className="text-gray-400 text-xs">Planet #{planets.indexOf(selectedPlanet) + 1} from the Sun</p>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow label="Diameter" value={selectedPlanet.realDiameter} icon="📏" />
              <InfoRow label="Distance from Sun" value={selectedPlanet.distanceFromSun} icon="☀️" />
              <InfoRow label="Orbital Period" value={selectedPlanet.orbitalPeriod} icon="🔄" />
              <InfoRow label="Orbital Speed" value={`${getOrbitalSpeed(selectedPlanet)} km/s`} icon="⚡" />
            </div>

            <p className="mt-4 text-gray-300 text-sm leading-relaxed border-t border-gray-700 pt-3">
              {selectedPlanet.description}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 py-4 px-4 flex flex-col items-center gap-3">
        {/* Speed control */}
        <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2l10 6-10 6V2z" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Speed:</span>
            {[0.25, 0.5, 1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  speed === s
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-700" />

          <button
            onClick={() => {
              setAngles(planets.map(() => Math.random() * 360));
            }}
            className="px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs transition-all"
            title="Randomize positions"
          >
            🎲 Randomize
          </button>
        </div>

        {/* Planet quick select */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {planets.map(planet => (
            <button
              key={planet.name}
              onClick={() => handlePlanetClick(planet)}
              className={`px-2 py-1 rounded-md text-xs transition-all ${
                selectedPlanet?.name === planet.name
                  ? 'bg-gray-700 text-white ring-1 ring-gray-500'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: planet.color }}
              />
              {planet.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div>
        <div className="text-gray-500 text-xs">{label}</div>
        <div className="text-white text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getOrbitalSpeed(planet: Planet): string {
  // Approximate orbital speeds in km/s
  const speeds: Record<string, string> = {
    Mercury: '47.4',
    Venus: '35.0',
    Earth: '29.8',
    Mars: '24.1',
    Jupiter: '13.1',
    Saturn: '9.7',
    Uranus: '6.8',
    Neptune: '5.4',
  };
  return speeds[planet.name] || '0';
}
