import re

def update_shop_grid_links():
    # Product mapping for shop grid
    product_links = {
        "Bikers Against Dumbass Drivers Shirt": "product_details/product_23_bikers-against-dumbass-drivers-shirt.html",
        "Family Jurassic Birthday Shirt": "product_details/product_24_family-jurassic-birthday-shirt.html", 
        "Custom The Devil Whispered to Me Shirt": "product_details/product_25_custom-the-devil-whispered-to-me-shirt.html",
        "Custom Vintage Dude Birthday Shirt": "product_details/product_26_custom-vintage-dude-birthday-shirt.html",
        "Custom Grumpy Old Man Shirt": "product_details/product_27_custom-grumpy-old-man-shirt.html",
        "Teaching My Favorite Peeps Shirt": "product_details/product_28_teaching-my-favorite-peeps-shirt.html",
        "Matching St. Patrick's Day Shirts": "product_details/product_29_matching-st-patricks-day-shirts.html",
        "Custom Family Shirt": "product_details/product_30_custom-family-shirt.html",
        "Kid's Mischief Managed Wizard Shirt": "product_details/product_31_kids-mischief-managed-wizard-shirt.html",
        "Adult's Everything Dope Comes From Hoodie": "product_details/product_32_adults-everything-dope-comes-from-hoodie.html"
    }
    
    # Read the shop grid file
    with open('pages/shop_grid_advanced_product_discovery.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update product cards to link to detail pages
    for product_name, detail_link in product_links.items():
        # Find product cards and add links
        pattern = rf'<div class="glass-card rounded-xl overflow-hidden group hover:shadow-glow transition-all duration-500">(.*?)<h3 class="font-orbitron text-lg font-bold text-white mb-2">{re.escape(product_name)}</h3>(.*?)</div>'
        
        replacement = rf'<div class="glass-card rounded-xl overflow-hidden group hover:shadow-glow transition-all duration-500">\1<a href="{detail_link}" class="block">\2<h3 class="font-orbitron text-lg font-bold text-white mb-2">{product_name}</h3></a>'
        
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Add "View Details" buttons to product cards
    for product_name in product_links.keys():
        # Find the product card and add a view details button
        pattern = rf'<h3 class="font-orbitron text-lg font-bold text-white mb-2">{re.escape(product_name)}</h3>(.*?)<span class="text-accent font-bold text-xl">\$[0-9.]+</span>'
        
        replacement = rf'<h3 class="font-orbitron text-lg font-bold text-white mb-2">{product_name}</h3>\1<span class="text-accent font-bold text-xl">$25.99</span>\n                        <a href="{product_links[product_name]}" class="btn-primary mt-3 w-full text-center">View Details</a>'
        
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Update related products section
    related_products = [
        ("Kid's Everything Dope Comes From Hoodie", "product_details/product_33_kids-everything-dope-comes-from-hoodie.html"),
        ("Kid's Plunge Into the Freeze Hoodie", "product_details/product_34_kids-plunge-into-the-freeze-hoodie.html"),
        ("Adult Plunge Into the Freeze Hoodie", "product_details/product_35_adult-plunge-into-the-freeze-hoodie.html")
    ]
    
    for product_name, detail_link in related_products:
        pattern = rf'<h4 class="font-semibold text-white">{re.escape(product_name)}</h4>'
        replacement = rf'<a href="{detail_link}"><h4 class="font-semibold text-white">{product_name}</h4></a>'
        content = re.sub(pattern, replacement, content)
    
    # Write the updated content back
    with open('pages/shop_grid_advanced_product_discovery.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Updated shop grid with product detail page links!")
    print("🔗 Added 'View Details' buttons to product cards")
    print("📱 Updated related products section")
    print("🎯 Product cards now link to individual detail pages")

if __name__ == "__main__":
    update_shop_grid_links() 