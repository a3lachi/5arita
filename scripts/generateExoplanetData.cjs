// Generate realistic exoplanet data linked to our Milky Way stars
// Based on NASA Exoplanet Archive statistics

const fs = require('fs');
const path = require('path');

console.log('🪐 Generating exoplanet data linked to Milky Way stars...\n');

// Load our star data
const dataDir = path.join(__dirname, '../public/data');
const starsFile = path.join(dataDir, 'milky_way_stars.json');

if (!fs.existsSync(starsFile)) {
  console.error('❌ Error: milky_way_stars.json not found!');
  console.error('   Run: pnpm generate:data first');
  process.exit(1);
}

const allStars = JSON.parse(fs.readFileSync(starsFile, 'utf8'));
console.log(`✅ Loaded ${allStars.length.toLocaleString()} stars\n`);

// Filter for suitable host stars (not too hot, not too faint)
// Exoplanets are easier to detect around certain types of stars
const suitableHosts = allStars.filter(star => {
  return star.teff_gspphot &&
         star.teff_gspphot >= 3000 && // Not too cool (M dwarfs can host planets)
         star.teff_gspphot <= 7000 && // Not too hot (early type stars)
         star.phot_g_mean_mag < 12; // Bright enough to detect planets
});

console.log(`🎯 Found ${suitableHosts.length.toLocaleString()} suitable host stars\n`);

// Discovery method distribution (based on real NASA data)
const discoveryMethods = [
  { method: 'Transit', weight: 76 },
  { method: 'Radial Velocity', weight: 19 },
  { method: 'Microlensing', weight: 2 },
  { method: 'Imaging', weight: 2 },
  { method: 'Transit Timing Variations', weight: 1 },
];

// Planet size distributions
const planetTypes = [
  { type: 'Earth-like', minR: 0.8, maxR: 1.25, weight: 5 },
  { type: 'Super-Earth', minR: 1.25, maxR: 2.0, weight: 20 },
  { type: 'Neptune-like', minR: 2.0, maxR: 6.0, weight: 40 },
  { type: 'Jupiter-like', minR: 6.0, maxR: 20.0, weight: 30 },
  { type: 'Sub-Earth', minR: 0.3, maxR: 0.8, weight: 5 },
];

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function generatePlanet(hostStar, planetIndex, year) {
  const method = weightedRandom(discoveryMethods);
  const planetType = weightedRandom(planetTypes);

  // Planet radius (Earth radii)
  const pl_rade = planetType.minR + Math.random() * (planetType.maxR - planetType.minR);

  // Planet mass (Earth masses) - rough correlation with radius
  const pl_bmasse = Math.pow(pl_rade, 2.06) * (0.5 + Math.random());

  // Orbital period (days) - log-uniform distribution
  const pl_orbper = Math.pow(10, Math.random() * 4); // 1-10,000 days

  // Semi-major axis (AU) - from Kepler's 3rd law
  const pl_orbsmax = Math.pow(pl_orbper / 365.25, 2/3) * (0.8 + Math.random() * 0.4);

  // Orbital eccentricity (most orbits are near-circular)
  const pl_orbeccen = Math.random() < 0.7 ? Math.random() * 0.1 : Math.random() * 0.5;

  // Insolation flux (Earth = 1)
  const starLuminosity = Math.pow(hostStar.st_rad || 1, 2) * Math.pow((hostStar.teff_gspphot || 5778) / 5778, 4);
  const pl_insol = starLuminosity / Math.pow(pl_orbsmax, 2);

  // Equilibrium temperature (K)
  const pl_eqt = 278 * Math.pow(pl_insol, 0.25);

  // Orbital inclination (degrees) - transit method biased toward 90°
  const pl_orbincl = method.method === 'Transit' ?
    85 + Math.random() * 10 : // Nearly edge-on for transits
    Math.random() * 180; // Random for other methods

  return {
    pl_name: `${hostStar.source_id.substring(5, 15)} ${String.fromCharCode(98 + planetIndex)}`, // b, c, d...
    hostname: hostStar.source_id,
    sy_snum: 1,
    sy_pnum: null, // Will be filled later
    discoverymethod: method.method,
    disc_year: year,
    disc_facility: method.method === 'Transit' ? 'Kepler' :
                   method.method === 'Radial Velocity' ? 'HARPS' :
                   method.method === 'Microlensing' ? 'OGLE' : 'Various',

    // Orbital parameters
    pl_orbper: parseFloat(pl_orbper.toFixed(4)),
    pl_orbsmax: parseFloat(pl_orbsmax.toFixed(4)),
    pl_rade: parseFloat(pl_rade.toFixed(3)),
    pl_bmasse: parseFloat(pl_bmasse.toFixed(3)),
    pl_orbeccen: parseFloat(pl_orbeccen.toFixed(3)),
    pl_insol: parseFloat(pl_insol.toFixed(2)),
    pl_eqt: parseFloat(pl_eqt.toFixed(1)),
    pl_orbincl: parseFloat(pl_orbincl.toFixed(2)),

    // Host star data (from our Gaia stars)
    ra: hostStar.ra,
    dec: hostStar.dec,
    sy_dist: hostStar.distance_gspphot,
    sy_plx: hostStar.parallax,
    sy_vmag: hostStar.phot_g_mean_mag, // Approximate
    sy_kmag: null,
    sy_gaiamag: hostStar.phot_g_mean_mag,
    st_teff: hostStar.teff_gspphot,
    st_rad: hostStar.st_rad || 1.0,
    st_mass: hostStar.st_mass || 1.0,
    st_met: hostStar.mh_gspphot,
    st_logg: hostStar.logg_gspphot,
    st_age: hostStar.st_age || null,
    st_spectype: hostStar.st_spectype || null,
    sy_pm: Math.sqrt(Math.pow(hostStar.pmra || 0, 2) + Math.pow(hostStar.pmdec || 0, 2)),
    sy_pmra: hostStar.pmra,
    sy_pmdec: hostStar.pmdec,
    gaia_id: hostStar.source_id,

    // Habitability flag
    habitable: pl_eqt >= 200 && pl_eqt <= 350 && pl_rade >= 0.5 && pl_rade <= 2.0,
  };
}

