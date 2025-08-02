import requests
from bs4 import BeautifulSoup
import os
import json
import time

shop_url = "https://www.etsy.com/shop/PlwgsCreativeApparel"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}
output_folder = "etsy_images"

os.makedirs(output_folder, exist_ok=True)

print(f"Fetching images from: {shop_url}")

try:
    response = requests.get(shop_url, headers=headers, timeout=15)
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find all images
        images = soup.find_all('img')
        print(f"Found {len(images)} total images on the page")
        
        # Also look for background images in CSS
        style_tags = soup.find_all('style')
        background_images = []
        for style in style_tags:
            if style.string:
                # Extract background-image URLs
                import re
                bg_pattern = r'background-image:\s*url\(["\']?([^"\')\s]+)["\']?\)'
                matches = re.findall(bg_pattern, style.string)
                background_images.extend(matches)
        
        print(f"Found {len(background_images)} background images")
        
        downloaded_count = 0
        
        # Download regular images
        for idx, img in enumerate(images):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if src:
                try:
                    # Handle relative URLs
                    if src.startswith('//'):
                        src = 'https:' + src
                    elif src.startswith('/'):
                        src = 'https://www.etsy.com' + src
                    
                    print(f"Attempting to download: {src}")
                    img_response = requests.get(src, headers=headers, timeout=10)
                    
                    if img_response.status_code == 200:
                        # Determine file extension
                        if 'jpg' in src.lower() or 'jpeg' in src.lower():
                            ext = 'jpg'
                        elif 'png' in src.lower():
                            ext = 'png'
                        elif 'webp' in src.lower():
                            ext = 'webp'
                        else:
                            ext = 'jpg'
                        
                        filename = f"{output_folder}/etsy_image_{downloaded_count}.{ext}"
                        with open(filename, 'wb') as f:
                            f.write(img_response.content)
                        downloaded_count += 1
                        print(f"✓ Saved: {filename}")
                    else:
                        print(f"✗ Failed to download {src}: Status {img_response.status_code}")
                except Exception as e:
                    print(f"✗ Error downloading {src}: {e}")
        
        # Download background images
        for idx, bg_src in enumerate(background_images):
            try:
                if bg_src.startswith('//'):
                    bg_src = 'https:' + bg_src
                elif bg_src.startswith('/'):
                    bg_src = 'https://www.etsy.com' + bg_src
                
                print(f"Attempting to download background: {bg_src}")
                bg_response = requests.get(bg_src, headers=headers, timeout=10)
                
                if bg_response.status_code == 200:
                    if 'jpg' in bg_src.lower() or 'jpeg' in bg_src.lower():
                        ext = 'jpg'
                    elif 'png' in bg_src.lower():
                        ext = 'png'
                    elif 'webp' in bg_src.lower():
                        ext = 'webp'
                    else:
                        ext = 'jpg'
                    
                    filename = f"{output_folder}/etsy_bg_{downloaded_count}.{ext}"
                    with open(filename, 'wb') as f:
                        f.write(bg_response.content)
                    downloaded_count += 1
                    print(f"✓ Saved background: {filename}")
                else:
                    print(f"✗ Failed to download background {bg_src}: Status {bg_response.status_code}")
            except Exception as e:
                print(f"✗ Error downloading background {bg_src}: {e}")
        
        print(f"\nDownload complete. Downloaded {downloaded_count} images to {output_folder}/")
        
        # Save the HTML for debugging
        with open(f"{output_folder}/page_source.html", 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Saved page source to {output_folder}/page_source.html for debugging")
        
    else:
        print(f"Failed to fetch page. Status code: {response.status_code}")
        
except Exception as e:
    print(f"Error fetching page: {e}") 