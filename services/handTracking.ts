import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export class HandTrackingService {
  landmarker: HandLandmarker | null = null;
  video: HTMLVideoElement | null = null;
  lastVideoTime = -1;

  async initialize() {
    try {
      // Use a stable, recent version for the WASM binaries
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });
      console.log("HandLandmarker initialized successfully");
    } catch (error) {
      console.error("Error initializing hand tracking:", error);
      throw error;
    }
  }

  detect(video: HTMLVideoElement) {
    if (!this.landmarker || !video.videoWidth) return null;

    let startTimeMs = performance.now();
    if (video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      return this.landmarker.detectForVideo(video, startTimeMs);
    }
    return null;
  }
}

/**
 * Calculates a normalized interaction value (0.0 to ~1.0) based on hand gestures.
 * Supports both 1-hand (openness) and 2-hand (distance) interactions.
 */
export const calculateInteractionValue = (results: any): number => {
  if (!results || !results.landmarks || results.landmarks.length === 0) return 0;

  const landmarks = results.landmarks;

  try {
    // Mode A: Two Hands - Distance between wrists
    if (landmarks.length >= 2) {
      const hand1 = landmarks[0][0]; // Wrist of first hand
      const hand2 = landmarks[1][0]; // Wrist of second hand
      
      if (!hand1 || !hand2) return 0;

      const dx = hand1.x - hand2.x;
      const dy = hand1.y - hand2.y;
      
      // Calculate Euclidean distance
      // Typical screen space distance: 0.1 (close) to 0.8 (far)
      const dist = Math.sqrt(dx * dx + dy * dy);
      return Math.max(0, dist);
    }

    // Mode B: One Hand - "Openness" (Avg distance from wrist to fingertips)
    if (landmarks.length === 1) {
      const hand = landmarks[0];
      const wrist = hand[0];
      const tips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
      
      if (!wrist) return 0;

      let totalDist = 0;
      let validTips = 0;

      for (const tipIdx of tips) {
        const tip = hand[tipIdx];
        if (tip) {
          const dx = tip.x - wrist.x;
          const dy = tip.y - wrist.y;
          totalDist += Math.sqrt(dx * dx + dy * dy);
          validTips++;
        }
      }
      
      if (validTips === 0) return 0;

      const avgDist = totalDist / validTips;
      
      // Heuristic mapping:
      // Closed fist ~ 0.1 avg distance
      // Open palm ~ 0.3-0.4 avg distance
      // We map this to match the 2-hand scale (0.0 - 0.8)
      // (avgDist - 0.1) * 3 roughly maps 0.1->0.4 range to 0.0->0.9
      const mappedValue = (avgDist - 0.05) * 3.0;
      return Math.max(0, mappedValue); 
    }
  } catch (e) {
    console.warn("Error calculating interaction value", e);
    return 0;
  }

  return 0;
};