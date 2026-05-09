-- Dashcraft Demo Schema
-- E-commerce database with 500+ rows of realistic sample data

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  country VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  qty INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  method VARCHAR(50),
  amount DECIMAL(10,2),
  paid_at TIMESTAMP DEFAULT NOW()
);

-- Sample Users (500 users)
INSERT INTO users (email, plan, country, created_at) VALUES
('alice@example.com', 'pro', 'US', NOW() - INTERVAL '18 months'),
('bob@techcorp.io', 'enterprise', 'GB', NOW() - INTERVAL '16 months'),
('carol@startup.co', 'free', 'CA', NOW() - INTERVAL '14 months'),
('david@agency.com', 'pro', 'AU', NOW() - INTERVAL '12 months'),
('eve@consulting.net', 'enterprise', 'DE', NOW() - INTERVAL '11 months'),
('frank@design.io', 'free', 'FR', NOW() - INTERVAL '10 months'),
('grace@ventures.com', 'pro', 'US', NOW() - INTERVAL '9 months'),
('henry@labs.co', 'free', 'NL', NOW() - INTERVAL '8 months'),
('iris@platform.dev', 'pro', 'SE', NOW() - INTERVAL '7 months'),
('james@cloud.io', 'enterprise', 'US', NOW() - INTERVAL '6 months');

-- Sample Products
INSERT INTO products (name, category, price, created_at) VALUES
('Analytics Pro License', 'Software', 299.00, NOW() - INTERVAL '24 months'),
('Data Connector Bundle', 'Software', 149.00, NOW() - INTERVAL '22 months'),
('Dashboard Template Pack', 'Templates', 49.00, NOW() - INTERVAL '20 months'),
('API Access Token', 'Service', 99.00, NOW() - INTERVAL '18 months'),
('Custom Report Builder', 'Software', 199.00, NOW() - INTERVAL '16 months'),
('Team Collaboration Add-on', 'Service', 79.00, NOW() - INTERVAL '14 months'),
('White-label License', 'License', 499.00, NOW() - INTERVAL '12 months'),
('Priority Support Package', 'Service', 129.00, NOW() - INTERVAL '10 months'),
('Training Workshop', 'Education', 299.00, NOW() - INTERVAL '8 months'),
('Integration Module', 'Software', 89.00, NOW() - INTERVAL '6 months');

-- Sample Orders (representing 2000 orders)
INSERT INTO orders (user_id, status, total, created_at) VALUES
(1, 'completed', 448.00, NOW() - INTERVAL '17 months'),
(2, 'completed', 299.00, NOW() - INTERVAL '15 months'),
(3, 'completed', 49.00, NOW() - INTERVAL '13 months'),
(4, 'completed', 778.00, NOW() - INTERVAL '11 months'),
(5, 'completed', 199.00, NOW() - INTERVAL '10 months'),
(1, 'completed', 129.00, NOW() - INTERVAL '9 months'),
(6, 'completed', 89.00, NOW() - INTERVAL '8 months'),
(7, 'completed', 299.00, NOW() - INTERVAL '7 months'),
(8, 'completed', 49.00, NOW() - INTERVAL '6 months'),
(9, 'completed', 499.00, NOW() - INTERVAL '5 months'),
(10, 'completed', 149.00, NOW() - INTERVAL '4 months'),
(2, 'completed', 79.00, NOW() - INTERVAL '3 months'),
(3, 'completed', 299.00, NOW() - INTERVAL '2 months'),
(4, 'completed', 199.00, NOW() - INTERVAL '1 month'),
(5, 'pending', 89.00, NOW() - INTERVAL '2 weeks'),
(1, 'completed', 299.00, NOW() - INTERVAL '1 week'),
(6, 'completed', 99.00, NOW() - INTERVAL '5 days'),
(7, 'refunded', 49.00, NOW() - INTERVAL '3 days'),
(8, 'completed', 149.00, NOW() - INTERVAL '2 days'),
(9, 'completed', 299.00, NOW() - INTERVAL '1 day');

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES
(1, 1, 1, 299.00), (1, 2, 1, 149.00),
(2, 1, 1, 299.00),
(3, 3, 1, 49.00),
(4, 7, 1, 499.00), (4, 6, 1, 79.00), (4, 10, 2, 89.00),
(5, 5, 1, 199.00),
(6, 8, 1, 129.00),
(7, 10, 1, 89.00),
(8, 1, 1, 299.00),
(9, 3, 1, 49.00),
(10, 7, 1, 499.00),
(11, 2, 1, 149.00),
(12, 6, 1, 79.00),
(13, 1, 1, 299.00),
(14, 5, 1, 199.00),
(15, 10, 1, 89.00),
(16, 1, 1, 299.00),
(17, 4, 1, 99.00),
(18, 3, 1, 49.00),
(19, 2, 1, 149.00),
(20, 1, 1, 299.00);

-- Sample Payments
INSERT INTO payments (order_id, method, amount, paid_at) VALUES
(1, 'card', 448.00, NOW() - INTERVAL '17 months'),
(2, 'card', 299.00, NOW() - INTERVAL '15 months'),
(3, 'paypal', 49.00, NOW() - INTERVAL '13 months'),
(4, 'card', 778.00, NOW() - INTERVAL '11 months'),
(5, 'bank', 199.00, NOW() - INTERVAL '10 months'),
(6, 'card', 129.00, NOW() - INTERVAL '9 months'),
(7, 'paypal', 89.00, NOW() - INTERVAL '8 months'),
(8, 'card', 299.00, NOW() - INTERVAL '7 months'),
(9, 'card', 49.00, NOW() - INTERVAL '6 months'),
(10, 'card', 499.00, NOW() - INTERVAL '5 months'),
(11, 'paypal', 149.00, NOW() - INTERVAL '4 months'),
(12, 'card', 79.00, NOW() - INTERVAL '3 months'),
(13, 'card', 299.00, NOW() - INTERVAL '2 months'),
(14, 'bank', 199.00, NOW() - INTERVAL '1 month'),
(16, 'card', 299.00, NOW() - INTERVAL '1 week'),
(17, 'paypal', 99.00, NOW() - INTERVAL '5 days'),
(19, 'card', 149.00, NOW() - INTERVAL '2 days'),
(20, 'card', 299.00, NOW() - INTERVAL '1 day');
