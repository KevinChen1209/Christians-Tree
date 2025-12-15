import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, Color, Group, Points, BufferAttribute, AdditiveBlending, MathUtils, CanvasTexture, DoubleSide, NormalBlending } from 'three';
import { useAppStore } from '../store';
import { getRingPosition, randomRange, ORNAMENT_COLORS, getSpiralPoint, generateTreeParticles, createStarShape } from '../utils/geometry';
import { Image } from '@react-three/drei';
import * as THREE from 'three';

const PARTICLE_COUNT = 5500;
const PHOTO_COUNT = 24; 
const ORNAMENT_COUNT = 250; 
const SNOWFLAKE_COUNT = 450;
const TREE_HEIGHT = 14;
const TREE_RADIUS = 5;
const NEBULA_RADIUS = 15;
const SPIRAL_LOOPS = 5.5;

const tempObject = new Object3D();
const tempVector = new Vector3();
const tempColor = new Color();

// Generate a SIMPLER snowflake texture (Just 3 crossing lines)
const useSnowflakeTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; // Smaller canvas
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.clearRect(0, 0, 64, 64);
        ctx.translate(32, 32);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2; // Thinner lines
        ctx.lineCap = 'round';
        
        // Simple 6-arm star (3 crossing lines)
        for (let i = 0; i < 3; i++) {
           ctx.save();
           ctx.rotate((i * Math.PI) / 3);
           
           ctx.beginPath();
           ctx.moveTo(0, -25);
           ctx.lineTo(0, 25);
           ctx.stroke();

           // Optional small tick at the end for minimal detail
           ctx.beginPath();
           ctx.moveTo(-5, 15);
           ctx.lineTo(0, 20);
           ctx.lineTo(5, 15);
           ctx.stroke();
           
           ctx.beginPath();
           ctx.moveTo(-5, -15);
           ctx.lineTo(0, -20);
           ctx.lineTo(5, -15);
           ctx.stroke();

           ctx.restore();
        }
        
        // Center Dot
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
};

