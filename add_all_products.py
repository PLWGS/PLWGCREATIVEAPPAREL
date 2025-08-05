#!/usr/bin/env python3
"""
Script to add all products from shop.html to the database
"""

import re
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def extract_products_from_html():
    """Extract product data from shop.html"""
    products = []
    
    with open('pages/shop.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the allProducts array
    pattern = r"const allProducts = \[(.*?)\];"
    match = re.search(pattern, content, re.DOTALL)
    
    if not match:
        print("Could not find allProducts array in shop.html")
        return []
    
    products_text = match.group(1)
    
    # Use a more sophisticated regex that properly handles escaped apostrophes
    # This pattern matches content between quotes, including escaped apostrophes
    product_pattern = r"\{\s*image:\s*'((?:[^'\\]|\\.)*)',\s*title:\s*'((?:[^'\\]|\\.)*)',\s*collection:\s*'((?:[^'\\]|\\.)*)',\s*price:\s*'((?:[^'\\]|\\.)*)',\s*rating:\s*'((?:[^'\\]|\\.)*)'\s*\}"
    product_matches = re.findall(product_pattern, products_text, re.DOTALL)
    
    for i, match in enumerate(product_matches):
        image_path, title, collection, price, rating = match
        
        # Convert image path to database format
        if image_path.startswith('../etsy_images/'):
            image_path = image_path.replace('../etsy_images/', 'etsy_images/')
        
        # Extract price as number
        price_str = price.replace('$', '').replace(',', '')
        try:
            price_value = float(price_str)
            original_price = price_value * 1.2  # 20% markup for original price
        except ValueError:
            price_value = 22.00
            original_price = 26.40
        
        # Use the exact title from frontend (including apostrophes)
        # Convert escaped apostrophes back to regular ones
        product_name = title.replace("\\'", "'")
        
        product = {
            'name': product_name,  # Exact name from frontend
            'description': f"Quality printed design - {product_name}",
            'price': price_value,
            'original_price': original_price,
            'image_url': image_path,
            'category': collection.replace(' Collection', ''),
            'subcategory': 'Featured',
            'tags': ['custom', 'printed', 'quality'],
            'stock_quantity': 50,
            'is_featured': True,
            'is_on_sale': True,
            'sale_percentage': 15
        }
        products.append(product)
        print(f"Extracted product {len(products)}: {product_name}")
    
    return products

def add_products_to_database(products):
    """Add products to the database"""
    try:
        # Connect to database
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        
        # Clear existing products
        cursor.execute("DELETE FROM products")
        print("Cleared existing products from database")
        
        # Insert new products
        for i, product in enumerate(products, 1):
            cursor.execute("""
                INSERT INTO products (name, description, price, original_price, image_url, category, subcategory, tags, stock_quantity, is_featured, is_on_sale, sale_percentage)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                product['name'],
                product['description'],
                product['price'],
                product['original_price'],
                product['image_url'],
                product['category'],
                product['subcategory'],
                product['tags'],
                product['stock_quantity'],
                product['is_featured'],
                product['is_on_sale'],
                product['sale_percentage']
            ))
            print(f"Added product {i}: {product['name']}")
        
        conn.commit()
        print(f"\nSuccessfully added {len(products)} products to database")
        
    except Exception as e:
        print(f"Error adding products to database: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def main():
    print("Extracting products from shop.html...")
    products = extract_products_from_html()
    
    if not products:
        print("No products found to add")
        return
    
    print(f"Found {len(products)} products to add")
    
    # Show first few products as preview
    print("\nPreview of first 5 products:")
    for i, product in enumerate(products[:5], 1):
        print(f"{i}. {product['name']} - ${product['price']}")
    
    # Add to database
    print("\nAdding products to database...")
    add_products_to_database(products)

if __name__ == "__main__":
    main() 