-- Simple Size-Based Pricing Setup
-- Add size_pricing column
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_pricing JSONB DEFAULT '{}';

-- Update products with size pricing
UPDATE products 
SET size_pricing = '{"S": {"price": 22.00, "available": true}, "M": {"price": 22.00, "available": true}, "L": {"price": 22.00, "available": true}, "XL": {"price": 22.00, "available": true}, "2X": {"price": 26.00, "available": true}, "3X": {"price": 28.00, "available": true}, "4X": {"price": 30.00, "available": true}}'::jsonb
WHERE size_pricing = '{}' OR size_pricing IS NULL;

-- Show results
SELECT id, name, price, size_pricing FROM products LIMIT 3;