// Generate ~5000 exoplanets (realistic number for detection)
// About 10% of suitable stars have detected planets
const numSystems = Math.floor(suitableHosts.length * 0.1);
const selectedHosts = [];
const usedIndices = new Set();

// Randomly select host stars
while (selectedHosts.length < numSystems) {
  const index = Math.floor(Math.random() * suitableHosts.length);
  if (!usedIndices.has(index)) {
    usedIndices.add(index);
    selectedHosts.push(suitableHosts[index]);
  }
}

console.log(`🎲 Selected ${selectedHosts.length.toLocaleString()} host stars for planetary systems\n`);

const exoplanets = [];
const systems = [];

selectedHosts.forEach((hostStar, sysIndex) => {
  // Number of planets per system (weighted toward 1-2 planets)
  const rand = Math.random();
  const numPlanets = rand < 0.5 ? 1 :
                     rand < 0.8 ? 2 :
                     rand < 0.95 ? 3 : 4;

  // Discovery year (weighted toward recent years)
  const baseYear = 1995 + Math.floor(Math.pow(Math.random(), 2) * 30); // 1995-2025

  const systemPlanets = [];

  for (let p = 0; p < numPlanets; p++) {
    const planet = generatePlanet(hostStar, p, baseYear + p);
    planet.sy_pnum = numPlanets;
    exoplanets.push(planet);
    systemPlanets.push(planet);
  }

  // Create system summary
  systems.push({
    hostname: hostStar.source_id,
    planet_count: numPlanets,
    planets: systemPlanets.map(p => ({
      name: p.pl_name,
      radius: p.pl_rade,
      mass: p.pl_bmasse,
      period: p.pl_orbper,
      semi_major_axis: p.pl_orbsmax,
      equilibrium_temp: p.pl_eqt,
      habitable: p.habitable,
    })),
    ra: hostStar.ra,
    dec: hostStar.dec,
    distance: hostStar.distance_gspphot,
    gaia_id: hostStar.source_id,
    st_teff: hostStar.teff_gspphot,
    sy_gaiamag: hostStar.phot_g_mean_mag,
    has_habitable_planet: systemPlanets.some(p => p.habitable),
  });

  if ((sysIndex + 1) % 500 === 0) {
    console.log(`   Generated ${sysIndex + 1} systems...`);
  }
});

console.log(`\n✅ Generated ${exoplanets.length.toLocaleString()} exoplanets in ${systems.length.toLocaleString()} systems\n`);

// Save data
const exoplanetsFile = path.join(dataDir, 'exoplanets.json');
fs.writeFileSync(exoplanetsFile, JSON.stringify(exoplanets, null, 2));
console.log(`💾 Saved: exoplanets.json`);
console.log(`📊 File size: ${(fs.statSync(exoplanetsFile).size / 1024 / 1024).toFixed(2)} MB\n`);

const systemsFile = path.join(dataDir, 'planetary_systems.json');
fs.writeFileSync(systemsFile, JSON.stringify(systems, null, 2));
console.log(`💾 Saved: planetary_systems.json`);
console.log(`📊 File size: ${(fs.statSync(systemsFile).size / 1024 / 1024).toFixed(2)} MB\n`);

// Statistics
const stats = {
  totalPlanets: exoplanets.length,
  totalSystems: systems.length,
  habitablePlanets: exoplanets.filter(p => p.habitable).length,
  systemsWithHabitable: systems.filter(s => s.has_habitable_planet).length,
  byMethod: {},
  byType: {},
};

exoplanets.forEach(p => {
  stats.byMethod[p.discoverymethod] = (stats.byMethod[p.discoverymethod] || 0) + 1;

  const type = p.pl_rade < 0.8 ? 'Sub-Earth' :
               p.pl_rade <= 1.25 ? 'Earth-like' :
               p.pl_rade <= 2.0 ? 'Super-Earth' :
               p.pl_rade <= 6.0 ? 'Neptune-like' : 'Jupiter-like';
  stats.byType[type] = (stats.byType[type] || 0) + 1;
});

console.log('📊 Exoplanet Statistics:\n');
console.log(`   Total planets: ${stats.totalPlanets.toLocaleString()}`);
console.log(`   Host stars: ${stats.totalSystems.toLocaleString()}`);
console.log(`   Potentially habitable: ${stats.habitablePlanets.toLocaleString()}`);
console.log(`   Systems with habitable planets: ${stats.systemsWithHabitable.toLocaleString()}\n`);

console.log('🔍 By Discovery Method:');
Object.entries(stats.byMethod)
  .sort((a, b) => b[1] - a[1])
  .forEach(([method, count]) => {
    console.log(`   ${method}: ${count.toLocaleString()}`);
  });

console.log('\n🌍 By Planet Type:');
Object.entries(stats.byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`   ${type}: ${count.toLocaleString()}`);
  });

console.log('\n✨ Exoplanet data ready!');
console.log('💡 These planets are linked to stars in your Milky Way dataset\n');
