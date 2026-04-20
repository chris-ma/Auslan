/**
 * Rule-based gesture detector using MediaPipe hand landmark geometry.
 *
 * Detects signs purely from hand shape — no training data required.
 * Works alongside the ML classifier; fires first when a clear shape is held
 * for ~133 ms (8 frames at 60 fps).
 *
 * MediaPipe landmark indices (per hand, 21 points):
 *   0=wrist
 *   Thumb:  1(CMC) 2(MCP) 3(IP)  4(tip)
 *   Index:  5(MCP) 6(PIP) 7(DIP) 8(tip)
 *   Middle: 9(MCP) 10(PIP)11(DIP)12(tip)
 *   Ring:  13(MCP)14(PIP)15(DIP)16(tip)
 *   Pinky: 17(MCP)18(PIP)19(DIP)20(tip)
 */

import type { HandLandmarks } from "../mediapipe/types";
import type { SignLabel } from "@auslan/vocab";

type Pt = { x: number; y: number };
type Pt3 = { x: number; y: number; z?: number };

const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Tip is farther from wrist than PIP → finger is straight/extended. */
function extended(tip: Pt, pip: Pt, wrist: Pt) {
  return d(tip, wrist) > d(pip, wrist);
}

/** Tip is closer to wrist than MCP → finger is tightly curled into a fist. */
function tightlyCurled(tip: Pt, mcp: Pt, wrist: Pt) {
  return d(tip, wrist) < d(mcp, wrist) * 0.95;
}

/**
 * Detect a single-frame gesture from the detected hands.
 * Returns null when the shape doesn't match any known rule.
 */
