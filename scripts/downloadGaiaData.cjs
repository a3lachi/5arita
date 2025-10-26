// Script to download Gaia DR3 star data for the Milky Way
// This downloads data once and saves it locally to avoid CORS issues

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const GAIA_TAP_URL = 'https://gea.esac.esa.gov/tap-server/tap/sync';

/**
 * Download Gaia star data in batches
 * Gaia has ~1.8 billion stars, but we'll download the brightest and most complete data
 */
async function downloadGaiaData() {
  console.log('🌌 Starting Gaia Milky Way data download...\n');

  // We'll download in magnitude ranges to get a good distribution
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
    console.log('✅ Created data directory:', dataDir);
  }

  const allStars = [];

  for (const dataset of datasets) {
    console.log(`\n📥 Downloading: ${dataset.description}`);
    console.log(`   Magnitude range: ${dataset.minMag} to ${dataset.maxMag}`);
    console.log(`   Target: ${dataset.limit} stars`);

    try {
      const stars = await fetchGaiaStars(dataset.minMag, dataset.maxMag, dataset.limit);

      if (stars && stars.length > 0) {
        console.log(`   ✅ Downloaded ${stars.length} stars`);
        allStars.push(...stars);

        // Save individual dataset
        const filename = path.join(dataDir, `${dataset.name}.json`);
        fs.writeFileSync(filename, JSON.stringify(stars, null, 2));
        console.log(`   💾 Saved to: ${dataset.name}.json`);
      } else {
        console.log(`   ⚠️  No stars downloaded for this range`);
      }

      // Wait a bit between requests to be nice to the API
      await sleep(2000);

    } catch (error) {
      console.error(`   ❌ Error downloading ${dataset.name}:`, error.message);
    }
  }

  // Save combined dataset
  if (allStars.length > 0) {
    const combinedFile = path.join(dataDir, 'milky_way_stars.json');
    fs.writeFileSync(combinedFile, JSON.stringify(allStars, null, 2));
    console.log(`\n✅ Total stars downloaded: ${allStars.length}`);
    console.log(`💾 Combined data saved to: milky_way_stars.json`);
    console.log(`📊 File size: ${(fs.statSync(combinedFile).size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error('\n❌ No stars were downloaded. Check your internet connection or try again later.');
  }
}

/**
 * Fetch stars from Gaia using TAP protocol
 */
async function fetchGaiaStars(minMag, maxMag, limit) {
  // ADQL query for comprehensive star data
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
    ORDER BY phot_g_mean_mag ASC
  `.trim().replace(/\s+/g, ' ');

  const formData = new URLSearchParams({
    REQUEST: 'doQuery',
    LANG: 'ADQL',
    FORMAT: 'json',
    QUERY: query
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData.toString())
      }
    };

    const req = https.request(GAIA_TAP_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
        // Show progress
        if (data.length % 100000 < 1000) {
          process.stdout.write(`\r   Downloading... ${(data.length / 1024).toFixed(0)} KB`);
        }
      });

      res.on('end', () => {
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

    req.write(formData.toString());
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the download
downloadGaiaData().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
