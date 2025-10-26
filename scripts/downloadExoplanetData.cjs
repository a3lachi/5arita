// Download exoplanet data from NASA Exoplanet Archive
// This downloads confirmed exoplanets with host star coordinates

const fs = require('fs');
const path = require('path');
const https = require('https');

const NASA_EXOPLANET_API = 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI';

console.log('🪐 Downloading NASA Exoplanet Archive data...\n');

/**
 * Simple CSV parser
 */
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const obj = {};

    headers.forEach((header, index) => {
      const value = values[index];
      // Convert to number if possible, otherwise keep as string
      obj[header] = value === '' || value === 'null' ? null :
                   !isNaN(value) && value !== '' ? parseFloat(value) : value;
    });

    data.push(obj);
  }

  return data;
}

/**
 * Download confirmed exoplanets with all available data
 */
async function downloadExoplanets() {
  // Using NASA Exoplanet Archive API (not TAP, use their simpler API)
  // Planetary Systems Composite table with all confirmed planets
  const params = new URLSearchParams({
    table: 'pscomppars',
    select: 'pl_name,hostname,sy_snum,sy_pnum,discoverymethod,disc_year,disc_facility,pl_orbper,pl_orbsmax,pl_rade,pl_bmasse,pl_orbeccen,pl_insol,pl_eqt,pl_orbincl,ra,dec,sy_dist,sy_plx,sy_vmag,sy_kmag,sy_gaiamag,st_teff,st_rad,st_mass,st_met,st_logg,st_age,st_spectype,sy_pm,sy_pmra,sy_pmdec,gaia_id',
    format: 'csv',
  });

  console.log('📡 Connecting to NASA Exoplanet Archive...');
  console.log('🔍 Query: Downloading all confirmed exoplanets with coordinates\n');

  return new Promise((resolve, reject) => {
    const url = `${NASA_EXOPLANET_API}?${params.toString()}`;

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      let totalBytes = 0;

      res.on('data', (chunk) => {
        data += chunk;
        totalBytes += chunk.length;
        // Show progress
        if (totalBytes % 100000 < 10000) {
          process.stdout.write(`\r📥 Downloaded: ${(totalBytes / 1024).toFixed(0)} KB`);
        }
      });

      res.on('end', () => {
        process.stdout.write('\r✅ Download complete!                \n');
        console.log('📊 Parsing CSV data...\n');

        try {
          const parsed = parseCSV(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Process and save exoplanet data
 */
async function processExoplanetData() {
  try {
    const rawData = await downloadExoplanets();

    if (!rawData || rawData.length === 0) {
      console.error('❌ No data received from NASA');
      process.exit(1);
    }

    console.log(`✅ Received ${rawData.length.toLocaleString()} exoplanets\n`);

    // Create data directory
    const dataDir = path.join(__dirname, '../public/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Process each exoplanet
    const exoplanets = rawData.map(planet => ({
      // Planet identification
      pl_name: planet.pl_name,
      hostname: planet.hostname,
      sy_snum: planet.sy_snum, // Number of stars in system
      sy_pnum: planet.sy_pnum, // Number of planets in system

      // Discovery info
      discoverymethod: planet.discoverymethod,
      disc_year: planet.disc_year,
      disc_facility: planet.disc_facility,

      // Orbital parameters
      pl_orbper: planet.pl_orbper, // Orbital period (days)
      pl_orbsmax: planet.pl_orbsmax, // Semi-major axis (AU)
      pl_rade: planet.pl_rade, // Planet radius (Earth radii)
      pl_bmasse: planet.pl_bmasse, // Planet mass (Earth masses)
      pl_orbeccen: planet.pl_orbeccen, // Orbital eccentricity
      pl_insol: planet.pl_insol, // Insolation flux (Earth = 1)
      pl_eqt: planet.pl_eqt, // Equilibrium temperature (K)
      pl_orbincl: planet.pl_orbincl, // Orbital inclination (degrees)

      // Host star coordinates (for matching with Gaia)
      ra: planet.ra,
      dec: planet.dec,
      sy_dist: planet.sy_dist, // Distance (parsecs)
      sy_plx: planet.sy_plx, // Parallax (mas)

      // Host star properties
      sy_vmag: planet.sy_vmag, // V magnitude
      sy_kmag: planet.sy_kmag, // K magnitude
      sy_gaiamag: planet.sy_gaiamag, // Gaia magnitude
      st_teff: planet.st_teff, // Stellar temperature (K)
      st_rad: planet.st_rad, // Stellar radius (Solar radii)
      st_mass: planet.st_mass, // Stellar mass (Solar masses)
      st_met: planet.st_met, // Stellar metallicity
      st_logg: planet.st_logg, // Stellar surface gravity
      st_age: planet.st_age, // Stellar age (Gyr)
      st_spectype: planet.st_spectype, // Spectral type

      // Proper motion
      sy_pm: planet.sy_pm, // Total proper motion (mas/yr)
      sy_pmra: planet.sy_pmra, // PM in RA (mas/yr)
      sy_pmdec: planet.sy_pmdec, // PM in Dec (mas/yr)

      // Gaia identifier (for direct matching)
      gaia_id: planet.gaia_id,
    }));

    // Save complete dataset
    const exoplanetsFile = path.join(dataDir, 'exoplanets.json');
    fs.writeFileSync(exoplanetsFile, JSON.stringify(exoplanets, null, 2));

    console.log('💾 Saved: exoplanets.json');
    console.log(`📊 File size: ${(fs.statSync(exoplanetsFile).size / 1024 / 1024).toFixed(2)} MB\n`);

    // Create statistics
    const stats = analyzeExoplanets(exoplanets);
    printStatistics(stats, exoplanets);

    // Group by host star
    const systemsMap = new Map();
    exoplanets.forEach(planet => {
      const host = planet.hostname;
      if (!systemsMap.has(host)) {
        systemsMap.set(host, []);
      }
      systemsMap.get(host).push(planet);
    });

    const systems = Array.from(systemsMap.entries()).map(([hostname, planets]) => ({
      hostname,
      planet_count: planets.length,
      planets: planets.map(p => ({
        name: p.pl_name,
        radius: p.pl_rade,
        mass: p.pl_bmasse,
        period: p.pl_orbper,
        semi_major_axis: p.pl_orbsmax,
        equilibrium_temp: p.pl_eqt,
      })),
      ra: planets[0].ra,
      dec: planets[0].dec,
      distance: planets[0].sy_dist,
      gaia_id: planets[0].gaia_id,
      st_teff: planets[0].st_teff,
      sy_gaiamag: planets[0].sy_gaiamag,
    }));

    const systemsFile = path.join(dataDir, 'planetary_systems.json');
    fs.writeFileSync(systemsFile, JSON.stringify(systems, null, 2));

    console.log('💾 Saved: planetary_systems.json');
    console.log(`📊 File size: ${(fs.statSync(systemsFile).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⭐ ${systems.length.toLocaleString()} unique host stars\n`);

    console.log('✨ Exoplanet data ready!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function analyzeExoplanets(exoplanets) {
  const stats = {
    total: exoplanets.length,
    withCoordinates: exoplanets.filter(p => p.ra && p.dec).length,
    withGaiaId: exoplanets.filter(p => p.gaia_id).length,
    withRadius: exoplanets.filter(p => p.pl_rade).length,
    withMass: exoplanets.filter(p => p.pl_bmasse).length,
    byMethod: {},
    byYear: {},
    earthLike: exoplanets.filter(p =>
      p.pl_rade >= 0.8 && p.pl_rade <= 1.25 &&
      p.pl_eqt >= 250 && p.pl_eqt <= 300
    ).length,
    superEarths: exoplanets.filter(p => p.pl_rade > 1.25 && p.pl_rade <= 2).length,
    neptuneLike: exoplanets.filter(p => p.pl_rade > 2 && p.pl_rade <= 6).length,
    jupiterLike: exoplanets.filter(p => p.pl_rade > 6).length,
  };

  exoplanets.forEach(p => {
    if (p.discoverymethod) {
      stats.byMethod[p.discoverymethod] = (stats.byMethod[p.discoverymethod] || 0) + 1;
    }
    if (p.disc_year) {
      stats.byYear[p.disc_year] = (stats.byYear[p.disc_year] || 0) + 1;
    }
  });

  return stats;
}

function printStatistics(stats, exoplanets) {
  console.log('📊 Exoplanet Statistics:\n');
  console.log(`   Total exoplanets: ${stats.total.toLocaleString()}`);
  console.log(`   With coordinates: ${stats.withCoordinates.toLocaleString()}`);
  console.log(`   With Gaia ID: ${stats.withGaiaId.toLocaleString()}`);
  console.log(`   With radius data: ${stats.withRadius.toLocaleString()}`);
  console.log(`   With mass data: ${stats.withMass.toLocaleString()}\n`);

  console.log('🌍 Planet Types:');
  console.log(`   Earth-like (habitable zone): ${stats.earthLike}`);
  console.log(`   Super-Earths (1.25-2 R⊕): ${stats.superEarths}`);
  console.log(`   Neptune-like (2-6 R⊕): ${stats.neptuneLike}`);
  console.log(`   Jupiter-like (>6 R⊕): ${stats.jupiterLike}\n`);

  console.log('🔍 Top Discovery Methods:');
  const topMethods = Object.entries(stats.byMethod)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  topMethods.forEach(([method, count]) => {
    console.log(`   ${method}: ${count}`);
  });
  console.log('');
}

// Run the download
processExoplanetData();
