#!/usr/bin/env python3
"""
Apply size chart functionality to specific edit pages
"""

import os
import re

# List of edit pages that need to be updated
EDIT_PAGES = [
    'pages/product-edit-product-21_funny_ugh_shirt_printed_design.html',
    'pages/product-edit-product-32_motorcycle_grandfather_like_a_regular_grandfather_.html', 
    'pages/product-edit-product-33_christmas_nightmare_before_coffee_shirt_choose_pri.html',
    'pages/product-edit-product-35_led_zeppelin_stairway_to_heaven_guitar_shape_song_.html',
    'pages/product-edit-product-52_dont_be_a_basic_pitch_baseball_shirt_printed_desig.html'
]

def apply_size_chart_functionality(file_path):
    """Apply size chart functionality to a single edit page"""
    print(f"Processing {file_path}...")
    
    if not os.path.exists(file_path):
        print(f"  ❌ File not found: {file_path}")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already updated
        if 'Size Chart Configuration' in content:
            print(f"  ✅ Already updated: {file_path}")
            return True
        
        # Copy the size chart functionality from the master edit page
        with open('pages/product-edit-product-1_just_a_little_boost.html', 'r', encoding='utf-8') as f:
            master_content = f.read()
        
        # Extract the size chart HTML section
        size_chart_start = master_content.find('<!-- Size Chart Configuration -->')
        size_chart_end = master_content.find('<!-- Tags -->', size_chart_start)
        
        if size_chart_start == -1 or size_chart_end == -1:
            print(f"  ❌ Could not extract size chart section from master file")
            return False
        
        size_chart_html = master_content[size_chart_start:size_chart_end]
        
        # Find insertion point in target file (before Tags section)
        if '<!-- Tags -->' in content:
            content = content.replace('                        <!-- Tags -->', 
                                    size_chart_html + '                        <!-- Tags -->')
        else:
            print(f"  ⚠️ Could not find Tags section in {file_path}")
            return False
        
        # Extract and add JavaScript functions
        js_start = master_content.find('// Size Chart Management Functions')
        js_end = master_content.find('// Initialize after authentication', js_start)
        
        if js_start != -1 and js_end != -1:
            js_functions = master_content[js_start:js_end]
            
            # Add before initializeEditPage function
            if 'function initializeEditPage()' in content and 'Size Chart Management Functions' not in content:
                content = content.replace(
                    '        // Initialize after authentication\n        function initializeEditPage()',
                    '        ' + js_functions + '        // Initialize after authentication\n        function initializeEditPage()'
                )
        
        # Add size_chart to formData
        if 'size_stock: sizeStock,' in content and 'size_chart: getSizeChartData(),' not in content:
            content = content.replace(
                'size_stock: sizeStock,',
                'size_stock: sizeStock,\n                size_chart: getSizeChartData(),'
            )
        
        # Add size chart population to populateForm
        if 'document.getElementById(\'feature-soft-touch\').checked = features.soft_touch !== false;' in content:
            if 'populateSizeChartFromData(productData.size_chart);' not in content:
                content = content.replace(
                    'document.getElementById(\'feature-soft-touch\').checked = features.soft_touch !== false;',
                    'document.getElementById(\'feature-soft-touch\').checked = features.soft_touch !== false;\n\n            // Size Chart\n            populateSizeChartFromData(productData.size_chart);'
                )
        
        # Add event listener to initializeEditPage
        if 'setupSizeSelection();' in content and 'garmentTypeSelect.addEventListener' not in content:
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
        
        # Save the updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✅ Successfully updated: {file_path}")
        return True
        
    except Exception as e:
        print(f"  ❌ Error updating {file_path}: {e}")
        return False

def main():
    """Apply size chart functionality to all edit pages"""
    print("🚀 Applying size chart functionality to edit pages...")
    
    success_count = 0
    for page in EDIT_PAGES:
        if apply_size_chart_functionality(page):
            success_count += 1
    
    print(f"\n✅ Successfully updated {success_count} out of {len(EDIT_PAGES)} edit pages")

if __name__ == "__main__":
    main()
