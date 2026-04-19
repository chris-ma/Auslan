export type SignTier = 1 | 2 | 3;
export type HandType = "right" | "left" | "both";
export type SignType = "static" | "dynamic";

export interface SignDefinition {
  label: string;
  displayText: string;
  tier: SignTier;
  hand: HandType;
  type: SignType;
  description: string;
}

export const SIGNS: readonly SignDefinition[] = [
  // ── Tier 1 ──────────────────────────────────────────────
  { label: "hello",       displayText: "Hello",       tier: 1, hand: "right",  type: "dynamic", description: "Wave open hand near forehead" },
  { label: "goodbye",     displayText: "Goodbye",     tier: 1, hand: "right",  type: "dynamic", description: "Wave hand side to side" },
  { label: "thank-you",   displayText: "Thank you",   tier: 1, hand: "right",  type: "dynamic", description: "Flat hand moves from chin forward" },
  { label: "please",      displayText: "Please",      tier: 1, hand: "right",  type: "dynamic", description: "Circular rub on chest" },
  { label: "sorry",       displayText: "Sorry",       tier: 1, hand: "right",  type: "dynamic", description: "Fist circles on chest" },
  { label: "yes",         displayText: "Yes",         tier: 1, hand: "right",  type: "dynamic", description: "Fist nods up and down" },
  { label: "no",          displayText: "No",          tier: 1, hand: "right",  type: "dynamic", description: "Index and middle finger close to thumb twice" },
  { label: "help",        displayText: "Help",        tier: 1, hand: "both",   type: "dynamic", description: "Thumbs-up lifted by flat hand" },
  { label: "want",        displayText: "Want",        tier: 1, hand: "both",   type: "dynamic", description: "Clawed hands pull toward body" },
  { label: "name",        displayText: "Name",        tier: 1, hand: "right",  type: "dynamic", description: "Index and middle finger tap back of other hand" },
  { label: "me",          displayText: "Me",          tier: 1, hand: "right",  type: "static",  description: "Index finger points to self" },
  { label: "you",         displayText: "You",         tier: 1, hand: "right",  type: "static",  description: "Index finger points to other person" },
  { label: "good",        displayText: "Good",        tier: 1, hand: "right",  type: "dynamic", description: "Thumbs up" },
  { label: "bad",         displayText: "Bad",         tier: 1, hand: "right",  type: "dynamic", description: "Thumbs down" },
  { label: "eat",         displayText: "Eat",         tier: 1, hand: "right",  type: "dynamic", description: "Bunched fingers tap lips twice" },
  { label: "drink",       displayText: "Drink",       tier: 1, hand: "right",  type: "dynamic", description: "C-hand tilts toward mouth" },
  { label: "water",       displayText: "Water",       tier: 1, hand: "right",  type: "dynamic", description: "W-hand taps chin twice" },
  { label: "toilet",      displayText: "Toilet",      tier: 1, hand: "right",  type: "dynamic", description: "T-hand shakes side to side" },
  { label: "stop",        displayText: "Stop",        tier: 1, hand: "right",  type: "dynamic", description: "Flat hand chops down on palm" },
  { label: "understand",  displayText: "Understand",  tier: 1, hand: "right",  type: "dynamic", description: "Index finger flicks up from temple" },

  // ── Tier 2 ──────────────────────────────────────────────
  { label: "mother",      displayText: "Mother",      tier: 2, hand: "right",  type: "dynamic", description: "Thumb taps chin" },
  { label: "father",      displayText: "Father",      tier: 2, hand: "right",  type: "dynamic", description: "Thumb taps forehead" },
  { label: "baby",        displayText: "Baby",        tier: 2, hand: "both",   type: "dynamic", description: "Arms rock as if cradling" },
  { label: "friend",      displayText: "Friend",      tier: 2, hand: "both",   type: "dynamic", description: "Hooked index fingers link together" },
  { label: "home",        displayText: "Home",        tier: 2, hand: "right",  type: "dynamic", description: "Fingertips of bunched hand tap cheek" },
  { label: "school",      displayText: "School",      tier: 2, hand: "both",   type: "dynamic", description: "Hands clap twice" },
  { label: "work",        displayText: "Work",        tier: 2, hand: "both",   type: "dynamic", description: "Fists tap together at wrists" },
  { label: "money",       displayText: "Money",       tier: 2, hand: "right",  type: "dynamic", description: "Bunched hand taps upward palm" },
  { label: "phone",       displayText: "Phone",       tier: 2, hand: "right",  type: "static",  description: "Y-hand held to ear" },
  { label: "sick",        displayText: "Sick",        tier: 2, hand: "right",  type: "dynamic", description: "Middle finger taps forehead" },
  { label: "pain",        displayText: "Pain",        tier: 2, hand: "both",   type: "dynamic", description: "Index fingers point toward each other and twist" },
  { label: "happy",       displayText: "Happy",       tier: 2, hand: "right",  type: "dynamic", description: "Flat hand circles on chest upward" },
  { label: "sad",         displayText: "Sad",         tier: 2, hand: "both",   type: "dynamic", description: "Flat hands move down face" },
  { label: "tired",       displayText: "Tired",       tier: 2, hand: "both",   type: "dynamic", description: "Bent hands drop at shoulders" },
  { label: "again",       displayText: "Again",       tier: 2, hand: "right",  type: "dynamic", description: "Bent hand arc taps palm" },
  { label: "wait",        displayText: "Wait",        tier: 2, hand: "both",   type: "dynamic", description: "Spread hands wiggle fingers" },
  { label: "where",       displayText: "Where?",      tier: 2, hand: "right",  type: "dynamic", description: "Index finger wags side to side" },
  { label: "what",        displayText: "What?",       tier: 2, hand: "right",  type: "dynamic", description: "Palm up, fingers spread, slight shake" },
  { label: "how",         displayText: "How?",        tier: 2, hand: "both",   type: "dynamic", description: "Knuckles together, rotate outward" },
  { label: "when",        displayText: "When?",       tier: 2, hand: "right",  type: "dynamic", description: "Index finger circles then points to other index" },

  // ── Tier 3 ──────────────────────────────────────────────
  { label: "one",         displayText: "1",           tier: 3, hand: "right",  type: "static",  description: "Index finger extended" },
  { label: "two",         displayText: "2",           tier: 3, hand: "right",  type: "static",  description: "Index and middle fingers extended" },
  { label: "three",       displayText: "3",           tier: 3, hand: "right",  type: "static",  description: "Index, middle, ring fingers extended" },
  { label: "four",        displayText: "4",           tier: 3, hand: "right",  type: "static",  description: "Four fingers extended" },
  { label: "five",        displayText: "5",           tier: 3, hand: "right",  type: "static",  description: "All five fingers extended" },
  { label: "more",        displayText: "More",        tier: 3, hand: "both",   type: "dynamic", description: "Bunched hands tap fingertips together" },
  { label: "finished",    displayText: "Finished",    tier: 3, hand: "both",   type: "dynamic", description: "Hands flip from palms-up to palms-down" },
  { label: "can",         displayText: "Can",         tier: 3, hand: "both",   type: "dynamic", description: "Both fists move down simultaneously" },
  { label: "dont-know",   displayText: "Don't know",  tier: 3, hand: "right",  type: "dynamic", description: "Bent hand at forehead brushes away" },
  { label: "maybe",       displayText: "Maybe",       tier: 3, hand: "both",   type: "dynamic", description: "Flat hands alternate up and down" },
] as const;

export type SignLabel = (typeof SIGNS)[number]["label"];

export const SIGN_LABELS: SignLabel[] = SIGNS.map((s) => s.label);

export const SIGN_MAP = new Map<SignLabel, SignDefinition>(
  SIGNS.map((s) => [s.label as SignLabel, s])
);

export const SIGNS_BY_TIER: Record<SignTier, SignDefinition[]> = {
  1: SIGNS.filter((s) => s.tier === 1),
  2: SIGNS.filter((s) => s.tier === 2),
  3: SIGNS.filter((s) => s.tier === 3),
};
