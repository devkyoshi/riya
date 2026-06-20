import cv2
import numpy as np
from PIL import Image


def preprocess_image(img: np.ndarray) -> np.ndarray:
    """Apply grayscale, denoise, adaptive threshold, and deskew."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    deskewed = _deskew(denoised)
    # Adaptive threshold improves OCR on uneven lighting from phone photos
    thresh = cv2.adaptiveThreshold(
        deskewed, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )
    return thresh


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Rotate image to correct skew using Hough line transform."""
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
    if lines is None:
        return gray

    angles = []
    for line in lines[:20]:
        rho, theta = line[0]
        angle = (theta - np.pi / 2) * 180 / np.pi
        if abs(angle) < 30:  # ignore near-vertical lines
            angles.append(angle)

    if not angles:
        return gray

    median_angle = float(np.median(angles))
    if abs(median_angle) < 0.5:  # skip trivial rotations
        return gray

    h, w = gray.shape
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def pil_to_cv2(pil_img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)


def cv2_to_pil(cv2_img: np.ndarray) -> Image.Image:
    if len(cv2_img.shape) == 2:
        return Image.fromarray(cv2_img)
    return Image.fromarray(cv2.cvtColor(cv2_img, cv2.COLOR_BGR2RGB))
