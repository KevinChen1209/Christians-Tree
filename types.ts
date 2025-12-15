import React from 'react';

export type Phase = 'tree' | 'blooming' | 'nebula' | 'collapsing';
export type Gesture = 'None' | 'Open_Palm' | 'Closed_Fist';

export interface ParticleData {
  initialPos: [number, number, number]; // Cone position
  nebulaPos: [number, number, number]; // Ring position
  color: string;
  scale: number;
}

// Augment the global JSX namespace to include Three.js elements for react-three-fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      instancedMesh: any;
      tetrahedronGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      octahedronGeometry: any;
      meshBasicMaterial: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      color: any;
      primitive: any;
      planeGeometry: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      extrudeGeometry: any;
    }
  }
}

// Augment React.JSX namespace for newer TypeScript/React versions
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      instancedMesh: any;
      tetrahedronGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      octahedronGeometry: any;
      meshBasicMaterial: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      color: any;
      primitive: any;
      planeGeometry: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      extrudeGeometry: any;
    }
  }
}