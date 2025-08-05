#!/usr/bin/env python3
"""
Create individual product edit pages for all 83 products
Also includes functions for dynamic edit page management
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

def clean_product_name(name):
    """Clean product name for use in filename"""
    # Remove special characters and replace spaces with underscores
    cleaned = re.sub(r'[^\w\s-]', '', name)
    cleaned = re.sub(r'[-\s]+', '_', cleaned)
    return cleaned.lower()

def get_product_data_from_filename(filename):
    """Extract product data from image filename"""
    # Remove file extension
    name = filename.replace('.jpg', '')
    
    # Extract product number and name
    parts = name.split('_', 1)
    if len(parts) >= 2:
        product_num = parts[0]
        product_name = parts[1].replace('_', ' ')
        return {
            'id': product_num,
            'name': product_name,
            'filename': filename
        }
    return None

def get_next_product_id():
    """Get the next available product ID by checking existing edit pages"""
    pages_dir = Path('pages')
    existing_pages = list(pages_dir.glob('product-edit-product-*.html'))
    
    if not existing_pages:
        return 1
    
    # Extract IDs from existing pages
    ids = []
    for page in existing_pages:
        filename = page.name
        # Extract ID from filename like "product-edit-product-01_..."
        match = re.search(r'product-edit-product-(\d+)_', filename)
        if match:
            ids.append(int(match.group(1)))
    
    return max(ids) + 1 if ids else 1

def create_individual_edit_page(product_data):
    """Create a single edit page for a specific product"""
    
    # Clean product name for filename
    clean_name = clean_product_name(product_data['name'])
    
    # Create the edit page content
    edit_page_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Edit {product_data['name']} - PlwgsCreativeApparel Admin</title>
    <meta name="description" content="Edit {product_data['name']} details and specifications for PlwgsCreativeApparel admin dashboard." />
    <link rel="stylesheet" href="../css/main.css" />
    <style>
        .edit-form {{
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid rgba(0, 188, 212, 0.3);
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        }}
        
        .form-group {{
            margin-bottom: 1.5rem;
        }}
        
        .form-label {{
            display: block;
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }}
        
        .form-input {{
            width: 100%;
            padding: 0.75rem;
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid rgba(0, 188, 212, 0.3);
            border-radius: 8px;
            color: #ffffff;
            font-size: 1rem;
        }}
        
        .form-input:focus {{
            outline: none;
            border-color: #00bcd4;
            box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
        }}
        
        .form-textarea {{
            min-height: 120px;
            resize: vertical;
        }}
        
        .btn-save {{
            background: linear-gradient(135deg, #00bcd4, #4dd0e1);
            color: #ffffff;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .btn-save:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
        }}
        
        .btn-cancel {{
            background: rgba(239, 68, 68, 0.8);
            color: #ffffff;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 1rem;
        }}
        
        .btn-cancel:hover {{
            background: rgba(239, 68, 68, 1);
        }}
        
        .product-image {{
            max-width: 300px;
            border-radius: 8px;
            border: 2px solid rgba(0, 188, 212, 0.3);
        }}
        
        .product-preview {{
            text-align: center;
            margin-bottom: 2rem;
        }}
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center">
                    <a href="admin-uploads.html" class="text-gray-300 hover:text-white transition-colors">
                        ← Back to Admin Dashboard
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-300">Admin Panel</span>
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-sm">A</span>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Edit Product</h1>
            <p class="text-gray-400">Update product details, pricing, and specifications</p>
        </div>

        <!-- Product Preview -->
        <div class="product-preview">
            <img src="../etsy_images/{product_data['filename']}" alt="{product_data['name']}" class="product-image">
            <h2 class="text-xl font-semibold text-white mt-4">{product_data['name']}</h2>
        </div>

        <!-- Product Edit Form -->
        <form id="product-edit-form" class="edit-form">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column - Basic Info -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Basic Information</h2>
                    
                    <div class="form-group">
                        <label for="product-name" class="form-label">Product Name</label>
                        <input type="text" id="product-name" class="form-input" value="{product_data['name']}" required>
                    </div>

                    <div class="form-group">
                        <label for="product-description" class="form-label">Description</label>
                        <textarea id="product-description" class="form-input form-textarea" rows="4" placeholder="Enter product description..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="product-category" class="form-label">Category</label>
                        <select id="product-category" class="form-input">
                            <option value="Halloween">Halloween</option>
                            <option value="Father's Day">Father's Day</option>
                            <option value="Birthday">Birthday</option>
                            <option value="Custom">Custom</option>
                            <option value="Cancer Awareness">Cancer Awareness</option>
                            <option value="Retirement">Retirement</option>
                            <option value="Family">Family</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Funny">Funny</option>
                            <option value="Personalized">Personalized</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="product-price" class="form-label">Price ($)</label>
                        <input type="number" id="product-price" class="form-input" step="0.01" min="0" value="22.00" required>
                    </div>

                    <div class="form-group">
                        <label for="product-original-price" class="form-label">Original Price ($)</label>
                        <input type="number" id="product-original-price" class="form-input" step="0.01" min="0" value="25.00">
                    </div>

                    <div class="form-group">
                        <label for="sale-percentage" class="form-label">Sale Percentage (%)</label>
                        <input type="number" id="sale-percentage" class="form-input" min="0" max="100" value="15">
                    </div>
                </div>

                <!-- Right Column - Inventory & Specs -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Inventory & Specifications</h2>
                    
                    <div class="form-group">
                        <label for="stock-quantity" class="form-label">Stock Quantity</label>
                        <input type="number" id="stock-quantity" class="form-input" min="0" value="50">
                    </div>

                    <div class="form-group">
                        <label for="low-stock-threshold" class="form-label">Low Stock Threshold</label>
                        <input type="number" id="low-stock-threshold" class="form-input" min="0" value="5">
                    </div>

                    <div class="form-group">
                        <label for="product-tags" class="form-label">Tags (comma-separated)</label>
                        <input type="text" id="product-tags" class="form-input" placeholder="funny, birthday, custom">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Colors</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" value="Black" class="mr-2" checked> Black
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="White" class="mr-2"> White
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Navy" class="mr-2"> Navy
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Gray" class="mr-2"> Gray
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Red" class="mr-2"> Red
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Green" class="mr-2"> Green
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Sizes</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" value="XS" class="mr-2"> XS
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="S" class="mr-2" checked> S
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="M" class="mr-2" checked> M
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="L" class="mr-2" checked> L
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XL" class="mr-2" checked> XL
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XXL" class="mr-2" checked> XXL
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Specifications -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Specifications</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="form-group">
                        <label for="spec-material" class="form-label">Material</label>
                        <input type="text" id="spec-material" class="form-input" value="100% Cotton">
                    </div>
                    <div class="form-group">
                        <label for="spec-weight" class="form-label">Weight</label>
                        <input type="text" id="spec-weight" class="form-input" value="6.1 oz">
                    </div>
                    <div class="form-group">
                        <label for="spec-fit" class="form-label">Fit</label>
                        <select id="spec-fit" class="form-input">
                            <option value="Regular">Regular</option>
                            <option value="Slim">Slim</option>
                            <option value="Relaxed">Relaxed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-neck" class="form-label">Neck Style</label>
                        <select id="spec-neck" class="form-input">
                            <option value="Crew Neck">Crew Neck</option>
                            <option value="V-Neck">V-Neck</option>
                            <option value="Hooded">Hooded</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-sleeve" class="form-label">Sleeve Length</label>
                        <select id="spec-sleeve" class="form-input">
                            <option value="Short Sleeve">Short Sleeve</option>
                            <option value="Long Sleeve">Long Sleeve</option>
                            <option value="Sleeveless">Sleeveless</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-origin" class="form-label">Origin</label>
                        <input type="text" id="spec-origin" class="form-input" value="Made in USA">
                    </div>
                </div>
            </div>

            <!-- Product Features -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Features</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-preshrunk" class="mr-3" checked>
                        <span>Preshrunk</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-double-stitched" class="mr-3" checked>
                        <span>Double Stitched</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-fade-resistant" class="mr-3" checked>
                        <span>Fade Resistant</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-soft-touch" class="mr-3" checked>
                        <span>Soft Touch</span>
                    </label>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-8 flex justify-end space-x-4">
                <button type="button" onclick="cancelEdit()" class="btn-cancel">Cancel</button>
                <button type="submit" class="btn-save">Save Changes</button>
            </div>
        </form>
    </main>

    <script>
        // Product data
        const productData = {{
            id: "{product_data['id']}",
            name: "{product_data['name']}",
            description: "",
            price: 22.00,
            original_price: 25.00,
            category: "",
            stock_quantity: 50,
            low_stock_threshold: 5,
            sale_percentage: 15,
            tags: [],
            colors: ['Black'],
            sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            specifications: {{
                material: '100% Cotton',
                weight: '6.1 oz',
                fit: 'Regular',
                neck_style: 'Crew Neck',
                sleeve_length: 'Short Sleeve',
                origin: 'Made in USA'
            }},
            features: {{
                preshrunk: true,
                double_stitched: true,
                fade_resistant: true,
                soft_touch: true
            }}
        }};

        // Load product data into form
        function loadProductData() {{
            // Load saved data from localStorage if available
            const savedData = localStorage.getItem(`product_${{productData.id}}`);
            if (savedData) {{
                const saved = JSON.parse(savedData);
                Object.assign(productData, saved);
            }}
            
            document.getElementById('product-name').value = productData.name || '';
            document.getElementById('product-description').value = productData.description || '';
            document.getElementById('product-price').value = productData.price || '';
            document.getElementById('product-original-price').value = productData.original_price || '';
            document.getElementById('product-category').value = productData.category || '';
            document.getElementById('stock-quantity').value = productData.stock_quantity || 50;
            document.getElementById('low-stock-threshold').value = productData.low_stock_threshold || 5;
            document.getElementById('sale-percentage').value = productData.sale_percentage || 15;
            document.getElementById('product-tags').value = productData.tags ? productData.tags.join(', ') : '';
            
            // Set colors
            document.querySelectorAll('input[type="checkbox"][value^="Black"], input[type="checkbox"][value^="White"], input[type="checkbox"][value^="Navy"], input[type="checkbox"][value^="Gray"], input[type="checkbox"][value^="Red"], input[type="checkbox"][value^="Green"]').forEach(checkbox => {{
                checkbox.checked = productData.colors.includes(checkbox.value);
            }});
            
            // Set sizes
            document.querySelectorAll('input[type="checkbox"][value^="XS"], input[type="checkbox"][value^="S"], input[type="checkbox"][value^="M"], input[type="checkbox"][value^="L"], input[type="checkbox"][value^="XL"], input[type="checkbox"][value^="XXL"]').forEach(checkbox => {{
                checkbox.checked = productData.sizes.includes(checkbox.value);
            }});
            
            // Set specifications
            if (productData.specifications) {{
                document.getElementById('spec-material').value = productData.specifications.material || '';
                document.getElementById('spec-weight').value = productData.specifications.weight || '';
                document.getElementById('spec-fit').value = productData.specifications.fit || '';
                document.getElementById('spec-neck').value = productData.specifications.neck_style || '';
                document.getElementById('spec-sleeve').value = productData.specifications.sleeve_length || '';
                document.getElementById('spec-origin').value = productData.specifications.origin || '';
            }}
            
            // Set features
            if (productData.features) {{
                document.getElementById('feature-preshrunk').checked = productData.features.preshrunk || false;
                document.getElementById('feature-double-stitched').checked = productData.features.double_stitched || false;
                document.getElementById('feature-fade-resistant').checked = productData.features.fade_resistant || false;
                document.getElementById('feature-soft-touch').checked = productData.features.soft_touch || false;
            }}
        }}

        // Handle form submission
        document.getElementById('product-edit-form').addEventListener('submit', function(e) {{
            e.preventDefault();
            saveProduct();
        }});

        function saveProduct() {{
            // Collect form data
            const formData = {{
                id: productData.id,
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                price: parseFloat(document.getElementById('product-price').value),
                original_price: parseFloat(document.getElementById('product-original-price').value),
                category: document.getElementById('product-category').value,
                stock_quantity: parseInt(document.getElementById('stock-quantity').value),
                low_stock_threshold: parseInt(document.getElementById('low-stock-threshold').value),
                sale_percentage: parseInt(document.getElementById('sale-percentage').value),
                tags: document.getElementById('product-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                colors: Array.from(document.querySelectorAll('input[type="checkbox"][value^="Black"], input[type="checkbox"][value^="White"], input[type="checkbox"][value^="Navy"], input[type="checkbox"][value^="Gray"], input[type="checkbox"][value^="Red"], input[type="checkbox"][value^="Green"]:checked')).map(cb => cb.value),
                sizes: Array.from(document.querySelectorAll('input[type="checkbox"][value^="XS"], input[type="checkbox"][value^="S"], input[type="checkbox"][value^="M"], input[type="checkbox"][value^="L"], input[type="checkbox"][value^="XL"], input[type="checkbox"][value^="XXL"]:checked')).map(cb => cb.value),
                specifications: {{
                    material: document.getElementById('spec-material').value,
                    weight: document.getElementById('spec-weight').value,
                    fit: document.getElementById('spec-fit').value,
                    neck_style: document.getElementById('spec-neck').value,
                    sleeve_length: document.getElementById('spec-sleeve').value,
                    origin: document.getElementById('spec-origin').value
                }},
                features: {{
                    preshrunk: document.getElementById('feature-preshrunk').checked,
                    double_stitched: document.getElementById('feature-double-stitched').checked,
                    fade_resistant: document.getElementById('feature-fade-resistant').checked,
                    soft_touch: document.getElementById('feature-soft-touch').checked
                }}
            }};

            // Save to localStorage
            localStorage.setItem(`product_${{productData.id}}`, JSON.stringify(formData));
            
            alert('Product updated successfully!');
            window.location.href = 'admin-uploads.html';
        }}

        function cancelEdit() {{
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {{
                window.location.href = 'admin-uploads.html';
            }}
        }}

        // Load product data when page loads
        document.addEventListener('DOMContentLoaded', function() {{
            loadProductData();
        }});
    </script>
</body>
</html>'''

    return edit_page_content

def create_edit_page_for_new_product(product_name, product_id=None):
    """Create an edit page for a newly created product"""
    
    if product_id is None:
        product_id = get_next_product_id()
    
    # Create product data
    product_data = {
        'id': str(product_id).zfill(2),  # Ensure 2-digit format
        'name': product_name,
        'filename': f"product_{str(product_id).zfill(2)}_{clean_product_name(product_name)}.jpg"
    }
    
    # Create the edit page content
    edit_page_content = create_individual_edit_page(product_data)
    
    # Create filename for edit page
    clean_name = clean_product_name(product_name)
    edit_page_filename = f"product-edit-product-{product_data['id']}_{clean_name}.html"
    edit_page_path = Path('pages') / edit_page_filename
    
    # Write the edit page
    with open(edit_page_path, 'w', encoding='utf-8') as f:
        f.write(edit_page_content)
    
    print(f"✅ Created edit page for new product: {product_name} (ID: {product_id})")
    
    return {
        'id': product_id,
        'name': product_name,
        'filename': edit_page_filename,
        'path': edit_page_path
    }

def delete_edit_page(product_id):
    """Delete the edit page for a specific product"""
    pages_dir = Path('pages')
    
    # Find the edit page for this product ID
    pattern = f"product-edit-product-{str(product_id).zfill(2)}_*.html"
    matching_files = list(pages_dir.glob(pattern))
    
    if matching_files:
        for file_path in matching_files:
            try:
                file_path.unlink()
                print(f"✅ Deleted edit page: {file_path.name}")
                return True
            except Exception as e:
                print(f"❌ Error deleting edit page {file_path.name}: {e}")
                return False
    else:
        print(f"⚠️ No edit page found for product ID {product_id}")
        return False

def update_admin_mapping():
    """Update the admin-uploads.html file with the current product mapping"""
    
    # Get all existing edit pages
    pages_dir = Path('pages')
    edit_pages = list(pages_dir.glob('product-edit-product-*.html'))
    
    # Create mapping
    product_mapping = {}
    for page in edit_pages:
        filename = page.name
        # Extract ID from filename like "product-edit-product-01_..."
        match = re.search(r'product-edit-product-(\d+)_', filename)
        if match:
            product_id = int(match.group(1))
            product_mapping[product_id] = filename
    
    # Generate the JavaScript mapping
    mapping_js = "const productEditPages = {\n"
    for product_id in sorted(product_mapping.keys()):
        mapping_js += f"    {product_id}: '{product_mapping[product_id]}',\n"
    mapping_js += "};"
    
    print("📝 Product mapping updated:")
    for product_id, filename in sorted(product_mapping.items()):
        print(f"   Product {product_id}: {filename}")
    
    return mapping_js

def main():
    """Main function to create all product edit pages"""
    
    # Create pages directory if it doesn't exist
    pages_dir = Path('pages')
    pages_dir.mkdir(exist_ok=True)
    
    # Get all product images
    etsy_images_dir = Path('etsy_images')
    if not etsy_images_dir.exists():
        print("❌ etsy_images directory not found!")
        return
    
    # Get all jpg files
    image_files = list(etsy_images_dir.glob('*.jpg'))
    
    if not image_files:
        print("❌ No image files found in etsy_images directory!")
        return
    
    print(f"📁 Found {len(image_files)} product images")
    
    # Create edit pages for each product
    created_pages = []
    
    for image_file in sorted(image_files):
        product_data = get_product_data_from_filename(image_file.name)
        
        if product_data:
            # Create the edit page content
            edit_page_content = create_individual_edit_page(product_data)
            
            # Create filename for edit page
            clean_name = clean_product_name(product_data['name'])
            edit_page_filename = f"product-edit-product-{product_data['id']}-{clean_name}.html"
            edit_page_path = pages_dir / edit_page_filename
            
            # Write the edit page
            with open(edit_page_path, 'w', encoding='utf-8') as f:
                f.write(edit_page_content)
            
            created_pages.append({
                'id': product_data['id'],
                'name': product_data['name'],
                'filename': edit_page_filename,
                'path': edit_page_path
            })
            
            print(f"✅ Created edit page for product {product_data['id']}: {product_data['name']}")
    
    # Update admin mapping
    mapping_js = update_admin_mapping()
    
    # Create a summary file
    summary_content = f"""# Product Edit Pages Summary

