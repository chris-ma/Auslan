"""
Batch-extract MediaPipe hand landmarks from labelled video files.

Directory layout expected:
    data/raw/<sign_label>/video_001.mp4
    data/raw/<sign_label>/video_002.mp4
    ...

Output:
    data/landmarks/<sign_label>.npy  — shape (N, 30, 126)
    N = number of samples, 30 = frames per window, 126 = 63 coords × 2 hands
"""

import argparse
import json
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from tqdm import tqdm

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = Path(__file__).parent.parent / "data" / "hand_landmarker.task"
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
OUT_DIR = Path(__file__).parent.parent / "data" / "landmarks"
WINDOW_FRAMES = 30
FEATURES_PER_FRAME = 126  # 63 × 2 hands


def normalize_landmarks(landmarks) -> np.ndarray:
    """Translate to wrist origin and scale by wrist-to-MCP9 distance."""
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])  # (21, 3)
    wrist = pts[0]
    mcp9 = pts[9]
    scale = np.linalg.norm(mcp9 - wrist)
    if scale < 1e-6:
        scale = 1.0
    return ((pts - wrist) / scale).flatten()  # (63,)


def extract_video(video_path: Path, landmarker: HandLandmarker) -> list[np.ndarray]:
    """Extract a list of 30-frame windows from a single video file."""
    cap = cv2.VideoCapture(str(video_path))
    frames: list[np.ndarray] = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        ts_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        result = landmarker.detect_for_video(mp_image, ts_ms)

        feature = np.zeros(FEATURES_PER_FRAME, dtype=np.float32)
        for hand_idx, hand_landmarks in enumerate(result.hand_landmarks[:2]):
            normed = normalize_landmarks(hand_landmarks)
            handedness = result.handedness[hand_idx][0].category_name
            offset = 0 if handedness == "Right" else 63
            feature[offset : offset + 63] = normed

        frames.append(feature)

    cap.release()

    if len(frames) < WINDOW_FRAMES:
        return []

    # Stride-1 sliding windows — augments small datasets
    windows = []
    for i in range(len(frames) - WINDOW_FRAMES + 1):
        windows.append(np.stack(frames[i : i + WINDOW_FRAMES]))  # (30, 126)
    return windows


def main(args: argparse.Namespace) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODEL_PATH)),
        running_mode=VisionRunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    sign_dirs = sorted(RAW_DIR.iterdir()) if not args.sign else [RAW_DIR / args.sign]
    label_index: dict[str, int] = {}
    idx = 0

    with HandLandmarker.create_from_options(options) as landmarker:
        for sign_dir in tqdm(sign_dirs, desc="Signs"):
            if not sign_dir.is_dir():
                continue

            label = sign_dir.name
            if label not in label_index:
                label_index[label] = idx
                idx += 1

            video_files = list(sign_dir.glob("*.mp4")) + list(sign_dir.glob("*.mov"))
            all_windows: list[np.ndarray] = []

            for vf in tqdm(video_files, desc=f"  {label}", leave=False):
                windows = extract_video(vf, landmarker)
                all_windows.extend(windows)

            if all_windows:
                arr = np.stack(all_windows).astype(np.float32)  # (N, 30, 126)
                np.save(OUT_DIR / f"{label}.npy", arr)
                print(f"  {label}: {arr.shape[0]} windows saved")

    # Save label index
    with open(OUT_DIR / "label_index.json", "w") as f:
        json.dump(label_index, f, indent=2)
    print(f"\nLabel index saved: {len(label_index)} signs")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract landmarks from Auslan videos")
    parser.add_argument("--sign", type=str, default=None, help="Process a single sign label")
    main(parser.parse_args())
