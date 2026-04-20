# Auslan Live — Codebase Guide

Real-time Australian Sign Language recognition with in-browser subtitles. All ML inference runs client-side — no video leaves the device.

## Monorepo layout

```
apps/web/          Next.js 14 web app (Phase 1 + 2 UI)
apps/signaling/    Node.js + Socket.IO signaling server (Phase 2 only)
packages/auslan-vocab/  Shared sign label/metadata package
training/          Python: landmark extraction → model training → TF.js export
```

## Quick start

```bash
# Install (requires pnpm 9+)
pnpm install

# Run web app only (Phase 1 practice page)
pnpm --filter @auslan/web dev
# Open http://localhost:3000/practice

# Run signaling server (needed for Phase 2 /call page)
pnpm --filter @auslan/signaling dev
```

## Models

The app needs two TF.js models in `apps/web/public/models/`:

| Directory | What it does | Input shape | Output |
|-----------|-------------|-------------|--------|
| `sign-classifier/` | Maps 30-frame landmark window → Auslan sign | `[1, 30, 126]` | softmax over 50 classes |
| `rest-pose/` | Detects whether user is actively signing | `[1, 126]` | sigmoid (0 = rest, 1 = signing) |

**To generate placeholder models** (correct architecture, random weights — app runs but no subtitles):
```bash
cd training
pip install -r requirements.txt
python src/generate_placeholder_models.py
```

**To train real models** (requires labelled Auslan video data):
```bash
cd training
# 1. Place videos at data/raw/<sign_label>/video_001.mp4
#    Download hand_landmarker.task to data/hand_landmarker.task
python src/extract_landmarks.py          # → data/landmarks/<label>.npy
python src/train_classifier.py           # → data/models/sign_classifier_best.keras
python src/export_tfjs.py --quantize     # → apps/web/public/models/sign-classifier/
# Repeat export_tfjs.py for the rest-pose model
```

## Key files

| File | Purpose |
|------|---------|
| `apps/web/lib/recognition/recognitionPipeline.ts` | Orchestrates the full pipeline: feature vector → buffer → rest gate → classifier |
| `apps/web/lib/recognition/normalizer.ts` | Wrist-origin, scale-invariant landmark normalisation |
| `apps/web/lib/recognition/frameBuffer.ts` | 30-frame circular buffer |
| `apps/web/lib/mediapipe/handLandmarker.ts` | MediaPipe HandLandmarker singleton |
| `apps/web/lib/workers/landmarkerWorker.ts` | Web Worker version (OffscreenCanvas) for off-main-thread inference |
| `apps/web/store/recognitionStore.ts` | Zustand store for subtitles, settings (uses `subscribeWithSelector`) |
| `apps/web/store/callStore.ts` | Zustand store for WebRTC call state |
| `apps/web/hooks/useRecognition.ts` | Starts/stops the RAF-based recognition loop |
| `apps/web/hooks/useCall.ts` | Creates/joins WebRTC peer connections |
| `apps/signaling/src/server.ts` | Socket.IO server entry point |
| `packages/auslan-vocab/src/signs.ts` | All 50 signs with tier, hand, type, description |

## Vocabulary

50 Auslan signs across 3 tiers. Order in `SIGN_LABELS` array must match the classifier's output class indices. Adding or removing signs requires retraining the model.

## Architecture (Phase 1)

```
getUserMedia → <video> (main thread)
  ↓
MediaPipe HandLandmarker.detectForVideo() — runs at 24fps in rAF loop
  ↓
normalizer.ts → 126-dim feature vector (wrist-origin, scale-invariant)
  ↓
FrameBuffer — accumulates 30 frames
  ↓
restPoseDetector.ts — gates below (isSigning?)
  ↓
signClassifier.ts — TF.js 1D-CNN, threshold 0.75
  ↓
recognitionStore.subtitles → SubtitleBar component
```

## Phase 2 additions

- `/call/[roomId]` page manages WebRTC peer connection
- Recognized signs are sent as JSON over `RTCDataChannel` (not video)
- `apps/signaling/` relays SDP offer/answer and ICE candidates only
- TURN server credentials go in `apps/web/.env.local`

## Running tests

```bash
pnpm --filter @auslan/web test
```

Tests cover `normalizer.ts` and `frameBuffer.ts` in `lib/recognition/*.test.ts`.

## Browser requirements

- Requires HTTPS (or localhost) for `getUserMedia`
- Requires `SharedArrayBuffer` support (COOP/COEP headers — set in `next.config.ts`)
- MediaPipe WASM requires WebAssembly + at least one thread
- WebRTC data channels required for Phase 2

## Environment variables

See `apps/web/.env.example` and `apps/signaling/.env.example`.
