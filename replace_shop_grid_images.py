import re

# Read the shop grid file
with open('pages/shop_grid_advanced_product_discovery.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacement mappings for all placeholder images
replacements = [
    # Category filter images
    (
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=40&auto=format&fit=crop',
        '../etsy_images/product_20_Breast-Cancer-Awareness-Shirt-Printed-Design-Breas.jpg'
    ),
    (
        'https://images.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg?q=80&w=40&auto=format&fit=crop',
        '../etsy_images/product_21_Down-Syndrome-Awareness-Shirt-Printed-Design-Down-.jpg'
    ),
    (
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=40',
        '../etsy_images/product_22_Down-Syndrome-Awareness-Shirt-Printed-Design-Down-.jpg'
    ),
    
    # Main product grid images
    (
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_23_Bikers-Against-Dumbass-Drivers-Shirt-2-Sided-Print.jpg'
    ),
    (
        'https://images.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_24_Family-Jurassic-Birthday-Shirt-Printed-Design-Boys.jpg'
    ),
    (
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
        '../etsy_images/product_25_Custom-The-Devil-Whispered-to-Me-Im-Coming-For-You.jpg'
    ),
    (
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_26_Custom-Vintage-Dude-Birthday-Shirt-Printed-Design-.jpg'
    ),
    (
        'https://images.unsplash.com/photo-1494790108755-2616c0763c5c?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_27_Custom-Grumpy-Old-Man-Shirt-Quality-Printed-Design.jpg'
    ),
    (
        'https://images.pixabay.com/photo-2016/11/29/20/22/girl-1871104_1280.jpg?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_28_Teaching-My-Favorite-Peeps-Shirt-Quality-Printed-D.jpg'
    ),
    
    # Related products
    (
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_29_Matching-St-Patricks-Day-Shirts-Printed-Design-Not.jpg'
    ),
    (
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300',
        '../etsy_images/product_30_Custom-Family-Shirt-Its-A-Name-Thing-You-Wouldnt-U.jpg'
    ),
    (
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_31_Kids-Mischief-Managed-Wizard-Shirt-Printed-Design-.jpg'
    ),
    (
        'https://images.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_32_Adults-Everything-Dope-Comes-From-City-or-State-Ho.jpg'
    ),
    
    # Recently viewed
    (
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=80&auto=format&fit=crop',
        '../etsy_images/product_33_Kids-Everything-Dope-Comes-From-City-or-State-Hood.jpg'
    ),
    (
        'https://images.pixabay.com/photo/2017/08/01/11/48/woman-2564660_1280.jpg?q=80&w=80&auto=format&fit=crop',
        '../etsy_images/product_34_Kids-Plunge-Into-the-Freeze-Hoodie-Printed-Design-.jpg'
    ),
    (
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=80',
        '../etsy_images/product_35_Adult-Plunge-Into-the-Freeze-Hoodie-Printed-Design.jpg'
    ),
]

# Apply replacements
for old_url, new_url in replacements:
    content = content.replace(old_url, new_url)

# Update product titles and descriptions with real Etsy product names
product_updates = [
    ('Midnight Terrors Tee', 'Bikers Against Dumbass Drivers Shirt'),
    ('Retro Gaming Mashup', 'Family Jurassic Birthday Shirt'),
    ('Sarcasm Loading Tee', 'Custom The Devil Whispered to Me Shirt'),
    ('Custom Skull Art', 'Custom Vintage Dude Birthday Shirt'),
    ('Zombie Apocalypse Survivor', 'Custom Grumpy Old Man Shirt'),
    ('Anime Villain Aesthetic', 'Teaching My Favorite Peeps Shirt'),
    ('Gothic Romance', 'Matching St. Patrick\'s Day Shirts'),
    ('Meme Lord Status', 'Custom Family Shirt'),
    ('Cryptid Hunter', 'Kid\'s Mischief Managed Wizard Shirt'),
    ('Retro Synthwave', 'Adult\'s Everything Dope Comes From Hoodie'),
]

for old_title, new_title in product_updates:
    content = content.replace(old_title, new_title)

# Update prices to MXN format
content = re.sub(r'\$[\d.]+', '$434.78 MXN', content)
content = re.sub(r'From \$[\d.]+', 'From $434.78 MXN', content)

# Update alt texts
content = content.replace('alt="Horror"', 'alt="Breast Cancer Awareness Shirt"')
content = content.replace('alt="Pop Culture"', 'alt="Down Syndrome Awareness Shirt"')
content = content.replace('alt="Humor"', 'alt="Down Syndrome Awareness Shirt"')

# Write the updated content back
with open('pages/shop_grid_advanced_product_discovery.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Shop grid images replaced successfully!")
print("📝 Updated product titles with real Etsy names")
print("💰 Updated prices to MXN format")
print("🖼️ Replaced all placeholder images with Etsy products") 