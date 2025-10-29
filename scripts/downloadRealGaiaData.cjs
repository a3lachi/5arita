// Download real Gaia DR3 star data using alternative mirrors
// Uses GAVO Data Center as fallback to ESA

const fs = require('fs');
const path = require('path');
const https = require('https');

// Try multiple Gaia TAP endpoints
const GAIA_ENDPOINTS = [
  'https://gaia.aip.de/tap/sync', // GAVO Data Center (Germany) - usually more reliable
  'https://gea.esac.esa.gov/tap-server/tap/sync', // ESA official
  'https://dc.zah.uni-heidelberg.de/tap/sync', // Heidelberg mirror
];

console.log('🌌 Downloading real Gaia DR3 star data...\n');
console.log('📡 Will try multiple TAP service mirrors for reliability\n');

/**
 * Download Gaia stars from a specific TAP endpoint
 */
async function fetchGaiaStars(endpoint, minMag, maxMag, limit, datasetName) {
  // Comprehensive ADQL query for Gaia DR3
  const query = `
    SELECT TOP ${limit}
      source_id,
      ra,
      dec,
      parallax,
      parallax_error,
      phot_g_mean_mag,
      phot_bp_mean_mag,
      phot_rp_mean_mag,
      bp_rp,
      teff_gspphot,
      logg_gspphot,
      mh_gspphot,
      distance_gspphot,
      pmra,
      pmdec,
      radial_velocity,
      radial_velocity_error,
      phot_variable_flag,
      ruwe
    FROM gaiadr3.gaia_source
    WHERE phot_g_mean_mag BETWEEN ${minMag} AND ${maxMag}
      AND parallax IS NOT NULL
      AND parallax > 0
      AND parallax_error IS NOT NULL
      AND parallax_error < 1
      AND ruwe < 1.4
    ORDER BY phot_g_mean_mag ASC
  `.trim().replace(/\s+/g, ' ');

  const formData = new URLSearchParams({
    REQUEST: 'doQuery',
    LANG: 'ADQL',
    FORMAT: 'json',
    QUERY: query
  });

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData.toString())
      },
      timeout: 120000 // 2 minute timeout
    };

    console.log(`   Trying: ${url.hostname}`);

    const req = https.request(options, (res) => {
      let data = '';
      let lastUpdate = Date.now();

      res.on('data', (chunk) => {
        data += chunk;
        // Show progress every second
        if (Date.now() - lastUpdate > 1000) {
          process.stdout.write(`\r   Downloading... ${(data.length / 1024).toFixed(0)} KB`);
          lastUpdate = Date.now();
        }
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        process.stdout.write('\r   Parsing response...                \n');

        try {
          const json = JSON.parse(data);

          if (json.data && Array.isArray(json.data)) {
            const metadata = json.metadata || [];

            // Map field names to indices
            const fieldMap = {};
            metadata.forEach((field, idx) => {
              fieldMap[field.name] = idx;
            });

            const stars = json.data.map(row => {
              const star = {};
              metadata.forEach(field => {
                const value = row[fieldMap[field.name]];
                star[field.name] = value;
              });
              return star;
            });

            resolve(stars);
          } else if (json.length && Array.isArray(json)) {
            // Some TAP services return array directly
            resolve(json);
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(formData.toString());
    req.end();
  });
}

/**
 * Try multiple endpoints until one works
 */
async function fetchGaiaStarsWithFallback(minMag, maxMag, limit, datasetName) {
  for (const endpoint of GAIA_ENDPOINTS) {
    try {
      console.log(`\n📡 Attempting to download from ${new URL(endpoint).hostname}...`);
      const stars = await fetchGaiaStars(endpoint, minMag, maxMag, limit, datasetName);
      if (stars && stars.length > 0) {
        console.log(`   ✅ Successfully downloaded ${stars.length} stars`);
        return stars;
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      // Continue to next endpoint
    }
  }

  throw new Error('All Gaia TAP endpoints failed');
}

async function downloadGaiaData() {
  const datasets = [
    { name: 'brightest_stars', minMag: -2, maxMag: 2, limit: 5000, description: 'Brightest visible stars' },
    { name: 'bright_stars', minMag: 2, maxMag: 6, limit: 10000, description: 'Bright stars visible to naked eye' },
    { name: 'faint_stars', minMag: 6, maxMag: 10, limit: 20000, description: 'Fainter stars (telescope needed)' },
    { name: 'distant_stars', minMag: 10, maxMag: 14, limit: 15000, description: 'Distant stars' },
  ];

  const dataDir = path.join(__dirname, '../public/data');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const allStars = [];

  for (const dataset of datasets) {
    console.log(`\n📥 Downloading: ${dataset.description}`);
    console.log(`   Magnitude range: ${dataset.minMag} to ${dataset.maxMag}`);
    console.log(`   Target: ${dataset.limit} stars`);

    try {
      const stars = await fetchGaiaStarsWithFallback(
        dataset.minMag,
        dataset.maxMag,
        dataset.limit,
        dataset.name
      );

      if (stars && stars.length > 0) {
        allStars.push(...stars);

        // Save individual dataset
        const filename = path.join(dataDir, `${dataset.name}.json`);
        fs.writeFileSync(filename, JSON.stringify(stars, null, 2));
        console.log(`   💾 Saved to: ${dataset.name}.json`);
        console.log(`   📊 File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
      }

      // Be nice to the API - wait between requests
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`   ❌ Failed to download ${dataset.name}:`, error.message);
      console.log(`   ⚠️  Continuing with other datasets...`);
    }
  }

  // Save combined dataset
  if (allStars.length > 0) {
    const combinedFile = path.join(dataDir, 'milky_way_stars.json');
    fs.writeFileSync(combinedFile, JSON.stringify(allStars, null, 2));

    console.log(`\n✨ Download complete!`);
    console.log(`📊 Total stars downloaded: ${allStars.length.toLocaleString()}`);
    console.log(`💾 Combined data saved to: milky_way_stars.json`);
    console.log(`📊 File size: ${(fs.statSync(combinedFile).size / 1024 / 1024).toFixed(2)} MB\n`);

    // Compress the file
    const gzipped = require('zlib').gzipSync(JSON.stringify(allStars));
    const gzFile = path.join(dataDir, 'milky_way_stars.json.gz');
    fs.writeFileSync(gzFile, gzipped);
    console.log(`🗜️  Compressed: milky_way_stars.json.gz`);
    console.log(`📊 Compressed size: ${(fs.statSync(gzFile).size / 1024 / 1024).toFixed(2)} MB\n`);
  } else {
    console.error('\n❌ No stars were downloaded from any endpoint.');
    console.log('💡 Check your internet connection or try again later.');
    console.log('💡 You can use the generateMilkyWayData.cjs script to create mock data instead.\n');
    process.exit(1);
  }
}

// Run the download
downloadGaiaData().catch(error => {
  console.error('\n❌ Fatal error:', error);
  console.log('💡 Try running: node scripts/generateMilkyWayData.cjs for mock data\n');
  process.exit(1);
});
