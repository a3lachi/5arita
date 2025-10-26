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
  const [loading, setLoading] = useState(true);
  const [_previousCamera, setPreviousCamera] = useState<CameraState | null>(null);

  useEffect(() => {
    async function loadStars() {
      setLoading(true);
      try {
        // Load all 50,000 stars from the Milky Way dataset
        // Magnitude 0-10 gives us a good visible range
        const gaiaStars = await fetchGaiaStars(50000, -2, 10);
        setStars(gaiaStars);
      } catch (error) {
        console.error('Failed to load stars:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStars();
  }, []);

  const handleStarClick = (star: GaiaStar) => {
    if (star.has_planets) {
      setSelectedStar(star);
      setViewMode('system');
    } else {
      setSelectedStar(star);
    }
  };

  const handleReturnToGalaxy = () => {
    setViewMode('galaxy');
    setSelectedStar(null);
  };

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
      />
      {!loading && stars.length > 0 && viewMode === 'galaxy' && <Statistics stars={stars} />}
    </div>
  );
}

export default App;
