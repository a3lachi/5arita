import { useMemo } from 'react';
import { GaiaStar } from '../services/gaiaService';

interface StatisticsProps {
  stars: GaiaStar[];
}

export default function Statistics({ stars }: StatisticsProps) {
  const stats = useMemo(() => {
    if (stars.length === 0) return null;

    // Calculate statistics
    const temperatures = stars
      .map(s => s.teff_gspphot)
      .filter(t => t !== undefined && t !== null) as number[];

    const properMotions = stars
      .filter(s => s.pmra !== undefined && s.pmdec !== undefined)
      .map(s => Math.sqrt(s.pmra! * s.pmra! + s.pmdec! * s.pmdec!));

    const avgTemp = temperatures.length > 0
      ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length
      : 0;

    const avgPM = properMotions.length > 0
      ? properMotions.reduce((a, b) => a + b, 0) / properMotions.length
      : 0;

    // Spectral class distribution
    const spectralCounts = {
      O: 0, B: 0, A: 0, F: 0, G: 0, K: 0, M: 0
    };

    temperatures.forEach(temp => {
      if (temp >= 30000) spectralCounts.O++;
      else if (temp >= 10000) spectralCounts.B++;
      else if (temp >= 7500) spectralCounts.A++;
      else if (temp >= 6000) spectralCounts.F++;
      else if (temp >= 5200) spectralCounts.G++;
      else if (temp >= 3700) spectralCounts.K++;
      else spectralCounts.M++;
    });

    return {
      total: stars.length,
      withTemp: temperatures.length,
      withPM: properMotions.length,
      avgTemp,
      avgPM,
      spectralCounts,
    };
  }, [stars]);

  if (!stats) return null;

  return (
    <div className="statistics-panel">
      <h3>📊 Dataset Statistics</h3>

      <div className="stat-section">
        <h4>Data Coverage</h4>
        <div className="stat-item">
          <span className="stat-label">Total Stars:</span>
          <span className="stat-value">{stats.total.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">With Temperature:</span>
          <span className="stat-value">{stats.withTemp} ({((stats.withTemp / stats.total) * 100).toFixed(0)}%)</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">With Proper Motion:</span>
          <span className="stat-value">{stats.withPM} ({((stats.withPM / stats.total) * 100).toFixed(0)}%)</span>
        </div>
      </div>

      <div className="stat-section">
        <h4>Averages</h4>
        <div className="stat-item">
          <span className="stat-label">Avg Temperature:</span>
          <span className="stat-value">{stats.avgTemp.toFixed(0)} K</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Proper Motion:</span>
          <span className="stat-value">{stats.avgPM.toFixed(2)} mas/yr</span>
        </div>
      </div>

      <div className="stat-section">
        <h4>Spectral Classes</h4>
        {Object.entries(stats.spectralCounts).map(([cls, count]) => {
          if (count === 0) return null;
          const percentage = (count / stats.withTemp) * 100;
          return (
            <div key={cls} className="spectral-bar">
              <span className="spectral-label">{cls}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="spectral-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
