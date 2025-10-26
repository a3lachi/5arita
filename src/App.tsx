import { useState, useEffect } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import Statistics from './components/Statistics';
import { GaiaStar, fetchGaiaStars } from './services/gaiaService';

function App() {
  const [selectedStar, setSelectedStar] = useState<GaiaStar | null>(null);
  const [stars, setStars] = useState<GaiaStar[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="app-container">
      <Scene onStarSelect={setSelectedStar} />
      <UI selectedStar={selectedStar} starCount={stars.length} loading={loading} />
      {!loading && stars.length > 0 && <Statistics stars={stars} />}
    </div>
  );
}

export default App;
