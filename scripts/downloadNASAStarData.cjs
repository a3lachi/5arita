// Download star data from NASA Exoplanet Archive
// Uses the stellar hosts table which contains comprehensive star data

const fs = require('fs');
const path = require('path');
const https = require('https');

const NASA_TAP_ENDPOINT = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

console.log('⭐ Downloading stellar data from NASA Exoplanet Archive...\n');

/**
 * Download data from NASA TAP service
 */
async function downloadFromNASA(tableName, description) {
  const query = `SELECT * FROM ${tableName}`;
  const encodedQuery = encodeURIComponent(query);
  const url = `${NASA_TAP_ENDPOINT}?query=${encodedQuery}&format=json`;

  console.log(`📡 Downloading ${description}...`);
  console.log(`   Table: ${tableName}`);
  console.log(`   Query: SELECT * FROM ${tableName}\n`);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log(`   ↪️  Redirected to: ${res.headers.location}`);
        https.get(res.headers.location, handleResponse).on('error', reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      handleResponse(res);
    }).on('error', (error) => {
      reject(error);
    });

    function handleResponse(res) {
      let data = '';
      let totalBytes = 0;

      res.on('data', (chunk) => {
        data += chunk;
        totalBytes += chunk.length;
        // Show progress
        if (totalBytes % 500000 < 10000) {
          process.stdout.write(`\r   📥 Downloaded: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
        }
      });

      res.on('end', () => {
        process.stdout.write('\r   ✅ Download complete!                \n');
        console.log('   📊 Parsing JSON data...\n');

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
 * Main download function
 */
async function downloadAllNASAData() {
  const dataDir = path.join(__dirname, '../public/data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // 1. Download stellar hosts table (comprehensive star data)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣  STELLAR HOSTS TABLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const stellarHosts = await downloadFromNASA('stellarhosts', 'Stellar Hosts');

    const stellarFile = path.join(dataDir, 'nasa_stellar_hosts.json');
    fs.writeFileSync(stellarFile, JSON.stringify(stellarHosts, null, 2));
    console.log(`   💾 Saved: nasa_stellar_hosts.json`);
    console.log(`   📊 Records: ${stellarHosts.length.toLocaleString()}`);
    console.log(`   📊 File size: ${(fs.statSync(stellarFile).size / 1024 / 1024).toFixed(2)} MB\n`);

    // 2. Download composite parameters table (additional star data)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣  PLANETARY SYSTEMS COMPOSITE TABLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const psCompPars = await downloadFromNASA('pscomppars', 'Planetary Systems Composite Parameters');

    const psCompFile = path.join(dataDir, 'nasa_ps_composite.json');
    fs.writeFileSync(psCompFile, JSON.stringify(psCompPars, null, 2));
    console.log(`   💾 Saved: nasa_ps_composite.json`);
    console.log(`   📊 Records: ${psCompPars.length.toLocaleString()}`);
    console.log(`   📊 File size: ${(fs.statSync(psCompFile).size / 1024 / 1024).toFixed(2)} MB\n`);

    // 3. Analyze and create unified star dataset
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣  CREATING UNIFIED STAR DATASET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('   Processing stellar hosts data...');

    // Load existing exoplanet data to link planets to stars
    const exoplanetsFile = path.join(dataDir, 'exoplanets.json');
    let exoplanets = [];
    if (fs.existsSync(exoplanetsFile)) {
      exoplanets = JSON.parse(fs.readFileSync(exoplanetsFile, 'utf8'));
      console.log(`   ✅ Loaded ${exoplanets.length.toLocaleString()} exoplanets for linking\n`);
    }

    // Create map of host stars with planet counts
    const hostStarMap = new Map();
    exoplanets.forEach(planet => {
      const hostname = planet.hostname;
      if (!hostStarMap.has(hostname)) {
        hostStarMap.set(hostname, {
          planet_count: 0,
          planets: []
        });
      }
      const host = hostStarMap.get(hostname);
      host.planet_count++;
      host.planets.push(planet.pl_name);
    });

    // Convert stellar hosts to our star format
    const stars = stellarHosts.map(star => {
      const hostname = star.hostname || star.sy_name;
      const hostInfo = hostStarMap.get(hostname) || { planet_count: 0, planets: [] };

      return {
        // Gaia identifiers
        source_id: star.gaia_id || star.sy_gaiaid || `NASA_${star.hostname}`,
        gaia_dr2_id: star.gaia_id,
        gaia_dr3_id: star.sy_gaiaid,

        // Star name/identifiers
        star_name: star.hostname,
        hd_name: star.hd_name,
        hip_name: star.hip_name,
        tic_id: star.tic_id,

        // Position (equatorial coordinates)
        ra: star.ra,
        dec: star.dec,

        // Distance & parallax
        sy_dist: star.sy_dist, // Distance in parsecs
        sy_plx: star.sy_plx, // Parallax in mas
        parallax: star.sy_plx,

        // Photometry (magnitudes in different bands)
        sy_vmag: star.sy_vmag, // V-band
        sy_kmag: star.sy_kmag, // K-band
        sy_gaiamag: star.sy_gaiamag, // Gaia G-band
        phot_g_mean_mag: star.sy_gaiamag,
        sy_bmag: star.sy_bmag, // B-band
        sy_jmag: star.sy_jmag, // J-band
        sy_hmag: star.sy_hmag, // H-band

        // Color indices (for star color calculation)
        bp_rp: star.gaia_bprp || (star.sy_bmag && star.sy_vmag ? star.sy_bmag - star.sy_vmag : null),

        // Stellar properties
        st_teff: star.st_teff, // Effective temperature (K)
        teff_gspphot: star.st_teff,
        st_rad: star.st_rad, // Stellar radius (solar radii)
        st_mass: star.st_mass, // Stellar mass (solar masses)
        st_met: star.st_met, // Metallicity [Fe/H]
        mh_gspphot: star.st_met,
        st_logg: star.st_logg, // Surface gravity log(g)
        logg_gspphot: star.st_logg,
        st_age: star.st_age, // Age (Gyr)
        st_spectype: star.st_spectype, // Spectral type

        // Proper motion
        sy_pm: star.sy_pm, // Total proper motion (mas/yr)
        sy_pmra: star.sy_pmra, // PM in RA (mas/yr)
        sy_pmdec: star.sy_pmdec, // PM in Dec (mas/yr)
        pmra: star.sy_pmra,
        pmdec: star.sy_pmdec,

        // Radial velocity
        st_radv: star.st_radv, // Radial velocity (km/s)
        radial_velocity: star.st_radv,

        // Planet information
        has_planets: hostInfo.planet_count > 0,
        planet_count: hostInfo.planet_count,
        planet_names: hostInfo.planets,

        // Number of stars and planets in system
        sy_snum: star.sy_snum, // Number of stars
        sy_pnum: star.sy_pnum, // Number of planets

        // Source info
        data_source: 'NASA Exoplanet Archive - Stellar Hosts',
        release_date: star.releasedate,
      };
    });

    // Save unified star dataset
    const unifiedFile = path.join(dataDir, 'milky_way_stars.json');
    fs.writeFileSync(unifiedFile, JSON.stringify(stars, null, 2));

    console.log(`   ✅ Created unified star dataset`);
    console.log(`   💾 Saved: milky_way_stars.json`);
    console.log(`   📊 Total stars: ${stars.length.toLocaleString()}`);
    console.log(`   📊 File size: ${(fs.statSync(unifiedFile).size / 1024 / 1024).toFixed(2)} MB`);

    const starsWithPlanets = stars.filter(s => s.has_planets).length;
    const starsWithGaiaId = stars.filter(s => s.gaia_dr3_id).length;
    const starsWithTemp = stars.filter(s => s.st_teff).length;

    console.log(`\n   📊 Statistics:`);
    console.log(`      Stars with planets: ${starsWithPlanets.toLocaleString()}`);
    console.log(`      Stars with Gaia DR3 ID: ${starsWithGaiaId.toLocaleString()}`);
    console.log(`      Stars with temperature: ${starsWithTemp.toLocaleString()}`);
    console.log(`      Stars with coordinates: ${stars.filter(s => s.ra && s.dec).length.toLocaleString()}\n`);

    // 4. Compress files
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣  COMPRESSING FILES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const zlib = require('zlib');

    // Compress star data
    const starGz = zlib.gzipSync(JSON.stringify(stars));
    const starGzFile = path.join(dataDir, 'milky_way_stars.json.gz');
    fs.writeFileSync(starGzFile, starGz);
    console.log(`   🗜️  milky_way_stars.json.gz: ${(fs.statSync(starGzFile).size / 1024 / 1024).toFixed(2)} MB`);

    // Compress exoplanet data
    const exoGz = zlib.gzipSync(JSON.stringify(exoplanets));
    const exoGzFile = path.join(dataDir, 'exoplanets.json.gz');
    fs.writeFileSync(exoGzFile, exoGz);
    console.log(`   🗜️  exoplanets.json.gz: ${(fs.statSync(exoGzFile).size / 1024 / 1024).toFixed(2)} MB\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ SUCCESS! All NASA data downloaded and processed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the download
downloadAllNASAData();
