// CDN Configuration for data files
// Update these URLs after uploading to Vercel Blob Storage

export const CDN_CONFIG = {
  // Set to true to use CDN, false to use local files
  USE_CDN: true,

  // Base URL for your Vercel Blob Storage
  // Format: https://your-blob-url.vercel-storage.com (no trailing slash)
  BLOB_BASE_URL: 'https://6ep0fmc0ekul9vo1.public.blob.vercel-storage.com',

  // Data file paths
  MILKY_WAY_STARS: '/milky_way_stars.json',
  EXOPLANETS: '/exoplanets.json',
};

// Helper function to get the correct URL
export function getDataUrl(filename: 'milky_way_stars' | 'exoplanets'): string {
  console.log('🔧 CDN Config:', { USE_CDN: CDN_CONFIG.USE_CDN, BLOB_BASE_URL: CDN_CONFIG.BLOB_BASE_URL });

  if (CDN_CONFIG.USE_CDN && CDN_CONFIG.BLOB_BASE_URL) {
    const path = filename === 'milky_way_stars'
      ? CDN_CONFIG.MILKY_WAY_STARS
      : CDN_CONFIG.EXOPLANETS;
    const url = `${CDN_CONFIG.BLOB_BASE_URL}${path}`;
    console.log('✅ Using CDN URL:', url);
    return url;
  }

  // Fallback to local files
  const localUrl = `/data/${filename}.json`;
  console.log('⚠️ Using local URL:', localUrl);
  return localUrl;
}
