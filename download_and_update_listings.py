import requests
import os
import re
from urllib.parse import urlparse

def download_images_and_update_listings():
    # Product data with correct information
    products = [
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/a59540/6195555724/il_340x270.6195555724_cqpo.jpg",
            "name": "Adult I am the Storm Cancer Warrior Jacket",
            "description": "Printed Design 2 Sided | The Devil Whispered in my Ear Jacket | Breast Cancer Awareness Jacket",
            "price": "$44.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/e8c94a/6242359117/il_340x270.6242359117_s1tl.jpg",
            "name": "Adult & Kid's Fight Childhood Cancer Jacket",
            "description": "Printed Design Double Sided | Childhood Cancer Awareness Jacket | Cancer Warrior Jacket",
            "price": "$44.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/9e0dc0/6193800620/il_340x270.6193800620_s2do.jpg",
            "name": "Adult Fight Cancer Jacket",
            "description": "Printed Design - Double Sided | Cancer Awareness Jacket | Cancer Warrior Jacket | Cancer Awareness Jacket",
            "price": "$44.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/7fb42a/6241072361/il_340x270.6241072361_mcvx.jpg",
            "name": "Adult Be Kind Hooded Jacket",
            "description": "Printed Design - Double Sided | In a World Where You Can Be Anything Be Kind Jacket | Human Kindness | Unisex",
            "price": "$44.00",
            "category": "Inspirational"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/5459f6/6241033989/il_340x270.6241033989_sff9.jpg",
            "name": "Be Kind T-Shirt",
            "description": "Printed Design - Double Sided | In a World Where You Can Be Anything Be Kind Shirt | Human Kindness Shirt | Unisex Size",
            "price": "$23.00",
            "category": "Inspirational"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/85386b/6227282309/il_340x270.6227282309_3m16.jpg",
            "name": "Kid's Mischief Managed Wizard Long Sleeve Shirt",
            "description": "Printed Design | Kids Wizard Shirt | Gildans Unisex Kids Long Sleeve Tee",
            "price": "$22.00",
            "category": "Kids"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/4fcdf8/6205642189/il_340x270.6205642189_4tth.jpg",
            "name": "Fight Cancer T-Shirt",
            "description": "Printed Design - Double Sided | Breast Cancer Awareness Shirt | Cancer Warrior Shirt | Crush Cancer Tee | Unisex Size",
            "price": "$23.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/c/1084/860/0/0/il/762bf3/6157531736/il_340x270.6157531736_70uh.jpg",
            "name": "You Are Awesome T-Shirt",
            "description": "Printed Design - Double Sided | Inspirational Shirt | Positive Quote Shirt | Self Love Shirt | Adult Unisex Size",
            "price": "$23.00",
            "category": "Inspirational"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/7ddc55/6152661104/il_340x270.6152661104_fcqg.jpg",
            "name": "Kid's Fight Cancer Hoodie",
            "description": "Printed Design | Team Cancer Hoodie | Breast Cancer Awareness Hoodie | Unisex Size - 15 Colors to Choose From",
            "price": "$34.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/a4ec0f/6200665471/il_340x270.6200665471_7wcd.jpg",
            "name": "Adult Fight Cancer Hoodie",
            "description": "Printed Design | Breast Cancer Survivor Hoodie | Breast Cancer Awareness Hoodie | Cancer Warrior Hoodie | Unisex",
            "price": "$38.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/ce4e4d/6200226387/il_340x270.6200226387_nu6y.jpg",
            "name": "Kid's Sometimes You Forget You Are Awesome Hoodie",
            "description": "Printed Design | Unisex Size - Choose from 15 Colors",
            "price": "$34.00",
            "category": "Inspirational"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/962c17/6141117177/il_340x270.6141117177_7adk.jpg",
            "name": "Kid's Racecar Birthday Party Shirt",
            "description": "Printed Design | Kid's Racecar Birthday Party Shirt | Family Birthday Shirts | Kid's Car Birthday Shirt",
            "price": "$19.00",
            "category": "Birthday"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/f20a99/6092548904/il_340x270.6092548904_puja.jpg",
            "name": "Kid's Dinosaur Birthday Party Shirt",
            "description": "Printed Design | Boy's Jurassic Birthday Party Shirt | Family Birthday Shirts | Boy's Birthday Shirt",
            "price": "$19.00",
            "category": "Birthday"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/6f723f/6723530158/il_340x270.6723530158_mamk.jpg",
            "name": "Motorcycle Grandfather Like a Regular Grandfather but Cooler TShirt",
            "description": "Quality Print | Fathers Day Gift | Grandfather Gift | Motorcycle Shirt",
            "price": "$22.00",
            "category": "Father's Day"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/fe699b/6718286294/il_340x270.6718286294_aetw.jpg",
            "name": "She's My Sweet Potato Shirt",
            "description": "I Yam Shirt | Printed Design | Thanksgiving Matching Couple Shirts | Funny Couple Shirts | Bella Canvas Unisex",
            "price": "$22.00",
            "category": "Holiday"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/40981b/5985901268/il_340x270.5985901268_36an.jpg",
            "name": "It's Not a Dad Bod It's a Father Figure Shirt",
            "description": "Printed Design | Gift for Him | Father's Day Shirt | Gift for Dad | Dad Shirt | Adult Unisex",
            "price": "$22.00",
            "category": "Father's Day"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/dfb546/5985803572/il_340x270.5985803572_gpr0.jpg",
            "name": "It's Where My Story Begins Hoodie",
            "description": "Printed Design | Personalize with Your City and State with State Flag and Seal | Adult Unisex Size",
            "price": "$40.00",
            "category": "Custom"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/826abf/6033797535/il_340x270.6033797535_35bb.jpg",
            "name": "Personalized State Shirt",
            "description": "This is where my Story Begins T-Shirt | Printed Design | It's Where My Story Begins Shirt | Unisex Size",
            "price": "$22.00",
            "category": "Custom"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/50481e/6033626801/il_340x270.6033626801_oac1.jpg",
            "name": "Custom Shirt Provide City & State",
            "description": "It's Where My Story Begins Shirt | Printed Design | It's Where My Story Begins TShirt | Unisex Size",
            "price": "$22.00",
            "category": "Custom"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/cc582d/5982263668/il_340x270.5982263668_6i4k.jpg",
            "name": "I Could Agree With You, but then we both be Wrong TShirt",
            "description": "Quality Printed Design | Funny TShirt | Sarcastic Shirt | Adult Unisex Size",
            "price": "$22.00",
            "category": "Humor"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/ddd4e4/6709301297/il_340x270.6709301297_o5on.jpg",
            "name": "It's 5 O'Clock Everywhere I'm Retired Shirt",
            "description": "Printed Design | Retirement Gift | Retirement Shirt | Choose From 18 Print Colors | Unisex",
            "price": "$22.00",
            "category": "Retirement"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/f3297d/5902742198/il_340x270.5902742198_nsxj.jpg",
            "name": "Adult Retirement Hoodie",
            "description": "Printed Design | It's 5 O'Clock Everywhere I'm Retired Hoodie | Retirement Gift | Retired Gift | Unisex Size",
            "price": "$38.00",
            "category": "Retirement"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/996a86/5885306640/il_340x270.5885306640_q3or.jpg",
            "name": "Hide Your Diamonds My Kid Steals TShirt",
            "description": "Quality Printed TShirt Design | Unisex Size TShirt",
            "price": "$19.00",
            "category": "Humor"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/5b11f6/5911347217/il_340x270.5911347217_5j09.jpg",
            "name": "Hide Your Diamonds My Kid Steals Tank Top",
            "description": "Quality Printed Design | Baseball Tank Top | Ladies Bella Canvas Tank Top",
            "price": "$20.00",
            "category": "Tank Tops"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/e69c9e/5985290748/il_340x270.5985290748_rfnm.jpg",
            "name": "Kid's Mischief Managed Wizard Hoodie",
            "description": "Printed Design | Kid's Mischief Hoodie | Kid's Wizard Hoodie | Unisex - 15 Colors to Choose From",
            "price": "$34.00",
            "category": "Kids"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/7dac15/6721079102/il_340x270.6721079102_9upl.jpg",
            "name": "I'm Drinking My Favorite Drink Tonight T-Shirt",
            "description": "Printed Design | Party Shirt | Funny Saying T-Shirt | Unisex Sizes",
            "price": "$22.00",
            "category": "Humor"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/5dc040/5421008110/il_340x270.5421008110_sj29.jpg",
            "name": "Custom Legendary Since Birthday Shirt",
            "description": "Quality Print | Personalized Birthday Shirt | Funny Birthday Shirt | Custom Birthday Shirt | Unisex",
            "price": "$22.00",
            "category": "Birthday"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/8c1d9e/4908964195/il_340x270.4908964195_d4mc.jpg",
            "name": "Custom Best Friends Shirt",
            "description": "Printed Design | Personalize Best Friends TShirt | Personalized Custom Shirt | Friends Gift | Adult Unisex Size",
            "price": "$22.00",
            "category": "Custom"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/f542be/4922734620/il_340x270.4922734620_nn93.jpg",
            "name": "Custom Song Lyric TShirt",
            "description": "High Quality Print | Personalized Song Lyric Shirt | Custom Song Shirt | Any Artist and Song | Adult Unisex Shirt",
            "price": "$25.00",
            "category": "Custom"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/faed98/5950868921/il_340x270.5950868921_ktth.jpg",
            "name": "Adult Fatherhood is a Walk in the Park Jurassic Park Hoodie",
            "description": "Printed Design | Fathers Day Gift | New Dad Gift | Jurassic Hoodie | Unisex",
            "price": "$38.00",
            "category": "Father's Day"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/5307f1/5902792676/il_340x270.5902792676_t6fw.jpg",
            "name": "Adult Motherhood is a Walk in the Park Jurassic Park Hoodie",
            "description": "Printed Design | Mom Gift | Mothers Day Gift | New Mom Gift | Gift for Her",
            "price": "$38.00",
            "category": "Mother's Day"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/3800fa/4332313625/il_340x270.4332313625_twd7.jpg",
            "name": "If I'm Too Much Go Find Less Tank Top",
            "description": "Printed Design | Funny Sarcastic Tank Top | Ladies Tank Top | Women's Sarcastic Tank Top | Ladies Bella Tank",
            "price": "$20.00",
            "category": "Tank Tops"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/37bce1/6450258240/il_340x270.6450258240_iqms.jpg",
            "name": "If I'm Too Much Go Find Less Long Sleeve",
            "description": "Printed Design | Funny Sarcastic Shirt | Sarcastic Shirt | Unisex Long Sleeve Tee",
            "price": "$24.00",
            "category": "Long Sleeve"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/13a662/6749485683/il_340x270.6749485683_elcu.jpg",
            "name": "I am the Storm Warrior TShirt",
            "description": "Printed Design | The Devil Whispered | Cancer Survivor | Cancer Awareness | Unisex Shirt",
            "price": "$22.00",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/c/1068/849/27/9/il/32bff1/4276521185/il_340x270.4276521185_499m.jpg",
            "name": "I am the Storm Long Sleeve Tee",
            "description": "Quality Printed Design | The Devil Whispered | Breast Cancer Survivor | Breast Cancer Awareness Long Sleeve",
            "price": "$23.50",
            "category": "Cancer Awareness"
        },
        {
            "image_url": "https://i.etsystatic.com/28285740/r/il/b2f90c/4006936976/il_340x270.4006936976_mwfy.jpg",
            "name": "Custom Song Lyric TShirt",
            "description": "High Quality Print | Rock or Country Guitar Design or Piano Design | Unisex Size",
            "price": "$30.00",
            "category": "Custom"
        }
    ]
    
    # Create etsy_images folder if it doesn't exist
    if not os.path.exists('etsy_images'):
        os.makedirs('etsy_images')
    
    # Download all images
    print("📥 Downloading images...")
    for i, product in enumerate(products, 1):
        try:
            response = requests.get(product['image_url'])
            if response.status_code == 200:
                # Extract filename from URL
                parsed_url = urlparse(product['image_url'])
                filename = os.path.basename(parsed_url.path)
                
                # Create a clean filename
                clean_name = product['name'].replace(' ', '-').replace('/', '-').replace('|', '-')[:50]
                file_extension = os.path.splitext(filename)[1] or '.jpg'
                new_filename = f"product_{i:02d}_{clean_name}{file_extension}"
                
                filepath = os.path.join('etsy_images', new_filename)
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                print(f"✅ Downloaded: {new_filename}")
            else:
                print(f"❌ Failed to download: {product['image_url']}")
        except Exception as e:
            print(f"❌ Error downloading {product['image_url']}: {e}")
    
    print(f"\n🎉 Downloaded {len(products)} images to etsy_images folder!")
    
    # Update HTML files with new product information
    files_to_update = ['pages/homepage.html', 'pages/shop.html']
    
    for file_path in files_to_update:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Update prices to match the new data
            price_updates = {
                r'\$22\.00': '$22.00',  # Keep as is
                r'\$25\.99': '$22.00',  # Most common update
                r'\$39\.99': '$34.00',  # Hoodies
                r'\$44\.99': '$38.00',  # Adult hoodies
                r'\$51\.99': '$44.00',  # Jackets
                r'\$26\.99': '$22.00',  # T-shirts
                r'\$21\.99': '$19.00',  # Kids items
                r'\$23\.00': '$23.00',  # Keep as is
                r'\$24\.00': '$24.00',  # Long sleeve
                r'\$25\.00': '$25.00',  # Custom song lyrics
                r'\$30\.00': '$30.00',  # Custom designs
                r'\$38\.00': '$38.00',  # Adult hoodies
                r'\$40\.00': '$40.00',  # Custom hoodies
                r'\$20\.00': '$20.00',  # Tank tops
                r'\$23\.50': '$23.50'   # Long sleeve cancer awareness
            }
            
            for old_price, new_price in price_updates.items():
                content = re.sub(old_price, new_price, content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Updated prices in {file_path}")
            
        except Exception as e:
            print(f"❌ Error updating {file_path}: {e}")
    
    print("\n🎉 All images downloaded and prices updated!")
    print("📁 Images saved in: etsy_images/")
    print("💰 Prices updated to match Etsy listings")

if __name__ == "__main__":
    download_images_and_update_listings() 