// Exoplanet service - loads planetary systems from local data

export interface Exoplanet {
  pl_name: string;
  hostname: string;
  sy_snum: number;
  sy_pnum: number | null;
  discoverymethod: string;
  disc_year: number;
  disc_facility: string;
  pl_orbper: number; // Orbital period (days)
  pl_orbsmax: number; // Semi-major axis (AU)
  pl_rade: number; // Planet radius (Earth radii)
  pl_bmasse: number; // Planet mass (Earth masses)
  pl_orbeccen: number; // Orbital eccentricity
  pl_insol: number; // Insolation flux (Earth = 1)
  pl_eqt: number; // Equilibrium temperature (K)
  pl_orbincl: number; // Orbital inclination (degrees)
  ra: number;
  dec: number;
  sy_dist: number;
  sy_plx: number;
  sy_vmag: number | null;
  sy_kmag: number | null;
  sy_gaiamag: number;
  st_teff: number;
  st_rad: number;
  st_mass: number;
  st_met: number | null;
  st_logg: number | null;
  st_age: number | null;
  st_spectype: string | null;
  sy_pm: number;
  sy_pmra: number | null;
  sy_pmdec: number | null;
  gaia_id: string;
  habitable: boolean;
}

export interface PlanetarySystems {
  hostname: string;
  planet_count: number;
  planets: {
    name: string;
    radius: number;
    mass: number;
    period: number;
    semi_major_axis: number;
    equilibrium_temp: number;
    habitable: boolean;
  }[];
  ra: number;
  dec: number;
  distance: number;
  gaia_id: string;
  st_teff: number;
  sy_gaiamag: number;
  has_habitable_planet: boolean;
}

/**
 * Load planetary systems from local data
 */
export async function fetchPlanetarySystems(): Promise<PlanetarySystems[]> {
  console.log('🪐 Loading planetary systems from local dataset...');

  try {
    const response = await fetch('/data/planetary_systems.json');

    if (!response.ok) {
      throw new Error(`Failed to load planetary systems: ${response.status}`);
    }

    const systems: PlanetarySystems[] = await response.json();
    console.log(`✅ Loaded ${systems.length.toLocaleString()} planetary systems`);
    console.log(`🌍 Systems with habitable planets: ${systems.filter(s => s.has_habitable_planet).length}`);

    return systems;
  } catch (error) {
    console.error('❌ Error loading planetary systems:', error);
    return [];
  }
}

/**
 * Load all exoplanets from local data
 */
export async function fetchExoplanets(): Promise<Exoplanet[]> {
  console.log('🪐 Loading exoplanets from local dataset...');

  try {
    const response = await fetch('/data/exoplanets.json');

    if (!response.ok) {
      throw new Error(`Failed to load exoplanets: ${response.status}`);
    }

    const exoplanets: Exoplanet[] = await response.json();
    console.log(`✅ Loaded ${exoplanets.length.toLocaleString()} exoplanets`);

    return exoplanets;
  } catch (error) {
    console.error('❌ Error loading exoplanets:', error);
    return [];
  }
}

/**
 * Get planet size category
 */
export function getPlanetCategory(radius: number): string {
  if (radius < 0.8) return 'Sub-Earth';
  if (radius <= 1.25) return 'Earth-like';
  if (radius <= 2.0) return 'Super-Earth';
  if (radius <= 6.0) return 'Neptune-like';
  return 'Jupiter-like';
}

/**
 * Check if planet is in habitable zone
 */
export function isInHabitableZone(eqTemp: number, radius: number): boolean {
  return eqTemp >= 200 && eqTemp <= 350 && radius >= 0.5 && radius <= 2.0;
}

/**
 * Calculate habitable zone boundaries (AU) for a given stellar luminosity
 */
export function getHabitableZone(starTemp: number, starRadius: number = 1.0): { inner: number; outer: number } {
  // Calculate stellar luminosity (L☉)
  const L = Math.pow(starRadius, 2) * Math.pow(starTemp / 5778, 4);

  // Habitable zone boundaries (simplified)
  const inner = Math.sqrt(L / 1.1); // Inner edge (runaway greenhouse)
  const outer = Math.sqrt(L / 0.53); // Outer edge (maximum greenhouse)

  return { inner, outer };
}
