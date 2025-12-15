import * as THREE from 'three';

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate random points INSIDE a cone volume (for the Tree Particles)
export const generateTreeParticles = (count: number, height: number, radius: number) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseColor = new THREE.Color('#4ade80'); // Glowing green
  const tipColor = new THREE.Color('#a7f3d0'); // Lighter green at tips

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Cone logic
    const y = Math.random() * height; // 0 to height
    const rAtHeight = (1 - y / height) * radius;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * rAtHeight; // Sqrt for uniform distribution within circle

    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    
    // Centering Y
    const finalY = y - height / 2;

    positions[i3] = x;
    positions[i3 + 1] = finalY;
    positions[i3 + 2] = z;

    // Color gradient based on height
    const mixedColor = baseColor.clone().lerp(tipColor, y / height);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }
  return { positions, colors };
};

// Calculate a specific point on a Spiral path (for Lights and Photos)
export const getSpiralPoint = (
  t: number, // 0 to 1 progress up the tree
  height: number,
  bottomRadius: number,
  loops: number
): [number, number, number] => {
  const y = t * height - (height / 2);
  const currentRadius = bottomRadius * (1 - t); // Linear taper
  const angle = t * loops * Math.PI * 2; // Winding up
  
  const x = Math.cos(angle) * currentRadius;
  const z = Math.sin(angle) * currentRadius;

  return [x, y, z];
};

// Generate a point inside a torus/ring (Nebula)
export const getRingPosition = (radius: number, tube: number): [number, number, number] => {
  const theta = Math.random() * Math.PI * 2; // Angle around the main ring
  const phi = Math.random() * Math.PI * 2; // Angle inside the tube
  
  const x = (radius + tube * Math.cos(phi)) * Math.cos(theta);
  const z = (radius + tube * Math.cos(phi)) * Math.sin(theta);
  const y = tube * Math.sin(phi);
  
  return [x, y, z];
};

// Generate 5-pointed Star Shape
export const createStarShape = (outerRadius: number, innerRadius: number) => {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; // Start at top
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
};

// Colors for ornaments: Specific Ordered Palette
// Vintage Gold, Burgundy (Wine Red), Grey Blue, Rose Pink, Champagne
export const ORNAMENT_COLORS = [
  '#C5A059', // Vintage Gold (复古金)
  '#800020', // Burgundy (酒红)
  '#7A8999', // Grey Blue (灰蓝)
  '#B76E79', // Rose Pink (玫瑰粉)
  '#F7E7CE', // Champagne (香槟色)
];