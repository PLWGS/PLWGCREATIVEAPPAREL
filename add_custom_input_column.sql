-- Add custom_input column to order_items table if it doesn't exist
-- This script ensures the custom_input JSONB column is available for storing customer custom input data

-- Check if custom_input column already exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'custom_input';

-- Add custom_input column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'custom_input'
    ) THEN
        ALTER TABLE order_items ADD COLUMN custom_input JSONB DEFAULT NULL;
        RAISE NOTICE 'Added custom_input column to order_items table';
    ELSE
        RAISE NOTICE 'custom_input column already exists in order_items table';
    END IF;
END $$;

-- Also add custom_input column to cart table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cart' AND column_name = 'custom_input'
    ) THEN
        ALTER TABLE cart ADD COLUMN custom_input JSONB DEFAULT NULL;
        RAISE NOTICE 'Added custom_input column to cart table';
    ELSE
        RAISE NOTICE 'custom_input column already exists in cart table';
    END IF;
END $$;

-- Show the updated table structure
\d order_items;
\d cart;

-- Test query to verify the column exists
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('order_items', 'cart') 
  AND column_name = 'custom_input'
ORDER BY table_name;
