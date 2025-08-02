# Etsy Image Download Guide

Since Etsy is blocking automated requests (403 Forbidden), here are alternative methods to get your shop images:

## Method 1: Manual Download from Etsy Shop
1. **Visit your shop**: https://www.etsy.com/shop/PlwgsCreativeApparel
2. **Right-click on each product image** → "Save image as..."
3. **Save to the `etsy_images` folder** in your project
4. **Rename files** to something descriptive like `product1.jpg`, `product2.jpg`, etc.

## Method 2: Use Browser Developer Tools
1. **Open your Etsy shop** in Chrome/Firefox
2. **Press F12** to open Developer Tools
3. **Go to Network tab**
4. **Refresh the page**
5. **Filter by "img"** to see all image requests
6. **Right-click on image URLs** → "Open in new tab"
7. **Save images** from the new tabs

## Method 3: Etsy API (If Available)
If you have API access:
```python
# You would need Etsy API credentials
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

# Get shop listings
response = requests.get('https://openapi.etsy.com/v3/application/shops/YOUR_SHOP_ID/listings/active', headers=headers)
```

## Method 4: Selenium (Advanced)
```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument("--headless")
driver = webdriver.Chrome(options=chrome_options)
driver.get("https://www.etsy.com/shop/PlwgsCreativeApparel")
# Extract images from page
```

## Method 5: Manual Image Collection
1. **Take screenshots** of your products
2. **Use image editing software** to crop and save
3. **Download from your Etsy dashboard** if available

## Recommended Approach
Since automated scraping is blocked, I recommend:
1. **Manual download** of your most important product images
2. **Save them to `etsy_images/` folder**
3. **Use them in your website** by referencing them in your HTML

## Next Steps
Once you have images in the `etsy_images` folder, you can:
1. **Add them to your website pages**
2. **Create a product gallery**
3. **Use them in your homepage showcase**
4. **Optimize them for web** (compress, resize)

Would you like me to help you integrate the images into your website once you have them downloaded? 