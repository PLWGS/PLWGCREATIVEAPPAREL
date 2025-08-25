#!/usr/bin/env python3
"""
Script to fetch REAL product data from database and update all edit pages with actual current data.
This will ensure all edit pages show the REAL data instead of default values.
"""

import os
import re
import json
import requests
import base64

def get_admin_token():
    """Get admin token from browser local storage or prompt user"""
    print("🔑 To fetch real product data, I need your admin token.")
    print("📝 Please get your admin token from your browser:")
    print("   1. Open your browser's Developer Tools (F12)")
    print("   2. Go to Application/Storage tab")
    print("   3. Look for Local Storage")
    print("   4. Find 'adminToken' and copy its value")
    print("   5. Paste it here:")
    
    token = input("Enter your admin token: ").strip()
    return token

def fetch_real_product_data(token):
    """Fetch real product data from the database API"""
    url = "http://localhost:3000/api/admin/products"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            products = response.json()
            print(f"✅ Successfully fetched {len(products)} products from database")
            return products
        else:
            print(f"❌ Error fetching products: {response.status_code}")
            print(f"Response: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error connecting to API: {e}")
        return []

def clean_product_name(name):
    """Clean product name for use in filename"""
    if not name:
        return "unknown_product"
    
    # Remove special characters and replace spaces with underscores
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    cleaned = re.sub(r'\s+', '_', cleaned.strip())
    cleaned = cleaned.lower()
    
    # Limit length to avoid filename issues
    if len(cleaned) > 50:
        cleaned = cleaned[:50]
    
    return cleaned

def escape_html(text):
    """Escape HTML entities for safe display"""
    if not text:
        return ""
    return (text.replace('&', '&amp;')
               .replace('<', '&lt;')
               .replace('>', '&gt;')
               .replace('"', '&quot;')
               .replace("'", '&#39;'))

