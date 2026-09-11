import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from './game/useGame';
import { renderGame } from './game/renderer';
import { planets, ORBITAL_SPEEDS } from './game/types';

export default function App() {
  const {
    state,
    terrainRef,
    starsRef,
    setCanvasSize,
    beginExpedition,
    selectPlanet,
    launchMission,
    beginLanding,
    beginSurface,
    returnToShip,
    keysRef,
  } = useGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const [mobileControls, setMobileControls] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setMobileControls(window.innerWidth < 768 || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Canvas resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
      setCanvasSize(w, h);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [setCanvasSize]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const render = () => {
      timeRef.current += 0.016;
      renderGame(ctx, state, terrainRef.current, starsRef.current, canvas.width, canvas.height, timeRef.current);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [state, terrainRef, starsRef]);

  // Surface space key handler for takeoff
  useEffect(() => {
    if (state.mode !== 'surface') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && state.nearShip && state.missionProgress >= state.missionTarget) {
        e.preventDefault();
        returnToShip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.mode, state.nearShip, state.missionProgress, state.missionTarget, returnToShip]);

  // Mobile touch controls
  const handleTouch = useCallback((dir: string, pressed: boolean) => {
    const k = keysRef.current;
    switch (dir) {
      case 'up': k.up = pressed; break;
      case 'down': k.down = pressed; break;
      case 'left': k.left = pressed; break;
      case 'right': k.right = pressed; break;
      case 'space':
        if (pressed) {
          k.space = true;
          // Also handle takeoff on mobile
          if (state.mode === 'surface' && state.nearShip && state.missionProgress >= state.missionTarget) {
            returnToShip();
          }
        }
        break;
    }
  }, [keysRef, state.mode, state.nearShip, state.missionProgress, state.missionTarget, returnToShip]);

  const selectedPlanet = state.selectedPlanetIndex !== null ? planets[state.selectedPlanetIndex] : null;

  return (
    <div className="w-full h-screen bg-gray-950 overflow-hidden relative flex flex-col select-none">
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ============ INTRO OVERLAY ============ */}
        {state.mode === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900/95 border border-blue-900/50 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl shadow-blue-900/20 animate-fade-in">
              <div className="text-4xl mb-4">🚀</div>
              <h1 className="text-2xl font-bold text-white mb-2">COMMANDER'S LOG</h1>
              <div className="w-16 h-0.5 bg-blue-500/50 mx-auto mb-4" />
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Your mission is to explore the Solar System, land on planets, collect scientific data, and return safely to Earth.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Use WASD or Arrow Keys to move. Press SPACE to interact.
              </p>
              <button
                onClick={beginExpedition}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
              >
                BEGIN EXPEDITION
              </button>
            </div>
          </div>
        )}

        {/* ============ MISSION PANEL (Solar System) ============ */}
        {state.mode === 'solar-system' && selectedPlanet && (
          <div className="absolute top-4 right-4 w-72 md:w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-2xl z-30 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${selectedPlanet.color}, ${selectedPlanet.secondaryColor})`,
                  boxShadow: `0 0 10px 3px ${selectedPlanet.color}40`,
                }}
              />
              <div>
                <h2 className="text-lg font-bold text-white">{selectedPlanet.name}</h2>
                <p className="text-gray-500 text-xs">
                  {state.visitedPlanets.includes(selectedPlanet.name) ? '✓ Visited' : 'Unexplored'}
                  {state.completedMissions.includes(selectedPlanet.name) && ' • Mission Complete'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatBox label="Distance" value={selectedPlanet.distanceFromSun} />
              <StatBox label="Gravity" value={selectedPlanet.gravity} />
              <StatBox label="Temperature" value={selectedPlanet.temperature} />
              <StatBox label="Atmosphere" value={selectedPlanet.atmosphere} />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
              <div className="text-gray-500 text-xs mb-1">MISSION OBJECTIVE</div>
              <div className="text-blue-300 text-sm font-medium">{selectedPlanet.mission}</div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-gray-500 text-xs">Difficulty:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-xs ${i < selectedPlanet.difficulty ? 'text-red-400' : 'text-gray-700'}`}>
                    ●
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={launchMission}
              disabled={state.fuel < selectedPlanet.difficulty * 5}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20 disabled:shadow-none"
            >
              {state.fuel < selectedPlanet.difficulty * 5 ? 'INSUFFICIENT FUEL' : '🚀 LAUNCH MISSION'}
            </button>
          </div>
        )}

        {/* ============ SOLAR SYSTEM PLANET LIST ============ */}
        {state.mode === 'solar-system' && (
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-center gap-1 z-20">
            {planets.map((planet, i) => (
              <button
                key={planet.name}
                onClick={() => selectPlanet(i)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  state.selectedPlanetIndex === i
                    ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-white'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: planet.color }} />
                {planet.name}
                {state.completedMissions.includes(planet.name) && ' ✓'}
              </button>
            ))}
          </div>
        )}

        {/* ============ ORBIT HUD ============ */}
        {state.mode === 'orbit' && state.currentPlanet && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 animate-fade-in">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-blue-400 text-sm font-bold mb-2">ORBITING {state.currentPlanet.name.toUpperCase()}</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Altitude</span>
                  <span className="text-white">{Math.round(state.orbitAltitude)} km</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Velocity</span>
                  <span className="text-white">{ORBITAL_SPEEDS[state.currentPlanet.name] || '0'} km/s</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Landing Difficulty</span>
                  <span className="text-yellow-400">{'●'.repeat(state.currentPlanet.difficulty)}{'○'.repeat(5 - state.currentPlanet.difficulty)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={beginLanding}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/30 animate-pulse-slow"
            >
              ↓ BEGIN LANDING
            </button>
          </div>
        )}

        {/* ============ LANDING HUD ============ */}
        {state.mode === 'landing' && state.currentPlanet && (
          <div className="absolute top-4 left-4 z-30 animate-fade-in">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-orange-700/50 rounded-xl p-4">
              <h3 className="text-orange-400 text-sm font-bold mb-2">LANDING — {state.currentPlanet.name.toUpperCase()}</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-gray-500 text-xs mb-1">ALTITUDE</div>
                  <div className="w-40 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all"
                      style={{ width: `${state.landingAltitude / 5}%` }}
                    />
                  </div>
                  <div className="text-white text-xs mt-0.5">{Math.round(state.landingAltitude)} m</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">VERTICAL SPEED</div>
                  <div className="text-orange-300 text-xs">-{Math.round(42 + state.landingProgress * 20)} m/s</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">STATUS</div>
                  <div className="text-green-400 text-xs font-bold">
                    {state.landingProgress < 0.9 ? 'DESCENDING...' : 'TOUCHDOWN!'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ LANDING COMPLETE ============ */}
        {state.mode === 'landing' && state.landingProgress >= 1 && (
          <div className="absolute inset-0 flex items-center justify-center z-40 animate-fade-in">
            <div className="bg-gray-900/95 backdrop-blur-sm border border-green-700/50 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🛬</div>
              <h3 className="text-green-400 text-lg font-bold mb-1">LANDED ON {state.currentPlanet?.name.toUpperCase()}</h3>
              <p className="text-gray-400 text-xs mb-4">Systems nominal. Ready for exploration.</p>
              <button
                onClick={beginSurface}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                BEGIN EXPLORATION →
              </button>
            </div>
          </div>
        )}

        {/* ============ SURFACE HUD ============ */}
        {state.mode === 'surface' && state.currentPlanet && (
          <>
            {/* Mission panel */}
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 max-w-xs">
                <h3 className="text-white text-sm font-bold mb-1">
                  📡 {state.currentPlanet.name.toUpperCase()}
                </h3>
                <div className="text-gray-400 text-xs mb-2">{state.currentPlanet.mission}</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">PROGRESS</span>
                  <div className="flex gap-1">
                    {Array.from({ length: state.missionTarget }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-3 h-3 rounded-full border ${
                          i < state.missionProgress
                            ? 'bg-green-500 border-green-400'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white text-xs">{state.missionProgress}/{state.missionTarget}</span>
                </div>
              </div>
            </div>

            {/* Controls help */}
            <div className="absolute bottom-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/30 rounded-lg p-2.5 text-xs text-gray-500">
                {mobileControls ? 'Use joystick to move • Tap SCAN to interact' : 'WASD/Arrows: Move • SPACE: Scan/Interact'}
              </div>
            </div>

            {/* Mission complete overlay */}
            {state.missionProgress >= state.missionTarget && (
              <div className="absolute top-4 right-4 z-30 animate-fade-in">
                <div className="bg-gray-900/95 backdrop-blur-sm border border-yellow-600/50 rounded-xl p-4">
                  <div className="text-yellow-400 text-sm font-bold mb-1">🏆 MISSION COMPLETE!</div>
                  <div className="text-green-400 text-xs mb-2">+250 Research Points</div>
                  <div className="text-gray-400 text-xs">Return to ship to take off</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ TRAVEL HUD ============ */}
        {(state.mode === 'travel' || state.mode === 'return-travel') && state.currentPlanet && (
          <div className="absolute top-4 left-4 z-30 animate-fade-in">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-blue-700/50 rounded-xl p-4">
              <h3 className="text-blue-400 text-sm font-bold mb-2">
                {state.mode === 'travel' ? `→ TRAVELING TO ${state.currentPlanet.name.toUpperCase()}` : '→ RETURNING TO EARTH'}
              </h3>
              <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${state.travelProgress * 100}%` }}
                />
              </div>
              <div className="text-gray-400 text-xs">
                Progress: {Math.round(state.travelProgress * 100)}%
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Speed: {Math.round(100 + state.travelProgress * 200)} km/s
              </div>
            </div>
          </div>
        )}

        {/* ============ RETURN ORBIT ============ */}
        {state.mode === 'return-orbit' && (
          <div className="absolute top-4 left-4 z-30 animate-fade-in">
            <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-blue-400 text-sm font-bold">DEPARTING ORBIT</h3>
              <div className="text-gray-400 text-xs mt-1">Setting course for Earth...</div>
            </div>
          </div>
        )}

        {/* ============ GLOBAL HUD (always visible except intro) ============ */}
        {state.mode !== 'intro' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/30 rounded-full px-5 py-2 flex items-center gap-4 text-xs">
              <HudItem label="RESEARCH" value={state.researchPoints.toString()} color="text-yellow-400" />
              <div className="w-px h-4 bg-gray-700" />
              <HudItem label="PLANETS" value={`${state.visitedPlanets.length}/8`} color="text-blue-400" />
              <div className="w-px h-4 bg-gray-700" />
              <HudItem label="FUEL" value={`${Math.round(state.fuel)}%`} color={state.fuel < 20 ? 'text-red-400' : 'text-green-400'} />
              <div className="w-px h-4 bg-gray-700" />
              <HudItem label="HULL" value={`${Math.round(state.hull)}%`} color="text-cyan-400" />
            </div>
          </div>
        )}

        {/* ============ MESSAGE ============ */}
        {state.message && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-gray-900/95 backdrop-blur-sm border border-green-600/50 rounded-lg px-4 py-2 text-green-400 text-sm font-medium shadow-lg">
              {state.message}
            </div>
          </div>
        )}

        {/* ============ MOBILE CONTROLS ============ */}
        {mobileControls && state.mode === 'surface' && (
          <div className="absolute bottom-20 right-4 z-40">
            <div className="grid grid-cols-3 gap-1 w-36">
              <div />
              <button
                onTouchStart={() => handleTouch('up', true)}
                onTouchEnd={() => handleTouch('up', false)}
                className="w-11 h-11 bg-gray-800/80 rounded-lg flex items-center justify-center text-white text-lg active:bg-gray-700"
              >
                ↑
              </button>
              <div />
              <button
                onTouchStart={() => handleTouch('left', true)}
                onTouchEnd={() => handleTouch('left', false)}
                className="w-11 h-11 bg-gray-800/80 rounded-lg flex items-center justify-center text-white text-lg active:bg-gray-700"
              >
                ←
              </button>
              <button
                onTouchStart={() => handleTouch('space', true)}
                onTouchEnd={() => handleTouch('space', false)}
                className="w-11 h-11 bg-blue-700/80 rounded-lg flex items-center justify-center text-white text-xs font-bold active:bg-blue-600"
              >
                SCAN
              </button>
              <button
                onTouchStart={() => handleTouch('right', true)}
                onTouchEnd={() => handleTouch('right', false)}
                className="w-11 h-11 bg-gray-800/80 rounded-lg flex items-center justify-center text-white text-lg active:bg-gray-700"
              >
                →
              </button>
              <div />
              <button
                onTouchStart={() => handleTouch('down', true)}
                onTouchEnd={() => handleTouch('down', false)}
                className="w-11 h-11 bg-gray-800/80 rounded-lg flex items-center justify-center text-white text-lg active:bg-gray-700"
              >
                ↓
              </button>
              <div />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function HudItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/40 rounded-lg p-2">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className="text-white text-xs font-medium truncate">{value}</div>
    </div>
  );
}
