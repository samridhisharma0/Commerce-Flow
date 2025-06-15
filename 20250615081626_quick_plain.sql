-- Complete E-commerce Database Schema
-- Supports microservices architecture with clear service boundaries

-- ============================================================================
-- USER SERVICE DATABASE SCHEMA
-- ============================================================================

-- Users table (primary user data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
    roles JSONB DEFAULT '["customer"]',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    birth_date DATE,
    gender VARCHAR(20),
    phone_number VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses table
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing')),
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(3) NOT NULL, -- ISO country code
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for tracking active sessions)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for User Service
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- PRODUCT SERVICE DATABASE SCHEMA (MongoDB Schema Definition)
-- ============================================================================

-- MongoDB Collections Schema (Document Structure)
/*
Products Collection:
{
  _id: ObjectId,
  sku: String, // indexed, unique
  name: String,
  description: String,
  shortDescription: String,
  brand: {
    id: String,
    name: String,
    slug: String,
    logo: String
  },
  category: {
    id: String,
    name: String,
    path: String, // e.g., "electronics/smartphones/android"
    breadcrumb: [String]
  },
  variants: [{
    id: String,
    sku: String,
    name: String,
    attributes: [{
      name: String, // color, size, etc.
      value: String
    }],
    pricing: {
      basePrice: Number,
      salePrice: Number,
      currency: String,
      taxable: Boolean
    },
    inventory: {
      available: Number,
      reserved: Number,
      total: Number,
      lowStockThreshold: Number
    },
    dimensions: {
      weight: Number,
      length: Number,
      width: Number,
      height: Number,
      unit: String
    }
  }],
  media: [{
    type: String, // image, video, 360
    url: String,
    alt: String,
    position: Number,
    variant_id: String // optional, for variant-specific media
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String],
    slug: String
  },
  attributes: [{
    name: String,
    value: String,
    type: String, // text, number, boolean, list
    filterable: Boolean,
    comparable: Boolean
  }],
  pricing: {
    basePrice: Number,
    salePrice: Number,
    currency: String,
    taxable: Boolean,
    priceRules: [{
      minQuantity: Number,
      price: Number
    }]
  },
  inventory: {
    trackInventory: Boolean,
    continueSellingWhenOutOfStock: Boolean,
    inventoryPolicy: String // deny, continue
  },
  shipping: {
    requiresShipping: Boolean,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    }
  },
  status: String, // active, inactive, draft, archived
  visibility: String, // public, private, password_protected
  tags: [String],
  vendor: {
    id: String,
    name: String,
    verified: Boolean
  },
  ratings: {
    average: Number,
    count: Number,
    distribution: {
      1: Number,
      2: Number,
      3: Number,
      4: Number,
      5: Number
    }
  },
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
}

Categories Collection:
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  parent_id: ObjectId,
  path: String,
  level: Number,
  image: String,
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  status: String,
  sort_order: Number,
  createdAt: Date,
  updatedAt: Date
}

Brands Collection:
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  logo: String,
  website: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
*/

-- ============================================================================
-- ORDER SERVICE DATABASE SCHEMA
-- ============================================================================

-- Orders table (main order data)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    
    -- Financial data
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Addresses (stored as JSONB for flexibility)
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    
    -- Order metadata
    notes TEXT,
    internal_notes TEXT,
    source VARCHAR(50) DEFAULT 'web', -- web, mobile, api, pos
    
    -- Timestamps
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL, -- Reference to product service
    product_variant_id UUID, -- Reference to specific variant
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    variant_title VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Product snapshot at time of order
    product_snapshot JSONB,
    
    -- Fulfillment
    fulfilled_quantity INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order status history for audit trail
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    changed_by UUID, -- Reference to user who made the change
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order discounts/coupons applied
CREATE TABLE order_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    discount_code VARCHAR(100),
    discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value DECIMAL(10,2),
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping carts table (separate from orders)
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Null for guest carts
    session_id VARCHAR(255), -- For guest carts
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping cart items
CREATE TABLE shopping_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_variant_id UUID,
    sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2),
    
    -- Product data cache
    product_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Order Service
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_session_id ON shopping_carts(session_id);
CREATE INDEX idx_shopping_cart_items_cart_id ON shopping_cart_items(cart_id);

-- ============================================================================
-- PAYMENT SERVICE DATABASE SCHEMA
-- ============================================================================

-- Payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay')),
    provider VARCHAR(50) NOT NULL, -- stripe, paypal, etc.
    provider_payment_method_id VARCHAR(255),
    
    -- Card-specific fields (encrypted)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_country VARCHAR(3),
    
    -- General fields
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    billing_address JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID, -- Reference to order service
    user_id UUID NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Payment details
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Gateway information
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    gateway_reference VARCHAR(255),
    
    -- Processing details
    processing_fee DECIMAL(10,4),
    net_amount DECIMAL(12,2),
    
    -- Failure information
    failure_code VARCHAR(50),
    failure_message TEXT,
    
    -- Timestamps
    authorized_at TIMESTAMP,
    captured_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment refunds table
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reason VARCHAR(255),
    gateway_refund_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment events for audit trail
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    gateway_event_id VARCHAR(255),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Payment Service
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);
CREATE INDEX idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX idx_payment_events_payment_id ON payment_events(payment_id);

-- ============================================================================
-- INVENTORY SERVICE DATABASE SCHEMA
-- ============================================================================

-- Inventory locations/warehouses
CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_fulfillment_location BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory levels per product variant per location
CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES inventory_locations(id),
    product_id UUID NOT NULL,
    product_variant_id UUID,
    sku VARCHAR(100) NOT NULL,
    
    -- Stock levels
    available_quantity INTEGER DEFAULT 0 CHECK (available_quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
    committed_quantity INTEGER DEFAULT 0 CHECK (committed_quantity >= 0),
    on_hand_quantity INTEGER DEFAULT 0 CHECK (on_hand_quantity >= 0),
    
    -- Settings
    low_stock_threshold INTEGER DEFAULT 5,
    out_of_stock_threshold INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(location_id, product_variant_id)
);

-- Inventory movements/transactions
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES inventory_locations(id),
    product_id UUID NOT NULL,
    product_variant_id UUID,
    sku VARCHAR(100) NOT NULL,
    
    -- Movement details
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'purchase', 'sale', 'return', 'adjustment', 'transfer', 'reservation', 'release'
    )),
    quantity_change INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id UUID, -- Order ID, Purchase Order ID, etc.
    reference_type VARCHAR(50), -- order, purchase_order, adjustment, etc.
    
    -- User who made the change
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory reservations (for cart items, pending orders)
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES inventory_locations(id),
    product_id UUID NOT NULL,
    product_variant_id UUID,
    sku VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    -- Reservation details
    reserved_by UUID NOT NULL, -- User ID
    reserved_for VARCHAR(50) NOT NULL, -- cart, order, etc.
    reference_id UUID NOT NULL, -- Cart ID, Order ID, etc.
    expires_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'cancelled')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Inventory Service
CREATE INDEX idx_inventory_levels_location_product ON inventory_levels(location_id, product_id);
CREATE INDEX idx_inventory_levels_sku ON inventory_levels(sku);
CREATE INDEX idx_inventory_levels_low_stock ON inventory_levels(location_id) WHERE available_quantity <= low_stock_threshold;
CREATE INDEX idx_inventory_movements_location_product ON inventory_movements(location_id, product_id);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_inventory_reservations_reference ON inventory_reservations(reference_type, reference_id);
CREATE INDEX idx_inventory_reservations_status ON inventory_reservations(status);
CREATE INDEX idx_inventory_reservations_expires ON inventory_reservations(expires_at);

-- ============================================================================
-- NOTIFICATION SERVICE DATABASE SCHEMA
-- ============================================================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'webhook')),
    event_type VARCHAR(100) NOT NULL, -- user.created, order.confirmed, etc.
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification queue
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID, -- User ID (optional for webhooks)
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'webhook')),
    template_id UUID REFERENCES notification_templates(id),
    subject VARCHAR(500),
    content TEXT NOT NULL,
    data JSONB, -- Template data
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMP,
    
    -- Results
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    external_id VARCHAR(255), -- Provider message ID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification logs (for sent notifications)
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notification_queue(id),
    recipient_id UUID,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    complained_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, event_type)
);

-- Indexes for Notification Service
CREATE INDEX idx_notification_templates_event_type ON notification_templates(event_type);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_next_attempt ON notification_queue(next_attempt_at) WHERE status = 'pending';
CREATE INDEX idx_notification_queue_recipient ON notification_queue(recipient_id);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- ============================================================================
-- ANALYTICS SERVICE DATABASE SCHEMA (Time-series data)
-- ============================================================================

