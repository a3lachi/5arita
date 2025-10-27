import { useEffect, useState } from 'react';
import { Exoplanet, getExoplanetsForStar, getHabitableZone } from '../services/exoplanetService';
import { GaiaStar, colorIndexToRGB } from '../services/gaiaService';
import { Sphere, Ring, Html } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetarySystemViewProps {
  star: GaiaStar;
  onPlanetSelect?: (planet: Exoplanet) => void;
  onStarSelect?: (star: GaiaStar) => void;
}

export default function PlanetarySystemView({ star, onPlanetSelect, onStarSelect }: PlanetarySystemViewProps) {
  const [planets, setPlanets] = useState<Exoplanet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlanets() {
      setLoading(true);
      const foundPlanets = await getExoplanetsForStar(
        star.star_name || star.source_id,
        star.ra,
        star.dec
      );
      setPlanets(foundPlanets);
      setLoading(false);
      console.log(`Found ${foundPlanets.length} planets for ${star.star_name || star.source_id}`);
    }
    loadPlanets();
  }, [star.source_id, star.star_name, star.ra, star.dec]);

  if (loading) {
    return (
      <Html center>
        <div style={{ color: 'white', fontSize: '20px' }}>Loading planetary system...</div>
      </Html>
    );
  }

  if (planets.length === 0) {
    return (
      <group>
        {/* Show the star anyway */}
        <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={new THREE.Color(...colorIndexToRGB(star.bp_rp))}
            emissive={new THREE.Color(...colorIndexToRGB(star.bp_rp))}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </Sphere>

        <Html position={[0, 1.5, 0]} center>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '0 0 8px black, 0 0 12px black',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {star.star_name || 'Star'}
          </div>
        </Html>

        <Html center position={[0, -2, 0]}>
          <div style={{
            color: 'white',
            fontSize: '16px',
            background: 'rgba(0,0,0,0.8)',
            padding: '12px 20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div>No confirmed exoplanets found</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
              This star may have planets not yet discovered or confirmed by NASA
            </div>
          </div>
        </Html>
      </group>
    );
  }

  // Star color from BP-RP or temperature
  const [r, g, b] = colorIndexToRGB(star.bp_rp);
  const starColor = new THREE.Color(r, g, b);

  // Get habitable zone
  const starTemp = planets[0]?.st_teff || star.teff_gspphot || 5778;
  const starRadius = planets[0]?.st_rad || 1.0;
  const { inner: hzInner, outer: hzOuter } = getHabitableZone(starTemp, starRadius);

  // Dynamic scale factor based on outermost planet
  const maxOrbit = Math.max(...planets.map(p => p.pl_orbsmax || 1));
  const AU_SCALE = maxOrbit > 10 ? 50 / maxOrbit : 10; // Scale so largest orbit fits in ~50 units

  return (
    <group>
      {/* Central Star */}
      <Sphere
        args={[0.5, 32, 32]}
        position={[0, 0, 0]}
        onClick={() => {
          onStarSelect?.(star);
          console.log('Star clicked:', star.star_name);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Sphere>

      {/* Star glow */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </Sphere>

      {/* Star name - using Html so it follows camera - clickable */}
      <Html position={[0, 1.5, 0]} center>
        <div
          onClick={() => {
            onStarSelect?.(star);
            console.log('Star name clicked:', star.star_name);
          }}
          style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            textShadow: '0 0 8px black, 0 0 12px black',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {planets[0]?.hostname || star.star_name || 'Host Star'}
        </div>
      </Html>

      {/* System info */}
      <Html position={[0, -2, 0]} center>
        <div style={{
          color: 'white',
          fontSize: '14px',
          background: 'rgba(0,0,0,0.7)',
          padding: '8px 12px',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {planets.length} planet{planets.length > 1 ? 's' : ''} • {starTemp.toFixed(0)}K
        </div>
      </Html>

      {/* Planets and orbits */}
      {planets.map((planet, i) => {
        const orbitRadius = (planet.pl_orbsmax || 1) * AU_SCALE;
        const planetRadiusEarth = planet.pl_rade || (planet.pl_radj ? planet.pl_radj * 11.2 : 1);
        const planetRadius = Math.max(0.05, Math.min(planetRadiusEarth * 0.05, 0.4));

        // Planet color based on properties
        const temp = planet.pl_eqt || 288;
        const planetColor = planet.habitable ? '#4CAF50' : // Green for habitable
                           temp > 1000 ? '#FF6B6B' : // Red/hot
                           temp > 500 ? '#FFB74D' : // Orange
                           temp > 200 ? '#64B5F6' : // Blue
                           '#90A4AE'; // Gray/cold

        // Calculate orbital position (distribute evenly)
        const angle = (i / planets.length) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;

        return (
          <group key={planet.pl_name}>
            {/* Orbit ring */}
            <Ring args={[orbitRadius - 0.02, orbitRadius + 0.02, 64]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshBasicMaterial
                color={planet.habitable ? '#4CAF50' : '#666666'}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
              />
            </Ring>

            {/* Planet */}
            <Sphere
              args={[planetRadius, 32, 32]}
              position={[x, 0, z]}
              onClick={(e) => {
                e.stopPropagation();
                onPlanetSelect?.(planet);
                console.log('Planet clicked:', planet.pl_name);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'default')}
            >
              <meshStandardMaterial color={planetColor} />
            </Sphere>

            {/* Planet label - only name - clickable */}
            <Html position={[x, planetRadius + 0.3, z]} center>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onPlanetSelect?.(planet);
                  console.log('Planet name clicked:', planet.pl_name);
                }}
                style={{
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px black, 0 0 8px black',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {planet.pl_name}{planet.habitable ? ' 🌍' : ''}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Habitable zone visualization */}
      <Ring args={[hzInner * AU_SCALE, hzOuter * AU_SCALE, 64]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color="#4CAF50"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </Ring>
      <Html position={[0, 0, hzOuter * AU_SCALE + 0.5]} center>
        <div style={{
          color: '#4CAF50',
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '0 0 4px black, 0 0 8px black',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          Habitable Zone
        </div>
      </Html>
    </group>
  );
}
