import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import ChristmasTree from './ChristmasTree';
import { useAppStore } from '../store';

const Scene: React.FC = () => {
  const { phase } = useAppStore();

  return (
    <Canvas 
      camera={{ position: [0, 5, 20], fov: 45 }}
      gl={{ antialias: false }} // Optimization for postprocessing
      dpr={[1, 2]}
    >
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffccaa" /> {/* Warm */}
      <pointLight position={[-10, 5, -10]} intensity={1} color="#aaccff" /> {/* Cool */}
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color="#fff" 
      />

      {/* Environment & Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={500} scale={25} size={2} speed={0.4} opacity={0.5} color="#FFD700" />
      
      <Suspense fallback={null}>
        <Environment preset="city" /> {/* Using city for good reflections, close to Shanghai Bund feel */}
        <ChristmasTree />
      </Suspense>

      {/* Controls: Limit movement based on phase if desired */}
      <OrbitControls 
        enablePan={false} 
        minDistance={10} 
        maxDistance={40} 
        autoRotate={phase === 'tree'}
        autoRotateSpeed={0.5}
      />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;
