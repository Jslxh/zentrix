import safety_utils
import os

MODEL_PATH = "model/yolo26_safety_model.pt"
VIDEO_PATH = "videos/zentrix_0.mp4"
OUTPUT_PATH = "static/processed/test_zentrix_0.mp4"

print("Loading model...")
model = safety_utils.load_yolo_model(MODEL_PATH)

print("Starting video processing...")
def progress_callback(frame_idx, total_frames, elapsed):
    if frame_idx % 10 == 0 or frame_idx == total_frames:
        print(f"Frame {frame_idx}/{total_frames} processed. Elapsed time: {elapsed:.1f}s")

result = safety_utils.detect_video(model, VIDEO_PATH, OUTPUT_PATH, progress_callback=progress_callback)

if "error" in result:
    print(f"❌ Error occurred: {result['error']}")
else:
    print("✅ Video processed successfully!")
    print(f"Output saved to: {OUTPUT_PATH}")
    print("Results:")
    for k, v in result.items():
        if k != "summary":
            print(f"  {k}: {v}")
        else:
            print("  summary:")
            for sk, sv in v.items():
                print(f"    {sk}: {sv}")
