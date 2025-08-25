/**
 * Product Management System
 * Handles dynamic creation and deletion of product edit pages
 */

class ProductManager {
    constructor() {
        this.productMapping = {};
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize the ProductManager
     */
    async init() {
        await this.loadProductMapping();
        this.initialized = true;
    }

    /**
     * Ensure the ProductManager is initialized before use
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    /**
     * Load the current product mapping from database
     */
    async loadProductMapping() {
        try {
            const response = await fetch('/api/admin/products', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const products = await response.json();
                this.productMapping = {};
                
                // Build mapping from actual database products
        products.forEach(product => {
                    this.productMapping[product.id] = `product-edit.html?id=${product.id}`;
                });
                
                console.log('📦 Product mapping loaded from database:', this.productMapping);
            } else {
                console.log('📦 No products in database, starting with empty mapping');
                this.productMapping = {};
            }
        } catch (error) {
            console.error('❌ Error loading product mapping:', error);
            this.productMapping = {};
        }
    }

    /**
     * Get the next available product ID
     */
    async getNextProductId() {
        await this.ensureInitialized();
        const existingIds = Object.keys(this.productMapping).map(Number);
        return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    }

    /**
     * Create a new product and its edit page
     */
    async createNewProduct(productData) {
        try {
            // Get next product ID
            const newProductId = await this.getNextProductId();
            
            // Create product data with new ID
            const newProduct = {
                id: newProductId,
                name: productData.name,
                description: productData.description || '',
                price: productData.price || 22.00,
                original_price: productData.original_price || 25.00,
                category: productData.category || '',
                stock_quantity: productData.stock_quantity || 50,
                low_stock_threshold: productData.low_stock_threshold || 5,
                sale_percentage: productData.sale_percentage || 15,
                // Tags retained internally for search but not shown on product page
                tags: productData.tags || [],
                colors: productData.colors || ['Black'],
                sizes: (productData.sizes || ['S', 'M', 'L', 'XL', 'XXL']).filter(s => s !== 'XS'),
                image_url: productData.image_url || null,
                specifications: productData.specifications || {
                    material: '100% Cotton',
                    weight: '6.1 oz',
                    fit: 'Regular',
                    neck_style: 'Crew Neck',
                    sleeve_length: 'Short Sleeve',
                    origin: 'Made in USA'
                },
                features: productData.features || {
                    preshrunk: true,
                    double_stitched: true,
                    fade_resistant: true,
                    soft_touch: true
                }
            };

            // Create the edit page
            const editPageResult = await this.createEditPage(newProduct);
            
            if (editPageResult.success) {
                // Add to mapping
                this.productMapping[newProductId] = editPageResult.filename;
                
                // Save to localStorage for demo purposes
                localStorage.setItem(`product_${newProductId}`, JSON.stringify(newProduct));
                
                console.log(`✅ Created new product: ${newProduct.name} (ID: ${newProductId})`);
                return {
                    success: true,
                    product: newProduct,
                    editPage: editPageResult.filename
                };
            } else {
                throw new Error(editPageResult.error);
            }
            
        } catch (error) {
            console.error('❌ Error creating new product:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create an edit page for a product
     */
    async createEditPage(product) {
        try {
            // Clean product name for filename
            const cleanName = this.cleanProductName(product.name);
            const productId = String(product.id).padStart(2, '0');
            
            // Create filename
            const editPageFilename = `product-edit-product-${productId}_${cleanName}.html`;
            
            // Create the edit page content
            const editPageContent = this.generateEditPageContent(product);
            
            // In a real application, this would be sent to the server
            // For now, we'll simulate the creation
            console.log(`📄 Creating edit page: ${editPageFilename}`);
            
            return {
                success: true,
                filename: editPageFilename,
                content: editPageContent
            };
            
        } catch (error) {
            console.error('❌ Error creating edit page:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create an edit page for a database product
     */
    async createEditPageForDatabaseProduct(dbProduct) {
        try {
            // Clean product name for filename
            const cleanName = this.cleanProductName(dbProduct.name);
            const productId = String(dbProduct.id).padStart(2, '0');
            
            // Create filename
            const editPageFilename = `product-edit-product-${productId}_${cleanName}.html`;
            
            // Convert database product to our format
            const product = {
                id: dbProduct.id,
                name: dbProduct.name,
                description: dbProduct.description || '',
                price: parseFloat(dbProduct.price),
                original_price: parseFloat(dbProduct.original_price) || 0,
                category: dbProduct.category || '',
                stock_quantity: dbProduct.stock_quantity || 50,
                low_stock_threshold: dbProduct.low_stock_threshold || 5,
                sale_percentage: dbProduct.sale_percentage || 15,
                tags: dbProduct.tags || [],
                colors: dbProduct.colors || ['Black'],
                sizes: (dbProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']).filter(s => s !== 'XS'),
                image_url: dbProduct.image_url || null,
                specifications: dbProduct.specifications || {
                    material: '100% Cotton',
                    weight: '6.1 oz',
                    fit: 'Regular',
                    neck_style: 'Crew Neck',
                    sleeve_length: 'Short Sleeve',
                    origin: 'Made in USA'
                },
                features: dbProduct.features || {
                    preshrunk: true,
                    double_stitched: true,
                    fade_resistant: true,
                    soft_touch: true
                }
            };
            
            // Create the edit page content
            const editPageContent = this.generateEditPageContent(product);
            
            // Add to mapping
            this.productMapping[dbProduct.id] = editPageFilename;
            
            console.log(`📄 Creating edit page for database product: ${editPageFilename}`);
            
            return {
                success: true,
                filename: editPageFilename,
                content: editPageContent,
                product: product
            };
            
        } catch (error) {
            console.error('❌ Error creating edit page for database product:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete a product and its edit page
     */
    async deleteProduct(productId) {
        try {
            // First, delete from database
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                // Remove from mapping
                const editPageFilename = this.productMapping[productId];
                if (editPageFilename) {
                    delete this.productMapping[productId];
                    
                    // Remove from localStorage
                    localStorage.removeItem(`product_${productId}`);
                    
                    console.log(`✅ Deleted product ${productId} from database and edit page: ${editPageFilename}`);
                    return {
                        success: true,
                        deletedProductId: productId,
                        deletedEditPage: editPageFilename
                    };
                } else {
                    console.log(`✅ Deleted product ${productId} from database (no edit page found)`);
                    return {
                        success: true,
                        deletedProductId: productId,
                        deletedEditPage: null
                    };
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete product from database');
            }
            
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Navigate to edit page for a product
     */
    editProduct(productId) {
        window.location.href = `product-edit.html?id=${productId}`;
    }

    /**
     * Clean product name for use in filename
     */
    cleanProductName(name) {
        return name
            .replace(/[^\w\s-]/g, '')
            .replace(/[-\s]+/g, '_')
            .toLowerCase();
    }

    /**
     * Generate edit page HTML content
     */
    generateEditPageContent(product) {
        const cleanName = this.cleanProductName(product.name);
        const productId = String(product.id).padStart(2, '0');
        
        // Use the actual image data from the database if available, otherwise use a placeholder
        const imageSrc = product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjM0I0QjVCIi8+CjxwYXRoIGQ9Ik0yNSAyNUg3NVY3NUgyNVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0zNSA0NUw2NSA0NU02NSA2NUwzNSA2NUwzNSA0NVoiIHN0cm9rZT0iIzAwQkNENCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Edit ${product.name} - PlwgsCreativeApparel Admin</title>
    <meta name="description" content="Edit ${product.name} details and specifications for PlwgsCreativeApparel admin dashboard." />
    <link rel="stylesheet" href="../css/main.css" />
    <style>
        .edit-form {
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid rgba(0, 188, 212, 0.3);
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-label {
            display: block;
            color: #ffffff;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .form-input {
            width: 100%;
            padding: 0.75rem;
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid rgba(0, 188, 212, 0.3);
            border-radius: 8px;
            color: #ffffff;
            font-size: 1rem;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #00bcd4;
            box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
        }
        
        .form-textarea {
            min-height: 120px;
            resize: vertical;
        }
        
        .btn-save {
            background: linear-gradient(135deg, #00bcd4, #4dd0e1);
            color: #ffffff;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-save:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
        }
        
        .btn-cancel {
            background: rgba(239, 68, 68, 0.8);
            color: #ffffff;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 1rem;
        }
        
        .btn-cancel:hover {
            background: rgba(239, 68, 68, 1);
        }
        
        .product-image {
            max-width: 300px;
            border-radius: 8px;
            border: 2px solid rgba(0, 188, 212, 0.3);
        }
        
        .product-preview {
            text-align: center;
            margin-bottom: 2rem;
        }
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
            <img src="${imageSrc}" alt="${product.name}" class="product-image">
            <h2 class="text-xl font-semibold text-white mt-4">${product.name}</h2>
        </div>

        <!-- Product Edit Form -->
        <form id="product-edit-form" class="edit-form">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column - Basic Info -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Basic Information</h2>
                    
                    <div class="form-group">
                        <label for="product-name" class="form-label">Product Name</label>
                        <input type="text" id="product-name" class="form-input" value="${product.name}" required>
                    </div>

                    <div class="form-group">
                        <label for="product-description" class="form-label">Description</label>
                        <textarea id="product-description" class="form-input form-textarea" rows="4" placeholder="Enter product description...">${product.description}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="product-category" class="form-label">Category</label>
                        <select id="product-category" class="form-input">
                            <option value="Halloween" ${product.category === 'Halloween' ? 'selected' : ''}>Halloween</option>
                            <option value="Father's Day" ${product.category === 'Father\'s Day' ? 'selected' : ''}>Father's Day</option>
                            <option value="Birthday" ${product.category === 'Birthday' ? 'selected' : ''}>Birthday</option>
                            <option value="Custom" ${product.category === 'Custom' ? 'selected' : ''}>Custom</option>
                            <option value="Cancer Awareness" ${product.category === 'Cancer Awareness' ? 'selected' : ''}>Cancer Awareness</option>
                            <option value="Retirement" ${product.category === 'Retirement' ? 'selected' : ''}>Retirement</option>
                            <option value="Family" ${product.category === 'Family' ? 'selected' : ''}>Family</option>
                            <option value="Holiday" ${product.category === 'Holiday' ? 'selected' : ''}>Holiday</option>
                            <option value="Funny" ${product.category === 'Funny' ? 'selected' : ''}>Funny</option>
                            <option value="Personalized" ${product.category === 'Personalized' ? 'selected' : ''}>Personalized</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="product-price" class="form-label">Price ($)</label>
                        <input type="number" id="product-price" class="form-input" step="0.01" min="0" value="${product.price}" required>
                    </div>

                    <div class="form-group">
                        <label for="product-original-price" class="form-label">Original Price ($)</label>
                        <input type="number" id="product-original-price" class="form-input" step="0.01" min="0" value="${product.original_price}">
                    </div>

                    <div class="form-group">
                        <label for="sale-percentage" class="form-label">Sale Percentage (%)</label>
                        <input type="number" id="sale-percentage" class="form-input" min="0" max="100" value="${product.sale_percentage}">
                    </div>
                </div>

                <!-- Right Column - Inventory & Specs -->
                <div>
                    <h2 class="text-xl font-semibold text-white mb-6">Inventory & Specifications</h2>
                    
                    <div class="form-group">
                        <label for="stock-quantity" class="form-label">Stock Quantity</label>
                        <input type="number" id="stock-quantity" class="form-input" min="0" value="${product.stock_quantity}">
                    </div>

                    <div class="form-group">
                        <label for="low-stock-threshold" class="form-label">Low Stock Threshold</label>
                        <input type="number" id="low-stock-threshold" class="form-input" min="0" value="${product.low_stock_threshold}">
                    </div>

                    <div class="form-group">
                        <label for="product-tags" class="form-label">Tags (comma-separated)</label>
                        <input type="text" id="product-tags" class="form-input" placeholder="funny, birthday, custom" value="${product.tags.join(', ')}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Colors</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            <label class="flex items-center">
                                <input type="checkbox" value="Black" class="mr-2" ${product.colors.includes('Black') ? 'checked' : ''}> Black
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="White" class="mr-2" ${product.colors.includes('White') ? 'checked' : ''}> White
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Navy" class="mr-2" ${product.colors.includes('Navy') ? 'checked' : ''}> Navy
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Gray" class="mr-2" ${product.colors.includes('Gray') ? 'checked' : ''}> Gray
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Red" class="mr-2" ${product.colors.includes('Red') ? 'checked' : ''}> Red
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="Green" class="mr-2" ${product.colors.includes('Green') ? 'checked' : ''}> Green
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Available Sizes</label>
                        <div class="grid grid-cols-3 gap-2 mt-2">
                            
                            <label class="flex items-center">
                                <input type="checkbox" value="S" class="mr-2" ${product.sizes.includes('S') ? 'checked' : ''}> S
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="M" class="mr-2" ${product.sizes.includes('M') ? 'checked' : ''}> M
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="L" class="mr-2" ${product.sizes.includes('L') ? 'checked' : ''}> L
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XL" class="mr-2" ${product.sizes.includes('XL') ? 'checked' : ''}> XL
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" value="XXL" class="mr-2" ${product.sizes.includes('XXL') ? 'checked' : ''}> XXL
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
                        <input type="text" id="spec-material" class="form-input" value="${product.specifications.material}">
                    </div>
                    <div class="form-group">
                        <label for="spec-weight" class="form-label">Weight</label>
                        <input type="text" id="spec-weight" class="form-input" value="${product.specifications.weight}">
                    </div>
                    <div class="form-group">
                        <label for="spec-fit" class="form-label">Fit</label>
                        <select id="spec-fit" class="form-input">
                            <option value="Regular" ${product.specifications.fit === 'Regular' ? 'selected' : ''}>Regular</option>
                            <option value="Slim" ${product.specifications.fit === 'Slim' ? 'selected' : ''}>Slim</option>
                            <option value="Relaxed" ${product.specifications.fit === 'Relaxed' ? 'selected' : ''}>Relaxed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-neck" class="form-label">Neck Style</label>
                        <select id="spec-neck" class="form-input">
                            <option value="Crew Neck" ${product.specifications.neck_style === 'Crew Neck' ? 'selected' : ''}>Crew Neck</option>
                            <option value="V-Neck" ${product.specifications.neck_style === 'V-Neck' ? 'selected' : ''}>V-Neck</option>
                            <option value="Hooded" ${product.specifications.neck_style === 'Hooded' ? 'selected' : ''}>Hooded</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-sleeve" class="form-label">Sleeve Length</label>
                        <select id="spec-sleeve" class="form-input">
                            <option value="Short Sleeve" ${product.specifications.sleeve_length === 'Short Sleeve' ? 'selected' : ''}>Short Sleeve</option>
                            <option value="Long Sleeve" ${product.specifications.sleeve_length === 'Long Sleeve' ? 'selected' : ''}>Long Sleeve</option>
                            <option value="Sleeveless" ${product.specifications.sleeve_length === 'Sleeveless' ? 'selected' : ''}>Sleeveless</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="spec-origin" class="form-label">Origin</label>
                        <input type="text" id="spec-origin" class="form-input" value="${product.specifications.origin}">
                    </div>
                </div>
            </div>

            <!-- Product Features -->
            <div class="mt-8">
                <h2 class="text-xl font-semibold text-white mb-6">Product Features</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <label class="flex items-center">
                        <input type="checkbox" id="feature-double-stitched" class="mr-3" ${product.features.double_stitched ? 'checked' : ''}>
                        <span>Double Stitched</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-fade-resistant" class="mr-3" ${product.features.fade_resistant ? 'checked' : ''}>
                        <span>Fade Resistant</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="feature-soft-touch" class="mr-3" ${product.features.soft_touch ? 'checked' : ''}>
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
        const productData = ${JSON.stringify(product)};

        // Load product data into form
        function loadProductData() {
            // Load saved data from localStorage if available
            const savedData = localStorage.getItem(\`product_\${productData.id}\`);
            if (savedData) {
                const saved = JSON.parse(savedData);
                Object.assign(productData, saved);
            }
        }

        // Handle form submission
        document.getElementById('product-edit-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });

        function saveProduct() {
            // Collect form data
            const formData = {
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
                sizes: Array.from(document.querySelectorAll('input[type="checkbox"][value^="S"], input[type="checkbox"][value^="M"], input[type="checkbox"][value^="L"], input[type="checkbox"][value^="XL"], input[type="checkbox"][value^="XXL"]:checked')).map(cb => cb.value),
                specifications: {
                    material: document.getElementById('spec-material').value,
                    weight: document.getElementById('spec-weight').value,
                    fit: document.getElementById('spec-fit').value,
                    neck_style: document.getElementById('spec-neck').value,
                    sleeve_length: document.getElementById('spec-sleeve').value,
                    origin: document.getElementById('spec-origin').value
                },
                features: {
                    double_stitched: document.getElementById('feature-double-stitched').checked,
                    fade_resistant: document.getElementById('feature-fade-resistant').checked,
                    soft_touch: document.getElementById('feature-soft-touch').checked
                }
            };

            // Save to localStorage
            localStorage.setItem(\`product_\${productData.id}\`, JSON.stringify(formData));
            
            alert('Product updated successfully!');
            window.location.href = 'admin-uploads.html';
        }

        function cancelEdit() {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                window.location.href = 'admin-uploads.html';
            }
        }

        // Load product data when page loads
        document.addEventListener('DOMContentLoaded', function() {
            loadProductData();
        });
    </script>
</body>
</html>`;
    }

    /**
     * Update the admin dashboard mapping
     */
    updateAdminMapping() {
        // This would normally update the admin-uploads.html file
        // For now, we'll just log the current mapping
        console.log('📝 Current product mapping:');
        for (const [id, filename] of Object.entries(this.productMapping)) {
            console.log(`   Product ${id}: ${filename}`);
        }
    }
}

// Export for use in other files
window.ProductManager = ProductManager; 