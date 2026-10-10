export type LandingOutcome = "success" | "crash";

export declare function landingGravityAtAltitude(altitude: number): number;
export declare function frameRetentionFactor(retentionPerFrame: number, deltaSeconds: number): number;
export declare function getLandingOutcome(verticalSpeed: number, horizontalSpeed: number): LandingOutcome;
