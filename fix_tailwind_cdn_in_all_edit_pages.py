#!/usr/bin/env python3
"""
Script to replace Tailwind CDN with local CSS in all edit pages to fix production warning.
"""

import os
import re

def fix_tailwind_cdn_in_file(filepath):
    """Replace Tailwind CDN with local CSS in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the CDN script tag with local CSS link
        old_cdn = '<script src="https://cdn.tailwindcss.com"></script>'
        new_css = '<link rel="stylesheet" href="../css/tailwind.css">'
        
        if old_cdn in content:
            content = content.replace(old_cdn, new_css)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    print("🔧 Fixing Tailwind CDN in all edit pages...")
    
    pages_dir = "pages"
    fixed_count = 0
    
    if os.path.exists(pages_dir):
        for filename in os.listdir(pages_dir):
            if filename.startswith("product-edit-product-") and filename.endswith(".html"):
                filepath = os.path.join(pages_dir, filename)
                if fix_tailwind_cdn_in_file(filepath):
                    fixed_count += 1
                    print(f"✅ Fixed: {filename}")
    
    print(f"🎉 Successfully fixed {fixed_count} edit pages!")
    print("📝 Now all edit pages use local CSS instead of CDN")

if __name__ == "__main__":
    main() 