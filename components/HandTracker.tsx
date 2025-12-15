import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { useAppStore } from '../store';
import { Gesture } from '../types';

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { cameraActive, setGesture } = useAppStore();
  const [loaded, setLoaded] = useState(false);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastGestureRef = useRef<Gesture>('None');

  // Initialize MediaPipe GestureRecognizer
  useEffect(() => {
    let isCancelled = false;
    const initGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        if (isCancelled) return;

        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        setLoaded(true);
      } catch (err) {
        console.error("Error loading MediaPipe:", err);
      }
    };

    initGestureRecognizer();

    return () => {
      isCancelled = true;
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, []);

  // Start/Stop Camera
  useEffect(() => {
    if (cameraActive && loaded) {
      enableCam();
    } else {
      disableCam();
    }
    return () => disableCam(); // Cleanup on unmount/change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive, loaded]);

  const enableCam = async () => {
    if (!gestureRecognizerRef.current || !videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      videoRef.current.srcObject = stream;
      
      // Wait for data to load
      videoRef.current.onloadeddata = () => {
        predictWebcam();
      };
    } catch (err) {
      console.error("Camera denied:", err);
    }
  };

  const disableCam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    // Reset gesture
    if (lastGestureRef.current !== 'None') {
      setGesture('None');
      lastGestureRef.current = 'None';
    }
  };

  const predictWebcam = () => {
    // 1. Basic Component Reference Checks
    if (!gestureRecognizerRef.current || !videoRef.current) {
       // Keep loop running if just waiting for refs, but unlikely if disabled
       if (cameraActive) requestRef.current = requestAnimationFrame(predictWebcam);
       return;
    }
    
    // 2. Video Stream Readiness Checks
    if (videoRef.current.videoWidth > 0 && videoRef.current.readyState >= 2) {
        let currentGesture: Gesture = 'None';
        
        try {
          const startTimeMs = performance.now();
          // Use recognizeForVideo instead of detectForVideo
          const result = gestureRecognizerRef.current.recognizeForVideo(videoRef.current, startTimeMs);
      
          // 3. Result Parsing
          if (result && result.gestures && result.gestures.length > 0) {
             const firstHandGestures = result.gestures[0];
             
             // Check if the specific hand's gestures array exists and has entries
             if (firstHandGestures && firstHandGestures.length > 0) {
                // The API returns an array of categories sorted by confidence
                const topGesture = firstHandGestures[0];
                const categoryName = topGesture.categoryName;
                
                // Map MediaPipe names to our internal types
                if (categoryName === 'Open_Palm') currentGesture = 'Open_Palm';
                else if (categoryName === 'Closed_Fist') currentGesture = 'Closed_Fist';
             }
          }
        } catch (e) {
          // Log warning but prevent app crash
          console.warn("MediaPipe recognition error:", e);
        }

        // 4. Update State (Throttled)
        if (currentGesture !== lastGestureRef.current) {
          setGesture(currentGesture);
          lastGestureRef.current = currentGesture;
          if (currentGesture !== 'None') {
             console.log(`Gesture Detected: ${currentGesture}`);
          }
        }
    }

    // Continue loop
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-opacity duration-500 ${cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="glass-panel p-2 rounded-2xl overflow-hidden w-40 h-32 relative">
         <video 
           ref={videoRef} 
           autoPlay 
           playsInline 
           muted
           className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
         />
         {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-white">Loading AI...</div>}
      </div>
    </div>
  );
};

export default HandTracker;