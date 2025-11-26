import React, { useEffect, useRef } from 'react';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarksRef: React.MutableRefObject<any[]>;
  isVisible: boolean;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ videoRef, landmarksRef, isVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const draw = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Match dimensions
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
          }

          // 1. Draw Video Frame
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1); // Mirror flip
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          // 2. Draw Landmarks
          const landmarks = landmarksRef.current;
          if (landmarks && landmarks.length > 0) {
             ctx.fillStyle = '#00ff00';
             ctx.strokeStyle = '#00ff00';
             ctx.lineWidth = 2;

             for (const hand of landmarks) {
               // Draw connections (simplified)
               drawConnectors(ctx, hand, canvas.width, canvas.height);
               
               // Draw points
               for (const lm of hand) {
                 const x = (1 - lm.x) * canvas.width; // Mirror x
                 const y = lm.y * canvas.height;
                 ctx.beginPath();
                 ctx.arc(x, y, 3, 0, 2 * Math.PI);
                 ctx.fill();
               }
             }
          }
        }
      }
      requestRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible, videoRef, landmarksRef]);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-6 right-6 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 bg-black/80 shadow-2xl z-50 pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
        LIVE
      </div>
    </div>
  );
};

// Helper to draw skeleton
function drawConnectors(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
  const connections = [
    [0,1], [1,2], [2,3], [3,4], // Thumb
    [0,5], [5,6], [6,7], [7,8], // Index
    [5,9], [9,10], [10,11], [11,12], // Middle
    [9,13], [13,14], [14,15], [15,16], // Ring
    [13,17], [0,17], [17,18], [18,19], [19,20] // Pinky + Palm
  ];

  ctx.beginPath();
  for (const [start, end] of connections) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    if (p1 && p2) {
      ctx.moveTo((1 - p1.x) * w, p1.y * h);
      ctx.lineTo((1 - p2.x) * w, p2.y * h);
    }
  }
  ctx.stroke();
}

export default CameraPreview;