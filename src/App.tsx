import { useState, useEffect } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import Statistics from './components/Statistics';
import { GaiaStar, fetchGaiaStars } from './services/gaiaService';

type ViewMode = 'galaxy' | 'system';

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy');
  const [selectedStar, setSelectedStar] = useState<GaiaStar | null>(null);
  const [stars, setStars] = useState<GaiaStar[]>([]);
  const [allStars, setAllStars] = useState<GaiaStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [_previousCamera, setPreviousCamera] = useState<CameraState | null>(null);
  const [showOnlyPlanets, setShowOnlyPlanets] = useState(false);

  useEffect(() => {
    async function loadStars() {
      setLoading(true);
      try {
        // Load all 50,000 stars from the Milky Way dataset
        // Magnitude 0-10 gives us a good visible range
        const gaiaStars = await fetchGaiaStars(50000, -2, 10);
        setAllStars(gaiaStars);
        setStars(gaiaStars);
      } catch (error) {
        console.error('Failed to load stars:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStars();
  }, []);

  // Filter stars based on planet filter
  useEffect(() => {
    if (showOnlyPlanets) {
      const filteredStars = allStars.filter(star => star.has_planets);
      setStars(filteredStars);
      console.log(`Filtered to ${filteredStars.length} stars with planets`);
    } else {
      setStars(allStars);
    }
  }, [showOnlyPlanets, allStars]);

  const handleStarClick = async (star: GaiaStar) => {
    setSelectedStar(star);

    // Always switch to system view - PlanetarySystemView will handle the case where no planets exist
    setViewMode('system');

    console.log('Star clicked:', star.star_name || star.source_id, 'has_planets:', star.has_planets);
  };

  const handleReturnToGalaxy = () => {
    setViewMode('galaxy');
    setSelectedStar(null);
  };

  const handleTogglePlanetFilter = () => {
    setShowOnlyPlanets(!showOnlyPlanets);
  };

  const planetarySystemCount = allStars.filter(star => star.has_planets).length;

  return (
    <div className="app-container">
      <Scene
        stars={stars}
        selectedStar={selectedStar}
        viewMode={viewMode}
        onStarClick={handleStarClick}
        onCameraChange={setPreviousCamera}
      />
      <UI
        selectedStar={selectedStar}
        starCount={stars.length}
        loading={loading}
        viewMode={viewMode}
        onReturnToGalaxy={handleReturnToGalaxy}
        showOnlyPlanets={showOnlyPlanets}
        onTogglePlanetFilter={handleTogglePlanetFilter}
        planetarySystemCount={planetarySystemCount}
      />
      {!loading && stars.length > 0 && viewMode === 'galaxy' && <Statistics stars={stars} />}
    </div>
  );
}

export default App;
