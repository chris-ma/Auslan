"""
Convert a trained Keras model to TensorFlow.js format for in-browser inference.

Usage:
    python export_tfjs.py --model data/models/sign_classifier_best.keras \
                          --out ../../apps/web/public/models/sign-classifier
"""

import argparse
import shutil
from pathlib import Path

import tensorflowjs as tfjs
import tensorflow as tf


def main(args: argparse.Namespace) -> None:
    model_path = Path(args.model)
    out_path = Path(args.out)
    out_path.mkdir(parents=True, exist_ok=True)

    print(f"Loading model from {model_path}…")
    model = tf.keras.models.load_model(model_path)
    model.summary()

    print(f"Converting to TF.js format at {out_path}…")
    tfjs.converters.save_keras_model(
        model,
        str(out_path),
        quantization_dtype_map={"float16": ".*"} if args.quantize else None,
    )

    # Copy the label index alongside the model
    label_index_src = model_path.parent / "label_index.json"
    if label_index_src.exists():
        shutil.copy(label_index_src, out_path / "label_index.json")

    # Report size
    total_bytes = sum(f.stat().st_size for f in out_path.rglob("*") if f.is_file())
    print(f"Done. Model size: {total_bytes / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export Keras model to TF.js")
    parser.add_argument(
        "--model",
        default="data/models/sign_classifier_best.keras",
        help="Path to Keras model",
    )
    parser.add_argument(
        "--out",
        default="../../apps/web/public/models/sign-classifier",
        help="Output directory for TF.js model",
    )
    parser.add_argument(
        "--quantize",
        action="store_true",
        help="Apply float16 quantization to reduce model size",
    )
    main(parser.parse_args())