// --- Sub-component: Polaroid Photo ---
const Polaroid = React.memo(({ index, url, activeIndex, onClick }: any) => {
  const isActive = activeIndex === index;
  const meshRef = useRef<Group>(null);
  
  // Local hover animation
  useFrame((state) => {
     if (isActive && meshRef.current) {
         meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + index) * 0.3;
     }
  });

  return (
    <group ref={meshRef}>
      {/* White Frame Background */}
      <mesh position={[0, -0.25, -0.02]}>
         <planeGeometry args={[2.6, 3.2]} /> 
         <meshBasicMaterial color="#fdfbf7" />
      </mesh>
      
      {/* The Image */}
      <Image
        url={url}
        scale={[3.5, 3.5]} 
        position={[0, 0.2, 0]}
        transparent
        opacity={1}
        onClick={(e) => {
            e.stopPropagation();
            // Toggle active state: if already active, set to null (resume); otherwise set to this index
            onClick(isActive ? null : index);
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      />
      {/* Active Indicator Glow */}
      {isActive && (
          <mesh position={[0, -0.25, -0.03]}>
              <planeGeometry args={[2.8, 3.4]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
          </mesh>
      )}
    </group>
  );
});

const ChristmasTree: React.FC = () => {
  const pointsRef = useRef<Points>(null);
  const snowflakesRef = useRef<InstancedMesh>(null);
  
  // Array of Refs for each color group of ornaments
  const ornamentGroupRefs = useRef<(InstancedMesh | null)[]>([]);
  
  const photoRefs = useRef<(Group | null)[]>([]);
  const starRef = useRef<Group>(null);
  const groupRef = useRef<Group>(null);
  
  const { phase, setPhase, gesture, activePhotoIndex, setActivePhotoIndex } = useAppStore();
  const snowflakeTexture = useSnowflakeTexture();
  
  // Animation state (0 = Tree, 1 = Nebula)
  const animationProgress = useRef(0);

  // --- 1. Data Generation ---
  
  // Tree & Nebula Particles
  const { treePositions, nebulaPositions, colors, currentPositions } = useMemo(() => {
     const { positions, colors } = generateTreeParticles(PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS);
     
     // Generate random nebula positions
     const nebulaPos = new Float32Array(PARTICLE_COUNT * 3);
     for(let i=0; i<PARTICLE_COUNT; i++) {
         const [x, y, z] = getRingPosition(NEBULA_RADIUS, 4); 
         nebulaPos[i*3] = x;
         nebulaPos[i*3+1] = y;
         nebulaPos[i*3+2] = z;
     }
     
     const currentPositions = new Float32Array(positions);

     return { 
         treePositions: positions, 
         nebulaPositions: nebulaPos, 
         colors,
         currentPositions
     };
  }, []);

  // Spiral Content (Ornaments & Photos)
  const { ornamentGroups, photosData } = useMemo(() => {
     const totalSteps = ORNAMENT_COUNT + PHOTO_COUNT;
     const photoInterval = Math.floor(totalSteps / PHOTO_COUNT);
     
     // Prepare groups for each color in the palette
     const oGroups: any[][] = ORNAMENT_COLORS.map(() => []);
     const pData: any[] = [];
     
     let photoIdx = 0;
     let ornamentCounter = 0; // To cycle colors sequentially
     
     for(let i=0; i<totalSteps; i++) {
        const t = i / totalSteps; 
        const angle = t * SPIRAL_LOOPS * Math.PI * 2;

        const isPhoto = (i % photoInterval === 0) && (photoIdx < PHOTO_COUNT);
        
        if (isPhoto) {
            // PHOTO LOGIC
            const photoRadius = (TREE_RADIUS * (1 - t)) + 0.8; 
            
            const px = Math.cos(angle) * photoRadius;
            const py = t * TREE_HEIGHT - (TREE_HEIGHT / 2);
            const pz = Math.sin(angle) * photoRadius;

            const treePos = new Vector3(px, py, pz);
            const treeRot: [number, number, number] = [0, -angle + Math.PI / 2, 0];

            // Nebula Position (Ring)
            const pAngle = (photoIdx / PHOTO_COUNT) * Math.PI * 2;
            const pNebulaPos = new Vector3(
                 Math.cos(pAngle) * NEBULA_RADIUS,
                 0,
                 Math.sin(pAngle) * NEBULA_RADIUS
            );
            
            pData.push({
                id: photoIdx++,
                treePos: treePos,
                treeRot: treeRot,
                nebulaPos: pNebulaPos,
                nebulaRot: [0, -pAngle + Math.PI/2, 0] 
            });
        } else {
             // ORNAMENT LOGIC
             // Sequential Color Selection: Vintage Gold -> Burgundy -> Grey Blue -> Rose Pink -> Champagne
             const colorIndex = ornamentCounter % ORNAMENT_COLORS.length;
             ornamentCounter++;
             
             const treePos = new Vector3(...getSpiralPoint(t, TREE_HEIGHT, TREE_RADIUS, SPIRAL_LOOPS));
             const [rx, ry, rz] = getRingPosition(NEBULA_RADIUS, 2);
             
             oGroups[colorIndex].push({
                treePos: treePos,
                nebulaPos: new Vector3(rx, ry, rz),
                scale: randomRange(0.15, 0.25)
             });
        }
     }
     return { ornamentGroups: oGroups, photosData: pData };
  }, []);

  // Snowflakes Data
  const snowflakeData = useMemo(() => {
    const data = [];
    for(let i=0; i<SNOWFLAKE_COUNT; i++) {
        const x = randomRange(-12, 12);
        const y = randomRange(0, 25); 
        const z = randomRange(-12, 12);
        
        const [nx, ny, nz] = getRingPosition(NEBULA_RADIUS, 8);

        data.push({
            currentTreePos: new Vector3(x, y, z), 
            nebulaPos: new Vector3(nx, ny, nz),
            speed: randomRange(0.3, 0.8), 
            rotationAxis: new Vector3(Math.random(), Math.random(), Math.random()).normalize(),
            rotationSpeed: randomRange(0.1, 0.3),
            scale: randomRange(0.05, 0.15)
        });
    }
    return data;
  }, []);

  // --- 2. Animation Loop ---
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // A. Animation Progress
    const targetT = (phase === 'blooming' || phase === 'nebula') ? 1 : 0;
    const lerpSpeed = 2.0;
    animationProgress.current = MathUtils.lerp(animationProgress.current, targetT, delta * lerpSpeed);
    const t = animationProgress.current;

    // B. Particles
    if (pointsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
             const i3 = i * 3;
             positions[i3] = MathUtils.lerp(treePositions[i3], nebulaPositions[i3], t);
             positions[i3+1] = MathUtils.lerp(treePositions[i3+1], nebulaPositions[i3+1], t);
             positions[i3+2] = MathUtils.lerp(treePositions[i3+2], nebulaPositions[i3+2], t);
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.rotation.y = time * 0.05;
    }

    // C. Ornaments (Grouped by Color)
    ornamentGroups.forEach((group, groupIndex) => {
        const mesh = ornamentGroupRefs.current[groupIndex];
        if (!mesh) return;

        group.forEach((ornament, i) => {
            tempVector.lerpVectors(ornament.treePos, ornament.nebulaPos, t);
            tempObject.position.copy(tempVector);
            
            tempObject.rotation.x = time * 0.5 + i;
            tempObject.rotation.z = time * 0.3 + i;
            tempObject.scale.setScalar(ornament.scale * (1 + Math.sin(time * 2 + i) * 0.1));
            
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
    });

    // D. Snowflakes (Calm Falling)
    if (snowflakesRef.current) {
        snowflakeData.forEach((flake, i) => {
            // Physics Update: Linear fall
            flake.currentTreePos.y -= flake.speed * delta;
            
            // Reset to top
            if (flake.currentTreePos.y < -5) {
                flake.currentTreePos.y = 20 + Math.random() * 5;
                flake.currentTreePos.x = randomRange(-12, 12);
                flake.currentTreePos.z = randomRange(-12, 12);
            }

            // Gentle drift (Sine wave is very slow and low amplitude)
            const currentX = flake.currentTreePos.x + Math.sin(time * 0.5 + i) * 0.1; 
            const currentZ = flake.currentTreePos.z + Math.cos(time * 0.3 + i) * 0.1;

            // Phase Interpolation
            const finalX = MathUtils.lerp(currentX, flake.nebulaPos.x, t);
            const finalY = MathUtils.lerp(flake.currentTreePos.y, flake.nebulaPos.y, t);
            const finalZ = MathUtils.lerp(currentZ, flake.nebulaPos.z, t);

            tempObject.position.set(finalX, finalY, finalZ);
            
            // Slow Rotation
            tempObject.rotation.x += flake.rotationAxis.x * flake.rotationSpeed * delta;
            tempObject.rotation.y += flake.rotationAxis.y * flake.rotationSpeed * delta;
            tempObject.rotation.z += flake.rotationAxis.z * flake.rotationSpeed * delta;

            tempObject.scale.setScalar(flake.scale);
            
            tempObject.updateMatrix();
            snowflakesRef.current!.setMatrixAt(i, tempObject.matrix);
        });
        snowflakesRef.current.instanceMatrix.needsUpdate = true;
    }

    // E. Photos (Pos + Rot)
    photoRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const photo = photosData[i];
        
        // Position
        ref.position.lerpVectors(photo.treePos, photo.nebulaPos, t);
        
        // Rotation (Lerp Euler angles approx)
        ref.rotation.x = MathUtils.lerp(photo.treeRot[0], photo.nebulaRot[0], t);
        ref.rotation.y = MathUtils.lerp(photo.treeRot[1], photo.nebulaRot[1], t);
        ref.rotation.z = MathUtils.lerp(photo.treeRot[2], photo.nebulaRot[2], t);
        
        // Scale
        const scale = MathUtils.lerp(0.2, 1.0, t);
        ref.scale.setScalar(scale);
    });
    
    // F. Star
    if (starRef.current) {
        const starScale = MathUtils.lerp(1, 0, t);
        starRef.current.scale.setScalar(starScale);
        starRef.current.rotation.y = time * 0.5;
    }

    // G. Group Rotation
    if (groupRef.current) {
        if (phase === 'nebula') {
            // STOP rotation if a photo is active (clicked)
            if (activePhotoIndex !== null) {
                // Rotation stops
            } else {
                const rotationSpeed = gesture === 'Open_Palm' ? 0.8 : 0.05;
                groupRef.current.rotation.y += delta * rotationSpeed;
            }
        } else {
            groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 2);
        }
    }

    // H. Phase Transitions
    if (phase === 'blooming' && t > 0.99) setPhase('nebula');
    if (phase === 'collapsing' && t < 0.01) setPhase('tree');
  });

  // --- 3. Initial Setup ---
  React.useLayoutEffect(() => {
     // Init Ornaments Matrices
     ornamentGroups.forEach((group, groupIndex) => {
         const mesh = ornamentGroupRefs.current[groupIndex];
         if(!mesh) return;

         group.forEach((o, i) => {
             tempObject.position.copy(o.treePos);
             tempObject.scale.setScalar(o.scale);
             tempObject.updateMatrix();
             mesh.setMatrixAt(i, tempObject.matrix);
         });
         mesh.instanceMatrix.needsUpdate = true;
     });
  }, [ornamentGroups]);

  const starShape = useMemo(() => createStarShape(0.8, 0.4), []);

  return (
    <group ref={groupRef}>
      
      {/* 1. Tree Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={currentPositions} 
            itemSize={3}
            usage={THREE.DynamicDrawUsage} 
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
            size={0.15} 
            vertexColors 
            transparent 
            opacity={0.8} 
            sizeAttenuation={true} 
            blending={AdditiveBlending} 
            depthWrite={false}
        />
      </points>

      {/* 2. PBR Ornaments - SPLIT INTO GROUPS FOR MULTI-COLOR MATERIALS */}
      {ORNAMENT_COLORS.map((color, i) => (
          <instancedMesh 
            key={color}
            ref={(el) => (ornamentGroupRefs.current[i] = el)} 
            args={[undefined, undefined, ornamentGroups[i].length]}
          >
             <sphereGeometry args={[1, 32, 32]} />
             <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={0.15} // Slight inner glow
                roughness={0.15} // Glossy
                metalness={0.9} // Highly metallic
                envMapIntensity={2.0} // Prominent reflections
             />
          </instancedMesh>
      ))}

      {/* 3. Crystalline Snowflakes */}
      <instancedMesh ref={snowflakesRef} args={[undefined, undefined, SNOWFLAKE_COUNT]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
             map={snowflakeTexture}
             transparent
             opacity={0.95}
             side={DoubleSide}
             blending={NormalBlending} 
             depthWrite={false}
          />
      </instancedMesh>

      {/* 4. Photos */}
      {photosData.map((photo, i) => (
          <group 
            key={photo.id}
            ref={(el) => (photoRefs.current[i] = el)}
          >
             <Polaroid 
                index={i}
                url={`https://picsum.photos/seed/${photo.id + 100}/400/500`}
                activeIndex={activePhotoIndex}
                onClick={setActivePhotoIndex}
             />
          </group>
      ))}

      {/* 5. Top Star */}
      <group position={[0, TREE_HEIGHT/2 + 0.2, 0]} ref={starRef}>
          <mesh>
             <extrudeGeometry args={[starShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 2 }]} />
             <meshStandardMaterial 
                color="#fbbf24" 
                emissive="#fbbf24" 
                emissiveIntensity={2} 
                toneMapped={false}
                roughness={0.1}
                metalness={1}
             />
          </mesh>
          <pointLight intensity={3} distance={15} color="#fbbf24" decay={2} />
      </group>
      
      {/* Center Light */}
      <pointLight 
        position={[0,0,0]} 
        intensity={phase === 'nebula' || phase === 'blooming' ? 4 : 0} 
        color="#a78bfa" 
        distance={25} 
      />
    </group>
  );
};

export default ChristmasTree;