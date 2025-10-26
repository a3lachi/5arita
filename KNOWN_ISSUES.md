# Known Issues

## Console Warnings (Safe to Ignore)

### 1. "Invalid argument not valid semver" Error

**Error Message:**
```
Uncaught Error: Invalid argument not valid semver ('' received)
    at activateBackend (backendManager.js:1:13128)
```

**Cause:** React DevTools browser extension compatibility issue

**Impact:** None - this is a harmless warning from React DevTools

**Solution:** You can safely ignore this error. It doesn't affect the application's functionality.

**Alternative:** Disable React DevTools browser extension if the warning bothers you

### 2. Large Chunk Size Warning (Build)

**Warning Message:**
```
Some chunks are larger than 500 kB after minification
```

**Cause:** Three.js library is large (~1.1 MB minified)

**Impact:** Slightly longer initial load time

**Solution (optional):**
- Use dynamic imports for Three.js components
- Enable code splitting in vite.config.ts
- Currently acceptable for this visualization app

## Performance Notes

### Rendering 50,000 Stars

- **Expected behavior:** Smooth 60 FPS on modern GPUs
- **Lower-end devices:** May see 30-45 FPS
- **Solution if slow:** Reduce star count in `App.tsx`:
  ```typescript
  const gaiaStars = await fetchGaiaStars(10000, -2, 8); // Reduce to 10K stars
  ```

## Data Loading

### First Load

- **Loading time:** 2-5 seconds (27MB JSON file)
- **Cached loads:** Near instant
- **Normal behavior:** Console shows "Loading Milky Way star data..."

All systems working as intended! 🌟
