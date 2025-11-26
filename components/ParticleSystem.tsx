import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShapeType } from '../types';
import { generateParticles } from '../utils/shapes';

interface ParticleSystemProps {
  shape: ShapeType;
  color: string;
  interactionRef: React.MutableRefObject<number>; // Ref instead of value for performance
  hasHandsRef: React.MutableRefObject<boolean>;   // Ref instead of value
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, color, interactionRef, hasHandsRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Initialize buffers once
  const { currentPositions, targetPositions } = useMemo(() => {
    const initial = generateParticles(ShapeType.HEART); 
    return {
      currentPositions: new Float32Array(initial),
      targetPositions: new Float32Array(initial),
    };
  }, []);

  // Update target shape when prop changes (Low frequency update)
  useEffect(() => {
    const newPositions = generateParticles(shape);
    // Smooth transition: we only update the target buffer, the useFrame loop handles the morph
    targetPositions.set(newPositions);
  }, [shape, targetPositions]);

  // Main Animation Loop (60FPS) - No React Re-renders allowed here
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    
    // 1. Read from Refs (Visual State)
    const rawVal = interactionRef.current;
    const isInteracting = hasHandsRef.current;
    
    // Safety check: Ensure value is a finite number
    const interactionValue = Number.isFinite(rawVal) ? rawVal : 0;

    // 2. Determine Scale logic
    let targetScale = 1.0;
    
    if (isInteracting) {
      // Map input 0.0->1.0 to Scale 0.5->3.0
      // Clamped to reasonable limits to prevent explosion
      const clamped = Math.max(0, Math.min(interactionValue, 1.2));
      targetScale = 0.5 + (clamped * 2.5);
    } else {
      // Idle "Breathing" animation
      targetScale = 1.0 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }

    // Double safety check
    if (!Number.isFinite(targetScale) || isNaN(targetScale)) targetScale = 1.0;

    // 3. Physics Constants
    const lerpSpeed = 0.08; 
    // Expand noise only when hands are active and "pulling"
    const isExpanded = isInteracting && interactionValue > 0.4;
    
    const count = positions.length;

    // 4. Update every particle
    for (let i = 0; i < count; i += 3) {
      const ix = i;
      const iy = i + 1;
      const iz = i + 2;

      // -- A. Morphing (Move current base position towards target shape) --
      // We store the "base" shape in currentPositions, separate from the rendered "scaled" positions
      const tx = targetPositions[ix];
      const ty = targetPositions[iy];
      const tz = targetPositions[iz];

      currentPositions[ix] += (tx - currentPositions[ix]) * lerpSpeed;
      currentPositions[iy] += (ty - currentPositions[iy]) * lerpSpeed;
      currentPositions[iz] += (tz - currentPositions[iz]) * lerpSpeed;

      // -- B. Applying Scale & Noise --
      let noise = 0;
      if (isExpanded) {
        // Simple deterministic noise based on index to avoid Math.random() in loop
        noise = (Math.sin(ix * 0.1 + state.clock.elapsedTime) * 0.15) * (interactionValue * 0.5);
      }

      // Final write to the Three.js BufferAttribute
      let px = currentPositions[ix] * targetScale + noise;
      let py = currentPositions[iy] * targetScale + noise;
      let pz = currentPositions[iz] * targetScale + noise;

      // Final Safety Guard against NaN (prevents black screen)
      if (isNaN(px)) px = 0;
      if (isNaN(py)) py = 0;
      if (isNaN(pz)) pz = 0;

      positions[ix] = px;
      positions[iy] = py;
      positions[iz] = pz;
    }

    geometry.attributes.position.needsUpdate = true;
    
    // Slow rotation
    pointsRef.current.rotation.y += 0.002;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={currentPositions.length / 3}
          array={new Float32Array(currentPositions.length)} // Empty initial array, filled by useFrame
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleSystem;