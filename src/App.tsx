import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default App
