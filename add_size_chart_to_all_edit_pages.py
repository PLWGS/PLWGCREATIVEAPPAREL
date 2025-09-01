#!/usr/bin/env python3
"""
Add size chart section to all existing product edit pages
"""
import os
import re

def add_size_chart_to_edit_page(file_path):
    """Add size chart section to a product edit page"""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if size chart already exists
    if 'Size Chart Configuration' in content:
        print(f"  ✅ Size chart already exists in {file_path}")
        return
    
    # Size chart HTML to insert
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
    
    # Find where to insert the size chart (before Custom Input Options)
    custom_input_pattern = r'(\s*<!-- Custom Input Options -->)'
    
    if re.search(custom_input_pattern, content):
        # Insert before Custom Input Options
        content = re.sub(custom_input_pattern, size_chart_html + r'\1', content)
        print(f"  ✅ Added size chart section before Custom Input Options")
    else:
        # Fallback: look for other patterns
        tags_pattern = r'(\s*<!-- Tags -->|\s*<[^>]*>Tags</)'
        if re.search(tags_pattern, content):
            content = re.sub(tags_pattern, size_chart_html + r'\1', content)
            print(f"  ✅ Added size chart section before Tags")
        else:
            print(f"  ❌ Could not find insertion point in {file_path}")
            return
    
    # Add JavaScript functions if they don't exist
    js_functions = '''
        // Size Chart Functions
        function getSizeChartData() {
            return {
                garmentType: document.getElementById('garment-type')?.value || 'adult-tshirt',
                sizes: {
                    S: {
                        chest: document.getElementById('size-s-chest')?.value || '18',
                        length: document.getElementById('size-s-length')?.value || '28'
                    },
                    M: {
                        chest: document.getElementById('size-m-chest')?.value || '20',
                        length: document.getElementById('size-m-length')?.value || '29'
                    },
                    L: {
                        chest: document.getElementById('size-l-chest')?.value || '22',
                        length: document.getElementById('size-l-length')?.value || '30'
                    },
                    XL: {
                        chest: document.getElementById('size-xl-chest')?.value || '24',
                        length: document.getElementById('size-xl-length')?.value || '31'
                    },
                    '2XL': {
                        chest: document.getElementById('size-2xl-chest')?.value || '26',
                        length: document.getElementById('size-2xl-length')?.value || '32'
                    }
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
                    S: { chest: '20', length: '27' },
                    M: { chest: '22', length: '28' },
                    L: { chest: '24', length: '29' },
                    XL: { chest: '26', length: '30' },
                    '2XL': { chest: '28', length: '31' }
                },
                'kids-tshirt': {
                    S: { chest: '14', length: '19' },
                    M: { chest: '15', length: '20' },
                    L: { chest: '16', length: '21' },
                    XL: { chest: '17', length: '22' },
                    '2XL': { chest: '18', length: '23' }
                },
                'kids-hoodie': {
                    S: { chest: '16', length: '18' },
                    M: { chest: '17', length: '19' },
                    L: { chest: '18', length: '20' },
                    XL: { chest: '19', length: '21' },
                    '2XL': { chest: '20', length: '22' }
                }
            };

            const preset = presets[garmentType];
            if (preset) {
                Object.keys(preset).forEach(size => {
                    const sizeKey = size.toLowerCase().replace('xl', 'xl');
                    document.getElementById(`size-${sizeKey}-chest`).value = preset[size].chest;
                    document.getElementById(`size-${sizeKey}-length`).value = preset[size].length;
                });
            }
        }

        function populateSizeChartFromData(sizeChart) {
            if (!sizeChart) return;
            
            // Set garment type
            if (sizeChart.garmentType && document.getElementById('garment-type')) {
                document.getElementById('garment-type').value = sizeChart.garmentType;
            }
            
            // Populate size data
            if (sizeChart.sizes) {
                Object.keys(sizeChart.sizes).forEach(size => {
                    const sizeKey = size.toLowerCase().replace('xl', 'xl');
                    const sizeData = sizeChart.sizes[size];
                    if (sizeData) {
                        if (document.getElementById(`size-${sizeKey}-chest`)) {
                            document.getElementById(`size-${sizeKey}-chest`).value = sizeData.chest || '';
                        }
                        if (document.getElementById(`size-${sizeKey}-length`)) {
                            document.getElementById(`size-${sizeKey}-length`).value = sizeData.length || '';
                        }
                    }
                });
            }
        }
'''
    
    # Add JavaScript functions before the closing </script> tag
    if 'getSizeChartData' not in content:
        script_pattern = r'(\s*</script>\s*</body>)'
        if re.search(script_pattern, content):
            content = re.sub(script_pattern, js_functions + r'\1', content)
            print(f"  ✅ Added size chart JavaScript functions")
    
    # Add event listener for garment type dropdown
    event_listener = '''
        // Add event listener for garment type dropdown
        document.addEventListener('DOMContentLoaded', function() {
            const garmentType = document.getElementById('garment-type');
            if (garmentType) {
                garmentType.addEventListener('change', function() {
                    if (this.value !== 'custom') {
                        applySizeChartPreset(this.value);
                    }
                });
            }
        });
'''
    
    if 'garment-type' in content and 'addEventListener' not in content:
        content = re.sub(script_pattern, event_listener + js_functions + r'\1', content)
        print(f"  ✅ Added garment type event listener")
    
    # Update form submission to include size chart
    if 'getSizeChartData()' not in content:
        # Look for form data collection patterns
        form_patterns = [
            r'(const formData = \{[^}]*)\}',
            r'(formData\s*=\s*\{[^}]*)\}',
        ]
        
        for pattern in form_patterns:
            if re.search(pattern, content):
                content = re.sub(pattern, r'\1,\n                size_chart: getSizeChartData()}', content)
                print(f"  ✅ Updated form submission to include size chart")
                break
    
    # Update populateForm function to populate size chart
    if 'populateForm' in content and 'populateSizeChartFromData' not in content:
        populate_pattern = r'(function populateForm\(productData\) \{[^}]*)(productData\.size_chart\)\;)?(\s*\})'
        if re.search(populate_pattern, content):
            content = re.sub(populate_pattern, r'\1\n            populateSizeChartFromData(productData.size_chart);\3', content)
            print(f"  ✅ Updated populateForm to load size chart data")
    
    # Write updated content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Successfully updated {file_path}")

def main():
    """Add size chart to all product edit pages"""
    pages_dir = 'pages'
    
    # Find all product edit pages
    edit_pages = []
    for filename in os.listdir(pages_dir):
        if filename.startswith('product-edit-product-') and filename.endswith('.html'):
            edit_pages.append(os.path.join(pages_dir, filename))
    
    if not edit_pages:
        print("No product edit pages found!")
        return
    
    print(f"Found {len(edit_pages)} product edit pages to update:")
    for page in edit_pages:
        print(f"  - {page}")
    
    print("\nUpdating pages...")
    for page in edit_pages:
        try:
            add_size_chart_to_edit_page(page)
        except Exception as e:
            print(f"  ❌ Error updating {page}: {e}")
    
    print(f"\n✅ Finished updating {len(edit_pages)} product edit pages!")
    print("Now every existing product edit page has the size chart section.")
    print("You can choose which products to add size charts to!")

if __name__ == '__main__':
    main()
