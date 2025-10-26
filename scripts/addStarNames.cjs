// Add human-readable names to stars and link planetary systems

const fs = require('fs');
const path = require('path');

console.log('✨ Adding star names and linking planetary systems...\n');

const dataDir = path.join(__dirname, '../public/data');
const starsFile = path.join(dataDir, 'milky_way_stars.json');
const systemsFile = path.join(dataDir, 'planetary_systems.json');

// Load data
const stars = JSON.parse(fs.readFileSync(starsFile, 'utf8'));
let systems = [];

if (fs.existsSync(systemsFile)) {
  systems = JSON.parse(fs.readFileSync(systemsFile, 'utf8'));
  console.log(`✅ Loaded ${systems.length} planetary systems\n`);
}

// Create a map of stars with planets
const planetHostMap = new Map();
systems.forEach(system => {
  planetHostMap.set(system.gaia_id, system);
});

// Star name prefixes based on constellation/catalog
const namePreffixes = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
];

const constellations = [
  'Andromedae', 'Aquarii', 'Aquilae', 'Arietis', 'Aurigae',
  'Bootis', 'Cancri', 'Canis Majoris', 'Capricorni', 'Cassiopeiae',
  'Centauri', 'Cephei', 'Ceti', 'Cygni', 'Draconis',
  'Eridani', 'Geminorum', 'Herculis', 'Hydrae', 'Leonis',
  'Librae', 'Lyrae', 'Ophiuchi', 'Orionis', 'Pegasi',
  'Persei', 'Piscium', 'Sagittarii', 'Scorpii', 'Tauri',
  'Ursae Majoris', 'Ursae Minoris', 'Virginis'
];

// Generate star name
function generateStarName(index, hasPlanets) {
  if (hasPlanets) {
    // Stars with planets get catalog-style names
    return `PSR J${String(index).padStart(4, '0')}`;
  }

  // Bright stars get Greek letter + constellation names
  if (index < 5000) {
    const prefix = namePreffixes[Math.floor(Math.random() * namePreffixes.length)];
    const constellation = constellations[Math.floor(Math.random() * constellations.length)];
    return `${prefix} ${constellation}`;
  }

  // Fainter stars get catalog designations
  const catalogTypes = ['HD', 'HR', 'HIP', 'TYC', 'GSC'];
  const catalog = catalogTypes[Math.floor(Math.random() * catalogTypes.length)];
  return `${catalog} ${10000 + index}`;
}

// Add names and planetary system info
console.log('🏷️  Adding star names...\n');
let namedCount = 0;
let withPlanetsCount = 0;

stars.forEach((star, index) => {
  const system = planetHostMap.get(star.source_id);

  if (system) {
    // Star has planets
    star.has_planets = true;
    star.planet_count = system.planet_count;
    star.star_name = generateStarName(index, true);
    withPlanetsCount++;
  } else {
    star.has_planets = false;
    star.planet_count = 0;
    // Give names to brightest stars
    if (star.phot_g_mean_mag < 8) {
      star.star_name = generateStarName(index, false);
    }
  }

  if (star.star_name) {
    namedCount++;
  }

  if ((index + 1) % 10000 === 0) {
    console.log(`   Processed ${index + 1} stars...`);
  }
});

console.log(`\n✅ Named ${namedCount.toLocaleString()} stars`);
console.log(`🪐 ${withPlanetsCount.toLocaleString()} stars have planetary systems\n`);

// Save updated stars
fs.writeFileSync(starsFile, JSON.stringify(stars, null, 2));
console.log('💾 Updated: milky_way_stars.json');
console.log(`📊 File size: ${(fs.statSync(starsFile).size / 1024 / 1024).toFixed(2)} MB\n`);

console.log('✨ Star names added successfully!\n');
