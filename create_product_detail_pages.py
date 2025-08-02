import os
import re
from pathlib import Path

def create_product_detail_pages():
    # Product data from Etsy catalog
    products = [
        {
            "id": 1,
            "name": "Just a Little BOO-jee Halloween Shirt",
            "description": "Quality Printed Design | Cute Halloween Ghost T-Shirt | Halloween Boo-jee Ghost Shirt | Ghost Shirt",
            "price": "$25.99",
            "image": "../etsy_images/product_01_Just-a-Little-BOO-jee-Halloween-Shirt-Quality-Prin.jpg",
            "category": "Halloween",
            "url": "https://www.etsy.com/listing/4339824528/just-a-little-boo-jee-halloween-shirt"
        },
        {
            "id": 2,
            "name": "Just a Little BOO-st Halloween Shirt",
            "description": "Quality Printed Design | Cute Halloween Ghost T-Shirt | Halloween Barista Coffee Shirt | Boo T-Shirt",
            "price": "$25.99",
            "image": "../etsy_images/product_02_Just-a-Little-BOO-st-Halloween-Shirt-Quality-Prin.jpg",
            "category": "Halloween",
            "url": "https://www.etsy.com/listing/4339761635/just-a-little-boo-st-halloween-shirt"
        },
        {
            "id": 3,
            "name": "Wish You Were Here Shirt",
            "description": "Quality Printed Design | Song Lyric T-Shirt | Music Shirt",
            "price": "$25.99",
            "image": "../etsy_images/product_03_Wish-You-Were-Here-Shirt-Quality-Printed-Design-So.jpg",
            "category": "Music",
            "url": "https://www.etsy.com/listing/4338526914/wish-you-were-here-shirt-quality-printed"
        },
        {
            "id": 4,
            "name": "Halloween One Two He's Coming for You Shirt",
            "description": "Printed Design | Horror Shirt | Scary Shirt | Unisex Black Long Sleeve Tee, T-Shirt or V-Neck",
            "price": "$25.99",
            "image": "../etsy_images/product_04_Halloween-One-Two-Hes-Coming-for-You-Shirt-Printed.jpg",
            "category": "Halloween",
            "url": "https://www.etsy.com/listing/4336527506/halloween-one-two-hes-coming-for-you"
        },
        {
            "id": 5,
            "name": "Personalized Straight Outta (Add Text) Shirt",
            "description": "Printed Design | Custom Text Shirt | Add Text or Change all 3 Lines | Funny Custom Shirt",
            "price": "$25.99",
            "image": "../etsy_images/product_05_Personalized-Straight-Outta-Add-Text-Shirt-Printed.jpg",
            "category": "Custom",
            "url": "https://www.etsy.com/listing/4321109188/personalized-straight-outta-add-text"
        },
        {
            "id": 6,
            "name": "Custom Bridezilla Shirt",
            "description": "Printed Design | Bridezilla Horror Shirt | Wedding Horror Bride Shirt | Couple that Love the Movies Shirt Add Text",
            "price": "$25.99",
            "image": "../etsy_images/product_06_Custom-Bridezilla-Shirt-Printed-Design-Bridezilla-.jpg",
            "category": "Custom",
            "url": "https://www.etsy.com/listing/4319477593/custom-bridezilla-shirt-printed-design"
        },
        {
            "id": 7,
            "name": "Kid's Halloween Horror Friends Hoodie",
            "description": "Printed Design | Kid's Friends Hoodie | Kid's Scary Hoodie | Unisex - 9 Colors to Choose From",
            "price": "$39.99",
            "image": "../etsy_images/product_07_Kids-Halloween-Horror-Friends-Hoodie-Printed-Desig.jpg",
            "category": "Halloween",
            "url": "https://www.etsy.com/listing/4319083468/kids-halloween-horror-friends-hoodie"
        },
        {
            "id": 8,
            "name": "Best Dad Ever T-Shirt",
            "description": "Printed Design | Best Dad Shirt | Father's Day Gift | Fathers Day Shirt",
            "price": "$25.99",
            "image": "../etsy_images/product_08_Best-Dad-Ever-T-Shirt-Printed-Design-Best-Dad-Shir.jpg",
            "category": "Father's Day",
            "url": "https://www.etsy.com/listing/4315663607/best-dad-ever-t-shirt-printed-design"
        }
    ]
    
    # Read the template file
    template_path = "pages/product_detail_conversion_focused_design_showcase.html"
    
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Create product detail pages directory
    product_pages_dir = "pages/product_details"
    os.makedirs(product_pages_dir, exist_ok=True)
    
    for product in products:
        print(f"Creating product detail page for: {product['name']}")
        
        # Create product-specific content
        product_content = template_content
        
        # Replace product information
        product_content = product_content.replace(
                "Midnight Horror Skull Tee - PlwgsCreativeApparel | Be Loud. Be Seen. Be You.",
    f"{product['name']} - PlwgsCreativeApparel | Be Loud. Be Seen. Be You."
        )
        
        product_content = product_content.replace(
            "Embrace the darkness with our spine-chilling Midnight Horror Skull design. Premium quality t-shirt featuring intricate gothic artwork that speaks to bold personalities.",
            f"{product['description']}. Premium quality design featuring unique artwork that speaks to bold personalities."
        )
        
        product_content = product_content.replace(
            "Midnight Horror Skull Tee",
            product['name']
        )
        
        product_content = product_content.replace(
            "$29.99",
            product['price']
        )
        
        product_content = product_content.replace(
            "$39.99",
            f"${float(product['price'].replace('$', '')) + 10:.2f}"
        )
        
        # Replace main product image
        product_content = product_content.replace(
            'src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop"',
            f'src="{product["image"]}"'
        )
        
        product_content = product_content.replace(
            'alt="Midnight Horror Skull Tee - Main View"',
            f'alt="{product["name"]} - Main View"'
        )
        
        # Replace thumbnail images with the same product image
        for i in range(4):
            product_content = product_content.replace(
                f'data-image="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop"',
                f'data-image="{product["image"]}"',
                1
            )
            product_content = product_content.replace(
                f'src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop"',
                f'src="{product["image"]}"',
                1
            )
        
        # Update breadcrumb
        product_content = product_content.replace(
            "Horror Essentials",
            product['category']
        )
        
        # Update design story
        design_story = f"""
                        <p class="text-text-secondary leading-relaxed">
                            {product['description']}. This unique design showcases our commitment to quality printing and bold artistic expression. Perfect for those who want to make a statement with their style and aren't afraid to stand out from the crowd.
                        </p>
        """
        product_content = re.sub(
            r'<p class="text-text-secondary leading-relaxed">.*?</p>',
            design_story.strip(),
            product_content,
            flags=re.DOTALL
        )
        
        # Create filename
        safe_name = re.sub(r'[^a-zA-Z0-9\s-]', '', product['name'])
        safe_name = re.sub(r'\s+', '-', safe_name).lower()
        filename = f"product_{product['id']:02d}_{safe_name}.html"
        
        # Write the product detail page
        with open(f"{product_pages_dir}/{filename}", 'w', encoding='utf-8') as f:
            f.write(product_content)
        
        print(f"✅ Created: {filename}")
    
    print(f"\n🎉 Created {len(products)} product detail pages!")
    print(f"📁 Location: {product_pages_dir}/")
    print("🔗 Next: Update shop grid to link to these product pages")

if __name__ == "__main__":
    create_product_detail_pages() 