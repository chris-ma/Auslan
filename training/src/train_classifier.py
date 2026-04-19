"""
Train the Auslan sign classifier.

Reads pre-extracted landmark windows from data/landmarks/,
applies augmentation, trains a 1D-CNN, and saves the model.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

from augmentation import augment

LANDMARKS_DIR = Path(__file__).parent.parent / "data" / "landmarks"
MODELS_DIR = Path(__file__).parent.parent / "data" / "models"
WINDOW_FRAMES = 30
FEATURES_PER_FRAME = 126


def load_dataset(
    augment_factor: int = 3,
) -> tuple[np.ndarray, np.ndarray, dict[str, int]]:
    with open(LANDMARKS_DIR / "label_index.json") as f:
        label_index: dict[str, int] = json.load(f)

    num_classes = len(label_index)
    X_parts, y_parts = [], []

    for label, idx in label_index.items():
        path = LANDMARKS_DIR / f"{label}.npy"
        if not path.exists():
            print(f"  WARNING: {path} not found, skipping")
            continue
        seqs = np.load(path)  # (N, 30, 126)
        if augment_factor > 0:
            seqs = augment(seqs, factor=augment_factor)
        labels = np.full(len(seqs), idx, dtype=np.int32)
        X_parts.append(seqs)
        y_parts.append(labels)

    X = np.concatenate(X_parts).astype(np.float32)
    y = np.concatenate(y_parts)
    y_onehot = tf.keras.utils.to_categorical(y, num_classes=num_classes)

    return X, y_onehot, label_index


def build_model(num_classes: int) -> tf.keras.Model:
    inputs = tf.keras.Input(shape=(WINDOW_FRAMES, FEATURES_PER_FRAME))

    x = tf.keras.layers.Conv1D(64, 3, activation="relu", padding="same")(inputs)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv1D(128, 3, activation="relu", padding="same")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv1D(128, 3, activation="relu", padding="same")(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    return tf.keras.Model(inputs, outputs)


def main(args: argparse.Namespace) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading dataset…")
    X, y, label_index = load_dataset(augment_factor=args.augment_factor)
    num_classes = len(label_index)
    print(f"Dataset: {X.shape[0]} samples, {num_classes} classes")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y.argmax(axis=1)
    )

    model = build_model(num_classes)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(patience=5, factor=0.5),
        tf.keras.callbacks.ModelCheckpoint(
            str(MODELS_DIR / "sign_classifier_best.keras"),
            save_best_only=True,
        ),
    ]

    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
    )

    # Save final Keras model
    model.save(MODELS_DIR / "sign_classifier_final.keras")
    print(f"Model saved to {MODELS_DIR}")

    # Save label index alongside model for reference
    with open(MODELS_DIR / "label_index.json", "w") as f:
        json.dump(label_index, f, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Auslan sign classifier")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--augment-factor", type=int, default=3)
    main(parser.parse_args())
