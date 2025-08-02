import re

def revert_currency_to_usd():
    # Files to update
    files_to_update = [
        'pages/homepage_dark_futuristic_e_commerce.html',
        'pages/shop_grid_advanced_product_discovery.html'
    ]
    
    for file_path in files_to_update:
        print(f"Updating {file_path}...")
        
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace MXN currency with USD
        # Convert 434.78 MXN to 25.99 USD
        content = re.sub(r'\$434\.78 MXN', '$25.99', content)
        
        # Convert 671.94 MXN to 39.99 USD (hoodie prices)
        content = re.sub(r'\$671\.94 MXN', '$39.99', content)
        
        # Convert 454.55 MXN to 26.99 USD
        content = re.sub(r'\$454\.55 MXN', '$26.99', content)
        
        # Convert 375.49 MXN to 21.99 USD
        content = re.sub(r'\$375\.49 MXN', '$21.99', content)
        
        # Convert 750.99 MXN to 44.99 USD
        content = re.sub(r'\$750\.99 MXN', '$44.99', content)
        
        # Convert 869.57 MXN to 51.99 USD
        content = re.sub(r'\$869\.57 MXN', '$51.99', content)
        
        # Write the updated content back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Updated {file_path}")

if __name__ == "__main__":
    revert_currency_to_usd()
    print("\n🎉 All currency references reverted to USD!")
    print("💰 Prices now in US Dollars as requested") 