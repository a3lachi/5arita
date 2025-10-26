import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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

interface StarFieldProps {
  onStarClick: (star: GaiaStar) => void;
}

export default function StarField({ onStarClick: _onStarClick }: StarFieldProps) {
  // TODO: Implement star click handling with raycasting
  const pointsRef = useRef<THREE.Points>(null);
  const [stars, setStars] = useState<GaiaStar[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Gaia data on mount
  useEffect(() => {
    async function loadStars() {
      setLoading(true);
      try {
        const gaiaStars = await fetchGaiaStars(2000, 0, 8);
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
  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const colors = new Float32Array(stars.length * 3);

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
      colors[i * 3] = r * brightness; // R
      colors[i * 3 + 1] = g * brightness; // G
      colors[i * 3 + 2] = b * brightness; // B
    });

    return { positions, sizes, colors };
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

  // Slow rotation animation
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0002;
    }
  });

  // Early return AFTER all hooks
  if (loading || stars.length === 0) {
    return null;
  }

  return (
    <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />
  );
}
