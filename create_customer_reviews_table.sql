-- Create customer_reviews table for homepage Etsy reviews
CREATE TABLE IF NOT EXISTS customer_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_name VARCHAR(100) NOT NULL,
  star_rating INTEGER NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  review_message TEXT NOT NULL,
  date_reviewed VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample reviews
INSERT INTO customer_reviews (reviewer_name, star_rating, review_message, date_reviewed, is_active, display_order) VALUES
('Michelle', 5, 'Shop owner went out of her way to help me and make sure I was completely satisfied with my order', '07/21/2025', true, 1),
('Shelley', 5, 'Lori is awesome to work with!', '07/21/2025', true, 2),
('Raelynn', 5, 'Always a pleasure working together!', '07/18/2025', true, 3),
('Amy', 5, 'Thanks so much! My son loved this shirt for his birthday!', '06/04/2025', true, 4),
('Laura', 5, 'High quality shirt. Highly recommend. Will reorder from this site again', '05/23/2025', true, 5)
ON CONFLICT DO NOTHING;
