#!/usr/bin/env python3
"""
Fix size chart placement in product edit pages - remove duplicates and place correctly
"""
import os
import re

def fix_size_chart_placement(file_path):
    """Fix size chart placement in a product edit page"""
    print(f"Fixing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all existing size chart sections
    size_chart_pattern = r'\s*<!-- Size Chart Configuration -->.*?</div>\s*</div>'
    content = re.sub(size_chart_pattern, '', content, flags=re.DOTALL)
    print(f"  ✅ Removed existing size chart sections")
    
    # Clean size chart HTML to insert in the correct place
    size_chart_html = '''
                </div>

                <!-- Size Chart Configuration -->
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-text-primary mb-2">Size Chart (inches)</label>
                    <div class="glass-card rounded-lg p-4 border border-accent border-opacity-20">
                        <!-- Garment Type Presets -->
                        <div class="mb-4">
                            <label class="block text-sm text-text-secondary mb-2">Garment Type</label>
                            <select id="garment-type" class="w-full px-3 py-2 bg-surface border border-surface-light rounded text-text-primary focus:border-accent focus:outline-none">
                                <option value="adult-tshirt" selected>Adult Unisex T-Shirt (Default)</option>
                                <option value="adult-hoodie">Adult Hoodie</option>
                                <option value="kids-tshirt">Kids T-Shirt</option>
                                <option value="kids-hoodie">Kids Hoodie</option>
                                <option value="custom">Custom (Manual Input)</option>
                            </select>
                            <p class="text-xs text-text-secondary mt-1">Select a preset to auto-fill measurements, or choose Custom to enter manually</p>
                        </div>

                        <!-- Size Chart Inputs -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div class="space-y-2">
                                <label class="block text-xs font-medium text-accent uppercase tracking-wide">Size S</label>
                                <div>
                                    <label class="block text-xs text-text-secondary">Chest Width</label>
                                    <input type="text" id="size-s-chest" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="18" placeholder="18">
                                </div>
                                <div>
                                    <label class="block text-xs text-text-secondary">Length</label>
                                    <input type="text" id="size-s-length" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="28" placeholder="28">
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-medium text-accent uppercase tracking-wide">Size M</label>
                                <div>
                                    <label class="block text-xs text-text-secondary">Chest Width</label>
                                    <input type="text" id="size-m-chest" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="20" placeholder="20">
                                </div>
                                <div>
                                    <label class="block text-xs text-text-secondary">Length</label>
                                    <input type="text" id="size-m-length" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="29" placeholder="29">
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-medium text-accent uppercase tracking-wide">Size L</label>
                                <div>
                                    <label class="block text-xs text-text-secondary">Chest Width</label>
                                    <input type="text" id="size-l-chest" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="22" placeholder="22">
                                </div>
                                <div>
                                    <label class="block text-xs text-text-secondary">Length</label>
                                    <input type="text" id="size-l-length" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="30" placeholder="30">
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-medium text-accent uppercase tracking-wide">Size XL</label>
                                <div>
                                    <label class="block text-xs text-text-secondary">Chest Width</label>
                                    <input type="text" id="size-xl-chest" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="24" placeholder="24">
                                </div>
                                <div>
                                    <label class="block text-xs text-text-secondary">Length</label>
                                    <input type="text" id="size-xl-length" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="31" placeholder="31">
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-medium text-accent uppercase tracking-wide">Size 2XL</label>
                                <div>
                                    <label class="block text-xs text-text-secondary">Chest Width</label>
                                    <input type="text" id="size-2xl-chest" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="26" placeholder="26">
                                </div>
                                <div>
                                    <label class="block text-xs text-text-secondary">Length</label>
                                    <input type="text" id="size-2xl-length" class="w-full px-2 py-1 bg-surface border border-surface-light rounded text-text-primary text-sm focus:border-accent focus:outline-none" value="32" placeholder="32">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Custom Input Options -->
                <div class="space-y-4">'''
    
    # Find the end of Product Features section and insert size chart
    features_pattern = r'(</div>\s*</div>\s*<!-- Custom Input Options -->)'
    if re.search(features_pattern, content):
        content = re.sub(features_pattern, size_chart_html, content)
        print(f"  ✅ Added size chart section in correct location")
    else:
        print(f"  ❌ Could not find Product Features section end")
        return False
    
    # Write updated content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Successfully fixed {file_path}")
    return True

def main():
    """Fix size chart placement in all product edit pages"""
    pages_dir = 'pages'
    
    # Find all product edit pages
    edit_pages = []
    for filename in os.listdir(pages_dir):
        if filename.startswith('product-edit-product-') and filename.endswith('.html'):
            edit_pages.append(os.path.join(pages_dir, filename))
    
    if not edit_pages:
        print("No product edit pages found!")
        return
    
    print(f"Fixing {len(edit_pages)} product edit pages...")
    
    success_count = 0
    for page in edit_pages:
        try:
            if fix_size_chart_placement(page):
                success_count += 1
        except Exception as e:
            print(f"  ❌ Error fixing {page}: {e}")
    
    print(f"\n✅ Successfully fixed {success_count}/{len(edit_pages)} product edit pages!")

if __name__ == '__main__':
    main()
