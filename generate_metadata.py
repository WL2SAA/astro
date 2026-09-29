#!/usr/bin/env python3
"""
astro • Wallpaper Metadata Generator
Scans Desktop/ and Phone/ directories, extracts image dimensions and sizes,
and generates wallpapers.json and wallpapers.js for the website.
"""

import os
import json
from PIL import Image

def generate_metadata():
    wallpapers = []
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    for device in ['Desktop', 'Phone']:
        device_dir = os.path.join(base_dir, device)
        if not os.path.exists(device_dir):
            continue
        for category in sorted(os.listdir(device_dir)):
            cat_path = os.path.join(device_dir, category)
            if not os.path.isdir(cat_path):
                continue
            for fname in sorted(os.listdir(cat_path)):
                if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    full_path = os.path.join(cat_path, fname)
                    rel_path = f"{device}/{category}/{fname}"
                    size_bytes = os.path.getsize(full_path)
                    try:
                        with Image.open(full_path) as img:
                            w, h = img.size
                    except Exception as e:
                        print(f"Warning reading {rel_path}: {e}")
                        w, h = 0, 0
                    
                    base_name = os.path.splitext(fname)[0]
                    title = ' '.join(word.capitalize() for word in base_name.replace('-', ' ').replace('_', ' ').split())
                    cat_display = category.replace('-', ' ')
                    
                    wallpapers.append({
                        'id': f"{device}-{category}-{base_name}",
                        'title': title,
                        'file': rel_path,
                        'filename': fname,
                        'device': device,
                        'category': category,
                        'categoryDisplay': cat_display,
                        'width': w,
                        'height': h,
                        'resolution': f"{w}x{h}",
                        'aspectRatio': round(w / h, 2) if h > 0 else 1.0,
                        'sizeFormatted': f"{size_bytes / 1024:.1f} KB" if size_bytes < 1024*1024 else f"{size_bytes / (1024*1024):.2f} MB"
                    })

    # Save wallpapers.json
    json_path = os.path.join(base_dir, 'wallpapers.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(wallpapers, f, indent=2)
        
    # Save wallpapers.js
    js_path = os.path.join(base_dir, 'wallpapers.js')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(f"// Auto-generated wallpaper data\nwindow.WALLPAPERS_DATA = {json.dumps(wallpapers, indent=2)};\n")
        
    desktop_count = len([w for w in wallpapers if w['device'] == 'Desktop'])
    phone_count = len([w for w in wallpapers if w['device'] == 'Phone'])
    print(f"Successfully indexed {len(wallpapers)} wallpapers:")
    print(f"  - Desktop: {desktop_count}")
    print(f"  - Phone:   {phone_count}")
    print(f"Updated {json_path} and {js_path}")

if __name__ == '__main__':
    generate_metadata()