Generated {len(created_pages)} individual product edit pages.

## Pages Created:

"""
    
    for page in created_pages:
        summary_content += f"- **Product {page['id']}**: {page['name']} → `{page['filename']}`\n"
    
    summary_content += f"""

## Usage:

1. Navigate to any edit page: `pages/product-edit-{page['id']}-{clean_product_name(page['name'])}.html`
2. Edit product details, pricing, and specifications
3. Click "Save Changes" to update the product
4. Click "Cancel" to return to admin dashboard

## File Structure:

```
pages/
├── product-edit-01-just-a-little-boo-jee-halloween-shirt.html
├── product-edit-02-just-a-little-poo-st-halloween-shirt.html
├── product-edit-03-wish-you-were-here-shirt.html
└── ... (total {len(created_pages)} files)
```

## Dynamic Management Functions:

- `create_edit_page_for_new_product(product_name, product_id)` - Create edit page for new product
- `delete_edit_page(product_id)` - Delete edit page for deleted product
- `get_next_product_id()` - Get next available product ID
- `update_admin_mapping()` - Update admin dashboard mapping

All edit pages are now ready for use!
"""
    
    with open('PRODUCT_EDIT_PAGES_SUMMARY.md', 'w', encoding='utf-8') as f:
        f.write(summary_content)
    
    print(f"\n🎉 Successfully created {len(created_pages)} product edit pages!")
    print("📄 Summary saved to: PRODUCT_EDIT_PAGES_SUMMARY.md")
    print("\n📝 Next steps:")
    print("1. Update admin-uploads.html to link to these individual edit pages")
    print("2. Test the edit functionality")
    print("3. Customize product data as needed")
    print("\n🔄 Dynamic Management:")
    print("- Use create_edit_page_for_new_product() when adding new products")
    print("- Use delete_edit_page() when removing products")
    print("- Use update_admin_mapping() to refresh admin dashboard")

if __name__ == "__main__":
    main() 