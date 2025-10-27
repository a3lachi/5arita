// Gaia API Service
// Uses ESA Gaia Archive TAP (Table Access Protocol) service

import { getDataUrl } from '../config/cdn';

export interface GaiaStar {
  source_id: string;
  star_name?: string; // Human-readable star name
  ra: number; // Right Ascension (degrees)
  dec: number; // Declination (degrees)
  parallax: number; // Distance indicator (milliarcseconds)
  parallax_error?: number; // Parallax uncertainty
  phot_g_mean_mag: number; // Brightness (G-band magnitude)
  phot_bp_mean_mag?: number; // Blue photometer magnitude
  phot_rp_mean_mag?: number; // Red photometer magnitude
  bp_rp?: number; // Color index (BP-RP)
  teff_gspphot?: number; // Effective temperature (Kelvin)
  logg_gspphot?: number; // Surface gravity
  mh_gspphot?: number; // Metallicity
  distance_gspphot?: number; // Distance in parsecs
  pmra?: number; // Proper motion RA (mas/year)
  pmdec?: number; // Proper motion Dec (mas/year)
  radial_velocity?: number; // Radial velocity (km/s)
  radial_velocity_error?: number; // Radial velocity uncertainty
  phot_variable_flag?: string; // Variability flag
  ruwe?: number; // Renormalized unit weight error (quality)
  has_planets?: boolean; // Whether this star has known exoplanets
  planet_count?: number; // Number of known planets
}

// const GAIA_TAP_URL = 'https://gea.esac.esa.gov/tap-server/tap/sync'; // Unused - kept for reference

/**
 * Fetch stars from Gaia DR3 catalog
 * @param limit Number of stars to fetch (max 2000 for performance)
 * @param minMagnitude Minimum brightness (lower = brighter)
 * @param maxMagnitude Maximum brightness
 */
export async function fetchGaiaStars(
  limit: number = 50000,
  minMagnitude: number = 0,
  maxMagnitude: number = 14
): Promise<GaiaStar[]> {
  console.log('🌟 Loading Milky Way star data from local dataset...');

  try {
    // Load the pre-generated Milky Way dataset
    const dataUrl = getDataUrl('milky_way_stars');
    console.log(`📡 Fetching star data from: ${dataUrl}`);
    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(`Failed to load star data: ${response.status}`);
    }

    const allStars: GaiaStar[] = await response.json();
    console.log(`✅ Loaded ${allStars.length.toLocaleString()} stars from local dataset`);

    // Filter by magnitude range if needed
    const filteredStars = allStars.filter(
      star => star.phot_g_mean_mag >= minMagnitude && star.phot_g_mean_mag <= maxMagnitude
    );

    // Limit to requested count
    const stars = filteredStars.slice(0, limit);

    console.log(`📊 Showing ${stars.length.toLocaleString()} stars (magnitude ${minMagnitude}-${maxMagnitude})`);

    return stars;
  } catch (error) {
    console.error('❌ Error loading star data:', error);
    console.error('📁 Make sure /data/milky_way_stars.json exists and is accessible');
    console.error('⚠️ On Vercel, large files may need to be hosted externally or compressed');
    console.warn('⚠️ Falling back to generated mock data (2000 stars)');
    return generateMockStars(Math.min(limit, 2000));
  }

  /*
  // ADQL query to get bright stars with full data (requires backend proxy)
  const query = `
    SELECT TOP ${limit}
      source_id,
      ra,
      dec,
      parallax,
      phot_g_mean_mag,
      phot_bp_mean_mag,
      phot_rp_mean_mag,
      bp_rp,
      teff_gspphot,
      pmra,
      pmdec,
      radial_velocity
    FROM gaiadr3.gaia_source
    WHERE phot_g_mean_mag BETWEEN ${minMagnitude} AND ${maxMagnitude}
      AND parallax IS NOT NULL
      AND parallax > 0
    ORDER BY phot_g_mean_mag ASC
  `;

  try {
    const formData = new URLSearchParams();
    formData.append('REQUEST', 'doQuery');
    formData.append('LANG', 'ADQL');
    formData.append('FORMAT', 'json');
    formData.append('QUERY', query);

    const response = await fetch(GAIA_TAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Gaia API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse Gaia response format
    if (data.data && Array.isArray(data.data)) {
      const metadata = data.metadata || [];
      const sourceIdIdx = metadata.findIndex((m: any) => m.name === 'source_id');
      const raIdx = metadata.findIndex((m: any) => m.name === 'ra');
      const decIdx = metadata.findIndex((m: any) => m.name === 'dec');
      const parallaxIdx = metadata.findIndex((m: any) => m.name === 'parallax');
      const magIdx = metadata.findIndex((m: any) => m.name === 'phot_g_mean_mag');
      const bpMagIdx = metadata.findIndex((m: any) => m.name === 'phot_bp_mean_mag');
      const rpMagIdx = metadata.findIndex((m: any) => m.name === 'phot_rp_mean_mag');
      const bpRpIdx = metadata.findIndex((m: any) => m.name === 'bp_rp');
      const teffIdx = metadata.findIndex((m: any) => m.name === 'teff_gspphot');
      const pmraIdx = metadata.findIndex((m: any) => m.name === 'pmra');
      const pmdecIdx = metadata.findIndex((m: any) => m.name === 'pmdec');
      const rvIdx = metadata.findIndex((m: any) => m.name === 'radial_velocity');

      return data.data.map((row: any[]) => ({
        source_id: row[sourceIdIdx],
        ra: row[raIdx],
        dec: row[decIdx],
        parallax: row[parallaxIdx],
        phot_g_mean_mag: row[magIdx],
        phot_bp_mean_mag: row[bpMagIdx],
        phot_rp_mean_mag: row[rpMagIdx],
        bp_rp: row[bpRpIdx],
        teff_gspphot: row[teffIdx],
        pmra: row[pmraIdx],
        pmdec: row[pmdecIdx],
        radial_velocity: row[rvIdx],
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching Gaia data:', error);
    // Return fallback mock data for development
    return generateMockStars(limit);
  }
  */
}

