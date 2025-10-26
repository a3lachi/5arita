# Preview

Known Universe Map (Three.js + React + TypeScript)

Interactive 3D map of the known universe built with Three.js and React (TypeScript).
This project focuses on streaming astronomy datasets (Gaia/SDSS/DESI/NASA) and rendering them efficiently in the browser.

## Features

- 3D visualization of astronomical data
- Real-time streaming of large datasets
- Interactive navigation and exploration
- Built with Three.js, React, and TypeScript

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics rendering
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for R3F
- **pnpm** - Fast, efficient package manager
- **Astronomy APIs** - Gaia, SDSS, DESI, NASA datasets

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Milky Way star dataset (50,000 stars)
pnpm generate:data
```

This will create a 27MB JSON file with 50,000 stars including:
- Complete positional data (RA, Dec, distance)
- Photometric data (magnitudes, colors)
- Physical properties (temperature, spectral class, metallicity)
- Kinematic data (proper motion, radial velocity)
- Realistic spectral class distribution (O/B/A/F/G/K/M stars)

### Development

```bash
# Start development server (http://localhost:5173)
pnpm dev
```

### Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Deployment

This project is optimized for deployment on Vercel:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

## License

MIT