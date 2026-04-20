"""
Generate placeholder TF.js models using only numpy + json.

No tensorflowjs installation required. Produces valid TF.js LayerModel files
(model.json + group1-shard1of1.bin) with the correct architecture and random
weights. All outputs will stay below the 0.75 confidence threshold so the app
pipeline runs end-to-end without showing incorrect subtitles.

Usage:
    python generate_placeholder_models.py

Output:
    ../../apps/web/public/models/sign-classifier/  (model.json + weights.bin)
    ../../apps/web/public/models/rest-pose/        (model.json + weights.bin)
"""

import json
from pathlib import Path

import numpy as np

WEB_ROOT = Path(__file__).parent.parent.parent / "apps" / "web" / "public" / "models"
NUM_SIGNS = 50
WINDOW_FRAMES = 30
FEATURES_PER_FRAME = 126  # 63 coords × 2 hands
FLATTENED = WINDOW_FRAMES * FEATURES_PER_FRAME  # 3780


def write_model(
    out_dir: Path,
    topology: dict,
    weights: list[tuple[str, tuple[int, ...], str]],
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    arrays: list[np.ndarray] = []
    weight_entries: list[dict] = []

    for name, shape, dtype in weights:
        # Near-zero random weights keep softmax output uniform (~0.02 per class),
        # well below the 0.75 confidence threshold.
        arr = (np.random.randn(*shape) * 0.01).astype(np.float32)
        arrays.append(arr)
        weight_entries.append({"name": name, "shape": list(shape), "dtype": dtype})

    # Write binary weight shard
    with open(out_dir / "group1-shard1of1.bin", "wb") as f:
        for arr in arrays:
            f.write(arr.tobytes())

    # Write model.json
    model_json = {
        **topology,
        "weightsManifest": [
            {
                "paths": ["group1-shard1of1.bin"],
                "weights": weight_entries,
            }
        ],
    }
    with open(out_dir / "model.json", "w") as f:
        json.dump(model_json, f, separators=(",", ":"))

    total_kb = sum(a.nbytes for a in arrays) / 1024
    print(f"  {out_dir.name}: model.json + {total_kb:.0f} KB weights")


def _base_topology(name: str, layers: list[dict]) -> dict:
    return {
        "format": "layers-model",
        "generatedBy": "keras v2.14.0",
        "convertedBy": "TensorFlow.js Converter v4.20.0",
        "modelTopology": {
            "class_name": "Sequential",
            "config": {
                "name": name,
                "trainable": True,
                "dtype": "float32",
                "layers": layers,
            },
            "keras_version": "2.14.0",
            "backend": "tensorflow",
        },
    }


def _dense(name: str, units: int, activation: str, extra: dict | None = None) -> dict:
    cfg: dict = {
        "name": name,
        "trainable": True,
        "dtype": "float32",
        "units": units,
        "activation": activation,
        "use_bias": True,
        "kernel_initializer": {"class_name": "GlorotUniform", "config": {"seed": None}},
        "bias_initializer": {"class_name": "Zeros", "config": {}},
        "kernel_regularizer": None,
        "bias_regularizer": None,
        "activity_regularizer": None,
        "kernel_constraint": None,
        "bias_constraint": None,
    }
    if extra:
        cfg.update(extra)
    return {"class_name": "Dense", "config": cfg}


def sign_classifier_topology() -> dict:
    """Flatten([30,126]→3780) + Dense(50, softmax)  input:[None,30,126]"""
    return _base_topology(
        "sign_classifier",
        [
            {
                "class_name": "Flatten",
                "config": {
                    "name": "flatten",
                    "trainable": True,
                    "dtype": "float32",
                    "data_format": "channels_last",
                    "batch_input_shape": [None, WINDOW_FRAMES, FEATURES_PER_FRAME],
                },
            },
            _dense("dense", NUM_SIGNS, "softmax"),
        ],
    )


def rest_pose_topology() -> dict:
    """Dense(1, sigmoid)  input:[None,126]"""
    return _base_topology(
        "rest_pose_detector",
        [
            _dense(
                "dense",
                1,
                "sigmoid",
                extra={"batch_input_shape": [None, FEATURES_PER_FRAME]},
            )
        ],
    )


def main() -> None:
    print("Generating placeholder TF.js models (numpy only — no tensorflowjs needed)…\n")

    # Sign classifier: [1, 30, 126] → flatten → [1, 3780] → dense → [1, 50]
    write_model(
        WEB_ROOT / "sign-classifier",
        sign_classifier_topology(),
        [
            ("dense/kernel", (FLATTENED, NUM_SIGNS), "float32"),
            ("dense/bias", (NUM_SIGNS,), "float32"),
        ],
    )

    # Rest-pose detector: [1, 126] → dense → [1, 1]
    write_model(
        WEB_ROOT / "rest-pose",
        rest_pose_topology(),
        [
            ("dense/kernel", (FEATURES_PER_FRAME, 1), "float32"),
            ("dense/bias", (1,), "float32"),
        ],
    )

    print("\nDone. Files written to apps/web/public/models/")
    print("The full pipeline runs end-to-end but recognition output stays below")
    print("the 0.75 confidence threshold — no subtitles appear until real models")
    print("are trained and placed here.")


if __name__ == "__main__":
    main()
