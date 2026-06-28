#!/usr/bin/env python3
"""
Generate Chrome extension icons from a source image.
Creates 16x16, 48x48, and 128x128 PNG icons.
"""

import sys
import os

def generate_icons(source_path, output_dir='icons'):
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not found. Attempting to install...")
        os.system(f"{sys.executable} -m pip install Pillow")
        from PIL import Image

    os.makedirs(output_dir, exist_ok=True)

    img = Image.open(source_path).convert('RGBA')
    sizes = [16, 48, 128]

    for size in sizes:
        resized = img.resize((size, size), Image.LANCZOS)
        out_path = os.path.join(output_dir, f'icon{size}.png')
        resized.save(out_path, 'PNG')
        print(f'  ✓ {out_path} ({size}×{size})')

    print(f'\nDone! Generated {len(sizes)} icons in {output_dir}/')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python gen_icons.py <source_image.png>')
        sys.exit(1)

    generate_icons(sys.argv[1])
