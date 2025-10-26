import { useMemo } from 'react';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { GaiaStar, equatorialToCartesian, parallaxToDistance } from '../services/gaiaService';

interface BrightStarsProps {
  stars: GaiaStar[];
}

export default function BrightStars({ stars }: BrightStarsProps) {
  // Filter for the brightest stars (magnitude < 2)
  const brightStars = useMemo(() => {
    return stars.filter(star => star.phot_g_mean_mag < 2);
  }, [stars]);

  if (brightStars.length === 0) return null;

  return (
    <>
      {brightStars.map((star, i) => {
        const distance = parallaxToDistance(star.parallax);
        const [x, y, z] = equatorialToCartesian(star.ra, star.dec, distance);

        return (
          <group key={`bright-${star.source_id}-${i}`} position={[x, y, z]}>
            {/* Subtle sparkle effect for brightest stars */}
            <Sparkles
              count={10}
              scale={5}
              size={2}
              speed={0.3}
              opacity={0.3}
              color={new THREE.Color(1, 1, 0.9)}
            />
          </group>
        );
      })}
    </>
  );
}