-- Events table for analytics (consider using InfluxDB or similar for production)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID,
    session_id VARCHAR(255),
    properties JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Partitioning key (for time-based partitioning)
    date_partition DATE GENERATED ALWAYS AS (timestamp::date) STORED
) PARTITION BY RANGE (date_partition);

-- Create monthly partitions (example for current and next month)
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_events_2024_02 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- User sessions for analytics
CREATE TABLE analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(3),
    region VARCHAR(100),
    city VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0
);

-- Indexes for Analytics Service
CREATE INDEX idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_started_at ON analytics_sessions(started_at);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON shopping_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_cart_items_updated_at BEFORE UPDATE ON shopping_cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_locations_updated_at BEFORE UPDATE ON inventory_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_levels_updated_at BEFORE UPDATE ON inventory_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_reservations_updated_at BEFORE UPDATE ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_queue_updated_at BEFORE UPDATE ON notification_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default address per user per type
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE user_addresses 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
          AND type = NEW.type 
          AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_address_trigger 
    BEFORE INSERT OR UPDATE ON user_addresses 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_address();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE payment_methods 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
          AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_payment_method_trigger 
    BEFORE INSERT OR UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to update inventory levels after movements
CREATE OR REPLACE FUNCTION update_inventory_after_movement()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory_levels 
    SET 
        on_hand_quantity = on_hand_quantity + NEW.quantity_change,
        available_quantity = GREATEST(0, on_hand_quantity + NEW.quantity_change - reserved_quantity),
        updated_at = CURRENT_TIMESTAMP
    WHERE location_id = NEW.location_id 
      AND product_variant_id = NEW.product_variant_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_after_movement_trigger 
    AFTER INSERT ON inventory_movements 
    FOR EACH ROW EXECUTE FUNCTION update_inventory_after_movement();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default inventory location
INSERT INTO inventory_locations (name, code, is_active, is_fulfillment_location)
VALUES ('Main Warehouse', 'MAIN', TRUE, TRUE);

-- Insert common notification templates
INSERT INTO notification_templates (name, type, event_type, subject, content) VALUES
('Welcome Email', 'email', 'user.created', 'Welcome to CommerceFlow!', 
 'Hi {{firstName}}, welcome to our platform! Please verify your email address.'),
('Order Confirmation', 'email', 'order.confirmed', 'Order Confirmation #{{orderNumber}}', 
 'Thank you for your order! Your order #{{orderNumber}} has been confirmed.'),
('Order Shipped', 'email', 'order.shipped', 'Your Order Has Shipped! #{{orderNumber}}', 
 'Great news! Your order #{{orderNumber}} has been shipped. Tracking: {{trackingNumber}}'),
('Password Reset', 'email', 'user.password_reset', 'Reset Your Password', 
 'Click here to reset your password: {{resetLink}}');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User summary view
CREATE VIEW user_summary AS
SELECT 
    u.id,
    u.email,
    u.status,
    up.first_name,
    up.last_name,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
GROUP BY u.id, u.email, u.status, up.first_name, up.last_name, u.created_at, u.last_login;

-- Order summary view
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    o.status,
    o.payment_status,
    o.total_amount,
    o.currency,
    o.created_at,
    COUNT(oi.id) as item_count,
    COALESCE(up.first_name || ' ' || up.last_name, 'Guest') as customer_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
GROUP BY o.id, o.order_number, o.user_id, o.status, o.payment_status, 
         o.total_amount, o.currency, o.created_at, up.first_name, up.last_name;

-- Inventory summary view
CREATE VIEW inventory_summary AS
SELECT 
    il.product_id,
    il.product_variant_id,
    il.sku,
    SUM(il.available_quantity) as total_available,
    SUM(il.reserved_quantity) as total_reserved,
    SUM(il.on_hand_quantity) as total_on_hand,
    COUNT(il.location_id) as locations_count,
    MIN(il.low_stock_threshold) as min_low_stock_threshold
FROM inventory_levels il
INNER JOIN inventory_locations loc ON il.location_id = loc.id
WHERE loc.is_active = TRUE
GROUP BY il.product_id, il.product_variant_id, il.sku;