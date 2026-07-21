import { calculateAngle } from './poseGeometry.js';

/**
 * Posture Checker — Real-time form validation using MediaPipe Pose landmarks.
 *
 * Returns an array of warnings (each with a message and landmark indices to highlight)
 * based on the current exercise configuration, body position, and rep history.
 *
 * @param {Array} landmarks - MediaPipe pose landmarks array (33 points).
 * @param {string} activeExerciseName - The name of the selected exercise.
 * @param {string} trackingJoint - 'knees', 'elbows', or 'static'.
 * @param {string} startState - The starting/extended state ('UP', 'DOWN', or 'HOLD').
 * @param {string} currentExState - Current rep state ('UP', 'DOWN', or 'HOLD').
 * @param {number} minAngleThisRep - Minimum angle reached in the current rep cycle.
 * @returns {{ warnings: Array<{message: string, severity: string}>, highlightIndices: number[] }}
 */
export const checkPosture = (landmarks, activeExerciseName, trackingJoint, startState, currentExState, minAngleThisRep) => {
  const warnings = [];
  const highlightIndices = [];

  if (!landmarks || landmarks.length < 33) {
    return { warnings, highlightIndices };
  }

  // ─── Landmark References ───
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];

  // ─── Visibility helpers ───
  const vis = (lm) => (lm?.visibility ?? 0) > 0.1;

  // Get current active angle for completion validation
  let currentAngle = null;
  if (trackingJoint === 'knees') {
    const leftValid = vis(leftHip) && vis(leftKnee) && vis(leftAnkle);
    const rightValid = vis(rightHip) && vis(rightKnee) && vis(rightAnkle);
    if (leftValid && rightValid) {
      currentAngle = (calculateAngle(leftHip, leftKnee, leftAnkle) + calculateAngle(rightHip, rightKnee, rightAnkle)) / 2;
    } else if (leftValid) {
      currentAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    } else if (rightValid) {
      currentAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    }
  } else if (trackingJoint === 'elbows') {
    const leftValid = vis(leftShoulder) && vis(leftElbow) && vis(leftWrist);
    const rightValid = vis(rightShoulder) && vis(rightElbow) && vis(rightWrist);
    if (leftValid && rightValid) {
      currentAngle = (calculateAngle(leftShoulder, leftElbow, leftWrist) + calculateAngle(rightShoulder, rightElbow, rightWrist)) / 2;
    } else if (leftValid) {
      currentAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    } else if (rightValid) {
      currentAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 1: BENT BACK (squats, push-ups, lunges)
  // Measures the Shoulder–Hip–Knee alignment.
  // Straight back should be > 155°. Below that is rounded/bent.
  // ═══════════════════════════════════════════════════════════
  if (trackingJoint === 'knees' || (trackingJoint === 'elbows' && startState === 'UP')) {
    let backAngle = null;

    const leftBackValid = vis(leftShoulder) && vis(leftHip) && vis(leftKnee);
    const rightBackValid = vis(rightShoulder) && vis(rightHip) && vis(rightKnee);

    if (leftBackValid && rightBackValid) {
      const angleL = calculateAngle(leftShoulder, leftHip, leftKnee);
      const angleR = calculateAngle(rightShoulder, rightHip, rightKnee);
      backAngle = (angleL + angleR) / 2;
    } else if (leftBackValid) {
      backAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    } else if (rightBackValid) {
      backAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    }

    if (backAngle !== null && backAngle < 155) {
      warnings.push({
        message: 'Straighten your back',
        severity: 'warning',
      });
      highlightIndices.push(11, 12, 23, 24, 25, 26);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 2: KNEES TOO FAR FORWARD (squats & lunges)
  // Check if knee X position extends significantly past ankle X position.
  // ═══════════════════════════════════════════════════════════
  if (trackingJoint === 'knees' && activeExerciseName !== 'Plank') {
    const threshold = 0.05; // horizontal deviation tolerance
    let kneesPastToes = false;

    if (vis(leftKnee) && vis(leftAnkle) && vis(leftHip)) {
      const facingRight = leftKnee.x > leftHip.x;
      if (facingRight) {
        if (leftKnee.x > leftAnkle.x + threshold) kneesPastToes = true;
      } else {
        if (leftKnee.x < leftAnkle.x - threshold) kneesPastToes = true;
      }
    }
    if (vis(rightKnee) && vis(rightAnkle) && vis(rightHip)) {
      const facingRight = rightKnee.x > rightHip.x;
      if (facingRight) {
        if (rightKnee.x > rightAnkle.x + threshold) kneesPastToes = true;
      } else {
        if (rightKnee.x < rightAnkle.x - threshold) kneesPastToes = true;
      }
    }

    if (kneesPastToes) {
      warnings.push({
        message: 'Knees too far forward — sit back more',
        severity: 'error',
      });
      highlightIndices.push(25, 26, 27, 28);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 3: INCOMPLETE SQUAT / LUNGE (squats & lunges)
  // Triggers when user is rising back up (angle > 145°) but did not 
  // descend below the required threshold during the rep.
  // ═══════════════════════════════════════════════════════════
  if (trackingJoint === 'knees' && minAngleThisRep !== null) {
    if (currentAngle !== null && currentAngle > 145) {
      if (activeExerciseName === 'Squats') {
        if (minAngleThisRep > 115 && minAngleThisRep < 140) {
          warnings.push({
            message: 'Go deeper — incomplete squat',
            severity: 'warning',
          });
          highlightIndices.push(25, 26);
        }
      } else if (activeExerciseName === 'Lunges') {
        if (minAngleThisRep > 120 && minAngleThisRep < 145) {
          warnings.push({
            message: 'Go deeper — incomplete lunge',
            severity: 'warning',
          });
          highlightIndices.push(25, 26);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 4: INCOMPLETE PUSH-UP (push-ups only)
  // Triggers when user is extending arms back up (angle > 135°) but
  // did not lower chest enough (elbow angle < 105°) during the rep.
  // ═══════════════════════════════════════════════════════════
  if (activeExerciseName === 'Push-ups' && minAngleThisRep !== null) {
    if (currentAngle !== null && currentAngle > 135) {
      if (minAngleThisRep > 105 && minAngleThisRep < 130) {
        warnings.push({
          message: 'Lower your chest — incomplete push-up',
          severity: 'warning',
        });
        highlightIndices.push(13, 14);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 5: INCORRECT ELBOW ANGLE / MOMENTUM (bicep curls only)
  // ═══════════════════════════════════════════════════════════
  if (activeExerciseName === 'Bicep Curls') {
    // A. Elbow Drift Check
    let elbowDriftAngle = null;
    const leftDriftValid = vis(leftShoulder) && vis(leftElbow) && vis(leftHip);
    const rightDriftValid = vis(rightShoulder) && vis(rightElbow) && vis(rightHip);

    if (leftDriftValid && rightDriftValid) {
      elbowDriftAngle = (calculateAngle(leftShoulder, leftElbow, leftHip) + calculateAngle(rightShoulder, rightElbow, rightHip)) / 2;
    } else if (leftDriftValid) {
      elbowDriftAngle = calculateAngle(leftShoulder, leftElbow, leftHip);
    } else if (rightDriftValid) {
      elbowDriftAngle = calculateAngle(rightShoulder, rightElbow, rightHip);
    }

    if (elbowDriftAngle !== null && elbowDriftAngle < 60) {
      warnings.push({
        message: 'Keep elbows close to your body',
        severity: 'error',
      });
      highlightIndices.push(13, 14, 11, 12);
    }

    // B. Incomplete Curl Range of Motion
    if (minAngleThisRep !== null && currentAngle !== null && currentAngle > 120) {
      if (minAngleThisRep > 75 && minAngleThisRep < 110) {
        warnings.push({
          message: 'Full range of motion — incomplete curl',
          severity: 'warning',
        });
        highlightIndices.push(13, 14);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 6: PLANK POSTURE VALIDATION (plank only)
  // Measure Shoulder-Hip-Ankle alignment. Expect straight line (~180°, min 165°).
  // ═══════════════════════════════════════════════════════════
  if (activeExerciseName === 'Plank') {
    let plankBackAngle = null;
    let expectedHipY = null;
    let actualHipY = null;

    const leftPlankValid = vis(leftShoulder) && vis(leftHip) && vis(leftAnkle);
    const rightPlankValid = vis(rightShoulder) && vis(rightHip) && vis(rightAnkle);

    if (leftPlankValid && rightPlankValid) {
      plankBackAngle = (calculateAngle(leftShoulder, leftHip, leftAnkle) + calculateAngle(rightShoulder, rightHip, rightAnkle)) / 2;
      actualHipY = (leftHip.y + rightHip.y) / 2;
      
      const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipX = (leftHip.x + rightHip.x) / 2;
      const ankleX = (leftAnkle.x + rightAnkle.x) / 2;
      const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
      
      if (Math.abs(ankleX - shoulderX) > 0.01) {
        expectedHipY = shoulderY + (ankleY - shoulderY) * ((hipX - shoulderX) / (ankleX - shoulderX));
      }
    } else if (leftPlankValid) {
      plankBackAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);
      actualHipY = leftHip.y;
      if (Math.abs(leftAnkle.x - leftShoulder.x) > 0.01) {
        expectedHipY = leftShoulder.y + (leftAnkle.y - leftShoulder.y) * ((leftHip.x - leftShoulder.x) / (leftAnkle.x - leftShoulder.x));
      }
    } else if (rightPlankValid) {
      plankBackAngle = calculateAngle(rightShoulder, rightHip, rightAnkle);
      actualHipY = rightHip.y;
      if (Math.abs(rightAnkle.x - rightShoulder.x) > 0.01) {
        expectedHipY = rightShoulder.y + (rightAnkle.y - rightShoulder.y) * ((rightHip.x - rightShoulder.x) / (rightAnkle.x - rightShoulder.x));
      }
    }

    if (plankBackAngle !== null && plankBackAngle < 165 && expectedHipY !== null && actualHipY !== null) {
      // Remember: y is 0 at top, 1 at bottom.
      // actualHipY < expectedHipY means hip is higher on screen (Hips too high/pike)
      if (actualHipY < expectedHipY - 0.04) {
        warnings.push({
          message: 'Lower your hips — flat plank posture required',
          severity: 'error',
        });
        highlightIndices.push(11, 12, 23, 24, 27, 28);
      } else if (actualHipY > expectedHipY + 0.04) {
        warnings.push({
          message: 'Raise your hips — do not sag your lower back',
          severity: 'error',
        });
        highlightIndices.push(11, 12, 23, 24, 27, 28);
      }
    }
  }

  // Deduplicate highlight indices
  const uniqueHighlights = [...new Set(highlightIndices)];

  return { warnings, highlightIndices: uniqueHighlights };
};
