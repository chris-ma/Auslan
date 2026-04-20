"""
Generate placeholder TF.js models so the web app can load without crashing.

These models have the correct architecture and I/O shapes but random weights.
Recognition output will be below the confidence threshold, so no subtitles appear —
the app pipeline runs correctly end-to-end and is ready for real model weights.

Usage:
    python generate_placeholder_models.py

Output:
    ../../apps/web/public/models/sign-classifier/  (model.json + weights.bin)
    ../../apps/web/public/models/rest-pose/        (model.json + weights.bin)
"""

from pathlib import Path

import numpy as np

# Try to import TF and tensorflowjs; print instructions if missing
try:
    import tensorflow as tf
    import tensorflowjs as tfjs
except ImportError:
    print("Install dependencies first:")
    print("  pip install -r requirements.txt")
    raise

WINDOW_FRAMES = 30
FEATURES_PER_FRAME = 126  # 63 coords × 2 hands
NUM_SIGNS = 50  # must match len(SIGN_LABELS) in @auslan/vocab

WEB_ROOT = Path(__file__).parent.parent.parent / "apps" / "web" / "public" / "models"
SIGN_CLASSIFIER_OUT = WEB_ROOT / "sign-classifier"
REST_POSE_OUT = WEB_ROOT / "rest-pose"


def build_sign_classifier() -> tf.keras.Model:
    """1D-CNN over 30-frame landmark windows → 50-class softmax."""
    inputs = tf.keras.Input(shape=(WINDOW_FRAMES, FEATURES_PER_FRAME), name="landmarks")
    x = tf.keras.layers.Conv1D(64, 3, activation="relu", padding="same")(inputs)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv1D(128, 3, activation="relu", padding="same")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv1D(128, 3, activation="relu", padding="same")(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(NUM_SIGNS, activation="softmax", name="sign_probs")(x)
    return tf.keras.Model(inputs, outputs, name="sign_classifier")


def build_rest_pose_detector() -> tf.keras.Model:
    """Single-frame binary classifier: is the user actively signing?"""
    inputs = tf.keras.Input(shape=(FEATURES_PER_FRAME,), name="landmarks_frame")
    x = tf.keras.layers.Dense(128, activation="relu")(inputs)
    x = tf.keras.layers.Dropout(0.3)(x)
    x = tf.keras.layers.Dense(64, activation="relu")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="is_signing")(x)
    return tf.keras.Model(inputs, outputs, name="rest_pose_detector")


def export(model: tf.keras.Model, out_dir: Path, quantize: bool = False) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"Exporting {model.name} → {out_dir}")

    tfjs.converters.save_keras_model(
        model,
        str(out_dir),
        quantization_dtype_map={"float16": ".*"} if quantize else None,
    )

    # Smoke-test: verify the exported model loads and runs
    loaded = tfjs.converters.load_keras_model(str(out_dir / "model.json"))
    dummy = np.random.rand(1, *model.input_shape[1:]).astype(np.float32)
    out = loaded.predict(dummy, verbose=0)
    print(f"  Smoke test OK — output shape: {out.shape}")

    total_bytes = sum(f.stat().st_size for f in out_dir.rglob("*") if f.is_file())
    print(f"  Size: {total_bytes / 1024:.1f} KB")


def main() -> None:
    print("Building sign classifier…")
    sign_clf = build_sign_classifier()
    sign_clf.summary(line_length=80)
    export(sign_clf, SIGN_CLASSIFIER_OUT)

    print("\nBuilding rest-pose detector…")
    rest_pose = build_rest_pose_detector()
    rest_pose.summary(line_length=80)
    export(rest_pose, REST_POSE_OUT)

    print("\nDone. Placeholder models are in apps/web/public/models/")
    print("The app will load but recognition output will stay below the confidence")
    print("threshold — replace weights with a trained model to enable real subtitles.")


if __name__ == "__main__":
    main()
