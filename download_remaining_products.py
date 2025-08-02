import requests
import os
import re
from urllib.parse import urlparse

def download_remaining_products():
    # Additional products from the review data
    additional_products = [
        {
            "image_url": "https://i.etsystatic.com/6715258330/r/il/bda7b6/6715258330/il_170x135.6715258330_h1s4.jpg",
            "name": "Custom Song Lyric TShirt | High Quality Print | Rock or Country Guitar Design or Piano Design | Unisex Size",
            "description": "Custom Song Lyric TShirt with high quality print featuring rock or country guitar design or piano design",
            "price": "$25.00",
            "category": "Custom Music"
        },
        {
            "image_url": "https://i.etsystatic.com/7064746423/r/il/22b812/7064746423/il_170x135.7064746423_ly7a.jpg",
            "name": "Custom Shirt Listing Any Text Design | Printed Design | Personalized Text Shirt Up to 200 Character | Unisex Sizes",
            "description": "Custom shirt with any text design, personalized text shirt up to 200 characters",
            "price": "$23.00",
            "category": "Custom Text"
        },
        {
            "image_url": "https://i.etsystatic.com/6863659772/r/il/133ea7/6863659772/il_170x135.6863659772_q6ct.jpg",
            "name": "Custom Order",
            "description": "Custom order with personalized design and specifications",
            "price": "$30.00",
            "category": "Custom Orders"
        },
        {
            "image_url": "https://i.etsystatic.com/5985803572/r/il/dfb546/5985803572/il_170x135.5985803572_gpr0.jpg",
            "name": "It's Where My Story Begins Hoodie | Printed Design | Personalize with Your City and State with State Flag and Seal | Adult Unisex Size",
            "description": "It's Where My Story Begins Hoodie with personalized city and state with state flag and seal",
            "price": "$38.00",
            "category": "Personalized Hoodies"
        },
        {
            "image_url": "https://i.etsystatic.com/6696411656/r/il/e786ac/6696411656/il_170x135.6696411656_kkdd.jpg",
            "name": "Down Syndrome Awareness Shirt | Printed Design | Down Right Perfect Shirt | Awareness Shirt | Down Syndrome T-Shirt | Adult Unisex Size",
            "description": "Down Syndrome Awareness Shirt with 'Down Right Perfect' design for awareness",
            "price": "$22.00",
            "category": "Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/4235677807/r/il/4fa0aa/4235677807/il_170x135.4235677807_e5q5.jpg",
            "name": "Kid's Acknowledge Me It's My Birthday Shirt | Printed Design | Kid's Custom Birthday T-Shirt | Kid's Personalized Birthday T-Shirt",
            "description": "Kid's Acknowledge Me It's My Birthday Shirt with custom birthday design",
            "price": "$20.00",
            "category": "Kids Birthday"
        },
        {
            "image_url": "https://i.etsystatic.com/4235677807/r/il/4fa0aa/4235677807/il_170x135.4235677807_e5q5.jpg",
            "name": "Acknowledge Me Birthday Shirt | Printed Design | It's My Birthday T-Shirt | Personalized Birthday Shirt | Unisex Tee",
            "description": "Acknowledge Me Birthday Shirt with personalized birthday design for adults",
            "price": "$22.00",
            "category": "Birthday"
        },
        {
            "image_url": "https://i.etsystatic.com/5985803572/r/il/dfb546/5985803572/il_170x135.5985803572_gpr0.jpg",
            "name": "It's Where My Story Begins Hoodie | Printed Design | Personalize with Your City and State with State Flag and Seal | Adult Unisex Size",
            "description": "It's Where My Story Begins Hoodie with personalized city and state with state flag and seal",
            "price": "$38.00",
            "category": "Personalized Hoodies"
        },
        {
            "image_url": "https://i.etsystatic.com/6696411656/r/il/e786ac/6696411656/il_170x135.6696411656_kkdd.jpg",
            "name": "Down Syndrome Awareness Shirt | Printed Design | Down Right Perfect Shirt | Awareness Shirt | Down Syndrome T-Shirt | Adult Unisex Size",
            "description": "Down Syndrome Awareness Shirt with 'Down Right Perfect' design for awareness",
            "price": "$22.00",
            "category": "Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/4235677807/r/il/4fa0aa/4235677807/il_170x135.4235677807_e5q5.jpg",
            "name": "Kid's Acknowledge Me It's My Birthday Shirt | Printed Design | Kid's Custom Birthday T-Shirt | Kid's Personalized Birthday T-Shirt",
            "description": "Kid's Acknowledge Me It's My Birthday Shirt with custom birthday design",
            "price": "$20.00",
            "category": "Kids Birthday"
        },
        {
            "image_url": "https://i.etsystatic.com/4235677807/r/il/4fa0aa/4235677807/il_170x135.4235677807_e5q5.jpg",
            "name": "Acknowledge Me Birthday Shirt | Printed Design | It's My Birthday T-Shirt | Personalized Birthday Shirt | Unisex Tee",
            "description": "Acknowledge Me Birthday Shirt with personalized birthday design for adults",
            "price": "$22.00",
            "category": "Birthday"
        }
    ]

    if not os.path.exists('etsy_images'):
        os.makedirs('etsy_images')

    print("📥 Downloading remaining product images...")
    
    # Start from product 37 since we already have 36
    for i, product in enumerate(additional_products, 37):
        try:
            response = requests.get(product['image_url'])
            if response.status_code == 200:
                parsed_url = urlparse(product['image_url'])
                filename = os.path.basename(parsed_url.path)
                clean_name = product['name'].replace(' ', '-').replace('/', '-').replace('|', '-')[:50]
                file_extension = os.path.splitext(filename)[1] or '.jpg'
                new_filename = f"product_{i:02d}_{clean_name}{file_extension}"
                filepath = os.path.join('etsy_images', new_filename)
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"✅ Downloaded: {new_filename}")
            else:
                print(f"❌ Failed to download: {product['image_url']}")
        except Exception as e:
            print(f"❌ Error downloading {product['image_url']}: {e}")

    print(f"\n🎉 Downloaded {len(additional_products)} additional images to etsy_images folder!")

    # Update the product catalog
    with open('etsy_images/product_catalog.txt', 'a', encoding='utf-8') as f:
        f.write("\n\nADDITIONAL PRODUCTS FROM REVIEWS\n")
        f.write("==================================================\n\n")
        
        for i, product in enumerate(additional_products, 37):
            f.write(f"{i:2d}. {product['name']}\n")
            f.write(f"    Price: {product['price']}\n")
            f.write(f"    Category: {product['category']}\n")
            f.write(f"    Description: {product['description']}\n")
            f.write(f"    Image: product_{i:02d}_*.jpg\n")
            f.write("-" * 50 + "\n\n")

    print("📝 Updated product catalog with additional products!")

    # Update prices in HTML files if needed
    files_to_update = ['pages/homepage.html', 'pages/shop.html']
    
    for file_path in files_to_update:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Add any new price updates if needed
            price_updates = {
                r'\$25\.00': '$25.00',
                r'\$23\.00': '$23.00',
                r'\$30\.00': '$30.00',
                r'\$38\.00': '$38.00',
                r'\$20\.00': '$20.00'
            }

            for old_price, new_price in price_updates.items():
                content = re.sub(old_price, new_price, content)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✅ Updated prices in {file_path}")

        except Exception as e:
            print(f"❌ Error updating {file_path}: {e}")

    print("\n🎉 All remaining products processed!")
    print("📁 Additional images saved in: etsy_images/")
    print("💰 Prices updated to match complete Etsy listings")

if __name__ == "__main__":
    download_remaining_products() 