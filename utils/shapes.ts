import * as THREE from 'three';
import { ShapeType } from '../types';

const COUNT = 8000;

// Helper to get random point on sphere
const randomOnSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const generateParticles = (type: ShapeType): Float32Array => {
  const positions = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (type) {
      case ShapeType.HEART: {
        // 3D Heart formula
        const t = Math.random() * Math.PI * 2;
        const p = Math.random() * Math.PI;
        // Distribute points to fill volume slightly
        const r = 1 - Math.pow(Math.random(), 3); 
        
        // Parametric heart surface
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const hz = r * 8 * Math.cos(p); // Add depth
        
        // Mix surface and volume
        x = hx * 0.15;
        y = hy * 0.15;
        z = hz * Math.sin(t) * 0.15; 
        break;
      }
      
      case ShapeType.FLOWER: {
        // Rose/Flower parametric
        const u = Math.random() * 2 * Math.PI;
        const v = Math.random() * Math.PI;
        const k = 4; // Petals
        const r = 2 * Math.sin(k * u) * Math.sin(v);
        
        x = r * Math.cos(u) * Math.sin(v) * 2.5;
        y = r * Math.sin(u) * Math.sin(v) * 2.5;
        z = r * Math.cos(v) * 2.5;
        break;
      }

      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.6;
        if (isRing) {
          // Ring
          const angle = Math.random() * Math.PI * 2;
          const dist = 3.5 + Math.random() * 1.5;
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
          y = (Math.random() - 0.5) * 0.2;
        } else {
          // Planet body
          const vec = randomOnSphere(2.0);
          x = vec.x; y = vec.y; z = vec.z;
        }
        
        // Tilt Saturn
        const tempX = x * Math.cos(0.4) - y * Math.sin(0.4);
        const tempY = x * Math.sin(0.4) + y * Math.cos(0.4);
        x = tempX;
        y = tempY;
        break;
      }

      case ShapeType.BUDDHA: {
        // Procedural approximation: Stack of spheres (Base, Body, Head)
        const part = Math.random();
        
        if (part < 0.4) {
          // Base (Lotus/Legs) - Wide flattened sphere
          const vec = randomOnSphere(1);
          x = vec.x * 2.5;
          y = vec.y * 0.8 - 2.0;
          z = vec.z * 1.8;
        } else if (part < 0.8) {
          // Body - Cone/Sphere hybrid
          const vec = randomOnSphere(1);
          x = vec.x * 1.6;
          y = vec.y * 1.6;
          z = vec.z * 1.4;
        } else {
          // Head
          const vec = randomOnSphere(1);
          x = vec.x * 0.9;
          y = vec.y * 0.9 + 2.0;
          z = vec.z * 0.9;
        }
        break;
      }

      case ShapeType.FIREWORKS: {
        // Burst
        const vec = randomOnSphere(0.1 + Math.random() * 4);
        x = vec.x;
        y = vec.y;
        z = vec.z;
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};