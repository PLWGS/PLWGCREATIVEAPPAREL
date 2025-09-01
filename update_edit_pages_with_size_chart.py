#!/usr/bin/env python3
"""
Update all product edit pages to include size chart functionality
"""

import os
import glob
import re

def update_edit_page_with_size_chart(file_path):
    """Update a single edit page with size chart functionality"""
    print(f"Updating {file_path}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if size chart already exists
        if 'Size Chart Configuration' in content:
            print(f"  ✅ {file_path} already has size chart functionality")
            return True
        
        # 1. Add size chart HTML section after Features section
        size_chart_html = '''
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

'''
        
        # Find the insertion point (after Features section, before Tags section)
        features_end_pattern = r'(\s*</div>\s*</div>\s*<!-- Tags -->'
        
        if '<!-- Tags -->' in content:
            content = content.replace('                        </div>

                        <!-- Tags -->', size_chart_html + '                        <!-- Tags -->')
        else:
            print(f"  ⚠️ Could not find insertion point in {file_path}")
            return False
        
        # 2. Add size_chart to formData if saveProductChanges function exists
        if 'size_stock: sizeStock,' in content and 'size_chart: getSizeChartData(),' not in content:
            content = content.replace(
                'size_stock: sizeStock,',
                'size_stock: sizeStock,\n                size_chart: getSizeChartData(),'
            )
        
        # 3. Add JavaScript functions before initializeEditPage
        js_functions = '''
        // Size Chart Management Functions
        function getSizeChartData() {
            return {
                S: {
                    chest: document.getElementById('size-s-chest').value || '18',
                    length: document.getElementById('size-s-length').value || '28'
                },
                M: {
                    chest: document.getElementById('size-m-chest').value || '20',
                    length: document.getElementById('size-m-length').value || '29'
                },
                L: {
                    chest: document.getElementById('size-l-chest').value || '22',
                    length: document.getElementById('size-l-length').value || '30'
                },
                XL: {
                    chest: document.getElementById('size-xl-chest').value || '24',
                    length: document.getElementById('size-xl-length').value || '31'
                },
                '2XL': {
                    chest: document.getElementById('size-2xl-chest').value || '26',
                    length: document.getElementById('size-2xl-length').value || '32'
                }
            };
        }

        function applySizeChartPreset(garmentType) {
            const presets = {
                'adult-tshirt': {
                    S: { chest: '18', length: '28' },
                    M: { chest: '20', length: '29' },
                    L: { chest: '22', length: '30' },
                    XL: { chest: '24', length: '31' },
                    '2XL': { chest: '26', length: '32' }
                },
                'adult-hoodie': {
                    S: { chest: '20', length: '26' },
                    M: { chest: '22', length: '27' },
                    L: { chest: '24', length: '28' },
                    XL: { chest: '26', length: '29' },
                    '2XL': { chest: '28', length: '30' }
                },
                'kids-tshirt': {
                    S: { chest: '14', length: '19' },
                    M: { chest: '15', length: '20' },
                    L: { chest: '16', length: '21' },
                    XL: { chest: '17', length: '22' },
                    '2XL': { chest: '18', length: '23' }
                },
                'kids-hoodie': {
                    S: { chest: '15', length: '18' },
                    M: { chest: '16', length: '19' },
                    L: { chest: '17', length: '20' },
                    XL: { chest: '18', length: '21' },
                    '2XL': { chest: '19', length: '22' }
                }
            };

            const preset = presets[garmentType];
            if (preset) {
                Object.keys(preset).forEach(size => {
                    const sizeKey = size === '2XL' ? '2xl' : size.toLowerCase();
                    document.getElementById(`size-${sizeKey}-chest`).value = preset[size].chest;
                    document.getElementById(`size-${sizeKey}-length`).value = preset[size].length;
                });
            }
        }

        function populateSizeChartFromData(sizeChartData) {
            if (!sizeChartData) return;
            
            try {
                const sizeChart = typeof sizeChartData === 'string' 
                    ? JSON.parse(sizeChartData) 
                    : sizeChartData;
                
                Object.keys(sizeChart).forEach(size => {
                    const sizeKey = size === '2XL' ? '2xl' : size.toLowerCase();
                    const chestInput = document.getElementById(`size-${sizeKey}-chest`);
                    const lengthInput = document.getElementById(`size-${sizeKey}-length`);
                    
                    if (chestInput && sizeChart[size].chest) {
                        chestInput.value = sizeChart[size].chest;
                    }
                    if (lengthInput && sizeChart[size].length) {
                        lengthInput.value = sizeChart[size].length;
                    }
                });
            } catch (error) {
                console.error('Error populating size chart:', error);
            }
        }

'''
        
        if 'function initializeEditPage()' in content and 'function getSizeChartData()' not in content:
            content = content.replace(
                '        // Initialize after authentication\n        function initializeEditPage()',
                js_functions + '        // Initialize after authentication\n        function initializeEditPage()'
            )
        
        # 4. Add size chart population to populateForm function
        if 'populateSizeChartFromData(productData.size_chart);' not in content:
            content = content.replace(
                '            // Size Chart\n            populateSizeChartFromData(productData.size_chart);',
                '            // Size Chart\n            populateSizeChartFromData(productData.size_chart);'
            )
            if '// Size Chart' not in content and 'document.getElementById(\'feature-soft-touch\').checked = features.soft_touch !== false;' in content:
                content = content.replace(
                    'document.getElementById(\'feature-soft-touch\').checked = features.soft_touch !== false;',
                    'document.getElementById(\'feature-soft-touch\').checked = features.soft_touch !== false;\n\n            // Size Chart\n            populateSizeChartFromData(productData.size_chart);'
                )
        
        # 5. Add garment type event listener to initializeEditPage
        if 'garmentTypeSelect.addEventListener' not in content and 'function initializeEditPage()' in content:
            setup_code = '''            
            // Setup size chart preset dropdown
            const garmentTypeSelect = document.getElementById('garment-type');
            if (garmentTypeSelect) {
                garmentTypeSelect.addEventListener('change', function() {
                    if (this.value !== 'custom') {
                        applySizeChartPreset(this.value);
                    }
                });
            }'''
            
            content = content.replace(
                'setupSizeSelection();',
                'setupSizeSelection();' + setup_code
            )
        
        # Write the updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✅ Successfully updated {file_path}")
        return True
        
    except Exception as e:
        print(f"  ❌ Error updating {file_path}: {e}")
        return False

def main():
    """Update all product edit pages"""
    print("🚀 Updating all product edit pages with size chart functionality...")
    
    # Find all product edit pages
    edit_pages = glob.glob('pages/product-edit-product-*.html')
    
    if not edit_pages:
        print("❌ No product edit pages found")
        return
    
    updated_count = 0
    for page in edit_pages:
        if update_edit_page_with_size_chart(page):
            updated_count += 1
    
    print(f"\n✅ Successfully updated {updated_count} out of {len(edit_pages)} edit pages")
    print("🎉 Size chart functionality has been added to all product edit pages!")

if __name__ == "__main__":
    main()
