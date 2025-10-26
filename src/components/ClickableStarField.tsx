import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  fetchGaiaStars,
  equatorialToCartesian,
  parallaxToDistance,
  magnitudeToSize,
  colorIndexToRGB,
  GaiaStar,
} from '../services/gaiaService';
import { starVertexShader, starFragmentShader } from '../shaders/starShader';

interface ClickableStarFieldProps {
  onStarClick: (star: GaiaStar) => void;
}

export default function ClickableStarField({ onStarClick }: ClickableStarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [stars, setStars] = useState<GaiaStar[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState<{ star: GaiaStar; position: [number, number, number] } | null>(null);
  const { camera, raycaster, pointer } = useThree();

  // Fetch Gaia data on mount
  useEffect(() => {
    async function loadStars() {
      setLoading(true);
      try {
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

  // Generate star positions and properties
  const { positions, sizes, colors, starData } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const colors = new Float32Array(stars.length * 3);
    const starData: Array<{ star: GaiaStar; position: [number, number, number] }> = [];

    stars.forEach((star, i) => {
      const distance = parallaxToDistance(star.parallax);
      const [x, y, z] = equatorialToCartesian(star.ra, star.dec, distance);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      sizes[i] = magnitudeToSize(star.phot_g_mean_mag);

      // Use real color from BP-RP color index
      const [r, g, b] = colorIndexToRGB(star.bp_rp);
      const brightness = Math.max(0.5, 1 - star.phot_g_mean_mag / 10);
      colors[i * 3] = r * brightness;
      colors[i * 3 + 1] = g * brightness;
      colors[i * 3 + 2] = b * brightness;

      starData.push({ star, position: [x, y, z] });
    });

    return { positions, sizes, colors, starData };
  }, [stars]);

  // Create custom shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Create geometry with attributes
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [positions, sizes, colors]);

  // Handle hover - detect closest star to mouse
  useFrame(() => {
    if (pointsRef.current && starData.length > 0) {
      // Slow rotation
      pointsRef.current.rotation.y += 0.0002;

      // Raycasting for hover
      raycaster.setFromCamera(pointer, camera);

      // Find closest star within threshold
      let closestDistance = Infinity;
      let closestIndex = -1;
      const threshold = 5; // Distance threshold for hover

      starData.forEach(({ position }, index) => {
        const starPos = new THREE.Vector3(...position);
        const distance = raycaster.ray.distanceToPoint(starPos);

        if (distance < threshold && distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex >= 0) {
        const { star, position } = starData[closestIndex];
        setHoveredStar({ star, position });
      } else {
        setHoveredStar(null);
      }
    }
  });

  // Handle click
  useEffect(() => {
    const handleClick = () => {
      if (hoveredStar) {
        console.log('Clicked star:', hoveredStar.star.star_name || hoveredStar.star.source_id);
        onStarClick(hoveredStar.star);
      }
    };

    const canvas = document.querySelector('canvas');
    canvas?.addEventListener('click', handleClick);
    return () => {
      canvas?.removeEventListener('click', handleClick);
    };
  }, [hoveredStar, onStarClick]);

  // Cursor change on hover
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = hoveredStar ? 'pointer' : 'default';
    }
  }, [hoveredStar]);

  if (loading || stars.length === 0) {
    return null;
  }

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />

      {/* Hover label */}
      {hoveredStar && (
        <Html
          position={[
            hoveredStar.position[0],
            hoveredStar.position[1] + 2,
            hoveredStar.position[2]
          ]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '0 0 4px black, 0 0 8px black',
            whiteSpace: 'nowrap',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {hoveredStar.star.star_name || 'Unnamed Star'}
          {hoveredStar.star.has_planets && ` 🪐 (${hoveredStar.star.planet_count})`}
        </Html>
      )}
    </>
  );
}
