# Vercel Blob Storage Setup Guide

This guide will help you upload your large data files to Vercel Blob Storage and configure your app to use them.

## Why Vercel Blob Storage?

Your data files are too large for Vercel's standard deployment:
- `public/data/milky_way_stars.json`: **31 MB** (54,498 stars)
- `public/data/exoplanets.json`: **63 MB** (5,638 exoplanets)

Vercel has file size limits, so we need to host these files externally on Vercel Blob Storage.

## Step 1: Upload Files to Vercel Blob

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your **5arita** project
3. Click on **Storage** tab in the left sidebar
4. Click **Create Database** or **Connect Store**
5. Select **Blob** storage
6. Click **Create** to create a new Blob store
7. Once created, click **Upload** button
8. Upload these two files:
   - `public/data/milky_way_stars.json`
   - `public/data/exoplanets.json`
9. After upload, click on each file to see its URL
10. Copy the full URL for each file (something like: `https://xxxxx.public.blob.vercel-storage.com/milky_way_stars.json`)

### Option B: Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI if you haven't already
pnpm install -g vercel

# Link your project
vercel link

# Upload the files
vercel blob upload public/data/milky_way_stars.json
vercel blob upload public/data/exoplanets.json
```

The CLI will output the URLs for each file.

## Step 2: Configure Your App

After uploading, you'll have two URLs that look like:
```
https://xxxxx.public.blob.vercel-storage.com/milky_way_stars.json
https://xxxxx.public.blob.vercel-storage.com/exoplanets.json
```

### Update the CDN Config

1. Open `src/config/cdn.ts`
2. Update the `BLOB_BASE_URL` with your base URL:

```typescript
export const CDN_CONFIG = {
  // Set to true to use CDN, false to use local files
  USE_CDN: true,

  // Base URL for your Vercel Blob Storage
  // Example: https://xxxxx.public.blob.vercel-storage.com
  BLOB_BASE_URL: 'https://xxxxx.public.blob.vercel-storage.com',

  // Data file paths
  MILKY_WAY_STARS: '/milky_way_stars.json',
  EXOPLANETS: '/exoplanets.json',
};
```

**Note:**
- The `BLOB_BASE_URL` should be just the base URL (without the filename)
- The filenames are already configured in `MILKY_WAY_STARS` and `EXOPLANETS`

## Step 3: Test Locally

Before deploying, test that the configuration works:

```bash
# Build the project
pnpm build

# Preview the production build locally
pnpm preview
```

Open the app in your browser and check the console. You should see:
```
📡 Fetching star data from: https://xxxxx.public.blob.vercel-storage.com/milky_way_stars.json
✅ Loaded 54,498 stars from local dataset
📡 Fetching exoplanet data from: https://xxxxx.public.blob.vercel-storage.com/exoplanets.json
✅ Loaded 5,638 exoplanets
```

## Step 4: Deploy to Vercel

Once local testing works:

```bash
# Commit your changes
git add .
git commit -m "Configure Vercel Blob Storage for large data files"
git push

# Vercel will automatically redeploy
```

Or manually trigger deployment:

```bash
vercel --prod
```

## Step 5: Verify Deployment

1. Open your deployed site on Vercel
2. Open the browser console (F12)
3. Check that the console shows:
   - `✅ Loaded 54,498 stars` (not 2,000)
   - `✅ Loaded 5,638 exoplanets`
   - `🪐 Planetary Systems: XXX`

## Troubleshooting

### Files not loading from Blob Storage

**Check console for errors:**
```
❌ Error loading star data: Failed to fetch
```

**Solutions:**
1. Verify the URLs in your browser (paste them directly in address bar)
2. Make sure `USE_CDN: true` in `src/config/cdn.ts`
3. Check that `BLOB_BASE_URL` doesn't have a trailing slash
4. Verify files are set to **public** access in Vercel Blob Storage

### Still showing 2,000 stars

**Possible causes:**
1. CDN config not updated - check `src/config/cdn.ts`
2. Files not uploaded yet - check Vercel Blob Storage dashboard
3. Wrong URL format - ensure no trailing slashes or missing protocol (https://)
4. Cache issue - hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### CORS errors

Vercel Blob Storage should automatically handle CORS for your domain. If you see CORS errors:
1. Check that the files are set to **public** access
2. Verify you're accessing from your Vercel domain (not localhost with CDN enabled)

## Alternative: Keep Local for Development

You can switch between CDN (production) and local files (development):

```typescript
// In src/config/cdn.ts
export const CDN_CONFIG = {
  // Use CDN only in production
  USE_CDN: import.meta.env.PROD,

  BLOB_BASE_URL: 'https://xxxxx.public.blob.vercel-storage.com',
  MILKY_WAY_STARS: '/milky_way_stars.json',
  EXOPLANETS: '/exoplanets.json',
};
```

This way:
- **Development (`pnpm dev`)**: Uses local files from `public/data/`
- **Production (Vercel)**: Uses Blob Storage

## File Sizes Reference

| File | Size | Records | Type |
|------|------|---------|------|
| milky_way_stars.json | 31 MB | 54,498 | Gaia DR3 stars |
| exoplanets.json | 63 MB | 5,638 | NASA Exoplanet Archive |

## Need Help?

If you encounter issues:
1. Check Vercel Blob Storage documentation: https://vercel.com/docs/storage/vercel-blob
2. Verify your console logs match the expected output
3. Test URLs directly in browser to ensure files are accessible
