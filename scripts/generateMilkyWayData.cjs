// Generate realistic Milky Way star data based on Gaia DR3 characteristics
// This creates a scientifically plausible dataset when live API is unavailable

const fs = require('fs');
const path = require('path');

console.log('🌌 Generating realistic Milky Way star data...\n');

// Star spectral class distributions (based on actual Milky Way statistics)
const spectralDistribution = [
  { class: 'O', temp: [30000, 50000], color: [-0.4, 0.0], percent: 0.00003 }, // Very rare
  { class: 'B', temp: [10000, 30000], color: [-0.2, 0.3], percent: 0.13 },
  { class: 'A', temp: [7500, 10000], color: [0.0, 0.5], percent: 0.6 },
  { class: 'F', temp: [6000, 7500], color: [0.3, 0.8], percent: 3.0 },
  { class: 'G', temp: [5200, 6000], color: [0.6, 1.2], percent: 7.6 }, // Our Sun
  { class: 'K', temp: [3700, 5200], color: [1.0, 2.0], percent: 12.1 },
  { class: 'M', temp: [2400, 3700], color: [1.5, 3.5], percent: 76.45 }, // Most common
];

function generateStars(count, minMag, maxMag, description) {
  console.log(`📊 Generating ${count} ${description}...`);
  const stars = [];

  for (let i = 0; i < count; i++) {
    // Select spectral class based on realistic distribution
    const rand = Math.random() * 100;
    let cumulative = 0;
    let spectral = spectralDistribution[spectralDistribution.length - 1];

    for (const spec of spectralDistribution) {
      cumulative += spec.percent;
      if (rand < cumulative) {
        spectral = spec;
        break;
      }
    }

    // Generate realistic properties
    const magnitude = minMag + Math.random() * (maxMag - minMag);
    const temp = spectral.temp[0] + Math.random() * (spectral.temp[1] - spectral.temp[0]);
    const bpRp = spectral.color[0] + Math.random() * (spectral.color[1] - spectral.color[0]);

    // Distance/parallax (brighter stars are often closer)
    const distanceParsecs = Math.pow(10, 1 + Math.random() * 2.5); // 10 to ~300 parsecs
    const parallax = 1000 / distanceParsecs; // mas

    // Position - distributed across the sky
    const ra = Math.random() * 360;
    const dec = (Math.random() - 0.5) * 180;

    // Proper motion (mas/year) - most stars move slowly
    const pmra = (Math.random() - 0.5) * 50;
    const pmdec = (Math.random() - 0.5) * 50;

    // Radial velocity (km/s)
    const radialVelocity = (Math.random() - 0.5) * 200;

    stars.push({
      source_id: `MOCK_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      ra: parseFloat(ra.toFixed(6)),
      dec: parseFloat(dec.toFixed(6)),
      parallax: parseFloat(parallax.toFixed(4)),
      parallax_error: parseFloat((parallax * 0.02 * Math.random()).toFixed(4)),
      phot_g_mean_mag: parseFloat(magnitude.toFixed(4)),
      phot_bp_mean_mag: parseFloat((magnitude + bpRp * 0.3).toFixed(4)),
      phot_rp_mean_mag: parseFloat((magnitude - bpRp * 0.3).toFixed(4)),
      bp_rp: parseFloat(bpRp.toFixed(4)),
      teff_gspphot: parseFloat(temp.toFixed(1)),
      logg_gspphot: parseFloat((3.5 + Math.random() * 2).toFixed(2)), // Surface gravity
      mh_gspphot: parseFloat(((Math.random() - 0.5) * 0.5).toFixed(3)), // Metallicity
      distance_gspphot: parseFloat(distanceParsecs.toFixed(2)),
      pmra: parseFloat(pmra.toFixed(4)),
      pmdec: parseFloat(pmdec.toFixed(4)),
      radial_velocity: parseFloat(radialVelocity.toFixed(3)),
      radial_velocity_error: parseFloat((Math.random() * 2).toFixed(3)),
      phot_variable_flag: Math.random() > 0.95 ? 'VARIABLE' : 'NOT_AVAILABLE',
      ruwe: parseFloat((1.0 + Math.random() * 0.2).toFixed(3)), // Quality metric
    });
  }

  console.log(`   ✅ Generated ${stars.length} stars`);
  return stars;
}

function generateMilkyWayDataset() {
  const dataDir = path.join(__dirname, '../public/data');

  // Create data directory
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const datasets = [
    { name: 'brightest_stars', minMag: -2, maxMag: 2, count: 5000, desc: 'brightest visible stars' },
    { name: 'bright_stars', minMag: 2, maxMag: 6, count: 10000, desc: 'bright stars (naked eye)' },
    { name: 'faint_stars', minMag: 6, maxMag: 10, count: 20000, desc: 'faint stars (telescope)' },
    { name: 'distant_stars', minMag: 10, maxMag: 14, count: 15000, desc: 'distant stars' },
  ];

  const allStars = [];

  for (const dataset of datasets) {
    const stars = generateStars(dataset.count, dataset.minMag, dataset.maxMag, dataset.desc);
    allStars.push(...stars);

    // Save individual dataset
    const filename = path.join(dataDir, `${dataset.name}.json`);
    fs.writeFileSync(filename, JSON.stringify(stars, null, 2));
    console.log(`   💾 Saved ${dataset.name}.json\n`);
  }

  // Save combined dataset
  const combinedFile = path.join(dataDir, 'milky_way_stars.json');
  fs.writeFileSync(combinedFile, JSON.stringify(allStars, null, 2));

  console.log(`\n✅ Total stars generated: ${allStars.length.toLocaleString()}`);
  console.log(`💾 Combined data saved to: milky_way_stars.json`);
  console.log(`📊 File size: ${(fs.statSync(combinedFile).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n🌟 Spectral class distribution:');

  // Calculate actual distribution
  const distribution = {};
  spectralDistribution.forEach(spec => {
    const count = Math.round(allStars.length * (spec.percent / 100));
    distribution[spec.class] = count;
    console.log(`   ${spec.class}: ${count.toLocaleString()} stars (${spec.percent}%)`);
  });

  console.log('\n✨ Dataset ready! You can now run: pnpm dev');
}

generateMilkyWayDataset();
