import requests
import json
import os
import html

def get_database_products():
    """Get products from the database API"""
    try:
        # This will be handled by client-side JavaScript, so we'll create a template
        # that loads data dynamically
        return []
    except Exception as e:
        print(f"Error fetching products: {e}")
        return []

def create_edit_page_content(product_id, product_name):
    """Create complete edit page content for a product"""
    clean_name = product_name.lower().replace(' ', '_').replace('-', '_').replace('&', 'and').replace("'", '').replace('"', '').replace('(', '').replace(')', '').replace(',', '').replace('.', '').replace('!', '').replace('?', '').replace('/', '_').replace('\\', '_')[:50]
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Product {product_id} - {product_name}</title>
    <link rel="stylesheet" href="../css/tailwind.css">
    <style>
        .edit-form {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        .form-section {{
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .form-group {{
            margin-bottom: 15px;
        }}
        .form-label {{
            display: block;
            margin-bottom: 5px;
            color: #fff;
            font-weight: 500;
        }}
        .form-input {{
            width: 100%;
            padding: 10px;
            border: 1px solid #444;
            border-radius: 4px;
            background: #2a2a2a;
            color: #fff;
        }}
        .checkbox-group {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 5px;
        }}
        .checkbox-item {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        .image-preview {{
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 4px;
            margin: 5px;
        }}
        .loading {{
            text-align: center;
            padding: 50px;
            color: #fff;
        }}
        .btn {{
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            margin-right: 10px;
        }}
        .btn-primary {{
            background: #3b82f6;
            color: white;
        }}
        .btn-secondary {{
            background: #6b7280;
            color: white;
        }}
        .btn-danger {{
            background: #ef4444;
            color: white;
        }}
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div class="edit-form">
        <div class="flex justify-between items-center mb-6">
            <h1 id="product-title" class="text-2xl font-bold">Edit Product {product_id}</h1>
            <div>
                <button onclick="cancelEdit()" class="btn btn-secondary">Cancel</button>
                <button type="submit" form="product-edit-form" class="btn btn-primary">Save Changes</button>
            </div>
        </div>

        <!-- Loading State -->
        <div id="loading-state" class="loading">
            <div class="text-xl mb-4">🔄 Loading product data...</div>
            <div class="text-gray-400">Please wait while we fetch the current product information.</div>
        </div>

        <!-- Edit Form -->
        <form id="product-edit-form" style="display: none;">
            <!-- Basic Information -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
                
                <div class="form-group">
                    <label for="product-name" class="form-label">Product Name</label>
                    <input type="text" id="product-name" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label for="product-description" class="form-label">Description</label>
                    <textarea id="product-description" class="form-input" rows="3"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="product-price" class="form-label">Price ($)</label>
                        <input type="number" id="product-price" class="form-input" step="0.01" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-original_price" class="form-label">Original Price ($)</label>
                        <input type="number" id="product-original_price" class="form-input" step="0.01">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="product-category" class="form-label">Category</label>
                        <select id="product-category" class="form-input">
                            <option value="Halloween">Halloween</option>
                            <option value="Custom Designs">Custom Designs</option>
                            <option value="Humor & Sass">Humor & Sass</option>
                            <option value="Awareness">Awareness</option>
                            <option value="Pop Culture">Pop Culture</option>
                            <option value="Horror">Horror</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="sale-percentage" class="form-label">Sale Percentage</label>
                        <input type="number" id="sale-percentage" class="form-input" min="0" max="100">
                    </div>
                </div>
            </div>

            <!-- Inventory -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Inventory</h2>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="stock-quantity" class="form-label">Stock Quantity</label>
                        <input type="number" id="stock-quantity" class="form-input" min="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="low-stock-threshold" class="form-label">Low Stock Threshold</label>
                        <input type="number" id="low-stock-threshold" class="form-input" min="0">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="product-tags" class="form-label">Tags (comma-separated)</label>
                    <input type="text" id="product-tags" class="form-input" placeholder="tag1, tag2, tag3">
                </div>
            </div>

            <!-- Colors -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Available Colors</h2>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="color-black" value="Black">
                        <label for="color-black">Black</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="color-white" value="White">
                        <label for="color-white">White</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="color-navy" value="Navy">
                        <label for="color-navy">Navy</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="color-gray" value="Gray">
                        <label for="color-gray">Gray</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="color-red" value="Red">
                        <label for="color-red">Red</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="color-green" value="Green">
                        <label for="color-green">Green</label>
                    </div>
                </div>
            </div>

            <!-- Sizes -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Available Sizes</h2>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="size-xs" value="XS">
                        <label for="size-xs">XS</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="size-s" value="S">
                        <label for="size-s">S</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="size-m" value="M">
                        <label for="size-m">M</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="size-l" value="L">
                        <label for="size-l">L</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="size-xl" value="XL">
                        <label for="size-xl">XL</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="size-xxl" value="XXL">
                        <label for="size-xxl">XXL</label>
                    </div>
                </div>
            </div>

            <!-- Specifications -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Specifications</h2>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="spec-material" class="form-label">Material</label>
                        <input type="text" id="spec-material" class="form-input" value="100% Cotton">
                    </div>
                    
                    <div class="form-group">
                        <label for="spec-weight" class="form-label">Weight</label>
                        <input type="text" id="spec-weight" class="form-input" value="6.1 oz">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="spec-fit" class="form-label">Fit</label>
                        <input type="text" id="spec-fit" class="form-input" value="Regular">
                    </div>
                    
                    <div class="form-group">
                        <label for="spec-neck" class="form-label">Neck Style</label>
                        <input type="text" id="spec-neck" class="form-input" value="Crew Neck">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="spec-sleeve" class="form-label">Sleeve Length</label>
                        <input type="text" id="spec-sleeve" class="form-input" value="Short Sleeve">
                    </div>
                    
                    <div class="form-group">
                        <label for="spec-origin" class="form-label">Origin</label>
                        <input type="text" id="spec-origin" class="form-input" value="Made in USA">
                    </div>
                </div>
            </div>

            <!-- Features -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Features</h2>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="feature-preshrunk">
                        <label for="feature-preshrunk">Preshrunk</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="feature-double_stitched">
                        <label for="feature-double_stitched">Double Stitched</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="feature-fade_resistant">
                        <label for="feature-fade_resistant">Fade Resistant</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="feature-soft_touch">
                        <label for="feature-soft_touch">Soft Touch</label>
                    </div>
                </div>
            </div>

            <!-- Images -->
            <div class="form-section">
                <h2 class="text-xl font-semibold mb-4">Images</h2>
                
                <div class="form-group">
                    <label for="image-upload" class="form-label">Upload New Images</label>
                    <input type="file" id="image-upload" multiple accept="image/*" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Current Images</label>
                    <div id="current-images" class="flex flex-wrap gap-2">
                        <p class="text-gray-400">Loading images...</p>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <script>
        const productId = {product_id}; // Actual product ID from database
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
            document.getElementById('product-original_price').value = productData.original_price || 0;
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
            document.getElementById('feature-preshrunk').checked = features.preshrunk || false;
            document.getElementById('feature-double_stitched').checked = features.double_stitched || false;
            document.getElementById('feature-fade_resistant').checked = features.fade_resistant || false;
            document.getElementById('feature-soft_touch').checked = features.soft_touch || false;

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
                original_price: parseFloat(document.getElementById('product-original_price').value),
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
                    preshrunk: document.getElementById('feature-preshrunk').checked,
                    double_stitched: document.getElementById('feature-double_stitched').checked,
                    fade_resistant: document.getElementById('feature-fade-resistant').checked,
                    soft_touch: document.getElementById('feature-soft_touch').checked
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

def main():
    print("🔍 Creating edit pages for actual database products...")
    
    # Get the actual product IDs from our database check
    actual_products = [
        (433, "Just a Little BOO-jee Halloween Shirt"),
        (434, "Just a Little BOO-st Halloween Shirt"),
        (435, "Wish You Were Here Shirt"),
        (436, "Halloween One Two He's Coming for You Shirt"),
        (437, "Personalized Straight Outta (Add Text) Shirt"),
        (438, "Custom Bridezilla Shirt"),
        (439, "Kid's Halloween Horror Friends Hoodie"),
        (440, "Best Dad Ever T-Shirt"),
        (441, "Grandma Heart Shirt"),
        (442, "Custom Father's Day Photo Shirt for Dad"),
        (443, "Custom Father's Day Photo Shirt for Dad"),
        (444, "Fathers Day Shirt"),
        (445, "Father's Day Shirt"),
        (446, "Look Who's All Grown Up And Ready For Senior Discounts"),
        (447, "Acknowledge Me It's My Birthday Shirt"),
        (448, "Biker Lives Matter Shirt"),
        (449, "Girl's Trip 2025 Shirt"),
        (450, "Old Lives Matter Shirt"),
        (451, "Breast Cancer Awareness Shirt"),
        (452, "Breast Cancer Awareness Shirt"),
        (453, "Down Syndrome Awareness Shirt"),
        (454, "Down Syndrome Awareness Shirt"),
        (455, "Bikers Against Dumbass Drivers Shirt"),
        (456, "Family Jurassic Birthday Shirt"),
        (457, "Custom The Devil Whispered to Me I'm Coming For You Shirt"),
        (458, "Custom Vintage Dude Birthday Shirt"),
        (459, "Custom Grumpy Old Man Shirt"),
        (460, "Teaching My Favorite Peeps Shirt"),
        (461, "Matching St. Patrick's Day Shirts"),
        (473, "Down Syndrome Awareness Shirt"),
        (475, "Acknowledge Me Birthday Shirt"),
        (477, "Down Syndrome Awareness Shirt"),
        (479, "Acknowledge Me Birthday Shirt")
    ]
    
    pages_created = 0
    
    for product_id, product_name in actual_products:
        try:
            # Create filename
            clean_name = product_name.lower().replace(' ', '_').replace('-', '_').replace('&', 'and').replace("'", '').replace('"', '').replace('(', '').replace(')', '').replace(',', '').replace('.', '').replace('!', '').replace('?', '').replace('/', '_').replace('\\', '_')[:50]
            filename = f"pages/product-edit-product-{product_id}_{clean_name}.html"
            
            # Create content
            content = create_edit_page_content(product_id, product_name)
            
            # Write file
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Created: {filename}")
            pages_created += 1
            
        except Exception as e:
            print(f"❌ Error creating page for product {product_id}: {e}")
    
    print(f"🎉 Successfully created {pages_created} edit pages!")
    print("📝 Now all edit pages correspond to actual database products!")

if __name__ == "__main__":
    main() 