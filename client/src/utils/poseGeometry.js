/**
 * Calculate the 2D angle (in degrees) formed at vertex p2 by vectors p1-p2 and p3-p2.
 * @param {{x: number, y: number}} p1 - Start point coordinate.
 * @param {{x: number, y: number}} p2 - Vertex coordinate (the joint itself).
 * @param {{x: number, y: number}} p3 - End point coordinate.
 * @returns {number} - Calculated angle in degrees (0 to 180).
 */
export const calculateAngle = (p1, p2, p3) => {
  if (!p1 || !p2 || !p3) return 0;
  
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  
  return angle;
};
