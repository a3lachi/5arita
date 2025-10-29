import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import ClickableStarField from './ClickableStarField';
import PlanetarySystemView from './PlanetarySystemView';
import { GaiaStar } from '../services/gaiaService';
import { Exoplanet } from '../services/exoplanetService';
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
  onPlanetSelect?: (planet: Exoplanet) => void;
  onStarSelectInSystem?: (star: GaiaStar) => void;
  savedCameraPosition?: CameraState | null;
}

// Component to control camera position based on view mode
function CameraController({ viewMode, savedPosition, onCameraChange }: { viewMode: ViewMode; savedPosition: CameraState | null | undefined; onCameraChange: Dispatch<SetStateAction<CameraState | null>> }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const prevViewMode = useRef(viewMode);

  useEffect(() => {
    // Save camera position when switching FROM galaxy TO system
    if (prevViewMode.current === 'galaxy' && viewMode === 'system' && controlsRef.current) {
      const position: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
      const target: [number, number, number] = [
        controlsRef.current.target.x,
        controlsRef.current.target.y,
        controlsRef.current.target.z
      ];
      onCameraChange({ position, target });
      console.log('💾 Saved camera position:', position, 'target:', target);
    }

    // Restore camera position when switching TO galaxy FROM system
    if (viewMode === 'galaxy' && prevViewMode.current === 'system' && savedPosition) {
      camera.position.set(...savedPosition.position);
      if (controlsRef.current) {
        controlsRef.current.target.set(...savedPosition.target);
        controlsRef.current.update();
      }
      console.log('📍 Restored camera position:', savedPosition.position, 'target:', savedPosition.target);
    } else if (viewMode === 'system' && prevViewMode.current === 'galaxy') {
      // Set camera for system view when entering
      camera.position.set(0, 5, 15);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }

    prevViewMode.current = viewMode;
  }, [viewMode, savedPosition, camera, onCameraChange]);

  // Custom wheel handler for unlimited forward movement
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Get direction from camera to target
      const direction = new THREE.Vector3();
      const target = new THREE.Vector3(0, 0, 0); // Galaxy center

      direction.subVectors(target, camera.position);
      const distanceToCenter = direction.length();

      // Normalize direction (or use camera direction if at center)
      if (distanceToCenter > 0.1) {
        direction.normalize();
      } else {
        // When at center, use camera's facing direction
        camera.getWorldDirection(direction);
      }

      // Move camera forward/backward
      const moveSpeed = event.deltaY * 0.1;
      camera.position.addScaledVector(direction, moveSpeed);

      if (controlsRef.current) {
        controlsRef.current.update();
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [camera, gl]);

  return <OrbitControls
    ref={controlsRef}
    target={[0, 0, 0]}
    enablePan={true}
    enableZoom={false}
    enableRotate={true}
    autoRotate={false}
    panSpeed={2}
    rotateSpeed={0.8}
    enableDamping={true}
    dampingFactor={0.05}
    minPolarAngle={0}
    maxPolarAngle={Math.PI}
    minDistance={0}
    maxDistance={Infinity}
  />;
}

export default function Scene({ stars, selectedStar, viewMode, onStarClick, onCameraChange, onPlanetSelect, onStarSelectInSystem, savedCameraPosition }: SceneProps) {
  return (
    <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 150]}
        fov={60}
        near={0.01}
        far={100000}
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
          <ClickableStarField onStarClick={onStarClick} stars={stars} />
        </>
      ) : selectedStar ? (
        /* Planetary system view */
        <PlanetarySystemView
          star={selectedStar}
          onPlanetSelect={onPlanetSelect}
          onStarSelect={onStarSelectInSystem}
        />
      ) : null}

      {/* Camera controls */}
      <CameraController viewMode={viewMode} savedPosition={savedCameraPosition} onCameraChange={onCameraChange} />
    </Canvas>
  );
}
