import cv2
import sys
import base64
import json
from io import BytesIO
from PIL import Image
import numpy as np


def extract_key_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if frame_count == 0:
        cap.release()
        return []
    # Calculate frame indices for 10%, 50%, 90%
    indices = [
        max(0, int(frame_count * 0.10)),
        max(0, int(frame_count * 0.50)),
        max(0, int(frame_count * 0.90))
    ]
    selected_frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        success, frame = cap.read()
        if not success:
            continue
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb_frame)
        buffered = BytesIO()
        pil_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        selected_frames.append(img_str)
    cap.release()
    return selected_frames


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video path provided"}))
        sys.exit(1)
    video_path = sys.argv[1]
    frames = extract_key_frames(video_path)
    print(json.dumps(frames))

if __name__ == "__main__":
    main() 