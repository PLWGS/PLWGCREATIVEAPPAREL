import re

# Read the homepage file
with open('pages/homepage_dark_futuristic_e_commerce.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacement mappings
replacements = [
    # Customer 2
    (
        'https://images.pixabay.com/photo-2016/11/29/20/22/girl-1871104_1280.jpg?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_11_Custom-Fathers-Day-Photo-Shirt-for-Dad-Printed-Des.jpg'
    ),
    # Customer 3
    (
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        '../etsy_images/product_12_Fathers-Day-Shirt-Printed-Design-Husband-Father-Le.jpg'
    ),
    # Customer 4
    (
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
        '../etsy_images/product_13_Fathers-Day-Shirt-Printed-Design-Husband-Father-Gr.jpg'
    ),
    # Instagram Post 1
    (
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_14_Look-Whos-All-Grown-Up-And-Ready-For-Senior-Discou.jpg'
    ),
    # Instagram Post 2
    (
        'https://images.pixabay.com/photo-2016/03/27/19/32/fashion-1283863_1280.jpg?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_15_Acknowledge-Me-Its-My-Birthday-Shirt-Printed-Desig.jpg'
    ),
    # Instagram Post 3
    (
        'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300',
        '../etsy_images/product_16_Biker-Lives-Matter-Shirt-Quality-Printed-Design-Mo.jpg'
    ),
    # Instagram Post 4
    (
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_17_Girls-Trip-2025-Shirt-Printed-Design-Custom-Girls-.jpg'
    ),
    # Instagram Post 5
    (
        'https://images.unsplash.com/photo-1494790108755-2616c0763c5c?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_18_Old-Lives-Matter-Shirt-Quality-Printed-Design-Funn.jpg'
    ),
    # Instagram Post 6
    (
        'https://images.pixabay.com/photo-2016/11/29/20/22/girl-1871104_1280.jpg?q=80&w=300&auto=format&fit=crop',
        '../etsy_images/product_19_Breast-Cancer-Awareness-Shirt-Printed-Design-Breas.jpg'
    ),
]

# Apply replacements
for old_url, new_url in replacements:
    content = content.replace(old_url, new_url)

# Update alt texts and descriptions
content = content.replace('Customer wearing pop culture tee', 'Custom Father\'s Day Photo Shirt')
content = content.replace('Customer wearing custom design', 'Father\'s Day Shirt')
content = content.replace('Customer wearing statement tee', 'Father\'s Day Shirt')
content = content.replace('Instagram post', 'Product Showcase')

# Update customer comments with prices
content = content.replace('"Love the pop culture references!"', '"Love the pop culture references! $434.78 MXN"')
content = content.replace('"Custom design exceeded expectations!"', '"Custom design exceeded expectations! $434.78 MXN"')
content = content.replace('"Quality and style on point!"', '"Quality and style on point! $434.78 MXN"')

# Write the updated content back
with open('pages/homepage_dark_futuristic_e_commerce.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Homepage images replaced successfully!")
print("📝 Updated customer comments with prices")
print("🖼️ Replaced all placeholder images with Etsy products") 