export function ruleBasedGesture(hands: HandLandmarks[]): SignLabel | null {
  if (!hands.length) return null;
  const lm = hands[0]!.landmarks as Pt3[];
  if (lm.length < 21) return null;

  const wrist    = lm[0]!;
  const thumbTip = lm[4]!;

  // Reference scale: wrist → middle-finger MCP
  const scale = d(lm[9]!, wrist) || 0.001;

  // ── Finger extension state ─────────────────────────────────────────────
  const idx = extended(lm[8]!,  lm[6]!,  wrist);
  const mid = extended(lm[12]!, lm[10]!, wrist);
  const rng = extended(lm[16]!, lm[14]!, wrist);
  const pky = extended(lm[20]!, lm[18]!, wrist);

  const idxCurled = tightlyCurled(lm[8]!,  lm[5]!,  wrist);
  const midCurled = tightlyCurled(lm[12]!, lm[9]!,  wrist);
  const rngCurled = tightlyCurled(lm[16]!, lm[13]!, wrist);
  const pkyCurled = tightlyCurled(lm[20]!, lm[17]!, wrist);

  // Thumb spread: tip farther from index MCP than thumb MCP
  const thumbSpread = d(thumbTip, lm[5]!) > d(lm[2]!, lm[5]!) * 1.1;
  // Thumb vertical orientation relative to wrist
  const thumbUp   = thumbTip.y < wrist.y - scale * 0.4;
  const thumbDown = thumbTip.y > wrist.y + scale * 0.4;

  // ── Compound shape helpers ─────────────────────────────────────────────

  // OK / Eight: thumb tip touching index tip (finger curved into O shape)
  const thumbIdxTouching = d(thumbTip, lm[8]!) < scale * 0.4;

  // Thumb touching ring finger (Auslan 6)
  const thumbRngTouching = d(thumbTip, lm[16]!) < scale * 0.4;
  // Thumb touching middle finger (Auslan 7)
  const thumbMidTouching = d(thumbTip, lm[12]!) < scale * 0.4;

  // Bunched hand: all fingertips clustered tightly together
  const tipsClose =
    d(lm[8]!, lm[12]!) < scale * 0.35 &&
    d(lm[8]!, lm[16]!) < scale * 0.50 &&
    d(lm[8]!, lm[20]!) < scale * 0.60 &&
    d(lm[4]!, lm[8]!)  < scale * 0.50;

  // C-hand: fingers uniformly curved (not extended, not tightly curled), thumb spread
  const cHand =
    !idx && !mid && !rng && !pky &&
    !idxCurled && !midCurled && !rngCurled && !pkyCurled &&
    thumbSpread;

  // Claw hand: fingers bent (not extended, not fist-curled), thumb tucked
  const clawHand =
    !idx && !mid && !rng && !pky &&
    !idxCurled && !midCurled && !rngCurled && !pkyCurled &&
    !thumbSpread;

  // ── Rules: most specific first ─────────────────────────────────────────

  // ILY (I Love You): thumb + index + pinky extended, middle + ring curled
  if (thumbSpread && idx && !mid && !rng && pky) return "i-love-you";

  // OK / Fine: thumb tip touching index tip, middle/ring/pinky extended
  if (thumbIdxTouching && !idx && mid && rng && pky) return "ok";

  // Auslan numbers involving thumb-finger contact
  // 6: thumb touches ring, index + middle + pinky extended
  if (thumbRngTouching && idx && mid && !rng && pky) return "six";
  // 7: thumb touches middle, index + ring + pinky extended
  if (thumbMidTouching && idx && !mid && rng && pky) return "seven";

  // Bunched fingertips → eat / food
  if (tipsClose) return "eat";

  // C-hand (curved, thumb spread) → drink
  if (cHand) return "drink";

  // Claw hand (curved, thumb tucked) → want
  if (clawHand) return "want";

  // ── Fist variants (no non-thumb fingers extended) ──────────────────────
  if (!idx && !mid && !rng && !pky) {
    if (thumbUp)   return "good";   // thumbs up
    if (thumbDown) return "bad";    // thumbs down
    return "yes";                   // closed fist
  }

  // ── Four fingers extended ──────────────────────────────────────────────
  if (idx && mid && rng && pky) {
    // Five: all spread including thumb
    if (thumbSpread) return "hello";
    // Four: thumb tucked
    return "four";
  }

  // ── Three-finger combinations ──────────────────────────────────────────
  if (idx && mid && rng && !pky) return "three";

  // ── Two-finger combinations ────────────────────────────────────────────
  if (idx && mid && !rng && !pky) return "two";

  // ── Index only → me or you (use Z depth to distinguish direction) ──────
  if (idx && !mid && !rng && !pky) {
    const tipZ   = (lm[8] as Pt3).z ?? 0;
    const wristZ = (lm[0] as Pt3).z ?? 0;
    return tipZ < wristZ - 0.05 ? "you" : "me";
  }

  // ── Pinky only → nine (hooked / touching thumb area) ──────────────────
  if (!idx && !mid && !rng && pky) {
    if (thumbSpread) return "phone"; // Y-hand (thumb + pinky spread)
    return "nine";                   // pinky only, thumb curled
  }

  // ── Ring only ──────────────────────────────────────────────────────────
  if (!idx && !mid && rng && !pky) return "eight"; // ring + thumb touching area

  // ── Two hands: proximity-based signs ──────────────────────────────────
  if (hands.length >= 2) {
    const lm2    = hands[1]!.landmarks as Pt[];
    const wrist2 = lm2[0]!;
    const handsClose = d(wrist, wrist2) < scale * 1.5;

    const idx2 = extended(lm2[8]!,  lm2[6]!,  wrist2);
    const mid2 = extended(lm2[12]!, lm2[10]!, wrist2);
    const rng2 = extended(lm2[16]!, lm2[14]!, wrist2);
    const pky2 = extended(lm2[20]!, lm2[18]!, wrist2);
    const allOpen2 = idx2 && mid2 && rng2 && pky2;
    const fist2 = !idx2 && !mid2 && !rng2 && !pky2;
    const fist1 = !idx && !mid && !rng && !pky;

    if (handsClose) {
      // Both fists together → sorry
      if (fist1 && fist2) return "sorry";
      // Both open hands together → stop
      if (idx && mid && rng && pky && allOpen2) return "stop";
      // One hand open, one fist → help
      if (fist1 && allOpen2) return "help";
      if (idx && mid && rng && pky && fist2) return "help";
    }
  }

  return null;
}
