/**
 * Small deterministic physics helpers shared by the game and Node tests.
 */

/** Gravity used by the landing simulation, clamped to the 0-10 km descent band. */
export function landingGravityAtAltitude(altitude) {
  if (!Number.isFinite(altitude)) {
    throw new TypeError("altitude must be a finite number");
  }

  const clampedAltitude = Math.max(0, Math.min(10_000, altitude));
  return 30 + (10_000 - clampedAltitude) * 0.005;
}

/** Convert a retention factor measured per 60 Hz frame to the current frame delta. */
export function frameRetentionFactor(retentionPerFrame, deltaSeconds) {
  if (!Number.isFinite(retentionPerFrame) || retentionPerFrame < 0 || retentionPerFrame > 1) {
    throw new RangeError("retentionPerFrame must be between 0 and 1");
  }
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new RangeError("deltaSeconds must be a finite, non-negative number");
  }

  return Math.pow(retentionPerFrame, deltaSeconds * 60);
}

/** Evaluate touchdown using the game's existing vertical and horizontal speed limits. */
export function getLandingOutcome(verticalSpeed, horizontalSpeed) {
  if (!Number.isFinite(verticalSpeed) || !Number.isFinite(horizontalSpeed)) {
    throw new TypeError("landing speeds must be finite numbers");
  }

  return Math.abs(verticalSpeed) < 30 && Math.abs(horizontalSpeed) < 20
    ? "success"
    : "crash";
}
