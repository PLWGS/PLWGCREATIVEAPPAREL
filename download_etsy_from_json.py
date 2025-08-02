import requests
import json
import os
import re
from urllib.parse import urlparse

# Your Etsy shop data
etsy_data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/947536/7043678314/il_fullxfull.7043678314_mnps.jpg",
            "name": "Just a Little BOO-jee Halloween Shirt | Quality Printed Design | Cute Halloween Ghost T-Shirt | Halloween Boo-jee Ghost Shirt | Ghost Shirt",
            "url": "https://www.etsy.com/listing/4339824528/just-a-little-boo-jee-halloween-shirt",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 1
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/61c82d/7091533897/il_fullxfull.7091533897_18p0.jpg",
            "name": "Just a Little BOO-st Halloween Shirt | Quality Printed Design | Cute Halloween Ghost T-Shirt | Halloween Barista Coffee Shirt | Boo T-Shirt",
            "url": "https://www.etsy.com/listing/4339761635/just-a-little-boo-st-halloween-shirt",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 2
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/b609f8/7084179209/il_fullxfull.7084179209_aiet.jpg",
            "name": "Wish You Were Here Shirt | Quality Printed Design | Song Lyric T-Shirt | Music Shirt",
            "url": "https://www.etsy.com/listing/4338526914/wish-you-were-here-shirt-quality-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 3
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/86eedb/7025397834/il_fullxfull.7025397834_nk1e.jpg",
            "name": "Halloween One Two He's Coming for You Shirt | Printed Design | Horror Shirt | Scary Shirt | Unisex Black Long Sleeve Tee, T-Shirt or V-Neck",
            "url": "https://www.etsy.com/listing/4336527506/halloween-one-two-hes-coming-for-you",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 4
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/122392/6943277016/il_fullxfull.6943277016_5xp5.jpg",
            "name": "Personalized Straight Outta (Add Text) Shirt | Printed Design | Custom Text Shirt | Add Text or Change all 3 Lines | Funny Custom Shirt",
            "url": "https://www.etsy.com/listing/4321109188/personalized-straight-outta-add-text",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 5
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/e3ca17/6982299087/il_fullxfull.6982299087_fijj.jpg",
            "name": "Custom Bridezilla Shirt | Printed Design | Bridezilla Horror Shirt | Wedding Horror Bride Shirt | Couple that Love the Movies Shirt Add Text",
            "url": "https://www.etsy.com/listing/4319477593/custom-bridezilla-shirt-printed-design",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 6
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/6a2f4e/6980231709/il_fullxfull.6980231709_qjsq.jpg",
            "name": "Kid's Halloween Horror Friends Hoodie | Printed Design | Kid's Friends Hoodie | Kid's Scary Hoodie | Unisex - 9 Colors to Choose From",
            "url": "https://www.etsy.com/listing/4319083468/kids-halloween-horror-friends-hoodie",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "671.94", "priceCurrency": "MXN"},
            "position": 7
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/e9e48c/6914934126/il_fullxfull.6914934126_pp86.jpg",
            "name": "Best Dad Ever T-Shirt | Printed Design | Best Dad Shirt | Father's Day Gift |  Fathers Day Shirt",
            "url": "https://www.etsy.com/listing/4315663607/best-dad-ever-t-shirt-printed-design",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 8
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/b5eb5c/6902369194/il_fullxfull.6902369194_86lj.jpg",
            "name": "Grandma Heart Shirt  | Printed Design | Personalize with Name(s) & Kid Image | Grandma Shirt | Grandpa Shirt | Custom Gift for Grandparents",
            "url": "https://www.etsy.com/listing/4312805589/grandma-heart-shirt-printed-design",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 9
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/117fcd/6893408910/il_fullxfull.6893408910_qko1.jpg",
            "name": "Custom Father's Day Photo Shirt for Dad | Printed Design | Family Photo Shirt | Dad's Photo Shirt |  Fathers Day Shirt | Provide Photo",
            "url": "https://www.etsy.com/listing/4310739945/custom-fathers-day-photo-shirt-for-dad",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 10
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/bad8b5/6894998338/il_fullxfull.6894998338_a41d.jpg",
            "name": "Custom Father's Day Photo Shirt for Dad | Printed Design | Family Photo Shirt | Dad's Photo Shirt |  Fathers Day Shirt | Provide Photo",
            "url": "https://www.etsy.com/listing/4310738447/custom-fathers-day-photo-shirt-for-dad",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 11
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/e6ded3/6936725099/il_fullxfull.6936725099_hrnq.jpg",
            "name": "Fathers Day Shirt | Printed Design | Husband Father Legend Shirt | Custom Fathers Day Shirt | Shirt for Dad | Personalized Fathers Day Shirt",
            "url": "https://www.etsy.com/listing/4310695911/fathers-day-shirt-printed-design-husband",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 12
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/2be553/6936705457/il_fullxfull.6936705457_dndm.jpg",
            "name": "Father's Day Shirt | Printed Design | Husband Father Grandpa Legend Shirt | Custom Fathers Day Shirt | Shirt for Dad | Shirt for Grandpa",
            "url": "https://www.etsy.com/listing/4307846215/fathers-day-shirt-printed-design-husband",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 13
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/a3feac/6823479518/il_fullxfull.6823479518_gtuf.jpg",
            "name": "Look Who's All Grown Up And Ready For Senior Discounts | Printed Design | Funny Adult Birthday Shirt | Funny Senior Birthday Shirt",
            "url": "https://www.etsy.com/listing/1905802769/look-whos-all-grown-up-and-ready-for",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 14
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/a843c2/6814596731/il_fullxfull.6814596731_27kv.jpg",
            "name": "Acknowledge Me It's My Birthday Shirt | Printed Design | Custom Birthday T-Shirt | Personalized Birthday T-Shirt | Adult Unisex Sizes",
            "url": "https://www.etsy.com/listing/1898124173/acknowledge-me-its-my-birthday-shirt",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 15
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/d39177/6776982073/il_fullxfull.6776982073_hieh.jpg",
            "name": "Biker Lives Matter Shirt | Quality Printed Design | Motorcycle Riders Shirt | Motorcycle Awareness Shirts | Biker Awareness | Unisex T-Shirt",
            "url": "https://www.etsy.com/listing/1876574532/biker-lives-matter-shirt-quality-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 16
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/143726/6723462354/il_fullxfull.6723462354_c1zl.jpg",
            "name": "Girl's Trip 2025 Shirt | Printed Design | Custom Girl's Trip T-Shirt | Girl's Vacation Shirts | Personalized Girls Trip Shirt | Unisex Shirt",
            "url": "https://www.etsy.com/listing/1889702539/girls-trip-2025-shirt-printed-design",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 17
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/5ed28e/6716830512/il_fullxfull.6716830512_f5y9.jpg",
            "name": "Old Lives Matter Shirt | Quality Printed Design | Funny Sarcastic Shirt | Unisex Adult T-Shirt",
            "url": "https://www.etsy.com/listing/1888466037/old-lives-matter-shirt-quality-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 18
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/5273cb/6764336575/il_fullxfull.6764336575_busc.jpg",
            "name": "Breast Cancer Awareness Shirt | Printed Design | Breast Cancer Flag Shirt | No One Fights Alone Breast Cancer Shirt | Unisex Shirt",
            "url": "https://www.etsy.com/listing/1888362623/breast-cancer-awareness-shirt-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 19
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/3d1db8/6765568537/il_fullxfull.6765568537_mzwg.jpg",
            "name": "Breast Cancer Awareness Shirt | Printed Design | Breast Cancer Warrior Shirt | Breast Cancer Survivor | Fight Cancer Shirt | Unisex Shirt",
            "url": "https://www.etsy.com/listing/1873982614/breast-cancer-awareness-shirt-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 20
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/4f8bff/6763779315/il_fullxfull.6763779315_iimi.jpg",
            "name": "Down Syndrome Awareness Shirt | Printed Design | Down Syndrome Shirt | Awareness Shirt | Down Syndrome T-Shirt | Adult Unisex Size",
            "url": "https://www.etsy.com/listing/1885159769/down-syndrome-awareness-shirt-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 21
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/e786ac/6696411656/il_fullxfull.6696411656_kkdd.jpg",
            "name": "Down Syndrome Awareness Shirt | Printed Design | Down Right Perfect Shirt | Awareness Shirt | Down Syndrome T-Shirt | Adult Unisex Size",
            "url": "https://www.etsy.com/listing/1884449875/down-syndrome-awareness-shirt-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 22
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/9507b0/6727267317/il_fullxfull.6727267317_9dtd.jpg",
            "name": "Bikers Against Dumbass Drivers Shirt | 2 Sided Printed Design | Bikers Handgun Shirt  | Motorcycle Riders Shirt | Bikers Shirt | Unisex Size",
            "url": "https://www.etsy.com/listing/1881077629/bikers-against-dumbass-drivers-shirt-2",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "454.55", "priceCurrency": "MXN"},
            "position": 23
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/80d045/6676303566/il_fullxfull.6676303566_jgcr.jpg",
            "name": "Family Jurassic Birthday Shirt | Printed Design | Boys Dinosaur Birthday Shirt | Girls Dinosaur Birthday Shirt | Family Squad Birthday Shirt",
            "url": "https://www.etsy.com/listing/1866162310/family-jurassic-birthday-shirt-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "375.49", "priceCurrency": "MXN"},
            "position": 24
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/bbb2b3/6769036219/il_fullxfull.6769036219_ohjo.jpg",
            "name": "Custom The Devil Whispered to Me I'm Coming For You Shirt | Printed Design | I Whispered Back Bring (Name of Drink)",
            "url": "https://www.etsy.com/listing/1863214224/custom-the-devil-whispered-to-me-im",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 25
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/4bffee/6659433748/il_fullxfull.6659433748_3c7t.jpg",
            "name": "Custom Vintage Dude Birthday Shirt | Printed Design | The Man The Myth The Legend Shirt | Personalized Birthday Age Shirt | Adult Shirt",
            "url": "https://www.etsy.com/listing/1877184765/custom-vintage-dude-birthday-shirt",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 26
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/8403c4/6659329048/il_fullxfull.6659329048_re9t.jpg",
            "name": "Custom Grumpy Old Man Shirt | Quality Printed Design | Birthday Shirt for Grandfather | Personalized Birthday Month | Adult Shirt",
            "url": "https://www.etsy.com/listing/1877180009/custom-grumpy-old-man-shirt-quality",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 27
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/88e385/6659265638/il_fullxfull.6659265638_8qz8.jpg",
            "name": "Teaching My Favorite Peeps Shirt | Quality Printed Design | Teachers Easter Peep Shirt | Easter Shirt For a Teacher | Adult Shirt",
            "url": "https://www.etsy.com/listing/1862978752/teaching-my-favorite-peeps-shirt-quality",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 28
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/a49c48/6676967712/il_fullxfull.6676967712_lez1.jpg",
            "name": "Matching St. Patrick's Day Shirts | Printed Design - Not a Decal | Custom Most Likely to Group TShirt | Custom Drinking Shirts | Unisex Size",
            "url": "https://www.etsy.com/listing/1859570889/matching-st-patricks-day-shirts-printed",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "434.78", "priceCurrency": "MXN"},
            "position": 29
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/09f4fd/6549286803/il_fullxfull.6549286803_ce1q.jpg",
            "name": "Custom Family Shirt - It's A <Name> Thing You Wouldn't Understand Shirt | Printed Design Choose From 9 Colors |  Great for Family Reunions",
            "url": "https://www.etsy.com/listing/1828125632/custom-family-shirt-its-a-name-thing-you",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "375.49", "priceCurrency": "MXN"},
            "position": 30
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/b5a66f/6980333687/il_fullxfull.6980333687_4kpt.jpg",
            "name": "Kid's Mischief Managed Wizard Shirt | Printed Design | Kid's Mischief Shirt | Kid's Wizard Shirt | Unisex",
            "url": "https://www.etsy.com/listing/1824427310/kids-mischief-managed-wizard-shirt",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "375.49", "priceCurrency": "MXN"},
            "position": 31
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/051f70/6499709737/il_fullxfull.6499709737_luir.jpg",
            "name": "Adult's Everything Dope Comes From <City or State> Hoodie | Printed Design | Adult Personalized City or State Hoodie | Adult Unisex Size",
            "url": "https://www.etsy.com/listing/1816349824/adults-everything-dope-comes-from-city",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "750.99", "priceCurrency": "MXN"},
            "position": 32
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/a3c889/6499606069/il_fullxfull.6499606069_kjdo.jpg",
            "name": "Kid's Everything Dope Comes From <City or State> Hoodie | Printed Design | Kids Personalized City or State Hoodie | 15 Colors to Choose From",
            "url": "https://www.etsy.com/listing/1816325710/kids-everything-dope-comes-from-city-or",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "671.94", "priceCurrency": "MXN"},
            "position": 33
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/487019/6246804162/il_fullxfull.6246804162_exiy.jpg",
            "name": "Kid's Plunge Into the Freeze Hoodie | Printed Design | Special Olympics Taking the Plunge Team Hoodie | Unisex Size 15 Colors to Choose From",
            "url": "https://www.etsy.com/listing/1774533060/kids-plunge-into-the-freeze-hoodie",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "671.94", "priceCurrency": "MXN"},
            "position": 34
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/20dd1a/6294839653/il_fullxfull.6294839653_kawq.jpg",
            "name": "Adult Plunge Into the Freeze Hoodie | Printed Design | Special Olympics Taking the Plunge Team Hoodie | Team Hoodie Pullover | Unisex Size",
            "url": "https://www.etsy.com/listing/1774528256/adult-plunge-into-the-freeze-hoodie",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "750.99", "priceCurrency": "MXN"},
            "position": 35
        },
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://i.etsystatic.com/28285740/r/il/60a083/6246765508/il_fullxfull.6246765508_mtad.jpg",
            "name": "Adult Personalized Team Jacket Plunge Into the Freeze | Printed Design | Custom Special Olympics Taking the Plunge Team Jacket | Unisex Size",
            "url": "https://www.etsy.com/listing/1788722049/adult-personalized-team-jacket-plunge",
            "brand": {"@type": "Brand", "name": "PlwgsCreativeApparel"},
            "offers": {"@type": "Offer", "price": "869.57", "priceCurrency": "MXN"},
            "position": 36
        }
    ],
    "numberOfItems": 83
}

