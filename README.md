# Interactive Solar System Explorer

A React-based interactive Solar System visualization.

The app animates the planets around the Sun, lets you change the animation speed, pause and resume the simulation, and open a detail panel for each planet.

## Features

- Animated orbits for Mercury through Neptune
- Pause / play controls
- Animation speed options from 0.25× to 5×
- Clickable planets with reference data
- Planet quick-select controls
- Randomized starting positions
- Planet details including diameter, distance from the Sun, orbital period, and approximate orbital speed

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Recharts
- Supabase client

The current interface is primarily a client-side visualization. The repository also contains dependencies used by the broader project setup.

## Run locally

```bash
git clone https://github.com/Chetan-code-lrca/solar_exp.git
cd solar_exp
npm install
npm run dev
```

Vite is configured to serve the development app on port `3000`.

## Production build

```bash
npm run build
```

Type-check the project with:

```bash
npm run typecheck
```

## GitHub Pages

The Vite base path is configured for `/solar_exp/`, and the repository includes a GitHub Pages deployment workflow.

## How the visualization works

Each planet has reference data for its real diameter, distance from the Sun, and orbital period. The on-screen orbit radii are visual values rather than a scale model of the real Solar System.

The animation advances each planet using its stored orbital-period value and applies a global speed multiplier.

Planet sizes and orbit distances are intentionally adapted for interaction and readability rather than physical scale.

## Repository structure

```text
solar_exp/
├── src/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.js
└── README.md
```

## Notes

This is an educational visualization rather than a scientific simulator. Orbital paths, planet sizes, animation timing, and visual distances are adapted for interaction and readability.
