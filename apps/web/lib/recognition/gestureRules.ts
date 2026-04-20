/**
 * Rule-based gesture detector using MediaPipe hand landmark geometry.
 *
 * Works by measuring finger extension (tip farther from wrist than PIP joint)
 * and thumb orientation (up/down/spread). No training data required — fires on
 * clear, unambiguous hand shapes only.
 *
 * Detectable signs from the vocabulary:
 *   yes, good, bad, one, two, three, four, five, phone
 *
 * MediaPipe landmark indices:
 *   0=wrist  1-4=thumb  5-8=index  9-12=middle  13-16=ring  17-20=pinky
 *   (PIP = knuckle at index 2 per finger: 6, 10, 14, 18)
 */

import type { HandLandmarks } from "../mediapipe/types";
import type { SignLabel } from "@auslan/vocab";

type Pt = { x: number; y: number };

const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Returns true when a finger tip is farther from the wrist than its PIP joint. */
function fingerExtended(tip: Pt, pip: Pt, wrist: Pt): boolean {
  return d(tip, wrist) > d(pip, wrist);
}

/**
 * Detect a single-frame gesture from the first detected hand.
 * Returns null when the hand shape doesn't match any known rule.
 */
export function ruleBasedGesture(hands: HandLandmarks[]): SignLabel | null {
  if (!hands.length) return null;
  const lm = hands[0]!.landmarks as Pt[];
  if (lm.length < 21) return null;

  const wrist    = lm[0]!;
  const thumbTip = lm[4]!;

  // Four non-thumb fingers
  const idx = fingerExtended(lm[8]!,  lm[6]!,  wrist);
  const mid = fingerExtended(lm[12]!, lm[10]!, wrist);
  const rng = fingerExtended(lm[16]!, lm[14]!, wrist);
  const pky = fingerExtended(lm[20]!, lm[18]!, wrist);

  // Thumb spread: tip is farther from index MCP than thumb MCP is
  const thumbSpread = d(thumbTip, lm[5]!) > d(lm[2]!, lm[5]!) * 1.1;

  // Thumb pointing up/down relative to wrist (works for typical upright hand)
  const handHeight = d(lm[9]!, wrist); // wrist → middle-MCP as reference scale
  const thumbUp    = thumbTip.y < wrist.y - handHeight * 0.4;
  const thumbDown  = thumbTip.y > wrist.y + handHeight * 0.4;

  // ── No non-thumb fingers extended ──────────────────────────────────────
  if (!idx && !mid && !rng && !pky) {
    if (thumbUp)    return "good";  // thumbs up
    if (thumbDown)  return "bad";   // thumbs down
    return "yes";                   // closed fist
  }

  // ── All four fingers extended ──────────────────────────────────────────
  if (idx && mid && rng && pky) {
    return thumbSpread ? "five" : "four";
  }

  // ── Specific combinations ──────────────────────────────────────────────
  if (idx && mid && rng && !pky) return "three";
  if (idx && mid && !rng && !pky) return "two";
  if (idx && !mid && !rng && !pky) return "one";

  // Y-hand: thumb + pinky only → phone
  if (!idx && !mid && !rng && pky && thumbSpread) return "phone";

  return null;
}
