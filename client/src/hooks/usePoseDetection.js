import { useState, useEffect, useRef } from 'react';
import { calculateAngle } from '../utils/poseGeometry.js';
import { checkPosture } from '../utils/postureChecker.js';

// Landmark visibility helper to check for stable detections
const vis = (lm) => lm && (lm.visibility ?? 0) > 0.5;

/**
 * Custom Hook for real-time MediaPipe Pose Detection, Repetition Counting,
 * Posture Correction, and Voice Feedback (Generic version).
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Ref to the playing video element.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to the overlay drawing canvas.
 * @param {boolean} isActive - Toggle state to enable or disable pose detection.
 * @param {string} activeExerciseName - The name of the selected exercise.
 * @param {string} trackingJoint - 'knees', 'elbows', or 'static'.
 * @param {string} startState - The starting/extended state ('UP', 'DOWN', or 'HOLD').
 * @param {boolean} voiceEnabled - Toggle state to enable spoken alerts.
 * @param {function} onPoseDetected - Callback fired when pose estimation results are ready.
 * @returns {{ fps, error, reps, currentState, currentRep, formWarnings }} - Live metrics.
 */
export const usePoseDetection = (
  videoRef,
  canvasRef,
  isActive,
  activeExerciseName,
  trackingJoint,
  startState,
  voiceEnabled,
  onPoseDetected
) => {
  const [fps, setFps] = useState(0);
  const [error, setError] = useState('');
  
  // Rep Counter / Hold Timer States
  const [reps, setReps] = useState(0);
  const [currentState, setCurrentState] = useState('UP');
  const [currentRep, setCurrentRep] = useState('Ready');

  // Posture Correction States
  const [formWarnings, setFormWarnings] = useState([]);
  const formWarningsRef = useRef([]);
  const highlightIndicesRef = useRef([]);
  const minAngleThisRepRef = useRef(180);
  const lastWarningUpdateRef = useRef(0);

  // Voice Feedback states and refs
  const hadWarningThisRepRef = useRef(false);
  const lastSpokenTimeRef = useRef({});

  // Plank Hold Timer Refs
  const plankTimeRef = useRef(0);

  const poseRef = useRef(null);
  const requestRef = useRef(null);
  
  // Refs to avoid stale closures in MediaPipe async loop callback
  const repsRef = useRef(0);
  const currentStateRef = useRef('UP');
  const currentRepRef = useRef('Ready');
  
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(performance.now());

  // Reset/Re-initialize state machine when config selection changes
  useEffect(() => {
    const initialExState = startState || 'UP';
    
    repsRef.current = 0;
    currentStateRef.current = initialExState;
    currentRepRef.current = 'Ready';
    
    setReps(0);
    setCurrentState(initialExState);
    setCurrentRep('Ready');
    setFormWarnings([]);
    formWarningsRef.current = [];
    highlightIndicesRef.current = [];
    minAngleThisRepRef.current = 180;
    hadWarningThisRepRef.current = false;
    lastSpokenTimeRef.current = {};
    plankTimeRef.current = 0;
  }, [trackingJoint, startState, isActive, activeExerciseName]);

  // Voice feedback speak helper
  const speak = (text) => {
    if (!voiceEnabled) return;
    if (!window.speechSynthesis) return;

    const now = Date.now();
    const lastTime = lastSpokenTimeRef.current[text] || 0;
    if (now - lastTime < 3000) {
      return; // prevent rapid repeats of the same phrase
    }
    lastSpokenTimeRef.current[text] = now;

    // For warning phrases, interrupt current queue to speak immediately
    if (text !== 'Perfect rep.' && text !== 'Good job.') {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const completeRep = () => {
    repsRef.current += 1;
    setReps(repsRef.current);
    currentRepRef.current = 'Completed';
    setCurrentRep('Completed');
    minAngleThisRepRef.current = 180;

    // Speak praise feedback
    if (hadWarningThisRepRef.current) {
      speak('Good job.');
    } else {
      speak('Perfect rep.');
    }
    hadWarningThisRepRef.current = false;
  };

  useEffect(() => {
    if (!isActive) {
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
      setFps(0);
      setFormWarnings([]);
      formWarningsRef.current = [];
      highlightIndicesRef.current = [];
      hadWarningThisRepRef.current = false;
      plankTimeRef.current = 0;
      return;
    }

    // Verify CDNs loaded successfully
    if (!window.Pose || !window.drawConnectors || !window.drawLandmarks) {
      setError('MediaPipe library failed to load. Check your internet connection or reload.');
      return;
    }

    setError('');
    
    // 1. Initialize Pose Model
    const poseInstance = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    poseInstance.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 2. Define onResults callback
    poseInstance.onResults((results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const landmarks = results.poseLandmarks;
      const nowFrameTime = performance.now();
      const frameDeltaSec = (nowFrameTime - lastFrameTimeRef.current) / 1000;

      if (landmarks) {
        // ─── DRAW SKELETON (mirrored) ───
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, {
          color: '#6C63FF',
          lineWidth: 4,
        });

        window.drawLandmarks(ctx, landmarks, {
          color: '#00D9FF',
          lineWidth: 1,
          radius: 5,
        });

        // Draw joint highlighting overlay (for form warnings)
        const badIndices = highlightIndicesRef.current;
        if (badIndices.length > 0) {
          for (const idx of badIndices) {
            const lm = landmarks[idx];
            if (lm && (lm.visibility ?? 0) > 0.1) {
              const x = lm.x * canvas.width;
              const y = lm.y * canvas.height;

              ctx.beginPath();
              ctx.arc(x, y, 14, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
              ctx.fill();

              ctx.beginPath();
              ctx.arc(x, y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = '#FF4444';
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }

        ctx.restore();

        // ─── REPETITION COUNTING / HOLD TIMER STATE MACHINES ───
        let targetAngle = 0;
        let isVisible = false;

        if (trackingJoint === 'knees') {
          const leftHip = landmarks[23];
          const leftKnee = landmarks[25];
          const leftAnkle = landmarks[27];
          const rightHip = landmarks[24];
          const rightKnee = landmarks[26];
          const rightAnkle = landmarks[28];

          const leftVis = leftKnee?.visibility ?? 0;
          const rightVis = rightKnee?.visibility ?? 0;

          const leftValid = leftHip && leftKnee && leftAnkle && leftVis > 0.1;
          const rightValid = rightHip && rightKnee && rightAnkle && rightVis > 0.1;

          if (leftValid || rightValid) {
            isVisible = true;
            if (leftValid && rightValid) {
              const angleL = calculateAngle(leftHip, leftKnee, leftAnkle);
              const angleR = calculateAngle(rightHip, rightKnee, rightAnkle);
              targetAngle = (angleL + angleR) / 2;
            } else if (leftValid) {
              targetAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
            } else {
              targetAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
            }
          }
        } else if (trackingJoint === 'elbows') {
          const leftShoulder = landmarks[11];
          const leftElbow = landmarks[13];
          const leftWrist = landmarks[15];
          const rightShoulder = landmarks[12];
          const rightElbow = landmarks[14];
          const rightWrist = landmarks[16];

          const leftVis = leftElbow?.visibility ?? 0;
          const rightVis = rightElbow?.visibility ?? 0;

          const leftValid = leftShoulder && leftElbow && leftWrist && leftVis > 0.1;
          const rightValid = rightShoulder && rightElbow && rightWrist && rightVis > 0.1;

          if (leftValid || rightValid) {
            isVisible = true;
            if (leftValid && rightValid) {
              const angleL = calculateAngle(leftShoulder, leftElbow, leftWrist);
              const angleR = calculateAngle(rightShoulder, rightElbow, rightWrist);
              targetAngle = (angleL + angleR) / 2;
            } else if (leftValid) {
              targetAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
            } else {
              targetAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
            }
          }
        } else if (trackingJoint === 'static') {
          // Static hold (Plank) landmarks check
          const leftValid = vis(landmarks[11]) && vis(landmarks[23]) && vis(landmarks[27]);
          const rightValid = vis(landmarks[12]) && vis(landmarks[24]) && vis(landmarks[28]);
          if (leftValid || rightValid) {
            isVisible = true;
          }
        }

        // Apply transition rules or static hold increments
        if (isVisible) {
          if (activeExerciseName === 'Plank') {
            // Check if there are form warnings. Only increment timer if posture is correct.
            const hasFormErrors = formWarningsRef.current.length > 0;
            if (!hasFormErrors) {
              plankTimeRef.current += frameDeltaSec;
              const roundedSec = Math.floor(plankTimeRef.current);
              
              if (roundedSec !== repsRef.current) {
                repsRef.current = roundedSec;
                setReps(roundedSec);
                currentRepRef.current = `Planking: ${roundedSec}s`;
                setCurrentRep(`Planking: ${roundedSec}s`);
                
                // Periodic hold encouragement every 10s
                if (roundedSec > 0 && roundedSec % 10 === 0) {
                  speak('Good job.');
                }
              }
            } else {
              if (currentRepRef.current !== 'Hold paused — check form') {
                currentRepRef.current = 'Hold paused — check form';
                setCurrentRep('Hold paused — check form');
              }
            }
          } else {
            // Dynamic exercises reps
            minAngleThisRepRef.current = Math.min(minAngleThisRepRef.current, targetAngle);

            if (trackingJoint === 'knees') {
              // Lunges vs Squats knee threshold triggers
              const bendThreshold = activeExerciseName === 'Lunges' ? 120 : 115;
              if (targetAngle < bendThreshold) {
                if (currentStateRef.current === 'UP') {
                  currentStateRef.current = 'DOWN';
                  setCurrentState('DOWN');
                  currentRepRef.current = `Rep #${repsRef.current + 1}`;
                  setCurrentRep(`Rep #${repsRef.current + 1}`);
                }
              } else if (targetAngle > 155) {
                if (currentStateRef.current === 'DOWN') {
                  currentStateRef.current = 'UP';
                  setCurrentState('UP');
                  completeRep();
                }
              }
            } else if (trackingJoint === 'elbows') {
              if (startState === 'UP') {
                if (targetAngle < 105) {
                  if (currentStateRef.current === 'UP') {
                    currentStateRef.current = 'DOWN';
                    setCurrentState('DOWN');
                    currentRepRef.current = `Rep #${repsRef.current + 1}`;
                    setCurrentRep(`Rep #${repsRef.current + 1}`);
                  }
                } else if (targetAngle > 145) {
                  if (currentStateRef.current === 'DOWN') {
                    currentStateRef.current = 'UP';
                    setCurrentState('UP');
                    completeRep();
                  }
                }
              } else {
                if (targetAngle < 75) {
                  if (currentStateRef.current === 'DOWN') {
                    currentStateRef.current = 'UP';
                    setCurrentState('UP');
                    currentRepRef.current = `Rep #${repsRef.current + 1}`;
                    setCurrentRep(`Rep #${repsRef.current + 1}`);
                  }
                } else if (targetAngle > 135) {
                  if (currentStateRef.current === 'UP') {
                    currentStateRef.current = 'DOWN';
                    setCurrentState('DOWN');
                    completeRep();
                  }
                }
              }
            }
          }
        }

        // ─── POSTURE CORRECTION CHECK (throttled to 500ms) ───
        const now = performance.now();
        if (now - lastWarningUpdateRef.current > 500) {
          const { warnings, highlightIndices } = checkPosture(
            landmarks,
            activeExerciseName,
            trackingJoint,
            startState,
            currentStateRef.current,
            minAngleThisRepRef.current
          );

          if (warnings && warnings.length > 0) {
            hadWarningThisRepRef.current = true;
            
            // Voice feedback warning mapping (only speaks first warning)
            const alertMsg = warnings[0].message;
            if (alertMsg === 'Straighten your back' || alertMsg.includes('Raise your hips')) {
              speak('Keep your back straight.');
            } else if (
              alertMsg.includes('incomplete') ||
              alertMsg.includes('deeper') ||
              alertMsg.includes('Lower your chest') ||
              alertMsg.includes('Lower your hips')
            ) {
              speak('Go lower.');
            } else if (
              alertMsg.includes('elbows close') ||
              alertMsg.includes('Knees too far')
            ) {
              speak('Straighten your elbows.');
            }
          }

          const prevMessages = formWarningsRef.current.map((w) => w.message).join('|');
          const newMessages = warnings.map((w) => w.message).join('|');

          if (prevMessages !== newMessages) {
            formWarningsRef.current = warnings;
            highlightIndicesRef.current = highlightIndices;
            setFormWarnings([...warnings]);
          } else {
            highlightIndicesRef.current = highlightIndices;
          }

          lastWarningUpdateRef.current = now;
        }

        if (onPoseDetected) {
          onPoseDetected(landmarks);
        }
      } else {
        if (formWarningsRef.current.length > 0) {
          formWarningsRef.current = [];
          highlightIndicesRef.current = [];
          setFormWarnings([]);
        }
      }

      const nowFps = performance.now();
      frameCountRef.current += 1;
      
      if (nowFps - fpsIntervalRef.current >= 1000) {
        const computedFps = Math.round((frameCountRef.current * 1000) / (nowFps - fpsIntervalRef.current));
        setFps(computedFps);
        frameCountRef.current = 0;
        fpsIntervalRef.current = nowFps;
      }
      lastFrameTimeRef.current = nowFrameTime;
    });

    poseRef.current = poseInstance;

    const processFrame = async () => {
      if (!isActive || !poseRef.current) return;

      // Throttle frame processing when tab is hidden to save CPU/GPU cycles
      if (document.hidden) {
        requestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      if (video && video.readyState >= 2 && !video.paused && !video.ended) {
        try {
          await poseRef.current.send({ image: video });
        } catch (err) {
          console.error('Frame processing error:', err);
        }
      }

      if (isActive && poseRef.current) {
        requestRef.current = requestAnimationFrame(processFrame);
      }
    };

    requestRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
      setFps(0);
      setFormWarnings([]);
      formWarningsRef.current = [];
      highlightIndicesRef.current = [];
      hadWarningThisRepRef.current = false;
      plankTimeRef.current = 0;
    };
  }, [isActive, videoRef, canvasRef, trackingJoint, startState, voiceEnabled, activeExerciseName]);

  return { fps, error, reps, currentState, currentRep, formWarnings };
};
export default usePoseDetection;
