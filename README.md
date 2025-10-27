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

# Generate exoplanet data (4,700+ planets linked to stars)
pnpm generate:exoplanets
```

**Star Dataset** (27MB): 50,000 stars including:
- Complete positional data (RA, Dec, distance)
- Photometric data (magnitudes, colors)
- Physical properties (temperature, spectral class, metallicity)
- Kinematic data (proper motion, radial velocity)
- Realistic spectral class distribution (O/B/A/F/G/K/M stars)

**Exoplanet Dataset** (5.7MB): 4,727 exoplanets including:
- 2,700 host stars (linked to Milky Way dataset via Gaia ID)
- 236 potentially habitable planets
- Orbital parameters (period, semi-major axis, eccentricity)
- Physical properties (radius, mass, temperature)
- Discovery methods (Transit, Radial Velocity, etc.)
- Habitable zone calculations

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

**⚠️ Important for Vercel Deployment:**

The `public/data` folder contains large JSON files (31MB+ for star data). Vercel has file size limits that may prevent these files from deploying properly.

**Solutions:**

1. **Use Git LFS** (recommended):
   ```bash
   git lfs install
   git lfs track "public/data/*.json"
   git add .gitattributes
   git add public/data/
   git commit -m "Add data files with LFS"
   git push
   ```

2. **Host data files externally**:
   - Upload data files to a CDN (Cloudflare R2, AWS S3, etc.)
   - Update `/src/services/gaiaService.ts` to fetch from CDN URL
   - Example: Change `'/data/milky_way_stars.json'` to `'https://your-cdn.com/milky_way_stars.json'`

3. **Reduce dataset size**:
   ```bash
   # Generate smaller dataset (10,000 stars instead of 50,000)
   node scripts/generateMilkyWayData.cjs 10000
   ```

If data files fail to load on Vercel, the app will fall back to 2,000 mock stars automatically.

## License

MIT