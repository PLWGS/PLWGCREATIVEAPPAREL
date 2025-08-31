-- =============================================================================
-- FIX DELETED "UNCATEGORY" FALLBACK CATEGORY
-- =============================================================================
-- This script recreates the essential "Uncategory" fallback category
-- and reassigns any orphaned products to it.

-- Step 1: Recreate the "Uncategory" fallback category
INSERT INTO categories (name, slug, description, is_active, is_default, sort_order, created_at, updated_at) 
VALUES (
    'Uncategory', 
    'uncategory', 
    'Default category for uncategorized products - DO NOT DELETE - System Critical', 
    true, 
    true, 
    999,
    NOW(),
    NOW()
);

-- Step 2: Check for orphaned products (products without valid category_id)
SELECT 
    'ORPHANED PRODUCTS FOUND:' as status,
    p.id,
    p.name,
    p.category_id,
    p.slug
FROM products p 
WHERE p.category_id IS NULL 
   OR p.category_id NOT IN (SELECT id FROM categories WHERE is_active = true);

-- Step 3: Get the ID of the newly created "Uncategory" category
SELECT 
    'NEW UNCATEGORY CATEGORY ID:' as status,
    id,
    name,
    slug
FROM categories 
WHERE slug = 'uncategory';

-- Step 4: Reassign any orphaned products to the "Uncategory" category
UPDATE products 
SET 
    category_id = (SELECT id FROM categories WHERE slug = 'uncategory'),
    updated_at = NOW()
WHERE category_id IS NULL 
   OR category_id NOT IN (SELECT id FROM categories WHERE is_active = true);

-- Step 5: Verify the fix - show products now assigned to "Uncategory"
SELECT 
    'PRODUCTS IN UNCATEGORY:' as status,
    p.id,
    p.name,
    p.slug,
    c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'uncategory'
ORDER BY p.name;

-- Step 6: Final verification - no orphaned products should exist
SELECT 
    'VERIFICATION - NO ORPHANED PRODUCTS:' as status,
    COUNT(*) as orphaned_count
FROM products p 
WHERE p.category_id IS NULL 
   OR p.category_id NOT IN (SELECT id FROM categories WHERE is_active = true);
