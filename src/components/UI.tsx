import { useState, useMemo } from 'react';
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
  allStars: GaiaStar[];
}

export default function UI({ selectedStar, selectedPlanet, starCount, loading, viewMode, onReturnToGalaxy, showOnlyPlanets, onTogglePlanetFilter, planetarySystemCount, allStars }: UIProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

  const distance = selectedStar ? getDistanceInLightYears(selectedStar.parallax) : 0;
  const spectralClass = selectedStar ? getSpectralClass(selectedStar.teff_gspphot) : '';
  const totalPM = selectedStar
    ? getTotalProperMotion(selectedStar.pmra, selectedStar.pmdec)
    : 0;

  // Calculate statistics for dataset
  const statistics = useMemo(() => {
    if (allStars.length === 0) return null;

    const temperatures = allStars
      .map(s => s.teff_gspphot)
      .filter(t => t !== undefined && t !== null) as number[];

    const properMotions = allStars
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
      total: allStars.length,
      withTemp: temperatures.length,
      withPM: properMotions.length,
      avgTemp,
      avgPM,
      spectralCounts,
    };
  }, [allStars]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const SectionHeader = ({ title, section, icon }: { title: string; section: string; icon: string }) => (
    <div
      className={`section-header ${expandedSections.has(section) ? 'expanded' : ''}`}
      onClick={() => toggleSection(section)}
    >
      <span className="section-icon">{icon}</span>
      <span className="section-title">{title}</span>
      <span className="section-toggle">{expandedSections.has(section) ? '▼' : '▶'}</span>
    </div>
  );

  return (
    <div className="ui-overlay">
      {/* Header */}
      <div className="header">
        <h1>5arita</h1>
        <p className="subtitle">Known Universe Map</p>
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

      {/* Collapsible Info Panel */}
      <div className="info-panel">
        {/* General Info Section */}
        <SectionHeader title="General Info" section="general" icon="ℹ️" />
        {expandedSections.has('general') && (
          <div className="section-content">
            <div className="info-item">
              <span className="label">Data Source:</span>
              <span className="value">NASA Archive</span>
            </div>
            <div className="info-item">
              <span className="label">Galaxy:</span>
              <span className="value">Milky Way</span>
            </div>
            <div className="info-item">
              <span className="label">Stars Loaded:</span>
              <span className="value">{loading ? 'Loading...' : starCount.toLocaleString()}</span>
            </div>
            {viewMode === 'galaxy' && planetarySystemCount > 0 ? (
              <div className="info-item">
                <span className="label">🪐 Planetary Systems:</span>
                <span className="value">{planetarySystemCount.toLocaleString()}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* Dataset Statistics Section (Galaxy View Only) */}
        {viewMode === 'galaxy' && statistics && (
          <>
            <SectionHeader title="Dataset Statistics" section="statistics" icon="📊" />
            {expandedSections.has('statistics') && (
              <div className="section-content">
                {/* Data Coverage */}
                <div className="stat-subsection">
                  <h5 className="stat-subtitle">Data Coverage</h5>
                  <div className="info-item">
                    <span className="label">With Temperature:</span>
                    <span className="value">{statistics.withTemp} ({((statistics.withTemp / statistics.total) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="info-item">
                    <span className="label">With Proper Motion:</span>
                    <span className="value">{statistics.withPM} ({((statistics.withPM / statistics.total) * 100).toFixed(0)}%)</span>
                  </div>
                </div>

                {/* Averages */}
                <div className="stat-subsection">
                  <h5 className="stat-subtitle">Averages</h5>
                  <div className="info-item">
                    <span className="label">Avg Temperature:</span>
                    <span className="value">{statistics.avgTemp.toFixed(0)} K</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Avg Proper Motion:</span>
                    <span className="value">{statistics.avgPM.toFixed(2)} mas/yr</span>
                  </div>
                </div>

                {/* Spectral Classes */}
                <div className="stat-subsection">
                  <h5 className="stat-subtitle">Spectral Classes</h5>
                  {Object.entries(statistics.spectralCounts).map(([cls, count]) => {
                    if (count === 0) return null;
                    const percentage = (count / statistics.withTemp) * 100;
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
            )}
          </>
        )}

        {/* Selected Star Section */}
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

            {/* Position Section */}
            <SectionHeader title="Position" section="position" icon="📍" />
            {expandedSections.has('position') && (
              <div className="section-content">
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
              </div>
            )}

            {/* Brightness Section */}
            <SectionHeader title="Brightness" section="brightness" icon="✨" />
            {expandedSections.has('brightness') && (
              <div className="section-content">
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
              </div>
            )}

            {/* Physical Properties Section */}
            {selectedStar.teff_gspphot && (
              <>
                <SectionHeader title="Physical Properties" section="physical" icon="🔬" />
                {expandedSections.has('physical') && (
                  <div className="section-content">
                    <div className="info-item">
                      <span className="label">Temperature:</span>
                      <span className="value">{selectedStar.teff_gspphot.toFixed(0)} K</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Spectral Class:</span>
                      <span className="value">{spectralClass}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Motion Section */}
            <SectionHeader title="Motion" section="motion" icon="🔄" />
            {expandedSections.has('motion') && (
              <div className="section-content">
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
              </div>
            )}
          </>
        )}

        {/* Selected Planet Section */}
        {selectedPlanet && (
          <>
            <div className="divider"></div>
            <h3>🪐 {selectedPlanet.pl_name}</h3>

            {/* Planet Properties Section */}
            <SectionHeader title="Planet Properties" section="planet-props" icon="🌍" />
            {expandedSections.has('planet-props') && (
              <div className="section-content">
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
              </div>
            )}

            {/* Orbital Parameters Section */}
            <SectionHeader title="Orbital Parameters" section="orbital" icon="🔭" />
            {expandedSections.has('orbital') && (
              <div className="section-content">
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
              </div>
            )}

            {/* Discovery Section */}
            <SectionHeader title="Discovery" section="discovery" icon="🔍" />
            {expandedSections.has('discovery') && (
              <div className="section-content">
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
              </div>
            )}

            {/* Atmospheric Data Section */}
            {((selectedPlanet.pl_ntranspec && selectedPlanet.pl_ntranspec > 0) ||
              (selectedPlanet.pl_nespec && selectedPlanet.pl_nespec > 0) ||
              (selectedPlanet.pl_ndispec && selectedPlanet.pl_ndispec > 0)) ? (
              <>
                <SectionHeader title="Atmospheric Data" section="atmosphere" icon="🌫️" />
                {expandedSections.has('atmosphere') && (
                  <div className="section-content">
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
                  </div>
                )}
              </>
            ) : null}
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
        <p>Data from NASA Archive</p>
      </div>
    </div>
  );
}
