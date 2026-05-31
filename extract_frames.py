import cv2
import os

# VIDEO FOLDER
video_folder = r"D:\zentrix\videos"

# OUTPUT FOLDER
output_folder = r"D:\zentrix\extracted_frames"

# Create output folder if not exists
os.makedirs(output_folder, exist_ok=True)

video_files = [
    f for f in os.listdir(video_folder)
    if f.endswith((".mp4", ".mkv", ".avi"))
]

print("===================================")
print("VIDEOS FOUND :", len(video_files))
print("===================================")

# TOTAL REQUIRED FRAMES
TOTAL_REQUIRED_FRAMES = 700

# SAVE EVERY Nth FRAME
frame_interval = 25

# Resize dimensions
resize_width = 1280
resize_height = 720

# Global saved frame counter
saved_count = 0

for video_name in video_files:

    # Full video path
    video_path = os.path.join(
        video_folder,
        video_name
    )

    print(f"\nPROCESSING : {video_name}")

    # Open video
    cap = cv2.VideoCapture(video_path)

    # Check video opened
    if not cap.isOpened():
        print(f"ERROR opening video : {video_name}")
        continue

    frame_count = 0

    while True:

        success, frame = cap.read()

        # Stop if video ends
        if not success:
            break

        frame_count += 1

        if frame_count % frame_interval == 0:

            # Resize image
            frame = cv2.resize(
                frame,
                (resize_width, resize_height)
            )

            # Remove video extension
            video_base_name = os.path.splitext(
                video_name
            )[0]

            # Frame name
            frame_name = (
                f"{video_base_name}_frame_{saved_count}.jpg"
            )

            # Full frame path
            frame_path = os.path.join(
                output_folder,
                frame_name
            )

            # Save image
            cv2.imwrite(frame_path, frame)

            saved_count += 1

            print(
                f"Saved Frames : {saved_count}",
                end="\r"
            )

            # STOP after 700 frames
            if saved_count >= TOTAL_REQUIRED_FRAMES:
                break

    # Release video
    cap.release()

    print(f"\nDONE : {video_name}")

    # STOP outer loop also
    if saved_count >= TOTAL_REQUIRED_FRAMES:
        break

print("\n===================================")
print("FRAME EXTRACTION COMPLETED")
print("TOTAL FRAMES SAVED :", saved_count)
print("FRAMES STORED IN :", output_folder)
print("===================================")