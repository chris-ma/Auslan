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
  // ── Tier 1 — Essential everyday communication ────────────────────────
  { label: "hello",         displayText: "Hello",          tier: 1, hand: "right", type: "dynamic", description: "Wave open hand near forehead" },
  { label: "goodbye",       displayText: "Goodbye",        tier: 1, hand: "right", type: "dynamic", description: "Wave hand side to side" },
  { label: "thank-you",     displayText: "Thank you",      tier: 1, hand: "right", type: "dynamic", description: "Flat hand moves from chin forward" },
  { label: "please",        displayText: "Please",         tier: 1, hand: "right", type: "dynamic", description: "Circular rub on chest" },
  { label: "sorry",         displayText: "Sorry",          tier: 1, hand: "right", type: "dynamic", description: "Fist circles on chest" },
  { label: "yes",           displayText: "Yes",            tier: 1, hand: "right", type: "dynamic", description: "Fist nods up and down" },
  { label: "no",            displayText: "No",             tier: 1, hand: "right", type: "dynamic", description: "Index and middle finger close to thumb twice" },
  { label: "ok",            displayText: "OK",             tier: 1, hand: "right", type: "static",  description: "Index and thumb form a circle, other fingers spread" },
  { label: "help",          displayText: "Help",           tier: 1, hand: "both",  type: "dynamic", description: "Thumbs-up lifted by flat hand" },
  { label: "want",          displayText: "Want",           tier: 1, hand: "both",  type: "dynamic", description: "Clawed hands pull toward body" },
  { label: "need",          displayText: "Need",           tier: 1, hand: "right", type: "dynamic", description: "Bent index finger bends down twice" },
  { label: "me",            displayText: "Me",             tier: 1, hand: "right", type: "static",  description: "Index finger points to self" },
  { label: "you",           displayText: "You",            tier: 1, hand: "right", type: "static",  description: "Index finger points to other person" },
  { label: "we",            displayText: "We",             tier: 1, hand: "right", type: "dynamic", description: "Index finger moves between self and other" },
  { label: "good",          displayText: "Good",           tier: 1, hand: "right", type: "static",  description: "Thumbs up" },
  { label: "bad",           displayText: "Bad",            tier: 1, hand: "right", type: "static",  description: "Thumbs down" },
  { label: "stop",          displayText: "Stop",           tier: 1, hand: "right", type: "dynamic", description: "Flat hand chops down on palm" },
  { label: "go",            displayText: "Go",             tier: 1, hand: "right", type: "dynamic", description: "Index finger points forward and moves away" },
  { label: "come",          displayText: "Come",           tier: 1, hand: "right", type: "dynamic", description: "Index finger beckons toward self" },
  { label: "like",          displayText: "Like",           tier: 1, hand: "right", type: "dynamic", description: "Middle finger and thumb pinch from chest outward" },
  { label: "love",          displayText: "Love",           tier: 1, hand: "both",  type: "dynamic", description: "Crossed arms hug chest" },
  { label: "understand",    displayText: "Understand",     tier: 1, hand: "right", type: "dynamic", description: "Index finger flicks up from temple" },
  { label: "dont-know",     displayText: "Don't know",     tier: 1, hand: "right", type: "dynamic", description: "Bent hand at forehead brushes away" },
  { label: "not",           displayText: "Not",            tier: 1, hand: "right", type: "dynamic", description: "Thumb flicks from under chin outward" },
  { label: "now",           displayText: "Now",            tier: 1, hand: "both",  type: "dynamic", description: "Both Y-hands drop down together" },
  { label: "finish",        displayText: "Finished",       tier: 1, hand: "both",  type: "dynamic", description: "Hands flip from palms-up to palms-down" },

  // ── Tier 2 — Common vocabulary ───────────────────────────────────────
  { label: "name",          displayText: "Name",           tier: 2, hand: "right", type: "dynamic", description: "Index and middle finger tap back of other hand" },
  { label: "eat",           displayText: "Eat",            tier: 2, hand: "right", type: "dynamic", description: "Bunched fingers tap lips twice" },
  { label: "drink",         displayText: "Drink",          tier: 2, hand: "right", type: "dynamic", description: "C-hand tilts toward mouth" },
  { label: "water",         displayText: "Water",          tier: 2, hand: "right", type: "dynamic", description: "W-hand taps chin twice" },
  { label: "food",          displayText: "Food",           tier: 2, hand: "right", type: "dynamic", description: "Bunched fingers move to mouth" },
  { label: "toilet",        displayText: "Toilet",         tier: 2, hand: "right", type: "dynamic", description: "T-hand shakes side to side" },
  { label: "home",          displayText: "Home",           tier: 2, hand: "right", type: "dynamic", description: "Fingertips of bunched hand tap cheek" },
  { label: "school",        displayText: "School",         tier: 2, hand: "both",  type: "dynamic", description: "Hands clap twice" },
  { label: "work",          displayText: "Work",           tier: 2, hand: "both",  type: "dynamic", description: "Fists tap together at wrists" },
  { label: "money",         displayText: "Money",          tier: 2, hand: "right", type: "dynamic", description: "Bunched hand taps upward palm" },
  { label: "phone",         displayText: "Phone",          tier: 2, hand: "right", type: "static",  description: "Y-hand held to ear" },
  { label: "car",           displayText: "Car",            tier: 2, hand: "both",  type: "dynamic", description: "Both fists mime steering a wheel" },
  { label: "sick",          displayText: "Sick",           tier: 2, hand: "right", type: "dynamic", description: "Middle finger taps forehead" },
  { label: "pain",          displayText: "Pain",           tier: 2, hand: "both",  type: "dynamic", description: "Index fingers point toward each other and twist" },
  { label: "happy",         displayText: "Happy",          tier: 2, hand: "right", type: "dynamic", description: "Flat hand circles on chest upward" },
  { label: "sad",           displayText: "Sad",            tier: 2, hand: "both",  type: "dynamic", description: "Flat hands move down face" },
  { label: "tired",         displayText: "Tired",          tier: 2, hand: "both",  type: "dynamic", description: "Bent hands drop at shoulders" },
  { label: "angry",         displayText: "Angry",          tier: 2, hand: "right", type: "dynamic", description: "Clawed hand pulls away from face" },
  { label: "scared",        displayText: "Scared",         tier: 2, hand: "both",  type: "dynamic", description: "Both hands shake at chest" },
  { label: "hot",           displayText: "Hot",            tier: 2, hand: "right", type: "dynamic", description: "Curved hand twists away from mouth" },
  { label: "cold",          displayText: "Cold",           tier: 2, hand: "both",  type: "dynamic", description: "Fists shake at sides of chest" },
  { label: "big",           displayText: "Big",            tier: 2, hand: "both",  type: "dynamic", description: "Both flat hands move apart" },
  { label: "small",         displayText: "Small",          tier: 2, hand: "both",  type: "dynamic", description: "Both flat hands move together" },
  { label: "fast",          displayText: "Fast",           tier: 2, hand: "right", type: "dynamic", description: "Index finger snaps forward quickly" },
  { label: "slow",          displayText: "Slow",           tier: 2, hand: "right", type: "dynamic", description: "Flat hand slides slowly up back of other hand" },
  { label: "beautiful",     displayText: "Beautiful",      tier: 2, hand: "right", type: "dynamic", description: "Open hand circles face then closes" },
  { label: "same",          displayText: "Same",           tier: 2, hand: "right", type: "dynamic", description: "Index finger points between two things" },
  { label: "different",     displayText: "Different",      tier: 2, hand: "both",  type: "dynamic", description: "Crossed index fingers pull apart" },
  { label: "think",         displayText: "Think",          tier: 2, hand: "right", type: "dynamic", description: "Index finger taps temple" },
  { label: "know",          displayText: "Know",           tier: 2, hand: "right", type: "dynamic", description: "Flat hand taps side of head" },
  { label: "see",           displayText: "See",            tier: 2, hand: "right", type: "dynamic", description: "V-hand points from eyes outward" },
  { label: "talk",          displayText: "Talk",           tier: 2, hand: "right", type: "dynamic", description: "Index finger taps lips twice" },
  { label: "listen",        displayText: "Listen",         tier: 2, hand: "right", type: "dynamic", description: "Cupped hand behind ear" },
  { label: "family",        displayText: "Family",         tier: 2, hand: "both",  type: "dynamic", description: "F-hands circle outward from fingertips touching" },
  { label: "mother",        displayText: "Mother",         tier: 2, hand: "right", type: "dynamic", description: "Thumb taps chin" },
  { label: "father",        displayText: "Father",         tier: 2, hand: "right", type: "dynamic", description: "Thumb taps forehead" },
  { label: "baby",          displayText: "Baby",           tier: 2, hand: "both",  type: "dynamic", description: "Arms rock as if cradling" },
  { label: "friend",        displayText: "Friend",         tier: 2, hand: "both",  type: "dynamic", description: "Hooked index fingers link together" },
  { label: "again",         displayText: "Again",          tier: 2, hand: "right", type: "dynamic", description: "Bent hand arc taps palm" },
  { label: "wait",          displayText: "Wait",           tier: 2, hand: "both",  type: "dynamic", description: "Spread hands wiggle fingers" },
  { label: "later",         displayText: "Later",          tier: 2, hand: "right", type: "dynamic", description: "L-hand rotates forward from vertical" },
  { label: "today",         displayText: "Today",          tier: 2, hand: "both",  type: "dynamic", description: "Both Y-hands arc down" },
  { label: "tomorrow",      displayText: "Tomorrow",       tier: 2, hand: "right", type: "dynamic", description: "A-hand arcs forward from cheek" },
  { label: "yesterday",     displayText: "Yesterday",      tier: 2, hand: "right", type: "dynamic", description: "A-hand arcs back to cheek" },
  { label: "morning",       displayText: "Morning",        tier: 2, hand: "right", type: "dynamic", description: "Flat hand rises from elbow to upright" },
  { label: "night",         displayText: "Night",          tier: 2, hand: "right", type: "dynamic", description: "Bent hand arcs downward over other arm" },
  { label: "time",          displayText: "Time",           tier: 2, hand: "right", type: "dynamic", description: "Index finger taps back of wrist" },

  // ── Tier 3 — Question words, numbers, phrases ────────────────────────
  { label: "what",          displayText: "What?",          tier: 3, hand: "right", type: "dynamic", description: "Palm up, fingers spread, slight shake" },
  { label: "where",         displayText: "Where?",         tier: 3, hand: "right", type: "dynamic", description: "Index finger wags side to side" },
  { label: "when",          displayText: "When?",          tier: 3, hand: "right", type: "dynamic", description: "Index finger circles then points to other index" },
  { label: "why",           displayText: "Why?",           tier: 3, hand: "right", type: "dynamic", description: "Index finger bends from temple outward" },
  { label: "who",           displayText: "Who?",           tier: 3, hand: "right", type: "dynamic", description: "Index finger circles in front of lips" },
  { label: "how",           displayText: "How?",           tier: 3, hand: "both",  type: "dynamic", description: "Knuckles together, rotate outward" },
  { label: "one",           displayText: "1",              tier: 3, hand: "right", type: "static",  description: "Index finger extended" },
  { label: "two",           displayText: "2",              tier: 3, hand: "right", type: "static",  description: "Index and middle fingers extended" },
  { label: "three",         displayText: "3",              tier: 3, hand: "right", type: "static",  description: "Index, middle, ring fingers extended" },
  { label: "four",          displayText: "4",              tier: 3, hand: "right", type: "static",  description: "Four fingers extended, thumb tucked" },
  { label: "five",          displayText: "5",              tier: 3, hand: "right", type: "static",  description: "All five fingers spread" },
  { label: "six",           displayText: "6",              tier: 3, hand: "right", type: "static",  description: "Thumb touches ring finger, others extended" },
  { label: "seven",         displayText: "7",              tier: 3, hand: "right", type: "static",  description: "Thumb touches middle finger, others extended" },
  { label: "eight",         displayText: "8",              tier: 3, hand: "right", type: "static",  description: "Thumb touches index finger tip, others extended" },
  { label: "nine",          displayText: "9",              tier: 3, hand: "right", type: "static",  description: "Index finger hooks to touch thumb" },
  { label: "ten",           displayText: "10",             tier: 3, hand: "right", type: "dynamic", description: "A-hand (fist) shakes or waggles thumb" },
  { label: "i-love-you",   displayText: "I love you",     tier: 3, hand: "right", type: "static",  description: "Thumb, index, and pinky extended (ILY sign)" },
  { label: "maybe",         displayText: "Maybe",          tier: 3, hand: "both",  type: "dynamic", description: "Flat hands alternate up and down" },
  { label: "can",           displayText: "Can",            tier: 3, hand: "both",  type: "dynamic", description: "Both fists move down simultaneously" },
  { label: "more",          displayText: "More",           tier: 3, hand: "both",  type: "dynamic", description: "Bunched hands tap fingertips together" },
  { label: "have",          displayText: "Have",           tier: 3, hand: "both",  type: "dynamic", description: "Bent hands pull back to chest" },
  { label: "give",          displayText: "Give",           tier: 3, hand: "right", type: "dynamic", description: "Flat hand moves forward and opens" },
  { label: "take",          displayText: "Take",           tier: 3, hand: "right", type: "dynamic", description: "Open hand grabs inward" },
  { label: "true",          displayText: "True",           tier: 3, hand: "right", type: "dynamic", description: "Index finger moves forward from lips" },
  { label: "wrong",         displayText: "Wrong",          tier: 3, hand: "right", type: "dynamic", description: "Y-hand taps chin" },
  { label: "agree",         displayText: "Agree",          tier: 3, hand: "both",  type: "dynamic", description: "Index fingers align parallel and nod together" },
  { label: "excuse-me",     displayText: "Excuse me",      tier: 3, hand: "right", type: "dynamic", description: "Fingertips brush forward across other palm" },
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
