import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ParticleSystem from './components/ParticleSystem';
import UI, { HandStatus } from './components/UI';
import CameraPreview from './components/CameraPreview';
import { ShapeType } from './types';
import { HandTrackingService, calculateInteractionValue } from './services/handTracking';

function App() {
  // --- React State (Visuals & Low Frequency) ---
  const [shape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#ec4899'); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState<HandStatus>('detecting');

  // --- Mutable Refs (High Frequency Physics/Logic) ---
  // We use refs for these to avoid triggering React Re-renders 60 times a second
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackerRef = useRef<HandTrackingService | null>(null);
  const interactionRef = useRef<number>(0); // The current smoothed value passed to 3D
  const hasHandsRef = useRef<boolean>(false); // Passed to 3D
  const landmarksRef = useRef<any[]>([]); // For the Preview component

  // --- Logic Control ---
  const requestRef = useRef<number | null>(null);
  const lastDetectionTime = useRef<number>(0);
  const targetDistance = useRef<number>(0); // The raw target from MediaPipe
  const isInitializing = useRef(false);
  
  const DETECTION_INTERVAL = 50; // ms (approx 20 FPS for detection)

  // 1. Camera Initialization
  const startCamera = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;
    setStatus('detecting');

    try {
      if (!trackerRef.current) {
        trackerRef.current = new HandTrackingService();
        await trackerRef.current.initialize();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320, // Low res is fine for ML, faster
          height: 240,
          facingMode: "user",
          frameRate: { ideal: 30 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          videoRef.current?.play().catch(e => console.error("Play error", e));
          loop(); // Start loop only after video is ready
        };
      }
    } catch (err) {
      console.error("Camera error", err);
      setStatus('error');
    } finally {
      isInitializing.current = false;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // 2. The Game Loop (Runs 60FPS independent of React Render)
  const loop = () => {
    const now = performance.now();

    // A. Detection (Throttled)
    if (now - lastDetectionTime.current > DETECTION_INTERVAL) {
      if (videoRef.current && trackerRef.current?.landmarker) {
        const results = trackerRef.current.detect(videoRef.current);
        
        if (results && results.landmarks.length > 0) {
          // Store raw landmarks for the preview component
          landmarksRef.current = results.landmarks;

          // Calculate interaction
          const rawValue = calculateInteractionValue(results);
          targetDistance.current = Number.isFinite(rawValue) ? rawValue : 0;
          
          // Update status refs
          hasHandsRef.current = true;

          // Update UI status (only if changed, to minimize renders)
          // We can check previous status to avoid setStatus spam
          const newStatus = results.landmarks.length === 1 ? 'one-hand' : 'active';
          setStatus(prev => prev === newStatus ? prev : newStatus);

        } else {
          landmarksRef.current = [];
          hasHandsRef.current = false;
          targetDistance.current = 0;
          
          // Only set lost if we were previously active to avoid flickering on init
          setStatus(prev => (prev === 'active' || prev === 'one-hand') ? 'active' : prev);
        }
      }
      lastDetectionTime.current = now;
    }

    // B. Smoothing / Interpolation
    // We smooth the value here before passing it to the 3D scene
    const lerpFactor = 0.1; 
    interactionRef.current += (targetDistance.current - interactionRef.current) * lerpFactor;
    
    // Sanity check
    if (isNaN(interactionRef.current)) interactionRef.current = 0;

    // Continue loop
    requestRef.current = requestAnimationFrame(loop);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* 
         Hidden Video Source 
         Kept in DOM for MediaPipe, but invisible. 
         We use CameraPreview to show it to user.
      */}
      <video 
        ref={videoRef} 
        className="absolute opacity-0 pointer-events-none" 
        playsInline 
        muted 
      />

      {/* Real-time Camera Feedback */}
      <CameraPreview 
        videoRef={videoRef}
        landmarksRef={landmarksRef}
        isVisible={status !== 'error'}
      />

      <UI 
        currentShape={shape} 
        setShape={setShape} 
        color={color} 
        setColor={setColor} 
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        handStatus={status}
        onRetryCamera={startCamera}
      />

      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]}> 
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate={!hasHandsRef.current} 
            autoRotateSpeed={0.5} 
          />
          <ambientLight intensity={0.5} />
          
          {/* 
            CRITICAL: We pass REFS, not values. 
            This component will NOT re-render when hands move. 
          */}
          <ParticleSystem 
            shape={shape} 
            color={color} 
            interactionRef={interactionRef} 
            hasHandsRef={hasHandsRef} 
          />
        </Canvas>
      </div>
    </div>
  );
}

export default App;