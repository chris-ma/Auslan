"""
Data augmentation for landmark sequences.
All augmentations operate on numpy arrays of shape (N, 30, 126).
"""

import numpy as np


def temporal_resample(
    sequences: np.ndarray, min_speed: float = 0.8, max_speed: float = 1.2
) -> np.ndarray:
    """Randomly stretch or compress the time axis of each sequence."""
    N, T, F = sequences.shape
    out = np.zeros_like(sequences)
    for i in range(N):
        factor = np.random.uniform(min_speed, max_speed)
        new_len = int(T * factor)
        src_indices = np.linspace(0, T - 1, new_len)
        # Interpolate and crop/pad to T frames
        resampled = np.array(
            [np.interp(np.arange(T), np.linspace(0, T - 1, new_len), sequences[i, :, j])
             for j in range(F)]
        ).T  # (T, F)
        out[i] = resampled
    return out


def landmark_jitter(sequences: np.ndarray, sigma: float = 0.01) -> np.ndarray:
    """Add small Gaussian noise to each landmark coordinate."""
    noise = np.random.normal(0, sigma, sequences.shape).astype(np.float32)
    return sequences + noise


def mirror_dominant_hand(sequences: np.ndarray) -> np.ndarray:
    """
    Swap dominant/non-dominant hand channels and negate the x-axis.
    Useful for signs that are symmetric or for right/left-handed variation.
    Shape: (N, 30, 126) where [0:63] = right, [63:126] = left.
    """
    out = sequences.copy()
    # Swap hand channels
    out[:, :, :63] = sequences[:, :, 63:]
    out[:, :, 63:] = sequences[:, :, :63]
    # Negate x-coordinates (every 3rd feature starting at 0)
    out[:, :, 0::3] *= -1
    return out


def scale_variation(
    sequences: np.ndarray, min_scale: float = 0.9, max_scale: float = 1.1
) -> np.ndarray:
    """Randomly scale the overall hand size."""
    scales = np.random.uniform(min_scale, max_scale, (sequences.shape[0], 1, 1))
    return sequences * scales.astype(np.float32)


def augment(sequences: np.ndarray, factor: int = 3) -> np.ndarray:
    """Apply all augmentations to create `factor` additional copies per sample."""
    copies = [sequences]
    for _ in range(factor):
        aug = sequences.copy()
        aug = temporal_resample(aug)
        aug = landmark_jitter(aug)
        aug = scale_variation(aug)
        copies.append(aug)

    # Include a mirror version
    copies.append(mirror_dominant_hand(sequences))
    return np.concatenate(copies, axis=0)
