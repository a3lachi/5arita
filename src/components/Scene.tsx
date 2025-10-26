import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Environment } from '@react-three/drei';
import { Dispatch, SetStateAction } from 'react';
import ClickableStarField from './ClickableStarField';
import PlanetarySystemView from './PlanetarySystemView';
import { GaiaStar } from '../services/gaiaService';
import * as THREE from 'three';

type ViewMode = 'galaxy' | 'system';

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

interface SceneProps {
  stars: GaiaStar[];
  selectedStar: GaiaStar | null;
  viewMode: ViewMode;
  onStarClick: (star: GaiaStar) => void;
  onCameraChange: Dispatch<SetStateAction<CameraState | null>>;
}

export default function Scene({ stars: _stars, selectedStar, viewMode, onStarClick, onCameraChange: _onCameraChange }: SceneProps) {
  return (
    <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={viewMode === 'galaxy' ? [0, 0, 150] : [0, 5, 15]}
        fov={60}
      />

      {/* Lighting */}
      <ambientLight intensity={viewMode === 'galaxy' ? 0.2 : 0.5} />
      {viewMode === 'system' && <pointLight position={[0, 0, 0]} intensity={2} />}

      {viewMode === 'galaxy' ? (
        <>
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
          <ClickableStarField onStarClick={onStarClick} />
        </>
      ) : selectedStar ? (
        /* Planetary system view */
        <PlanetarySystemView star={selectedStar} />
      ) : null}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={viewMode === 'galaxy' ? 20 : 2}
        maxDistance={viewMode === 'galaxy' ? 500 : 50}
        autoRotate={false}
        zoomSpeed={1.2}
        rotateSpeed={0.8}
      />

      {/* Subtle environment lighting */}
      {viewMode === 'galaxy' && <Environment preset="night" />}
    </Canvas>
  );
}
