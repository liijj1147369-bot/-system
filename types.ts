export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha', // Procedural approximation
  FIREWORKS = 'Fireworks'
}

export interface ParticleState {
  shape: ShapeType;
  color: string;
  scaleFactor: number; // Controlled by hands (0.5 to 3.0)
}

export interface HandData {
  leftWrist?: { x: number; y: number; z: number };
  rightWrist?: { x: number; y: number; z: number };
  distance: number; // Normalized 0-1
  isVisible: boolean;
}

// Augment JSX namespace for React Three Fiber elements to fix TS errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
    }
  }
}