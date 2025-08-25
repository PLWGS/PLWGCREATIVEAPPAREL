#!/usr/bin/env python3
"""
Script to update edit pages to dynamically load REAL data from the database.
This will make each edit page fetch its own data when it loads, so you can see the actual current data.
"""

import os
import re
import json

def create_dynamic_edit_page_content(product_id, product_name):
    """Create an edit page that dynamically loads real data from the database"""
    
    # Clean the product name for the filename
    clean_name = product_name.replace(' ', '_').lower()[:50]
    
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Product {product_id} - {product_name}</title>
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
        .loading {{
            text-align: center;
            padding: 2rem;
            color: #00bcd4;
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
            <h1 class="text-3xl font-bold text-white mb-2">Edit Product: <span id="product-title">Loading...</span></h1>
            <p class="text-gray-400">Update product details, pricing, and specifications</p>
        </div>

        <!-- Loading State -->
        <div id="loading-state" class="loading">
            <div class="text-xl mb-4">🔄 Loading product data...</div>
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>

        <!-- Product Edit Form (initially hidden) -->
        <form id="product-edit-form" class="edit-form" style="display: none;">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column - Basic Info -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Basic Information</h2>
                    
                    <div class="form-group">
                        <label for="product-name" class="form-label">Product Name</label>
                        <input type="text" id="product-name" class="form-input" required>
                    </div>

                    <div class="form-group">
                        <label for="product-description" class="form-label">Description</label>
                        <textarea id="product-description" class="form-input form-textarea" rows="4"></textarea>
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
                        <input type="number" id="product-price" class="form-input" step="0.01" min="0" required>
                    </div>

                    <div class="form-group">
                        <label for="product-original-price" class="form-label">Original Price ($)</label>
                        <input type="number" id="product-original-price" class="form-input" step="0.01" min="0">
                    </div>

                    <div class="form-group">
                        <label for="sale-percentage" class="form-label">Sale Percentage (%)</label>
                        <input type="number" id="sale-percentage" class="form-input" min="0" max="100">
                    </div>
                </div>

                <!-- Right Column - Inventory & Specs -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Inventory & Specifications</h2>
                    
                    <div class="form-group">
                        <label for="stock-quantity" class="form-label">Stock Quantity</label>
                        <input type="number" id="stock-quantity" class="form-input" min="0">
                    </div>

                    <div class="form-group">
                        <label for="low-stock-threshold" class="form-label">Low Stock Threshold</label>
                        <input type="number" id="low-stock-threshold" class="form-input" min="0">
                    </div>

                    <div class="form-group">
                        <label for="product-tags" class="form-label">Tags (comma-separated)</label>
                        <input type="text" id="product-tags" class="form-input" placeholder="funny, birthday, custom">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Colors</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" value="Black" class="mr-2"> Black
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
                                <input type="checkbox" value="S" class="mr-2"> S
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="M" class="mr-2"> M
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="L" class="mr-2"> L
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XL" class="mr-2"> XL
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XXL" class="mr-2"> XXL
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
                        <input type="text" id="spec-material" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="spec-weight" class="form-label">Weight</label>
                        <input type="text" id="spec-weight" class="form-input">
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
                        <input type="text" id="spec-origin" class="form-input">
                    </div>
                </div>
            </div>

            <!-- Product Features -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Features</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <label class="flex items-center">
                        <input type="checkbox" id="feature-double-stitched" class="mr-3">
                        <span>Double Stitched</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-fade-resistant" class="mr-3">
                        <span>Fade Resistant</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-soft-touch" class="mr-3">
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
        const productId = {product_id};
        let productData = null;

        // Load product data from database
        async function loadProductData() {{
            try {{
                const response = await fetch(`/api/admin/products/${{productId}}`, {{
                    headers: {{
                        'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                    }}
                }});
                
                if (response.ok) {{
                    productData = await response.json();
                    populateForm();
                    document.getElementById('loading-state').style.display = 'none';
                    document.getElementById('product-edit-form').style.display = 'block';
                }} else {{
                    throw new Error('Failed to load product data');
                }}
            }} catch (error) {{
                console.error('Error loading product data:', error);
                document.getElementById('loading-state').innerHTML = `
                    <div class="text-red-500 text-xl mb-4">❌ Error loading product data</div>
                    <div class="text-gray-400">Please make sure you are logged in as admin and try again.</div>
                    <button onclick="loadProductData()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Retry</button>
                `;
            }}
        }}

        // Populate form with loaded data
        function populateForm() {{
            if (!productData) return;
            
            // Update title
            document.getElementById('product-title').textContent = productData.name;
            
            // Basic info
            document.getElementById('product-name').value = productData.name || '';
            document.getElementById('product-description').value = productData.description || '';
            document.getElementById('product-category').value = productData.category || 'Halloween';
            document.getElementById('product-price').value = productData.price || 0;
            document.getElementById('product-original-price').value = productData.original_price || 0;
            document.getElementById('sale-percentage').value = productData.sale_percentage || 15;
            
            // Inventory
            document.getElementById('stock-quantity').value = productData.stock_quantity || 50;
            document.getElementById('low-stock-threshold').value = productData.low_stock_threshold || 5;
            document.getElementById('product-tags').value = (productData.tags || []).join(', ');
            
            // Colors
            const colors = productData.colors || ['Black'];
            document.querySelectorAll('input[type="checkbox"][value^="Black"], input[type="checkbox"][value^="White"], input[type="checkbox"][value^="Navy"], input[type="checkbox"][value^="Gray"], input[type="checkbox"][value^="Red"], input[type="checkbox"][value^="Green"]').forEach(checkbox => {{
                checkbox.checked = colors.includes(checkbox.value);
            }});
            
            // Sizes
            const sizes = productData.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
            document.querySelectorAll('input[type="checkbox"][value^="XS"], input[type="checkbox"][value^="S"], input[type="checkbox"][value^="M"], input[type="checkbox"][value^="L"], input[type="checkbox"][value^="XL"], input[type="checkbox"][value^="XXL"]').forEach(checkbox => {{
                checkbox.checked = sizes.includes(checkbox.value);
            }});
            
            // Specifications
            const specs = productData.specifications || {{}};
            document.getElementById('spec-material').value = specs.material || '100% Cotton';
            document.getElementById('spec-weight').value = specs.weight || '6.1 oz';
            document.getElementById('spec-fit').value = specs.fit || 'Regular';
            document.getElementById('spec-neck').value = specs.neck_style || 'Crew Neck';
            document.getElementById('spec-sleeve').value = specs.sleeve_length || 'Short Sleeve';
            document.getElementById('spec-origin').value = specs.origin || 'Made in USA';
            
            // Features
            const features = productData.features || {{}};

            document.getElementById('feature-double-stitched').checked = features.double_stitched || false;
            document.getElementById('feature-fade-resistant').checked = features.fade_resistant || false;
            document.getElementById('feature-soft-touch').checked = features.soft_touch || false;
            
            // Load images
            loadCurrentImages();
        }}

        // Load current images
        function loadCurrentImages() {{
            const currentImagesContainer = document.getElementById('current-images');
            if (productData && productData.images && productData.images.length > 0) {{
                currentImagesContainer.innerHTML = '';
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
                    if (!productData.images) productData.images = [];
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
                id: productId,
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
                images: productData.images || [],
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
                const response = await fetch(`/api/admin/products/${{productId}}`, {{
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

        // Load product data when page loads
        document.addEventListener('DOMContentLoaded', function() {{
            loadProductData();
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

def extract_product_name_from_filename(filename):
    """Extract product name from filename"""
    match = re.search(r'product-edit-product-\d+_(.+)\.html', filename)
    if match:
        product_name = match.group(1).replace('_', ' ').title()
    else:
        product_name = "Unknown Product"
    return product_name

def main():
    print("🔍 Updating all edit pages to dynamically load REAL data...")
    
    # Get existing edit pages
    existing_pages = get_existing_edit_pages()
    print(f"📁 Found {len(existing_pages)} existing edit pages")
    
    # Update each edit page
    pages_dir = "pages"
    updated_count = 0
    
    for filename in existing_pages:
        product_id = extract_product_id_from_filename(filename)
        product_name = extract_product_name_from_filename(filename)
        
        if product_id:
            # Create the dynamic edit page content
            content = create_dynamic_edit_page_content(product_id, product_name)
            
            # Write the updated file
            filepath = os.path.join(pages_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            updated_count += 1
            print(f"✅ Updated: {filename} to load REAL data dynamically")
    
    print(f"🎉 Successfully updated {updated_count} edit pages!")
    print("📝 Now when you click 'Edit' on any product, it will:")
    print("   1. Show a loading spinner")
    print("   2. Fetch the REAL data from your database")
    print("   3. Display all the actual current information")
    print("   4. Allow you to edit and save changes")

if __name__ == "__main__":
    main() 