# Milky Way Star Dataset

## Overview

This project uses a locally generated dataset of **50,000 stars** from the Milky Way galaxy, designed to match the characteristics of ESA's Gaia DR3 catalog.

## Dataset Details

### Total Stars: 50,000

The dataset is divided into magnitude ranges:

| Dataset | Magnitude Range | Star Count | Description |
|---------|----------------|------------|-------------|
| `brightest_stars.json` | -2 to 2 | 5,000 | Brightest stars visible to naked eye |
| `bright_stars.json` | 2 to 6 | 10,000 | Bright stars (naked eye visible) |
| `faint_stars.json` | 6 to 10 | 20,000 | Faint stars (telescope needed) |
| `distant_stars.json` | 10 to 14 | 15,000 | Distant/faint stars |
| **`milky_way_stars.json`** | -2 to 14 | **50,000** | **Combined dataset (used by app)** |

## Star Properties

Each star includes comprehensive data matching Gaia DR3 format:

### Positional Data
- `ra` - Right Ascension (degrees, 0-360)
- `dec` - Declination (degrees, -90 to +90)
- `parallax` - Distance indicator (milliarcseconds)
- `parallax_error` - Measurement uncertainty
- `distance_gspphot` - Distance in parsecs

### Photometric Data (Brightness)
- `phot_g_mean_mag` - G-band magnitude (main brightness)
- `phot_bp_mean_mag` - Blue photometer magnitude
- `phot_rp_mean_mag` - Red photometer magnitude
- `bp_rp` - Color index (determines star color)

### Physical Properties
- `teff_gspphot` - Effective temperature (Kelvin, 2400-50000K)
- `logg_gspphot` - Surface gravity (log scale)
- `mh_gspphot` - Metallicity (relative to Sun)

### Kinematic Data (Motion)
- `pmra` - Proper motion in RA (mas/year)
- `pmdec` - Proper motion in Dec (mas/year)
- `radial_velocity` - Radial velocity (km/s)
- `radial_velocity_error` - Measurement uncertainty

### Quality Indicators
- `ruwe` - Renormalized unit weight error (astrometric quality)
- `phot_variable_flag` - Indicates if star brightness varies

## Spectral Class Distribution

The dataset follows realistic Milky Way stellar population statistics:

| Spectral Class | Temperature Range | Color | Percentage | Count |
|----------------|-------------------|-------|------------|-------|
| O (Blue) | 30,000-50,000 K | Blue | 0.00003% | ~0 |
| B (Blue-White) | 10,000-30,000 K | Blue-White | 0.13% | 65 |
| A (White) | 7,500-10,000 K | White | 0.6% | 300 |
| F (Yellow-White) | 6,000-7,500 K | Yellow-White | 3% | 1,500 |
| G (Yellow) | 5,200-6,000 K | Yellow | 7.6% | 3,800 |
| K (Orange) | 3,700-5,200 K | Orange | 12.1% | 6,050 |
| M (Red) | 2,400-3,700 K | Red | 76.45% | 38,225 |

**Note:** Our Sun is a G-type star (~5,778 K)

## Data Generation

The data is generated using:
```bash
pnpm generate:data
```

This runs `scripts/generateMilkyWayData.cjs` which creates scientifically plausible stars with:
- Realistic spectral class distribution
- Proper correlations (temperature ↔ color ↔ spectral class)
- Believable distances and motions
- Appropriate error values

## File Size

- **Total dataset**: 27 MB
- Individual files range from 2.7 MB to 11 MB

## Why Local Data?

1. **CORS Restrictions**: Gaia API doesn't allow direct browser access
2. **Performance**: No network latency for star data
3. **Offline**: Works without internet after generation
4. **Reliability**: No API rate limits or downtime

## Real Gaia Data

To use real Gaia DR3 data (requires backend proxy):
1. Set up a backend server to proxy Gaia API requests
2. Uncomment the API fetch code in `src/services/gaiaService.ts`
3. Update the endpoint to point to your proxy

## Data Quality

While this is generated data, it accurately represents:
- ✅ Real stellar population statistics
- ✅ Proper physical correlations
- ✅ Gaia DR3 data format and fields
- ✅ Realistic value ranges and distributions

This makes it suitable for visualization, education, and demonstration purposes.
