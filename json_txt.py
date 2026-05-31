import os
import json
import cv2
from tqdm import tqdm

# Define classes in alphabetical order
CLASSES = [
    'conveyor',
    'forklift',
    'hazard_zone',
    'helmet',
    'machine_hazard',
    'mask',
    'overhead_hazard',
    'safety_vest',
    'shield',
    'welding_hazard',
    'worker'
]

class_to_idx = {cls: i for i, cls in enumerate(CLASSES)}

def convert_labelme_to_yolo(json_path, output_dir):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    img_height = data.get('imageHeight')
    img_width = data.get('imageWidth')
    image_path_in_json = data.get('imagePath')
    
    # If dimensions are missing from JSON, try to load from the image file
    if not img_height or not img_width:
        # Resolve image path relative to the json file's directory
        json_dir = os.path.dirname(json_path)
        img_full_path = os.path.join(json_dir, image_path_in_json)
        if os.path.exists(img_full_path):
            img = cv2.imread(img_full_path)
            if img is not None:
                img_height, img_width = img.shape[:2]
            else:
                raise ValueError(f"Could not load image to retrieve dimensions: {img_full_path}")
        else:
            raise ValueError(f"Image dimensions missing in JSON and image file not found: {img_full_path}")

    yolo_lines = []
    class_counts = {cls: 0 for cls in CLASSES}
    
    for shape in data.get('shapes', []):
        label = shape.get('label')
        if label not in class_to_idx:
            print(f"Warning: class '{label}' in {os.path.basename(json_path)} is not in the predefined class list.")
            continue
            
        class_idx = class_to_idx[label]
        points = shape.get('points', [])
        
        if not points or len(points) < 2:
            continue
            
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        
        xmin = min(xs)
        xmax = max(xs)
        ymin = min(ys)
        ymax = max(ys)
        
        # Clip coordinates to image boundaries
        xmin_clipped = max(0.0, min(xmin, img_width))
        xmax_clipped = max(0.0, min(xmax, img_width))
        ymin_clipped = max(0.0, min(ymin, img_height))
        ymax_clipped = max(0.0, min(ymax, img_height))
        
        # Calculate width and height of the bounding box
        w = xmax_clipped - xmin_clipped
        h = ymax_clipped - ymin_clipped
        
        # Calculate center coordinates
        x_center = xmin_clipped + (w / 2.0)
        y_center = ymin_clipped + (h / 2.0)
        
        # Normalize coordinates
        x_center_norm = x_center / img_width
        y_center_norm = y_center / img_height
        w_norm = w / img_width
        h_norm = h / img_height
        
        # Append line in YOLO format
        yolo_lines.append(f"{class_idx} {x_center_norm:.6f} {y_center_norm:.6f} {w_norm:.6f} {h_norm:.6f}")
        class_counts[label] += 1
        
    # Write to TXT file
    base_name = os.path.splitext(os.path.basename(json_path))[0]
    txt_filename = f"{base_name}.txt"
    txt_path = os.path.join(output_dir, txt_filename)
    
    with open(txt_path, 'w', encoding='utf-8') as out_f:
        out_f.write('\n'.join(yolo_lines) + '\n')
        
    return class_counts

def main():
    extracted_frames_dir = r"D:\zentrix\extracted_frames"
    
    if not os.path.exists(extracted_frames_dir):
        print(f"Error: Target directory {extracted_frames_dir} does not exist.")
        return
        
    json_files = [f for f in os.listdir(extracted_frames_dir) if f.endswith('.json')]
    print(f"Found {len(json_files)} JSON files in {extracted_frames_dir}")
    
    total_class_counts = {cls: 0 for cls in CLASSES}
    success_count = 0
    error_count = 0
    
    for json_file in json_files:
        json_path = os.path.join(extracted_frames_dir, json_file)
        try:
            counts = convert_labelme_to_yolo(json_path, extracted_frames_dir)
            for cls, count in counts.items():
                total_class_counts[cls] += count
            success_count += 1
        except Exception as e:
            print(f"Error converting {json_file}: {e}")
            error_count += 1
            
    # Write classes.txt
    classes_txt_path = os.path.join(extracted_frames_dir, 'classes.txt')
    with open(classes_txt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(CLASSES) + '\n')
        
    # Write a copy to root
    root_classes_txt_path = os.path.join(os.path.dirname(extracted_frames_dir), 'classes.txt')
    with open(root_classes_txt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(CLASSES) + '\n')
        
    print("\n" + "="*40)
    print("CONVERSION SUMMARY")
    print("="*40)
    print(f"Successfully converted: {success_count} files")
    print(f"Failed conversions:     {error_count} files")
    print("\nClass Instance Counts:")
    for cls in CLASSES:
        print(f"  - {cls}: {total_class_counts[cls]} instances")
    print(f"Saved class mapping to: {classes_txt_path}")
    print("="*40 + "\n")

if __name__ == '__main__':
    main()
