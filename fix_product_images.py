#!/usr/bin/env python3
"""
Script to fix product database by removing products without corresponding image files
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_existing_images():
    """Get list of existing image files"""
    etsy_images_dir = 'etsy_images'
    existing_images = []
    
    if os.path.exists(etsy_images_dir):
        for filename in os.listdir(etsy_images_dir):
            if filename.endswith('.jpg') and filename.startswith('product_'):
                existing_images.append(filename)
    
    return existing_images

def fix_database():
    """Fix the database by removing products without corresponding images"""
    try:
        # Connect to database
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        # Get existing images
        existing_images = get_existing_images()
        print(f"Found {len(existing_images)} existing image files")
        
        # Get all products from database
        cursor.execute("SELECT id, name, image_url FROM products")
        products = cursor.fetchall()
        print(f"Found {len(products)} products in database")
        
        # Find products with missing images
        products_to_remove = []
        products_to_update = []
        
        for product_id, name, image_url in products:
            if image_url:
                # Extract filename from image_url
                filename = image_url.split('/')[-1]
                
                if filename not in existing_images:
                    print(f"Product {product_id} ({name}) has missing image: {filename}")
                    products_to_remove.append(product_id)
                else:
                    # Update image_url to use correct path
                    new_image_url = f"etsy_images/{filename}"
                    if new_image_url != image_url:
                        products_to_update.append((product_id, new_image_url))
        
        # Remove products with missing images
        if products_to_remove:
            cursor.execute("DELETE FROM products WHERE id = ANY(%s)", (products_to_remove,))
            print(f"Removed {len(products_to_remove)} products with missing images")
        
        # Update image URLs for remaining products
        for product_id, new_image_url in products_to_update:
            cursor.execute("UPDATE products SET image_url = %s WHERE id = %s", (new_image_url, product_id))
            print(f"Updated image URL for product {product_id}")
        
        # Commit changes
        conn.commit()
        
        # Get final count
        cursor.execute("SELECT COUNT(*) FROM products")
        final_count = cursor.fetchone()[0]
        print(f"Final product count: {final_count}")
        
        cursor.close()
        conn.close()
        
        print("Database fix completed successfully!")
        
    except Exception as e:
        print(f"Error fixing database: {e}")

if __name__ == "__main__":
    fix_database() 