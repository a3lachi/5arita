// Download comprehensive exoplanet data from NASA Exoplanet Archive
// Using TAP (Table Access Protocol) - the recommended API
// Downloads ALL available planet properties including spectroscopy, atmospheric data, etc.

const fs = require('fs');
const path = require('path');
const https = require('https');

const NASA_TAP_ENDPOINT = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

console.log('🪐 Downloading NASA Exoplanet Archive data (TAP service)...\n');

/**
 * Build comprehensive SQL query for all exoplanet data
 */
function buildQuery() {
  // Use SELECT * to get all available columns
  return `SELECT * FROM ps WHERE default_flag = 1`;
}

/**
 * Download confirmed exoplanets with all available data using TAP
 */
async function downloadExoplanets() {
  const query = buildQuery();
  const encodedQuery = encodeURIComponent(query);
  const url = `${NASA_TAP_ENDPOINT}?query=${encodedQuery}&format=json`;

  console.log('📡 Connecting to NASA Exoplanet Archive TAP service...');
  console.log('🔍 Query: Downloading ALL confirmed exoplanets with complete data');
  console.log('📊 Including: orbital params, spectroscopy, photometry, colors, atmospheric data');
  console.log('🔗 URL length:', url.length);
  console.log('📝 Query:', query.substring(0, 200) + '...\n');

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log(`↪️  Redirected to: ${res.headers.location}`);
        https.get(res.headers.location, handleResponse).on('error', reject);
        return;
      }

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
        if (totalBytes % 500000 < 10000) {
          process.stdout.write(`\r📥 Downloaded: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
        }
      });

      res.on('end', () => {
        process.stdout.write('\r✅ Download complete!                \n');
        console.log('📊 Parsing JSON data...\n');

        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });

    function handleResponse(res) {
      let data = '';
      let totalBytes = 0;

      res.on('data', (chunk) => {
        data += chunk;
        totalBytes += chunk.length;
        if (totalBytes % 500000 < 10000) {
          process.stdout.write(`\r📥 Downloaded: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
        }
      });

      res.on('end', () => {
        process.stdout.write('\r✅ Download complete!                \n');
        console.log('📊 Parsing JSON data...\n');
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }
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

    // Keep ALL data from NASA - no filtering
    const exoplanets = rawData;

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
    withMass: exoplanets.filter(p => p.pl_bmasse || p.pl_masse).length,
    withDensity: exoplanets.filter(p => p.pl_dens).length,
    withTemperature: exoplanets.filter(p => p.pl_eqt).length,

    // Spectroscopy/atmospheric data
    withTransmissionSpec: exoplanets.filter(p => p.pl_ntranspec > 0).length,
    withEclipseSpec: exoplanets.filter(p => p.pl_nespec > 0).length,
    withDirectImaging: exoplanets.filter(p => p.pl_ndispec > 0).length,

    // Photometry for colors
    withMultibandPhotometry: exoplanets.filter(p =>
      (p.sy_bmag || p.sy_vmag || p.sy_rmag || p.sy_imag || p.sy_zmag)
    ).length,
    withInfraredPhotometry: exoplanets.filter(p =>
      (p.sy_jmag || p.sy_hmag || p.sy_kmag)
    ).length,

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
  console.log(`   With mass data: ${stats.withMass.toLocaleString()}`);
  console.log(`   With density data: ${stats.withDensity.toLocaleString()}`);
  console.log(`   With temperature data: ${stats.withTemperature.toLocaleString()}\n`);

  console.log('🔬 Spectroscopy & Atmospheric Data:');
  console.log(`   With transmission spectroscopy: ${stats.withTransmissionSpec.toLocaleString()}`);
  console.log(`   With eclipse spectroscopy: ${stats.withEclipseSpec.toLocaleString()}`);
  console.log(`   With direct imaging spectroscopy: ${stats.withDirectImaging.toLocaleString()}\n`);

  console.log('🎨 Photometry (for color calculations):');
  console.log(`   With multiband optical photometry: ${stats.withMultibandPhotometry.toLocaleString()}`);
  console.log(`   With infrared photometry: ${stats.withInfraredPhotometry.toLocaleString()}\n`);

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