/**
 * Convert equatorial coordinates (RA, Dec) to Cartesian (x, y, z)
 * @param ra Right Ascension in degrees
 * @param dec Declination in degrees
 * @param distance Distance from origin (derived from parallax)
 */
export function equatorialToCartesian(
  ra: number,
  dec: number,
  distance: number = 100
): [number, number, number] {
  // Convert degrees to radians
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;

  // Spherical to Cartesian conversion
  const x = distance * Math.cos(decRad) * Math.cos(raRad);
  const y = distance * Math.cos(decRad) * Math.sin(raRad);
  const z = distance * Math.sin(decRad);

  return [x, z, -y]; // Adjusted for Three.js coordinate system
}

/**
 * Calculate distance from parallax (in parsecs)
 * @param parallax Parallax in milliarcseconds
 */
export function parallaxToDistance(parallax: number): number {
  if (parallax <= 0) return 100; // Default distance
  // Distance (parsecs) = 1000 / parallax (mas)
  const parsecs = 1000 / parallax;
  // Clamp to reasonable visualization range
  return Math.min(Math.max(parsecs * 0.1, 10), 200);
}

/**
 * Map magnitude to star size for visualization
 * @param magnitude Apparent magnitude (lower = brighter)
 */
export function magnitudeToSize(magnitude: number): number {
  // Brighter stars (lower magnitude) = larger size
  // Using exponential scaling for more dramatic size differences
  // Magnitude range: 0-8 -> Size range: 1.0-8.0
  const normalized = 8 - magnitude; // Invert so brighter = higher value
  const size = Math.pow(1.5, normalized / 2); // Exponential scaling
  return Math.max(1.0, Math.min(size, 12.0)); // Clamp between 1-12
}

/**
 * Convert color index (BP-RP) to RGB color
 * @param bpRp Color index (typically -0.5 to 3.0)
 * @returns RGB color array [r, g, b] (0-1 range)
 */
export function colorIndexToRGB(bpRp: number | undefined): [number, number, number] {
  if (bpRp === undefined || bpRp === null) {
    return [1, 1, 1]; // White for unknown
  }

  // BP-RP color index mapping:
  // < 0.5: Blue stars (hot)
  // 0.5-1.5: White/Yellow stars (medium)
  // > 1.5: Red stars (cool)

  if (bpRp < 0.5) {
    // Blue to blue-white
    const t = Math.max(0, Math.min(1, (bpRp + 0.5) / 1.0));
    return [0.6 + t * 0.4, 0.7 + t * 0.3, 1.0];
  } else if (bpRp < 1.5) {
    // White to yellow
    const t = (bpRp - 0.5) / 1.0;
    return [1.0, 1.0 - t * 0.2, 0.9 - t * 0.4];
  } else {
    // Yellow to red
    const t = Math.min(1, (bpRp - 1.5) / 1.5);
    return [1.0, 0.7 - t * 0.4, 0.4 - t * 0.4];
  }
}

/**
 * Get star spectral class from temperature
 * @param temperature Temperature in Kelvin
 */
export function getSpectralClass(temperature: number | undefined): string {
  if (!temperature) return 'Unknown';

  if (temperature >= 30000) return 'O (Blue)';
  if (temperature >= 10000) return 'B (Blue-White)';
  if (temperature >= 7500) return 'A (White)';
  if (temperature >= 6000) return 'F (Yellow-White)';
  if (temperature >= 5200) return 'G (Yellow)'; // Like our Sun
  if (temperature >= 3700) return 'K (Orange)';
  return 'M (Red)';
}

/**
 * Calculate distance in light-years from parallax
 * @param parallax Parallax in milliarcseconds
 */
export function getDistanceInLightYears(parallax: number): number {
  if (parallax <= 0) return 0;
  const parsecs = 1000 / parallax;
  return parsecs * 3.26156; // 1 parsec = 3.26156 light-years
}

/**
 * Calculate total proper motion
 * @param pmra Proper motion in RA (mas/year)
 * @param pmdec Proper motion in Dec (mas/year)
 */
export function getTotalProperMotion(pmra?: number, pmdec?: number): number {
  if (!pmra || !pmdec) return 0;
  return Math.sqrt(pmra * pmra + pmdec * pmdec);
}

/**
 * Fallback mock data generator for development/offline use
 */
function generateMockStars(count: number): GaiaStar[] {
  const stars: GaiaStar[] = [];
  for (let i = 0; i < count; i++) {
    const bpRp = Math.random() * 3 - 0.5;
    stars.push({
      source_id: `mock_${i}`,
      ra: Math.random() * 360,
      dec: (Math.random() - 0.5) * 180,
      parallax: Math.random() * 10 + 1,
      phot_g_mean_mag: Math.random() * 8,
      phot_bp_mean_mag: Math.random() * 8,
      phot_rp_mean_mag: Math.random() * 8,
      bp_rp: bpRp,
      teff_gspphot: 3000 + Math.random() * 25000,
      pmra: (Math.random() - 0.5) * 20,
      pmdec: (Math.random() - 0.5) * 20,
      radial_velocity: (Math.random() - 0.5) * 200,
    });
  }
  return stars;
}
