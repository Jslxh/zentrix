import os
import random
import shutil

SOURCE_DIR = r"D:\zentrix\extracted_frames"
DATASET_DIR = r"D:\zentrix\dataset"

random.seed(42)

# Create folders
for split in ["train", "val", "test"]:
    os.makedirs(os.path.join(DATASET_DIR, "images", split), exist_ok=True)
    os.makedirs(os.path.join(DATASET_DIR, "labels", split), exist_ok=True)

# Get image files
images = [
    f for f in os.listdir(SOURCE_DIR)
    if f.endswith((".jpg", ".jpeg", ".png"))
]

random.shuffle(images)

total = len(images)

train_end = int(0.7 * total)
val_end = int(0.9 * total)

train_files = images[:train_end]
val_files = images[train_end:val_end]
test_files = images[val_end:]

splits = {
    "train": train_files,
    "val": val_files,
    "test": test_files
}

print(f"Total images found: {total}")
print(f"Splits distribution - Train: {len(train_files)}, Val: {len(val_files)}, Test: {len(test_files)}")

for split_name, files in splits.items():
    print(f"Processing {split_name} split...")
    for image_file in files:
        base = os.path.splitext(image_file)[0]
        txt_file = base + ".txt"

        # copy image
        shutil.copy2(
            os.path.join(SOURCE_DIR, image_file),
            os.path.join(DATASET_DIR, "images", split_name, image_file)
        )

        # copy label
        label_src = os.path.join(SOURCE_DIR, txt_file)
        if os.path.exists(label_src):
            shutil.copy2(
                label_src,
                os.path.join(DATASET_DIR, "labels", split_name, txt_file)
            )

print("Dataset Split Completed Successfully!")
