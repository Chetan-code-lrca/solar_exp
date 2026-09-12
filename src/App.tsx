import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from './game/useGame';
import { render } from './game/renderer';
import { PLANETS } from './game/types';

export default function App() {
  const {
    state,
    canvasRef: sizeRef,
    setCanvasSize,
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
    keysRef,
  } = useGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
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
    const loop = () => {
      timeRef.current += 0.016;
      render(ctx, state, canvas.width, canvas.height, timeRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // Surface/atmospheric keyboard handler for scan/board
  useEffect(() => {
    if (state.mode !== 'surface' && state.mode !== 'mission-complete' && state.mode !== 'atmospheric-probe') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (state.nearTarget && !state.nearTarget.scanned) {
          scanTarget();
        } else if (state.nearLander && state.missionProgress >= state.missionTarget) {
          boardShip();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.mode, state.nearTarget, state.nearLander, state.missionProgress, state.missionTarget, scanTarget, boardShip]);

  // Nearest target distance
  const nearestUnscanned = state.scanTargets
    .filter(t => !t.scanned)
    .sort((a, b) => {
      const da = Math.hypot(state.playerX - a.x, state.playerY - a.y);
      const db = Math.hypot(state.playerX - b.x, state.playerY - b.y);
      return da - db;
    })[0];
  const nearestDist = nearestUnscanned
    ? Math.round(Math.hypot(state.playerX - nearestUnscanned.x, state.playerY - nearestUnscanned.y))
    : 0;

  const selectedPlanet = state.selectedPlanetIndex !== null ? PLANETS[state.selectedPlanetIndex] : null;

  return (
    <div className="w-full h-screen bg-gray-950 overflow-hidden relative flex flex-col select-none">
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ============ MENU OVERLAY ============ */}
        {state.mode === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <div className="text-center animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wider mb-2" style={{ textShadow: '0 0 30px rgba(100,150,255,0.3)' }}>
                SOLARIS EXPEDITION
              </h1>
              <p className="text-gray-400 text-sm md:text-base mb-8 max-w-md mx-auto px-4">
                Explore the Solar System.<br />
                Land where you can.<br />
                Discover what nobody has seen.
              </p>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={beginExpedition}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30 text-sm md:text-base"
                >
                  BEGIN EXPEDITION
                </button>
                <button
                  onClick={() => setShowHowToPlay(true)}
                  className="px-6 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 rounded-lg transition-all text-sm"
                >
                  HOW TO PLAY
                </button>
              </div>
            </div>

            {/* How to play modal */}
            {showHowToPlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-60" onClick={() => setShowHowToPlay(false)}>
                <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-bold mb-3">HOW TO PLAY</h3>
                  <div className="text-gray-300 text-sm space-y-2">
                    <p>• Click planets in the Solar System to select them</p>
                    <p>• Launch missions to explore each world</p>
                    <p>• Use <span className="text-blue-300">WASD</span> or <span className="text-blue-300">Arrow Keys</span> to move</p>
                    <p>• Press <span className="text-blue-300">SPACE</span> to scan samples or board ship</p>
                    <p>• Complete missions to earn Research Points</p>
                    <p>• Return to your lander and take off to continue</p>
                  </div>
                  <button
                    onClick={() => setShowHowToPlay(false)}
                    className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    GOT IT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ SOLAR SYSTEM HUD ============ */}
        {state.mode === 'solar-system' && (
          <>
            {/* Mission Control HUD */}
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3">
                <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Mission Control</div>
                <div className="space-y-1.5 text-xs">
                  <HudRow label="Research" value={state.researchPoints.toString()} color="text-yellow-400" />
                  <HudRow label="Fuel" value={`${Math.round(state.fuel)}%`} color={state.fuel < 20 ? 'text-red-400' : 'text-green-400'} />
                  <HudRow label="Hull" value={`${Math.round(state.hull)}%`} color="text-cyan-400" />
                  <HudRow label="Planets" value={`${state.visitedPlanets.length}/8`} color="text-blue-400" />
                </div>
              </div>
            </div>

            {/* Planet selection panel */}
            {selectedPlanet && (
              <div className="absolute top-4 right-4 w-64 md:w-72 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 z-30 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${selectedPlanet.color}, ${selectedPlanet.secondaryColor})`,
                      boxShadow: `0 0 8px 2px ${selectedPlanet.color}40`,
                    }}
                  />
                  <div>
                    <h2 className="text-white font-bold text-sm">{selectedPlanet.name}</h2>
                    <p className="text-gray-500 text-[10px]">
                      {state.visitedPlanets.includes(selectedPlanet.name) ? '✓ Visited' : 'Unexplored'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <MiniStat label="Distance" value={selectedPlanet.distanceFromSun} />
                  <MiniStat label="Gravity" value={selectedPlanet.gravity} />
                  <MiniStat label="Temp" value={selectedPlanet.temperature} />
                  <MiniStat label="Atmo" value={selectedPlanet.atmosphere} />
                </div>

                <div className="bg-gray-800/40 rounded-lg p-2 mb-3">
                  <div className="text-gray-500 text-[10px]">MISSION</div>
                  <div className="text-blue-300 text-xs">{selectedPlanet.mission}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-gray-500 text-[10px]">Difficulty:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-[8px] ${i < selectedPlanet.difficulty ? 'text-red-400' : 'text-gray-700'}`}>●</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={openBriefing}
                  className="w-full py-2 bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  SELECT DESTINATION →
                </button>
              </div>
            )}

            {/* Planet quick-select bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <div className="flex flex-wrap justify-center gap-1 bg-gray-900/60 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-800/50">
                {PLANETS.map((planet, i) => (
                  <button
                    key={planet.name}
                    onClick={() => selectPlanet(i)}
                    className={`px-2 py-1 rounded-md text-[10px] transition-all ${
                      state.selectedPlanetIndex === i
                        ? 'bg-blue-600/60 text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: planet.color }} />
                    {planet.name}
                    {state.completedMissions.includes(planet.name) && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============ BRIEFING OVERLAY ============ */}
        {state.mode === 'briefing' && selectedPlanet && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900/95 border border-blue-900/50 rounded-xl p-6 max-w-sm mx-4 animate-fade-in">
              <h2 className="text-blue-400 text-lg font-bold mb-1">{selectedPlanet.name.toUpperCase()} EXPEDITION</h2>
              <div className="w-12 h-0.5 bg-blue-500/50 mb-4" />

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Destination:</span>
                  <span className="text-white ml-2">{selectedPlanet.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Mission:</span>
                  <p className="text-blue-300 mt-0.5">{selectedPlanet.mission}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Flight Difficulty:</span>
                  <span className="text-yellow-400 ml-2">
                    {'★'.repeat(selectedPlanet.difficulty)}{'☆'.repeat(5 - selectedPlanet.difficulty)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Estimated Fuel:</span>
                  <span className={`ml-2 ${state.fuel < selectedPlanet.fuelCost ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedPlanet.fuelCost}%
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <span className="text-yellow-500 text-xs">⚠ Warning:</span>
                  <span className="text-gray-400 text-xs ml-1">{selectedPlanet.atmosphere}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={launchMission}
                  disabled={state.fuel < selectedPlanet.fuelCost}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-all text-sm"
                >
                  {state.fuel < selectedPlanet.fuelCost ? 'LOW FUEL' : '🚀 LAUNCH MISSION'}
                </button>
                <button
                  onClick={cancelBriefing}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-all text-sm"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ LAUNCH HUD ============ */}
        {state.mode === 'launch' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-700/40 rounded-lg px-4 py-2 text-center">
              <div className="text-orange-400 text-xs font-bold">
                {state.launchPhase === 'countdown' && `T-${Math.ceil(state.launchCountdown)}`}
                {state.launchPhase === 'ignition' && 'ENGINE IGNITION'}
                {state.launchPhase === 'liftoff' && 'LIFTOFF!'}
              </div>
            </div>
          </div>
        )}

        {/* ============ SPACE FLIGHT HUD ============ */}
        {state.mode === 'space-flight' && (
          <>
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-blue-700/40 rounded-xl p-3">
                <div className="text-blue-400 text-[10px] uppercase tracking-wider mb-2">Navigation</div>
                <div className="space-y-1.5 text-xs">
                  <HudRow label="Destination" value={state.currentPlanet?.name || ''} color="text-white" />
                  <HudRow label="Distance" value={formatDistance(state.flightTargetDistance * (1 - state.flightProgress))} color="text-blue-300" />
                  <HudRow label="Thrust" value={state.flightThrust > 0 ? 'ACTIVE' : 'OFF'} color={state.flightThrust > 0 ? 'text-orange-400' : 'text-gray-500'} />
                </div>
                <div className="mt-2">
                  <div className="text-gray-500 text-[10px] mb-1">PROGRESS</div>
                  <div className="w-36 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${state.flightProgress * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right HUD */}
            <div className="absolute top-4 right-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3">
                <div className="space-y-1.5 text-xs">
                  <BarRow label="FUEL" value={state.fuel} max={100} color="bg-green-500" />
                  <BarRow label="HULL" value={state.hull} max={100} color="bg-cyan-500" />
                </div>
              </div>
            </div>

            {/* Controls hint */}
            {!isMobile && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className="text-gray-600 text-[10px]">WASD: Thrust • Avoid asteroids!</div>
              </div>
            )}
          </>
        )}

        {/* ============ APPROACH HUD ============ */}
        {state.mode === 'approach' && state.currentPlanet && (
          <div className="absolute top-4 left-4 z-30">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3">
              <div className="text-white text-xs font-bold mb-1">APPROACHING {state.currentPlanet.name.toUpperCase()}</div>
              <div className="text-blue-300 text-xs">{formatDistance(state.approachDistance)}</div>
            </div>
          </div>
        )}

        {/* ============ ORBIT HUD ============ */}
        {state.mode === 'orbit' && state.currentPlanet && (
          <>
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-blue-700/40 rounded-xl p-3">
                <div className="text-blue-400 text-[10px] uppercase tracking-wider mb-2">{state.currentPlanet.name} Orbit</div>
                <div className="space-y-1.5 text-xs">
                  <HudRow label="Altitude" value={`${Math.round(state.orbitRadius)} km`} color="text-white" />
                  <HudRow label="Velocity" value={`${(state.orbitSpeed * 5.7).toFixed(1)} km/s`} color="text-cyan-300" />
                  <HudRow label="Stability" value={`${Math.round(state.orbitStability)}%`} color={state.orbitStability < 50 ? 'text-red-400' : 'text-green-400'} />
                  <HudRow label="Fuel" value={`${Math.round(state.fuel)}%`} color={state.fuel < 20 ? 'text-red-400' : 'text-green-400'} />
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <div className="text-green-400 text-[10px]">● LANDING WINDOW AVAILABLE</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
              <button
                onClick={beginLanding}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/20 text-sm"
              >
                {state.currentPlanet.hasSolidSurface ? '↓ BEGIN LANDING' : '↓ DEPLOY PROBE'}
              </button>
              <button
                onClick={continueOrbit}
                className="px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 rounded-lg transition-all text-sm"
              >
                CONTINUE ORBIT
              </button>
            </div>

            {/* Controls hint */}
            {!isMobile && (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="text-gray-600 text-[10px]">W/S: Adjust altitude • A/D: Adjust speed</div>
              </div>
            )}
          </>
        )}

        {/* ============ LANDING HUD ============ */}
        {state.mode === 'landing' && state.currentPlanet && (
          <>
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-700/40 rounded-xl p-3">
                <div className="text-orange-400 text-[10px] uppercase tracking-wider mb-2">Landing — {state.currentPlanet.name}</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-gray-500 text-[10px]">PHASE</div>
                    <div className="text-white text-xs font-bold uppercase">{state.landingPhase}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">ALTITUDE</div>
                    <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all" style={{ width: `${Math.min(100, state.landingAltitude / 1000)}%` }} />
                    </div>
                    <div className="text-white text-[10px] mt-0.5">{formatAltitude(state.landingAltitude)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">VERTICAL SPEED</div>
                    <div className={`text-xs font-bold ${Math.abs(state.landingVerticalSpeed) > 30 ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.round(state.landingVerticalSpeed)} m/s
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">HORIZONTAL SPEED</div>
                    <div className={`text-xs font-bold ${Math.abs(state.landingHorizontalSpeed) > 20 ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.round(state.landingHorizontalSpeed)} m/s
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">THRUST</div>
                    <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all" style={{ width: `${state.landingThrust * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">FUEL</div>
                    <div className={`text-xs font-bold ${state.fuel < 20 ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.round(state.fuel)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Landing warnings */}
            {(Math.abs(state.landingVerticalSpeed) > 30 || Math.abs(state.landingHorizontalSpeed) > 20) && state.landingAltitude < 1000 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                <div className="bg-red-900/80 border border-red-500 rounded-lg px-4 py-2 animate-pulse">
                  <div className="text-red-200 text-sm font-bold">⚠ TOO FAST</div>
                  <div className="text-red-300 text-xs">Slow descent before landing!</div>
                </div>
              </div>
            )}

            {/* Controls hint */}
            {!isMobile && (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="text-gray-600 text-[10px]">W: Thrust up • A/D: Horizontal correction</div>
              </div>
            )}
          </>
        )}

        {/* ============ SURFACE HUD ============ */}
        {(state.mode === 'surface' || state.mode === 'mission-complete') && state.currentPlanet && (
          <>
            {/* Mission panel */}
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3 max-w-[220px]">
                <div className="text-white text-[10px] uppercase tracking-wider mb-1">Mission</div>
                <div className="text-gray-300 text-xs mb-2">{state.currentPlanet.mission}</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[10px]">Progress</span>
                  <div className="flex gap-1">
                    {Array.from({ length: state.missionTarget }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border ${
                          i < state.missionProgress ? 'bg-green-500 border-green-400' : 'bg-gray-800 border-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {nearestUnscanned && state.mode === 'surface' && (
                  <div className="mt-2 pt-2 border-t border-gray-700/40">
                    <div className="text-gray-500 text-[10px]">Nearest Target</div>
                    <div className="text-blue-300 text-xs">{nearestUnscanned.label} — {nearestDist}m</div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="absolute top-4 right-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3">
                <div className="space-y-1 text-xs">
                  <HudRow label="Research" value={state.researchPoints.toString()} color="text-yellow-400" />
                  <HudRow label="Fuel" value={`${Math.round(state.fuel)}%`} color="text-green-400" />
                </div>
              </div>
            </div>

            {/* Controls hint */}
            {!isMobile && (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="text-gray-600 text-[10px]">WASD: Move • SPACE: Interact</div>
              </div>
            )}
          </>
        )}

        {/* ============ ATMOSPHERIC PROBE HUD ============ */}
        {state.mode === 'atmospheric-probe' && state.currentPlanet && (
          <>
            {/* Mission panel */}
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-blue-700/40 rounded-xl p-3 max-w-[220px]">
                <div className="text-blue-400 text-[10px] uppercase tracking-wider mb-1">Atmospheric Probe</div>
                <div className="text-gray-300 text-xs mb-2">{state.currentPlanet.mission}</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[10px]">Progress</span>
                  <div className="flex gap-1">
                    {Array.from({ length: state.missionTarget }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border ${
                          i < state.missionProgress ? 'bg-blue-500 border-blue-400' : 'bg-gray-800 border-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Probe stats */}
            <div className="absolute top-4 right-4 z-30">
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3">
                <div className="space-y-1.5 text-xs">
                  <HudRow label="Altitude" value={`${Math.round(state.landingAltitude / 1000)}km`} color="text-blue-300" />
                  <HudRow label="V-Speed" value={`${Math.round(state.landingVerticalSpeed)}m/s`} color={Math.abs(state.landingVerticalSpeed) > 50 ? 'text-red-400' : 'text-green-400'} />
                  <HudRow label="H-Speed" value={`${Math.round(state.landingHorizontalSpeed)}m/s`} color="text-cyan-300" />
                  <HudRow label="Fuel" value={`${Math.round(state.fuel)}%`} color={state.fuel < 20 ? 'text-red-400' : 'text-green-400'} />
                </div>
              </div>
            </div>

            {/* Controls hint */}
            {!isMobile && (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="text-gray-600 text-[10px]">W/S: Thrust • A/D: Horizontal • SPACE: Collect</div>
              </div>
            )}
          </>
        )}

        {/* ============ MISSION COMPLETE OVERLAY ============ */}
        {state.mode === 'mission-complete' && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
            <div className="bg-gray-900/95 backdrop-blur-sm border border-yellow-600/50 rounded-xl p-5 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <h3 className="text-yellow-400 font-bold text-sm">MISSION COMPLETE</h3>
              <p className="text-gray-400 text-xs mt-1">{state.currentPlanet?.name} survey complete.</p>
              <p className="text-green-400 text-xs mt-1">+300 bonus RP on return</p>
              <button
                onClick={() => {
                  // For atmospheric probes, go directly to returning
                  if (!state.currentPlanet?.hasSolidSurface) {
                    boardShip();
                  } else {
                    returnFromComplete();
                  }
                }}
                className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition-all"
              >
                {state.currentPlanet?.hasSolidSurface ? 'RETURN TO LANDER →' : 'RETURN TO ORBIT →'}
              </button>
            </div>
          </div>
        )}

        {/* ============ TAKEOFF HUD ============ */}
        {state.mode === 'takeoff' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-orange-700/40 rounded-lg px-4 py-2 text-center">
              <div className="text-orange-400 text-xs font-bold">TAKING OFF...</div>
            </div>
          </div>
        )}

        {/* ============ RETURNING HUD ============ */}
        {state.mode === 'returning' && (
          <div className="absolute top-4 left-4 z-30">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-blue-700/40 rounded-xl p-3">
              <div className="text-blue-400 text-xs font-bold">RETURNING TO SOLAR SYSTEM</div>
              <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${state.flightProgress * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* ============ GLOBAL HUD ============ */}
        {state.mode !== 'menu' && state.mode !== 'solar-system' && state.mode !== 'briefing' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-700/30 rounded-full px-4 py-1.5 flex items-center gap-3 text-[10px]">
              <span className="text-gray-500">RP</span>
              <span className="text-yellow-400 font-bold">{state.researchPoints}</span>
              <div className="w-px h-3 bg-gray-700" />
              <span className="text-gray-500">FUEL</span>
              <span className={`font-bold ${state.fuel < 20 ? 'text-red-400' : 'text-green-400'}`}>{Math.round(state.fuel)}%</span>
              <div className="w-px h-3 bg-gray-700" />
              <span className="text-gray-500">HULL</span>
              <span className="text-cyan-400 font-bold">{Math.round(state.hull)}%</span>
            </div>
          </div>
        )}

        {/* ============ MESSAGE ============ */}
        {state.message && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className={`backdrop-blur-sm border rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
              state.messageType === 'success' ? 'bg-gray-900/90 border-green-600/50 text-green-400' :
              state.messageType === 'warning' ? 'bg-gray-900/90 border-yellow-600/50 text-yellow-400' :
              'bg-gray-900/90 border-blue-600/50 text-blue-300'
            }`}>
              {state.message}
            </div>
          </div>
        )}

        {/* ============ MOBILE CONTROLS ============ */}
        {isMobile && (state.mode === 'surface' || state.mode === 'mission-complete' || state.mode === 'space-flight' || state.mode === 'orbit' || state.mode === 'landing' || state.mode === 'atmospheric-probe') && (
          <div className="absolute bottom-6 right-4 z-40">
            <div className="grid grid-cols-3 gap-1 w-32">
              <div />
              <MobileBtn label="↑" onPress={() => setMobileKey('up', true)} onRelease={() => setMobileKey('up', false)} />
              <div />
              <MobileBtn label="←" onPress={() => setMobileKey('left', true)} onRelease={() => setMobileKey('left', false)} />
              <MobileBtn label="●" onPress={() => {
                setMobileKey('space', true);
                if (state.nearTarget && !state.nearTarget.scanned) scanTarget();
                else if (state.nearLander && state.missionProgress >= state.missionTarget) boardShip();
              }} onRelease={() => setMobileKey('space', false)} highlight />
              <MobileBtn label="→" onPress={() => setMobileKey('right', true)} onRelease={() => setMobileKey('right', false)} />
              <div />
              <MobileBtn label="↓" onPress={() => setMobileKey('down', true)} onRelease={() => setMobileKey('down', false)} />
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

function HudRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/30 rounded p-1.5">
      <div className="text-gray-500 text-[9px]">{label}</div>
      <div className="text-white text-[10px] font-medium truncate">{value}</div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex justify-between gap-3">
        <span className="text-gray-500 text-[10px]">{label}</span>
        <span className="text-white text-[10px]">{Math.round(value)}%</span>
      </div>
      <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden mt-0.5">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MobileBtn({ label, onPress, onRelease, highlight }: { label: string; onPress: () => void; onRelease: () => void; highlight?: boolean }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onTouchEnd={(e) => { e.preventDefault(); onRelease(); }}
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm active:scale-95 transition-transform ${
        highlight ? 'bg-blue-600/80' : 'bg-gray-800/80'
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatDistance(km: number): string {
  if (km >= 1000000) return `${(km / 1000000).toFixed(1)}M km`;
  if (km >= 1000) return `${(km / 1000).toFixed(0)}K km`;
  return `${Math.round(km)} km`;
}

function formatAltitude(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}
