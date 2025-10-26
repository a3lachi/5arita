// Link real NASA exoplanet data to Gaia stars by coordinates
// This updates the milky_way_stars.json with accurate has_planets flags

const fs = require('fs');
const path = require('path');

console.log('🔗 Linking NASA exoplanets to Gaia stars...\n');

const dataDir = path.join(__dirname, '../public/data');

// Load data
const stars = JSON.parse(fs.readFileSync(path.join(dataDir, 'milky_way_stars.json'), 'utf8'));
const exoplanets = JSON.parse(fs.readFileSync(path.join(dataDir, 'exoplanets.json'), 'utf8'));

console.log(`📊 Loaded ${stars.length.toLocaleString()} stars`);
console.log(`📊 Loaded ${exoplanets.length.toLocaleString()} exoplanets\n`);

// Group planets by host star coordinates
const planetsByCoords = new Map();
exoplanets.forEach(planet => {
  if (planet.ra && planet.dec) {
    const key = `${planet.ra.toFixed(4)},${planet.dec.toFixed(4)}`;
    if (!planetsByCoords.has(key)) {
      planetsByCoords.set(key, []);
    }
    planetsByCoords.get(key).push(planet);
  }
});

console.log(`🌍 Grouped into ${planetsByCoords.size.toLocaleString()} unique coordinate sets\n`);

// Match stars to planets by coordinates
let matchCount = 0;
let updatedStars = 0;

stars.forEach(star => {
  // Clear old has_planets flag
  star.has_planets = false;
  star.planet_count = 0;

  if (!star.ra || !star.dec) return;

  // Try to find matching planets within 0.01 degrees (~36 arcseconds)
  let matchedPlanets = [];

  planetsByCoords.forEach((planets, coordKey) => {
    const [planetRa, planetDec] = coordKey.split(',').map(Number);
    const dRa = Math.abs(star.ra - planetRa);
    const dDec = Math.abs(star.dec - planetDec);
    const distance = Math.sqrt(dRa * dRa + dDec * dDec);

    if (distance < 0.01) {
      matchedPlanets.push(...planets);
    }
  });

  if (matchedPlanets.length > 0) {
    star.has_planets = true;
    star.planet_count = matchedPlanets.length;

    // Update star name with hostname from NASA data if available
    if (matchedPlanets[0].hostname && !star.star_name) {
      star.star_name = matchedPlanets[0].hostname;
    }

    matchCount++;
    updatedStars++;
  }
});

console.log('✅ Matching complete!\n');
console.log(`📊 Results:`);
console.log(`   Stars matched with planets: ${matchCount.toLocaleString()}`);
console.log(`   Total planetary systems: ${matchCount.toLocaleString()}`);
console.log(`   Stars updated: ${updatedStars.toLocaleString()}\n`);

// Save updated stars
const outputFile = path.join(dataDir, 'milky_way_stars.json');
fs.writeFileSync(outputFile, JSON.stringify(stars, null, 2));

console.log(`💾 Saved updated data to: ${outputFile}`);
console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB\n`);

console.log('✨ Linking complete!');
console.log('   Now the filter will show only stars with real NASA exoplanets\n');
