import assert from "node:assert/strict";
import test from "node:test";

import {
  frameRetentionFactor,
  getLandingOutcome,
  landingGravityAtAltitude,
} from "../src/game/physics.js";

test("landing gravity stays positive at high altitude and increases near touchdown", () => {
  assert.equal(landingGravityAtAltitude(100_000), 30);
  assert.equal(landingGravityAtAltitude(10_000), 30);
  assert.equal(landingGravityAtAltitude(5_000), 55);
  assert.equal(landingGravityAtAltitude(0), 80);
  assert.equal(landingGravityAtAltitude(-100), 80);
});

test("landing gravity rejects non-finite altitude", () => {
  assert.throws(() => landingGravityAtAltitude(Number.NaN), TypeError);
  assert.throws(() => landingGravityAtAltitude(Number.POSITIVE_INFINITY), TypeError);
});

test("frame damping preserves its 60 Hz retention and scales with delta time", () => {
  assert.equal(frameRetentionFactor(0.98, 1 / 60), 0.98);
  assert.ok(Math.abs(frameRetentionFactor(0.98, 2 / 60) - 0.98 ** 2) < 1e-12);
  assert.equal(frameRetentionFactor(0.95, 0), 1);
});

test("frame damping rejects invalid parameters", () => {
  assert.throws(() => frameRetentionFactor(1.1, 1 / 60), RangeError);
  assert.throws(() => frameRetentionFactor(0.95, -1), RangeError);
});

test("landing outcome requires both touchdown speeds to be below their limits", () => {
  assert.equal(getLandingOutcome(29.9, 19.9), "success");
  assert.equal(getLandingOutcome(-29.9, -19.9), "success");
  assert.equal(getLandingOutcome(30, 0), "crash");
  assert.equal(getLandingOutcome(0, 20), "crash");
});

test("landing outcome rejects non-finite speeds", () => {
  assert.throws(() => getLandingOutcome(Number.NaN, 0), TypeError);
  assert.throws(() => getLandingOutcome(0, Number.POSITIVE_INFINITY), TypeError);
});
