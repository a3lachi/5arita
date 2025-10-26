// Add all NASA exoplanet host stars to the Gaia star dataset
// This ensures all stars with exoplanets are visible and clickable

const fs = require('fs');
const path = require('path');

console.log('🌟 Adding NASA exoplanet host stars to dataset...\n');

const dataDir = path.join(__dirname, '../public/data');

// Load data
const stars = JSON.parse(fs.readFileSync(path.join(dataDir, 'milky_way_stars.json'), 'utf8'));
const exoplanets = JSON.parse(fs.readFileSync(path.join(dataDir, 'exoplanets.json'), 'utf8'));

console.log(`📊 Loaded ${stars.length.toLocaleString()} existing stars`);
console.log(`📊 Loaded ${exoplanets.length.toLocaleString()} exoplanets\n`);

// Group exoplanets by host star
const systemsMap = new Map();
exoplanets.forEach(planet => {
  if (!planet.hostname || !planet.ra || !planet.dec) return;

  if (!systemsMap.has(planet.hostname)) {
    systemsMap.set(planet.hostname, {
      hostname: planet.hostname,
      ra: planet.ra,
      dec: planet.dec,
      planets: [],
      // Use planet's host star data
      st_teff: planet.st_teff,
      st_rad: planet.st_rad,
      st_mass: planet.st_mass,
      sy_dist: planet.sy_dist,
      sy_plx: planet.sy_plx,
      sy_vmag: planet.sy_vmag,
      sy_kmag: planet.sy_kmag,
      sy_gaiamag: planet.sy_gaiamag,
      gaia_id: planet.gaia_id,
    });
  }
  systemsMap.get(planet.hostname).planets.push(planet);
});

console.log(`🌍 Found ${systemsMap.size.toLocaleString()} unique host stars in NASA data\n`);

// Create Gaia-format stars from NASA host stars
const newStars = [];
let starsAdded = 0;

systemsMap.forEach((system, hostname) => {
  // Check if this star already exists in our dataset (by coordinates)
  const exists = stars.some(star => {
    if (!star.ra || !star.dec) return false;
    const dRa = Math.abs(star.ra - system.ra);
    const dDec = Math.abs(star.dec - system.dec);
    const distance = Math.sqrt(dRa * dRa + dDec * dDec);
    return distance < 0.01; // Within 36 arcseconds
  });

  if (!exists) {
    // Calculate BP-RP color index from temperature
    let bp_rp = 1.0; // Default
    if (system.st_teff) {
      if (system.st_teff < 3500) bp_rp = 3.5; // M star (red)
      else if (system.st_teff < 5000) bp_rp = 2.0; // K star (orange)
      else if (system.st_teff < 6000) bp_rp = 1.0; // G star (yellow)
      else if (system.st_teff < 7500) bp_rp = 0.3; // F star (white)
      else if (system.st_teff < 10000) bp_rp = -0.2; // A star (blue-white)
      else bp_rp = -0.5; // B/O star (blue)
    }

    // Calculate parallax from distance
    const parallax = system.sy_plx || (system.sy_dist ? 1000 / system.sy_dist : 10);

    // Calculate magnitude from Gaia mag or estimate
    const phot_g_mean_mag = system.sy_gaiamag || system.sy_vmag || 10;

    const newStar = {
      source_id: `NASA_${hostname.replace(/\s+/g, '_')}`,
      star_name: hostname,
      ra: system.ra,
      dec: system.dec,
      parallax: parallax,
      phot_g_mean_mag: phot_g_mean_mag,
      phot_bp_mean_mag: phot_g_mean_mag - bp_rp * 0.5,
      phot_rp_mean_mag: phot_g_mean_mag + bp_rp * 0.5,
      bp_rp: bp_rp,
      teff_gspphot: system.st_teff || 5778,
      has_planets: true,
      planet_count: system.planets.length,
      // Add NASA-specific data
      gaia_id: system.gaia_id,
      pmra: 0,
      pmdec: 0,
      radial_velocity: null,
    };

    newStars.push(newStar);
    starsAdded++;
  }
});

console.log(`✅ Adding ${starsAdded.toLocaleString()} new host stars from NASA data\n`);

// Merge new stars with existing stars
const mergedStars = [...stars, ...newStars];

console.log(`📊 Results:`);
console.log(`   Original stars: ${stars.length.toLocaleString()}`);
console.log(`   New host stars added: ${starsAdded.toLocaleString()}`);
console.log(`   Total stars: ${mergedStars.length.toLocaleString()}`);
console.log(`   Stars with planets: ${mergedStars.filter(s => s.has_planets).length.toLocaleString()}\n`);

// Save merged dataset
const outputFile = path.join(dataDir, 'milky_way_stars.json');
fs.writeFileSync(outputFile, JSON.stringify(mergedStars, null, 2));

console.log(`💾 Saved updated data to: ${outputFile}`);
console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB\n`);

console.log('✨ Update complete!');
console.log('   All NASA exoplanet host stars are now visible in the map\n');
