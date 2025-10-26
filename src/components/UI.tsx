import {
  GaiaStar,
  getDistanceInLightYears,
  getSpectralClass,
  getTotalProperMotion,
} from '../services/gaiaService';

type ViewMode = 'galaxy' | 'system';

interface UIProps {
  selectedStar: GaiaStar | null;
  starCount: number;
  loading: boolean;
  viewMode: ViewMode;
  onReturnToGalaxy: () => void;
}

export default function UI({ selectedStar, starCount, loading, viewMode, onReturnToGalaxy }: UIProps) {
  const distance = selectedStar ? getDistanceInLightYears(selectedStar.parallax) : 0;
  const spectralClass = selectedStar ? getSpectralClass(selectedStar.teff_gspphot) : '';
  const totalPM = selectedStar
    ? getTotalProperMotion(selectedStar.pmra, selectedStar.pmdec)
    : 0;
  return (
    <div className="ui-overlay">
      {/* Header */}
      <div className="header">
        <h1>Preview</h1>
        <p className="subtitle">Milky Way Galaxy Map</p>
      </div>

      {/* Info Panel */}
      <div className="info-panel">
        <div className="info-item">
          <span className="label">Data Source:</span>
          <span className="value">ESA Gaia DR3</span>
        </div>
        <div className="info-item">
          <span className="label">Galaxy:</span>
          <span className="value">Milky Way</span>
        </div>
        <div className="info-item">
          <span className="label">Stars Loaded:</span>
          <span className="value">{loading ? 'Loading...' : starCount.toLocaleString()}</span>
        </div>
        {selectedStar && (
          <>
            <div className="divider"></div>
            <h3>⭐ {selectedStar.star_name || 'Selected Star'}</h3>
            {selectedStar.has_planets && (
              <div className="info-item">
                <span className="label">🪐 Planets:</span>
                <span className="value">{selectedStar.planet_count}</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Source ID:</span>
              <span className="value-small">{selectedStar.source_id.substring(0, 16)}...</span>
            </div>

            <h4 className="section-title">Position</h4>
            <div className="info-item">
              <span className="label">Right Ascension:</span>
              <span className="value">{selectedStar.ra.toFixed(4)}°</span>
            </div>
            <div className="info-item">
              <span className="label">Declination:</span>
              <span className="value">{selectedStar.dec.toFixed(4)}°</span>
            </div>
            <div className="info-item">
              <span className="label">Distance:</span>
              <span className="value">{distance.toFixed(1)} ly</span>
            </div>
            <div className="info-item">
              <span className="label">Parallax:</span>
              <span className="value">{selectedStar.parallax.toFixed(3)} mas</span>
            </div>

            <h4 className="section-title">Brightness</h4>
            <div className="info-item">
              <span className="label">G Magnitude:</span>
              <span className="value">{selectedStar.phot_g_mean_mag.toFixed(2)}</span>
            </div>
            {selectedStar.phot_bp_mean_mag && (
              <div className="info-item">
                <span className="label">BP Magnitude:</span>
                <span className="value">{selectedStar.phot_bp_mean_mag.toFixed(2)}</span>
              </div>
            )}
            {selectedStar.phot_rp_mean_mag && (
              <div className="info-item">
                <span className="label">RP Magnitude:</span>
                <span className="value">{selectedStar.phot_rp_mean_mag.toFixed(2)}</span>
              </div>
            )}
            {selectedStar.bp_rp !== undefined && selectedStar.bp_rp !== null && (
              <div className="info-item">
                <span className="label">Color Index:</span>
                <span className="value">{selectedStar.bp_rp.toFixed(3)}</span>
              </div>
            )}

            <h4 className="section-title">Physical Properties</h4>
            {selectedStar.teff_gspphot && (
              <>
                <div className="info-item">
                  <span className="label">Temperature:</span>
                  <span className="value">{selectedStar.teff_gspphot.toFixed(0)} K</span>
                </div>
                <div className="info-item">
                  <span className="label">Spectral Class:</span>
                  <span className="value">{spectralClass}</span>
                </div>
              </>
            )}

            <h4 className="section-title">Motion</h4>
            {selectedStar.pmra !== undefined && selectedStar.pmra !== null && (
              <div className="info-item">
                <span className="label">PM (RA):</span>
                <span className="value">{selectedStar.pmra.toFixed(2)} mas/yr</span>
              </div>
            )}
            {selectedStar.pmdec !== undefined && selectedStar.pmdec !== null && (
              <div className="info-item">
                <span className="label">PM (Dec):</span>
                <span className="value">{selectedStar.pmdec.toFixed(2)} mas/yr</span>
              </div>
            )}
            {totalPM > 0 && (
              <div className="info-item">
                <span className="label">Total PM:</span>
                <span className="value">{totalPM.toFixed(2)} mas/yr</span>
              </div>
            )}
            {selectedStar.radial_velocity !== undefined && selectedStar.radial_velocity !== null && (
              <div className="info-item">
                <span className="label">Radial Velocity:</span>
                <span className="value">{selectedStar.radial_velocity.toFixed(2)} km/s</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Return button (show in system view) */}
      {viewMode === 'system' && (
        <button className="return-button" onClick={onReturnToGalaxy}>
          ← Return to Galaxy View
        </button>
      )}

      {/* Controls hint */}
      <div className="controls-hint">
        <p>🖱️ Left Click + Drag: Rotate</p>
        <p>🖱️ Right Click + Drag: Pan</p>
        <p>🖱️ Scroll: Zoom</p>
        {viewMode === 'galaxy' && <p>🖱️ Click Star: View System</p>}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Built with Three.js, React & TypeScript</p>
        <p>Data from ESA Gaia Archive</p>
      </div>
    </div>
  );
}
