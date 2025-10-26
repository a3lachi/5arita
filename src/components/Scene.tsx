import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Environment } from '@react-three/drei';
import StarField from './StarField';
import { GaiaStar } from '../services/gaiaService';
import * as THREE from 'three';

interface SceneProps {
  onStarSelect?: (star: GaiaStar | null) => void;
}

export default function Scene({ onStarSelect }: SceneProps) {
  return (
    <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 150]} fov={60} />

      {/* Lighting */}
      <ambientLight intensity={0.2} />

      {/* Background stars for depth */}
      <Stars
        radius={400}
        depth={150}
        count={5000}
        factor={3}
        fade
        speed={0.3}
        saturation={0.5}
      />

      {/* Gaia star field with realistic 3D models */}
      <StarField onStarSelect={onStarSelect} />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={20}
        maxDistance={500}
        autoRotate={false}
        autoRotateSpeed={0.5}
        zoomSpeed={1.2}
        rotateSpeed={0.8}
      />

      {/* Subtle environment lighting */}
      <Environment preset="night" />
    </Canvas>
  );
}
