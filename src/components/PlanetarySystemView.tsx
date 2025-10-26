import { useEffect, useState } from 'react';
import { PlanetarySystems, fetchPlanetarySystems } from '../services/exoplanetService';
import { GaiaStar, colorIndexToRGB } from '../services/gaiaService';
import { Sphere, Ring, Text } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetarySystemViewProps {
  star: GaiaStar;
}

export default function PlanetarySystemView({ star }: PlanetarySystemViewProps) {
  const [system, setSystem] = useState<PlanetarySystems | null>(null);

  useEffect(() => {
    async function loadSystem() {
      const systems = await fetchPlanetarySystems();
      const found = systems.find(s => s.gaia_id === star.source_id);
      setSystem(found || null);
    }
    loadSystem();
  }, [star.source_id]);

  if (!system) {
    return null;
  }

  // Star color from BP-RP
  const [r, g, b] = colorIndexToRGB(star.bp_rp);
  const starColor = new THREE.Color(r, g, b);

  // Scale factor for visualization (1 AU = 10 units in scene)
  const AU_SCALE = 10;

  return (
    <group>
      {/* Central Star */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
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

      {/* Star name */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {star.star_name || star.source_id.substring(0, 16)}
      </Text>

      {/* Planets and orbits */}
      {system.planets.map((planet, i) => {
        const orbitRadius = planet.semi_major_axis * AU_SCALE;
        const planetRadius = Math.max(0.05, Math.min(planet.radius * 0.05, 0.3));

        // Planet color based on temperature
        const planetColor = planet.habitable ? '#4CAF50' : // Green for habitable
                           planet.equilibrium_temp > 1000 ? '#FF6B6B' : // Red/hot
                           planet.equilibrium_temp > 500 ? '#FFB74D' : // Orange
                           planet.equilibrium_temp > 200 ? '#64B5F6' : // Blue
                           '#90A4AE'; // Gray/cold

        // Calculate orbital position (simplified - just angle)
        const angle = (i / system.planets.length) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;

        return (
          <group key={planet.name}>
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
            <Sphere args={[planetRadius, 32, 32]} position={[x, 0, z]}>
              <meshStandardMaterial color={planetColor} />
            </Sphere>

            {/* Planet label */}
            <Text
              position={[x, planetRadius + 0.2, z]}
              fontSize={0.15}
              color="white"
              anchorX="center"
              anchorY="bottom"
            >
              {planet.name.split(' ').pop()}
              {planet.habitable ? ' 🌍' : ''}
            </Text>
          </group>
        );
      })}

      {/* Habitable zone visualization */}
      {star.teff_gspphot && (() => {
        const L = Math.pow(system.planets[0]?.semi_major_axis || 1, 2);
        const hzInner = Math.sqrt(L / 1.1) * AU_SCALE;
        const hzOuter = Math.sqrt(L / 0.53) * AU_SCALE;

        return (
          <>
            <Ring args={[hzInner, hzOuter, 64]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshBasicMaterial
                color="#4CAF50"
                transparent
                opacity={0.1}
                side={THREE.DoubleSide}
              />
            </Ring>
            <Text
              position={[0, 0, hzOuter + 0.5]}
              fontSize={0.2}
              color="#4CAF50"
              anchorX="center"
            >
              Habitable Zone
            </Text>
          </>
        );
      })()}
    </group>
  );
}
