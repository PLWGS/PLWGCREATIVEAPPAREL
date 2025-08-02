import requests
from bs4 import BeautifulSoup
import os
import re

shop_url = "https://www.etsy.com/shop/PlwgsCreativeApparel"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
output_folder = "etsy_images"

os.makedirs(output_folder, exist_ok=True)

print(f"Fetching images from: {shop_url}")
html = requests.get(shop_url, headers=headers).text
soup = BeautifulSoup(html, 'html.parser')

images = soup.find_all('img')
print(f"Found {len(images)} total images on the page")

downloaded_count = 0
for idx, img in enumerate(images):
    src = img.get('src')
    if src:
        # Check for various Etsy image patterns
        if any(pattern in src for pattern in ['il_', 'etsy', 'listing', 'shop', 'product']):
            try:
                # Handle relative URLs
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://www.etsy.com' + src
                
                print(f"Downloading: {src}")
                response = requests.get(src, headers=headers, timeout=10)
                
                if response.status_code == 200:
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
                        f.write(response.content)
                    downloaded_count += 1
                    print(f"Saved: {filename}")
                else:
                    print(f"Failed to download {src}: Status {response.status_code}")
            except Exception as e:
                print(f"Error downloading {src}: {e}")

print(f"\nDownload complete. Downloaded {downloaded_count} images to {output_folder}/") 