def create_complete_edit_page_content(product_data):
    """Create the complete HTML content for an edit page with REAL data"""
    
    product_id = product_data.get('id', 0)
    name = escape_html(product_data.get('name', 'Unknown Product'))
    description = escape_html(product_data.get('description', ''))
    price = product_data.get('price', 0)
    original_price = product_data.get('original_price', 0)
    category = escape_html(product_data.get('category', ''))
    stock_quantity = product_data.get('stock_quantity', 50)
    low_stock_threshold = product_data.get('low_stock_threshold', 5)
    sale_percentage = product_data.get('sale_percentage', 15)
    tags = product_data.get('tags', [])
    colors = product_data.get('colors', ['Black'])
    sizes = product_data.get('sizes', ['S', 'M', 'L', 'XL', 'XXL'])
    images = product_data.get('images', [])
    specifications = product_data.get('specifications', {})
    features = product_data.get('features', {})
    
    # Convert arrays to JSON strings for JavaScript
    tags_json = json.dumps(tags)
    colors_json = json.dumps(colors)
    sizes_json = json.dumps(sizes)
    images_json = json.dumps(images)
    specifications_json = json.dumps(specifications)
    features_json = json.dumps(features)
    
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Product {product_id} - {name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
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
        .image-preview {{
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
            border: 2px solid rgba(0, 188, 212, 0.3);
        }}
        .image-upload-area {{
            border: 2px dashed rgba(0, 188, 212, 0.3);
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            background: rgba(26, 26, 26, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        .image-upload-area:hover {{
            border-color: #00bcd4;
            background: rgba(26, 26, 26, 0.8);
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
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Edit Product: {name}</h1>
            <p class="text-gray-400">Update product details, pricing, and specifications</p>
        </div>

        <!-- Product Edit Form -->
        <form id="product-edit-form" class="edit-form">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column - Basic Info -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Basic Information</h2>
                    
                    <div class="form-group">
                        <label for="product-name" class="form-label">Product Name</label>
                        <input type="text" id="product-name" class="form-input" value="{name}" required>
                    </div>

                    <div class="form-group">
                        <label for="product-description" class="form-label">Description</label>
                        <textarea id="product-description" class="form-input form-textarea" rows="4">{description}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="product-category" class="form-label">Category</label>
                        <select id="product-category" class="form-input">
                            <option value="Halloween" {'selected' if category == 'Halloween' else ''}>Halloween</option>
                            <option value="Father\'s Day" {'selected' if category == 'Father\'s Day' else ''}>Father's Day</option>
                            <option value="Birthday" {'selected' if category == 'Birthday' else ''}>Birthday</option>
                            <option value="Custom" {'selected' if category == 'Custom' else ''}>Custom</option>
                            <option value="Cancer Awareness" {'selected' if category == 'Cancer Awareness' else ''}>Cancer Awareness</option>
                            <option value="Retirement" {'selected' if category == 'Retirement' else ''}>Retirement</option>
                            <option value="Family" {'selected' if category == 'Family' else ''}>Family</option>
                            <option value="Holiday" {'selected' if category == 'Holiday' else ''}>Holiday</option>
                            <option value="Funny" {'selected' if category == 'Funny' else ''}>Funny</option>
                            <option value="Personalized" {'selected' if category == 'Personalized' else ''}>Personalized</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="product-price" class="form-label">Price ($)</label>
                        <input type="number" id="product-price" class="form-input" step="0.01" min="0" value="{price}" required>
                    </div>

                    <div class="form-group">
                        <label for="product-original-price" class="form-label">Original Price ($)</label>
                        <input type="number" id="product-original-price" class="form-input" step="0.01" min="0" value="{original_price}">
                    </div>

                    <div class="form-group">
                        <label for="sale-percentage" class="form-label">Sale Percentage (%)</label>
                        <input type="number" id="sale-percentage" class="form-input" min="0" max="100" value="{sale_percentage}">
                    </div>
                </div>

                <!-- Right Column - Inventory & Specs -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Inventory & Specifications</h2>
                    
                    <div class="form-group">
                        <label for="stock-quantity" class="form-label">Stock Quantity</label>
                        <input type="number" id="stock-quantity" class="form-input" min="0" value="{stock_quantity}">
                    </div>

                    <div class="form-group">
                        <label for="low-stock-threshold" class="form-label">Low Stock Threshold</label>
                        <input type="number" id="low-stock-threshold" class="form-input" min="0" value="{low_stock_threshold}">
                    </div>

                    <div class="form-group">
                        <label for="product-tags" class="form-label">Tags (comma-separated)</label>
                        <input type="text" id="product-tags" class="form-input" placeholder="funny, birthday, custom" value="{', '.join(tags)}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Colors</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" value="Black" class="mr-2" {'checked' if 'Black' in colors else ''}> Black
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="White" class="mr-2" {'checked' if 'White' in colors else ''}> White
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Navy" class="mr-2" {'checked' if 'Navy' in colors else ''}> Navy
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Gray" class="mr-2" {'checked' if 'Gray' in colors else ''}> Gray
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Red" class="mr-2" {'checked' if 'Red' in colors else ''}> Red
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Green" class="mr-2" {'checked' if 'Green' in colors else ''}> Green
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Sizes</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" value="XS" class="mr-2" {'checked' if 'XS' in sizes else ''}> XS
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="S" class="mr-2" {'checked' if 'S' in sizes else ''}> S
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="M" class="mr-2" {'checked' if 'M' in sizes else ''}> M
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="L" class="mr-2" {'checked' if 'L' in sizes else ''}> L
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XL" class="mr-2" {'checked' if 'XL' in sizes else ''}> XL
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XXL" class="mr-2" {'checked' if 'XXL' in sizes else ''}> XXL
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Images -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Images</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="form-label">Current Images</label>
                        <div id="current-images" class="grid grid-cols-2 gap-4 mt-2">
                            <!-- Current images will be loaded here -->
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Upload New Images</label>
                        <div class="image-upload-area" onclick="document.getElementById('image-upload').click()">
                            <div class="text-gray-400 mb-2">
                                <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                <p>Click to upload images</p>
                                <p class="text-sm">Drag and drop images here or click to browse</p>
                            </div>
                        </div>
                        <input type="file" id="image-upload" multiple accept="image/*" style="display: none;">
                    </div>
                </div>
            </div>

            <!-- Product Specifications -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Specifications</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="form-group">
                        <label for="spec-material" class="form-label">Material</label>
                        <input type="text" id="spec-material" class="form-input" value="{specifications.get('material', '100% Cotton')}">
                    </div>
                    <div class="form-group">
                        <label for="spec-weight" class="form-label">Weight</label>
                        <input type="text" id="spec-weight" class="form-input" value="{specifications.get('weight', '6.1 oz')}">
                    </div>
                    <div class="form-group">
                        <label for="spec-fit" class="form-label">Fit</label>
                        <select id="spec-fit" class="form-input">
                            <option value="Regular" {'selected' if specifications.get('fit') == 'Regular' else ''}>Regular</option>
                            <option value="Slim" {'selected' if specifications.get('fit') == 'Slim' else ''}>Slim</option>
                            <option value="Relaxed" {'selected' if specifications.get('fit') == 'Relaxed' else ''}>Relaxed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-neck" class="form-label">Neck Style</label>
                        <select id="spec-neck" class="form-input">
                            <option value="Crew Neck" {'selected' if specifications.get('neck_style') == 'Crew Neck' else ''}>Crew Neck</option>
                            <option value="V-Neck" {'selected' if specifications.get('neck_style') == 'V-Neck' else ''}>V-Neck</option>
                            <option value="Hooded" {'selected' if specifications.get('neck_style') == 'Hooded' else ''}>Hooded</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-sleeve" class="form-label">Sleeve Length</label>
                        <select id="spec-sleeve" class="form-input">
                            <option value="Short Sleeve" {'selected' if specifications.get('sleeve_length') == 'Short Sleeve' else ''}>Short Sleeve</option>
                            <option value="Long Sleeve" {'selected' if specifications.get('sleeve_length') == 'Long Sleeve' else ''}>Long Sleeve</option>
                            <option value="Sleeveless" {'selected' if specifications.get('sleeve_length') == 'Sleeveless' else ''}>Sleeveless</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-origin" class="form-label">Origin</label>
                        <input type="text" id="spec-origin" class="form-input" value="{specifications.get('origin', 'Made in USA')}">
                    </div>
                </div>
            </div>

            <!-- Product Features -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Features</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <label class="flex items-center">
                        <input type="checkbox" id="feature-double-stitched" class="mr-3" {'checked' if features.get('double_stitched') else ''}>
                        <span>Double Stitched</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-fade-resistant" class="mr-3" {'checked' if features.get('fade_resistant') else ''}>
                        <span>Fade Resistant</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-soft-touch" class="mr-3" {'checked' if features.get('soft_touch') else ''}>
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
        // Product data from server
        const productData = {{
            id: {product_id},
            name: "{name}",
            description: "{description}",
            price: {price},
            original_price: {original_price},
            category: "{category}",
            stock_quantity: {stock_quantity},
            low_stock_threshold: {low_stock_threshold},
            sale_percentage: {sale_percentage},
            tags: {tags_json},
            colors: {colors_json},
            sizes: {sizes_json},
            images: {images_json},
            specifications: {specifications_json},
            features: {features_json}
        }};

        // Load current images
        function loadCurrentImages() {{
            const currentImagesContainer = document.getElementById('current-images');
            if (productData.images && productData.images.length > 0) {{
                productData.images.forEach((image, index) => {{
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'relative';
                    imgDiv.innerHTML = `
                        <img src="${{image}}" alt="Product image" class="image-preview">
                        <button type="button" onclick="removeImage(${{index}})" class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                    `;
                    currentImagesContainer.appendChild(imgDiv);
                }});
            }} else {{
                currentImagesContainer.innerHTML = '<p class="text-gray-400">No images uploaded</p>';
            }}
        }}

        // Handle image upload
        document.getElementById('image-upload').addEventListener('change', function(e) {{
            const files = e.target.files;
            for (let file of files) {{
                const reader = new FileReader();
                reader.onload = function(e) {{
                    productData.images.push(e.target.result);
                    loadCurrentImages();
                }};
                reader.readAsDataURL(file);
            }}
        }});

        // Remove image
        function removeImage(index) {{
            productData.images.splice(index, 1);
            loadCurrentImages();
        }}

        // Handle form submission
        document.getElementById('product-edit-form').addEventListener('submit', async function(e) {{
            e.preventDefault();
            
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
                images: productData.images,
                specifications: {{
                    material: document.getElementById('spec-material').value,
                    weight: document.getElementById('spec-weight').value,
                    fit: document.getElementById('spec-fit').value,
                    neck_style: document.getElementById('spec-neck').value,
                    sleeve_length: document.getElementById('spec-sleeve').value,
                    origin: document.getElementById('spec-origin').value
                }},
                features: {{
    
                    double_stitched: document.getElementById('feature-double-stitched').checked,
                    fade_resistant: document.getElementById('feature-fade-resistant').checked,
                    soft_touch: document.getElementById('feature-soft-touch').checked
                }}
            }};

            try {{
                const response = await fetch('/api/admin/products/{product_id}', {{
                    method: 'PUT',
                    headers: {{
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                    }},
                    body: JSON.stringify(formData)
                }});
                
                if (response.ok) {{
                    alert('Product updated successfully!');
                    window.location.href = 'admin-uploads.html';
                }} else {{
                    alert('Error updating product. Please try again.');
                }}
            }} catch (error) {{
                console.error('Error:', error);
                alert('Error updating product. Please try again.');
            }}
        }});

        function cancelEdit() {{
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {{
                window.location.href = 'admin-uploads.html';
            }}
        }}

        // Load current images when page loads
        document.addEventListener('DOMContentLoaded', function() {{
            loadCurrentImages();
        }});
    </script>
</body>
</html>'''
    
    return html_content

def get_existing_edit_pages():
    """Get list of existing edit page filenames"""
    pages_dir = "pages"
    existing_pages = []
    
    if os.path.exists(pages_dir):
        for filename in os.listdir(pages_dir):
            if filename.startswith("product-edit-product-") and filename.endswith(".html"):
                existing_pages.append(filename)
    
    return existing_pages

def extract_product_id_from_filename(filename):
    """Extract product ID from edit page filename"""
    match = re.search(r'product-edit-product-(\d+)_', filename)
    if match:
        return int(match.group(1))
    return None

def main():
    print("🔍 Fetching REAL product data and updating all edit pages...")
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("❌ No token provided. Exiting.")
        return
    
    # Fetch real product data
    products = fetch_real_product_data(token)
    if not products:
        print("❌ No products fetched. Exiting.")
        return
    
    # Create a mapping of product IDs to product data
    product_map = {product['id']: product for product in products}
    
    # Get existing edit pages
    existing_pages = get_existing_edit_pages()
    print(f"📁 Found {len(existing_pages)} existing edit pages")
    
    # Update each edit page with real data
    pages_dir = "pages"
    updated_count = 0
    
    for filename in existing_pages:
        product_id = extract_product_id_from_filename(filename)
        if product_id and product_id in product_map:
            product_data = product_map[product_id]
            
            # Create the complete edit page content with REAL data
            content = create_complete_edit_page_content(product_data)
            
            # Write the updated file
            filepath = os.path.join(pages_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            updated_count += 1
            print(f"✅ Updated: {filename} with REAL data for product {product_id}")
        else:
            print(f"⚠️  Skipped: {filename} - Product ID {product_id} not found in database")
    
    print(f"🎉 Successfully updated {updated_count} edit pages with REAL product data!")
    print("📝 Now all edit pages will show the ACTUAL current data from your database!")

if __name__ == "__main__":
    main() 