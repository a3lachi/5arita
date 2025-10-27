import {
  GaiaStar,
  getDistanceInLightYears,
  getSpectralClass,
  getTotalProperMotion,
} from '../services/gaiaService';
import { Exoplanet, getPlanetCategory } from '../services/exoplanetService';

type ViewMode = 'galaxy' | 'system';

interface UIProps {
  selectedStar: GaiaStar | null;
  selectedPlanet?: Exoplanet | null;
  starCount: number;
  loading: boolean;
  viewMode: ViewMode;
  onReturnToGalaxy: () => void;
  showOnlyPlanets: boolean;
  onTogglePlanetFilter: () => void;
  planetarySystemCount: number;
}

export default function UI({ selectedStar, selectedPlanet, starCount, loading, viewMode, onReturnToGalaxy, showOnlyPlanets, onTogglePlanetFilter, planetarySystemCount }: UIProps) {
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

      {/* Filter Toggle (only in galaxy view) */}
      {viewMode === 'galaxy' && (
        <div className="filter-panel">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showOnlyPlanets}
              onChange={onTogglePlanetFilter}
            />
            <span className="toggle-label">
              🪐 Show only stars with exoplanets
            </span>
          </label>
        </div>
      )}

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
        {viewMode === 'galaxy' && planetarySystemCount > 0 && (
          <div className="info-item">
            <span className="label">🪐 Planetary Systems:</span>
            <span className="value">{planetarySystemCount.toLocaleString()}</span>
          </div>
        )}
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

        {/* Selected Planet Data */}
        {selectedPlanet && (
          <>
            <div className="divider"></div>
            <h3>🪐 {selectedPlanet.pl_name}</h3>

            <h4 className="section-title">Planet Properties</h4>
            {selectedPlanet.pl_rade && (
              <div className="info-item">
                <span className="label">Radius:</span>
                <span className="value">{selectedPlanet.pl_rade.toFixed(2)} R⊕</span>
              </div>
            )}
            {selectedPlanet.pl_radj && (
              <div className="info-item">
                <span className="label">Radius:</span>
                <span className="value">{selectedPlanet.pl_radj.toFixed(2)} R♃</span>
              </div>
            )}
            {(selectedPlanet.pl_bmasse || selectedPlanet.pl_masse) && (
              <div className="info-item">
                <span className="label">Mass:</span>
                <span className="value">{(selectedPlanet.pl_bmasse || selectedPlanet.pl_masse)?.toFixed(2)} M⊕</span>
              </div>
            )}
            {selectedPlanet.pl_dens && (
              <div className="info-item">
                <span className="label">Density:</span>
                <span className="value">{selectedPlanet.pl_dens.toFixed(2)} g/cm³</span>
              </div>
            )}
            {selectedPlanet.pl_eqt && (
              <div className="info-item">
                <span className="label">Equilibrium Temp:</span>
                <span className="value">{selectedPlanet.pl_eqt.toFixed(0)} K</span>
              </div>
            )}
            {selectedPlanet.pl_rade && (
              <div className="info-item">
                <span className="label">Category:</span>
                <span className="value">{getPlanetCategory(selectedPlanet.pl_rade)}</span>
              </div>
            )}
            {selectedPlanet.habitable && (
              <div className="info-item">
                <span className="label">🌍 Habitable:</span>
                <span className="value">Potentially</span>
              </div>
            )}

            <h4 className="section-title">Orbital Parameters</h4>
            {selectedPlanet.pl_orbsmax && (
              <div className="info-item">
                <span className="label">Semi-major Axis:</span>
                <span className="value">{selectedPlanet.pl_orbsmax.toFixed(3)} AU</span>
              </div>
            )}
            {selectedPlanet.pl_orbper && (
              <div className="info-item">
                <span className="label">Orbital Period:</span>
                <span className="value">{selectedPlanet.pl_orbper.toFixed(2)} days</span>
              </div>
            )}
            {selectedPlanet.pl_orbeccen !== undefined && selectedPlanet.pl_orbeccen !== null && (
              <div className="info-item">
                <span className="label">Eccentricity:</span>
                <span className="value">{selectedPlanet.pl_orbeccen.toFixed(3)}</span>
              </div>
            )}
            {selectedPlanet.pl_orbincl && (
              <div className="info-item">
                <span className="label">Inclination:</span>
                <span className="value">{selectedPlanet.pl_orbincl.toFixed(2)}°</span>
              </div>
            )}

            <h4 className="section-title">Discovery</h4>
            {selectedPlanet.discoverymethod && (
              <div className="info-item">
                <span className="label">Method:</span>
                <span className="value">{selectedPlanet.discoverymethod}</span>
              </div>
            )}
            {selectedPlanet.disc_year && (
              <div className="info-item">
                <span className="label">Year:</span>
                <span className="value">{selectedPlanet.disc_year}</span>
              </div>
            )}
            {selectedPlanet.disc_facility && (
              <div className="info-item">
                <span className="label">Facility:</span>
                <span className="value-small">{selectedPlanet.disc_facility}</span>
              </div>
            )}

            {/* Spectroscopy Data */}
            {(selectedPlanet.pl_ntranspec || selectedPlanet.pl_nespec || selectedPlanet.pl_ndispec) && (
              <>
                <h4 className="section-title">Atmospheric Data</h4>
                {selectedPlanet.pl_ntranspec && selectedPlanet.pl_ntranspec > 0 && (
                  <div className="info-item">
                    <span className="label">Transmission Spectra:</span>
                    <span className="value">{selectedPlanet.pl_ntranspec}</span>
                  </div>
                )}
                {selectedPlanet.pl_nespec && selectedPlanet.pl_nespec > 0 && (
                  <div className="info-item">
                    <span className="label">Eclipse Spectra:</span>
                    <span className="value">{selectedPlanet.pl_nespec}</span>
                  </div>
                )}
                {selectedPlanet.pl_ndispec && selectedPlanet.pl_ndispec > 0 && (
                  <div className="info-item">
                    <span className="label">Direct Imaging Spectra:</span>
                    <span className="value">{selectedPlanet.pl_ndispec}</span>
                  </div>
                )}
              </>
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
