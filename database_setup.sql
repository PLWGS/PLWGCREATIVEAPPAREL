-- Size-Based Pricing Implementation for PLWGCREATIVEAPPAREL
-- This script adds size pricing functionality to the products table

-- First, let's see the current table structure
\d products;

-- Check if size_pricing column already exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'size_pricing';

-- Add size_pricing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'size_pricing'
    ) THEN
        ALTER TABLE products ADD COLUMN size_pricing JSONB DEFAULT '{}';
        RAISE NOTICE 'Added size_pricing column to products table';
    ELSE
        RAISE NOTICE 'size_pricing column already exists';
    END IF;
END $$;

-- Show the updated table structure
\d products;

-- Create a sample size pricing structure for existing products
UPDATE products 
SET size_pricing = '{
    "S": {"price": 22.00, "available": true},
    "M": {"price": 22.00, "available": true},
    "L": {"price": 22.00, "available": true},
    "XL": {"price": 22.00, "available": true},
    "2X": {"price": 26.00, "available": true},
    "3X": {"price": 28.00, "available": true},
    "4X": {"price": 30.00, "available": true}
}'::jsonb
WHERE size_pricing = '{}' OR size_pricing IS NULL;

-- Show sample data
SELECT id, name, price, size_pricing FROM products LIMIT 5;

-- Create an index for better performance on size_pricing queries
CREATE INDEX IF NOT EXISTS idx_products_size_pricing ON products USING GIN (size_pricing);

-- Test query to get product with size pricing
SELECT 
    id,
    name,
    price as base_price,
    size_pricing->>'2X' as size_2x_info,
    (size_pricing->'2X'->>'price')::numeric as size_2x_price
FROM products 
WHERE size_pricing IS NOT NULL 
LIMIT 3;
