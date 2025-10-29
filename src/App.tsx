import { useState, useEffect } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import Statistics from './components/Statistics';
import { GaiaStar, fetchGaiaStars } from './services/gaiaService';
import { Exoplanet } from './services/exoplanetService';

type ViewMode = 'galaxy' | 'system';

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy');
  const [selectedStar, setSelectedStar] = useState<GaiaStar | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Exoplanet | null>(null);
  const [stars, setStars] = useState<GaiaStar[]>([]);
  const [allStars, setAllStars] = useState<GaiaStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousCamera, setPreviousCamera] = useState<CameraState | null>(null);
  const [showOnlyPlanets, setShowOnlyPlanets] = useState(false);

  useEffect(() => {
    async function loadStars() {
      setLoading(true);
      try {
        // Load ALL stars from the NASA dataset (no magnitude filtering)
        // This loads all 46,765 stellar hosts with exoplanets
        const gaiaStars = await fetchGaiaStars(50000, -10, 20);
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

  const handlePlanetSelect = (planet: Exoplanet) => {
    setSelectedPlanet(planet);
    // DON'T clear selectedStar - keep the planetary system view visible
    console.log('Planet selected in App:', planet.pl_name);
  };

  const handleStarSelectInSystem = (star: GaiaStar) => {
    // Keep the same star selected, just update the UI panel
    setSelectedPlanet(null); // Clear planet when star is clicked
    console.log('Star selected in system view:', star.star_name);
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
        onPlanetSelect={handlePlanetSelect}
        onStarSelectInSystem={handleStarSelectInSystem}
        savedCameraPosition={previousCamera}
      />
      <UI
        selectedStar={selectedStar}
        selectedPlanet={selectedPlanet}
        starCount={stars.length}
        loading={loading}
        viewMode={viewMode}
        onReturnToGalaxy={handleReturnToGalaxy}
        showOnlyPlanets={showOnlyPlanets}
        onTogglePlanetFilter={handleTogglePlanetFilter}
        planetarySystemCount={planetarySystemCount}
        allStars={stars}
      />
    </div>
  );
}

export default App;
