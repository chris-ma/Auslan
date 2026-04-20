/**
 * Rule-based gesture detector using MediaPipe hand landmark geometry.
 *
 * Works by measuring finger extension, thumb orientation, fingertip clustering,
 * and finger curl depth. No training data required.
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
  const lm = hands[0]!.landmarks as Pt[];
  if (lm.length < 21) return null;

  const wrist = lm[0]!;

  // Reference scale: wrist → middle-finger MCP
  const scale = d(lm[9]!, wrist) || 0.001;

  // ── Finger states ──────────────────────────────────────────────────────
  const idx  = extended(lm[8]!,  lm[6]!,  wrist);
  const mid  = extended(lm[12]!, lm[10]!, wrist);
  const rng  = extended(lm[16]!, lm[14]!, wrist);
  const pky  = extended(lm[20]!, lm[18]!, wrist);

  const idxCurled = tightlyCurled(lm[8]!,  lm[5]!,  wrist);
  const midCurled = tightlyCurled(lm[12]!, lm[9]!,  wrist);
  const rngCurled = tightlyCurled(lm[16]!, lm[13]!, wrist);
  const pkyCurled = tightlyCurled(lm[20]!, lm[17]!, wrist);

  const thumbTip = lm[4]!;
  // Thumb spread: tip farther from index MCP than thumb MCP is
  const thumbSpread = d(thumbTip, lm[5]!) > d(lm[2]!, lm[5]!) * 1.1;
  // Thumb up/down relative to wrist (scaled to hand size)
  const thumbUp   = thumbTip.y < wrist.y - scale * 0.4;
  const thumbDown = thumbTip.y > wrist.y + scale * 0.4;

  // ── Derived shapes ─────────────────────────────────────────────────────

  // Bunched: all fingertips clustered tightly together (eat / more)
  const tipsClose =
    d(lm[8]!, lm[12]!) < scale * 0.35 &&
    d(lm[8]!, lm[16]!) < scale * 0.50 &&
    d(lm[8]!, lm[20]!) < scale * 0.60 &&
    d(lm[4]!, lm[8]!)  < scale * 0.50;

  // C-hand: fingers uniformly curved — not extended, not tightly curled
  const cHand =
    !idx && !mid && !rng && !pky &&
    !idxCurled && !midCurled && !rngCurled && !pkyCurled &&
    thumbSpread;

  // Claw hand: fingers spread wide but all bent (not extended, not fist-curled)
  const clawHand =
    !idx && !mid && !rng && !pky &&
    !idxCurled && !midCurled && !rngCurled && !pkyCurled &&
    !thumbSpread;

  // ── Match rules (most specific first) ─────────────────────────────────

  // Bunched fingertips → eat
  if (tipsClose) return "eat";

  // C-hand (curved, thumb spread) → drink
  if (cHand) return "drink";

  // Claw hand (curved, thumb tucked) → want
  if (clawHand) return "want";

  // No non-thumb fingers extended
  if (!idx && !mid && !rng && !pky) {
    if (idxCurled && midCurled && rngCurled && pkyCurled) {
      if (thumbUp)   return "good";   // thumbs up
      if (thumbDown) return "bad";    // thumbs down
      return "yes";                   // closed fist
    }
  }

  // Fist with thumb up/down (fingers not all tightly curled but folded)
  if (!idx && !mid && !rng && !pky) {
    if (thumbUp)   return "good";
    if (thumbDown) return "bad";
    return "yes";
  }

  // All four fingers + thumb spread → five / hello / stop
  if (idx && mid && rng && pky) {
    return thumbSpread ? "hello" : "four";
  }

  // Three fingers
  if (idx && mid && rng && !pky) return "three";

  // V-sign
  if (idx && mid && !rng && !pky) return "two";

  // Index only
  if (idx && !mid && !rng && !pky) {
    // Pointing toward camera (z tip < z wrist) → you; away → me
    const tipZ  = (hands[0]!.landmarks[8] as { z?: number })?.z ?? 0;
    const wristZ = (hands[0]!.landmarks[0] as { z?: number })?.z ?? 0;
    return tipZ < wristZ - 0.05 ? "you" : "me";
  }

  // Y-hand: thumb + pinky → phone
  if (!idx && !mid && !rng && pky && thumbSpread) return "phone";

  // Two hands: both fists close together → sorry / work
  if (hands.length >= 2) {
    const lm2 = hands[1]!.landmarks as Pt[];
    const handsClose = d(lm[0]!, lm2[0]!) < scale * 1.5;

    const idx2  = extended(lm2[8]!,  lm2[6]!,  lm2[0]!);
    const mid2  = extended(lm2[12]!, lm2[10]!, lm2[0]!);
    const rng2  = extended(lm2[16]!, lm2[14]!, lm2[0]!);
    const pky2  = extended(lm2[20]!, lm2[18]!, lm2[0]!);
    const allOpen2 = idx2 && mid2 && rng2 && pky2;

    // Both fists together → sorry
    if (!idx && !mid && !rng && !pky && !idx2 && !mid2 && !rng2 && !pky2 && handsClose) {
      return "sorry";
    }

    // Both open hands → help / stop
    if (idx && mid && rng && pky && allOpen2 && handsClose) {
      return "stop";
    }

    // One hand open, one fist (thumbs-up lifted) → help
    if ((!idx && !mid && !rng && !pky) && allOpen2) return "help";
    if ((idx && mid && rng && pky) && !idx2 && !mid2 && !rng2 && !pky2) return "help";
  }

  return null;
}
