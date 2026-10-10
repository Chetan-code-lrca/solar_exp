# Solaris Expedition

A browser-based Solar System expedition game built with React, TypeScript, Vite, and Canvas rendering. Select a planet, launch a mission, pilot through a short flight, then carry out a surface survey or an atmospheric-probe mission.

This is an educational game with simplified game physics, not a scientifically accurate spacecraft or orbital simulator.

## Gameplay

- Explore Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.
- Pilot the ship through asteroid fields while managing fuel and hull integrity.
- Adjust orbital altitude and speed before starting descent.
- Land on terrestrial planets and scan three surface targets.
- Visit gas and ice giants with atmospheric probes instead of impossible solid-surface landings.
- Earn research points, track visited planets, and return to the solar-system hub.

## Controls

| Input | Action |
| --- | --- |
| W / Up arrow | Thrust upward; also raises altitude during orbit |
| S / Down arrow | Thrust downward; also lowers altitude during orbit |
| A / Left arrow | Move left; also reduces orbital speed |
| D / Right arrow | Move right; also increases orbital speed |
| Space | Interact or collect a scan target when prompted |
| Touch controls | Mobile movement and interaction controls |

Controls change meaning between flight, orbit, landing, surface exploration, and atmospheric-probe modes. Follow the on-screen HUD for mode-specific hints.

## Run locally

Requirements: Node.js 22 or another compatible modern Node.js release, and npm.

```bash
git clone https://github.com/Chetan-code-lrca/solar_exp.git
cd solar_exp
npm ci
npm run dev
```

Vite serves the development app on port `3000` as configured in the repository.

## Validation commands

```bash
npm test
npm run typecheck
npm run build
```

The Node test suite covers deterministic physics helpers such as landing gravity, frame-rate-scaled damping, and touchdown speed limits. GitHub Actions runs tests, type-checking, and a production build on pushes and pull requests.

## GitHub Pages

The application is built with the `/solar_exp/` base path for repository Pages hosting. The deployment workflow builds the site and publishes the `dist/` output.

## Project structure

```text
src/
  App.tsx              React UI and HUD
  main.tsx             Application entry point
  game/
    types.ts           Game state, planets, and state types
    useGame.ts         Game loop and mission transitions
    renderer.ts        Canvas rendering
    physics.js         Shared deterministic physics helpers
    physics.d.ts       TypeScript declarations for physics helpers
tests/
  physics.test.mjs     Node built-in regression tests
```

## Scope and limitations

- Distances, gravity, orbital stability, and travel times are simplified for gameplay.
- Random asteroids and particle effects are visual/gameplay mechanisms, not real-space models.
- The current tests validate pure physics helpers and build-time correctness; they do not replace full manual play-testing across desktop and mobile browsers.
- No API keys, remote database, or external model service is required to play.
