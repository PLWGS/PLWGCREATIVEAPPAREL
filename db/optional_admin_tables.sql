-- Optional admin-related tables per ADMIN_DASHBOARD_PLAN.MD

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type TEXT,
  title TEXT,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_sends (
  id SERIAL PRIMARY KEY,
  subject TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recipients INT
);

-- Optional persistence (we currently compute feed on the fly)
CREATE TABLE IF NOT EXISTS admin_activity (
  id SERIAL PRIMARY KEY,
  type TEXT,
  title TEXT,
  subtitle TEXT,
  amount NUMERIC,
  link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;