output_folder = "etsy_images"
os.makedirs(output_folder, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.etsy.com/',
}

print(f"Starting download of {len(etsy_data['itemListElement'])} product images...")

downloaded_count = 0
failed_count = 0

for product in etsy_data['itemListElement']:
    try:
        image_url = product['image']
        product_name = product['name']
        position = product['position']
        
        # Clean product name for filename
        clean_name = re.sub(r'[^\w\s-]', '', product_name)
        clean_name = re.sub(r'[-\s]+', '-', clean_name)
        clean_name = clean_name[:50]  # Limit length
        
        print(f"\n[{position:2d}] Downloading: {product_name[:60]}...")
        
        # Download image
        response = requests.get(image_url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            # Determine file extension from URL
            parsed_url = urlparse(image_url)
            path = parsed_url.path
            if 'jpg' in path.lower() or 'jpeg' in path.lower():
                ext = 'jpg'
            elif 'png' in path.lower():
                ext = 'png'
            elif 'webp' in path.lower():
                ext = 'webp'
            else:
                ext = 'jpg'
            
            # Create filename
            filename = f"{output_folder}/product_{position:02d}_{clean_name}.{ext}"
            
            # Save image
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            downloaded_count += 1
            print(f"✓ Saved: {filename}")
            
        else:
            print(f"✗ Failed: HTTP {response.status_code}")
            failed_count += 1
            
    except Exception as e:
        print(f"✗ Error downloading product {position}: {e}")
        failed_count += 1

print(f"\n{'='*50}")
print(f"Download Summary:")
print(f"✓ Successfully downloaded: {downloaded_count} images")
print(f"✗ Failed downloads: {failed_count} images")
print(f"📁 Images saved to: {output_folder}/")
print(f"{'='*50}")

# Create a product catalog file
catalog_file = f"{output_folder}/product_catalog.txt"
with open(catalog_file, 'w', encoding='utf-8') as f:
    f.write("PLWGCREATIVEAPPAREL - Product Catalog\n")
    f.write("=" * 50 + "\n\n")
    
    for product in etsy_data['itemListElement']:
        position = product['position']
        name = product['name']
        price = product['offers']['price']
        currency = product['offers']['priceCurrency']
        url = product['url']
        
        f.write(f"{position:2d}. {name}\n")
        f.write(f"    Price: {price} {currency}\n")
        f.write(f"    URL: {url}\n")
        f.write(f"    Image: product_{position:02d}_*.{ext}\n")
        f.write("-" * 50 + "\n\n")

print(f"📋 Product catalog saved to: {catalog_file}") 