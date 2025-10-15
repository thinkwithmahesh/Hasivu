-- HASIVU Platform Database Schema
-- Optimized for school meal delivery performance at scale
-- Target: 1000+ concurrent users during lunch rush

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Schools table (multi-tenant architecture)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    lunch_rush_start TIME DEFAULT '11:30:00',
    lunch_rush_end TIME DEFAULT '13:30:00',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu categories with hierarchy support
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(school_id, slug)
);

-- Menu items with comprehensive nutrition and school-specific data
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_value INTEGER NOT NULL, -- Price in paise/cents for accurate calculations
    price_display VARCHAR(20) NOT NULL,
    prep_time_minutes INTEGER DEFAULT 10,
    rating DECIMAL(3,2) DEFAULT 0.0,
    image_url VARCHAR(500),
    image_emoji VARCHAR(10),
    active BOOLEAN DEFAULT TRUE,

    -- Nutritional information
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    fiber DECIMAL(5,2),
    sugar DECIMAL(5,2),

    -- School-specific data
    popularity_score INTEGER DEFAULT 0,
    last_ordered DATE,
    order_count INTEGER DEFAULT 0,

    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(name, '') || ' ' ||
            COALESCE(description, '') || ' ' ||
            COALESCE((SELECT string_agg(dietary_type, ' ') FROM menu_item_dietary WHERE item_id = menu_items.id), '')
        )
    ) STORED,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dietary restrictions and preferences
CREATE TABLE dietary_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) -- Hex color code
);

-- Junction table for menu items and dietary types
CREATE TABLE menu_item_dietary (
    item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    dietary_type_id UUID REFERENCES dietary_types(id) ON DELETE CASCADE,
    dietary_type VARCHAR(100) NOT NULL, -- Denormalized for performance
    PRIMARY KEY (item_id, dietary_type_id)
);

-- Ingredients for allergen tracking
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_allergen BOOLEAN DEFAULT FALSE,
    allergen_category VARCHAR(50), -- dairy, nuts, gluten, etc.
    description TEXT
);

-- Junction table for menu items and ingredients
CREATE TABLE menu_item_ingredients (
    item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(100) NOT NULL, -- Denormalized for performance
    is_allergen BOOLEAN DEFAULT FALSE, -- Denormalized for performance
    PRIMARY KEY (item_id, ingredient_id)
);

-- Age groups for school-specific targeting
CREATE TABLE age_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    description TEXT,

    UNIQUE(school_id, name)
);

-- Junction table for menu items and age groups
CREATE TABLE menu_item_age_groups (
    item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    age_group_id UUID REFERENCES age_groups(id) ON DELETE CASCADE,
    age_group_name VARCHAR(50) NOT NULL, -- Denormalized for performance
    PRIMARY KEY (item_id, age_group_id)
);

-- Menu availability schedules
CREATE TABLE menu_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 1-7 (Monday-Sunday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available BOOLEAN DEFAULT TRUE,

    UNIQUE(item_id, day_of_week, start_time)
);

-- Performance indexes for high-frequency queries
-- These indexes are critical for lunch rush performance

-- Primary lookup indexes
CREATE INDEX CONCURRENTLY idx_menu_items_school_active ON menu_items(school_id, active) WHERE active = TRUE;
CREATE INDEX CONCURRENTLY idx_menu_items_category ON menu_items(category_id, active) WHERE active = TRUE;
CREATE INDEX CONCURRENTLY idx_menu_items_popularity ON menu_items(school_id, popularity_score DESC, active) WHERE active = TRUE;

-- Price and rating filters (common during browsing)
CREATE INDEX CONCURRENTLY idx_menu_items_price ON menu_items(school_id, price_value, active) WHERE active = TRUE;
CREATE INDEX CONCURRENTLY idx_menu_items_rating ON menu_items(school_id, rating DESC, active) WHERE active = TRUE;
CREATE INDEX CONCURRENTLY idx_menu_items_prep_time ON menu_items(school_id, prep_time_minutes, active) WHERE active = TRUE;

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY idx_menu_items_category_price_rating ON menu_items(school_id, category_id, price_value, rating DESC, active) WHERE active = TRUE;

-- Full-text search index (critical for search performance)
CREATE INDEX CONCURRENTLY idx_menu_items_search ON menu_items USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_menu_items_name_trgm ON menu_items USING GIN(name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_menu_items_description_trgm ON menu_items USING GIN(description gin_trgm_ops);

-- Dietary restrictions indexes (high-frequency filters)
CREATE INDEX CONCURRENTLY idx_menu_item_dietary_lookup ON menu_item_dietary(dietary_type, item_id);
CREATE INDEX CONCURRENTLY idx_menu_item_dietary_item ON menu_item_dietary(item_id, dietary_type);

-- Age group targeting indexes
CREATE INDEX CONCURRENTLY idx_menu_item_age_groups_lookup ON menu_item_age_groups(age_group_name, item_id);

-- Availability indexes for time-based queries
CREATE INDEX CONCURRENTLY idx_menu_availability_day_time ON menu_availability(day_of_week, start_time, end_time) WHERE available = TRUE;
CREATE INDEX CONCURRENTLY idx_menu_availability_item_day ON menu_availability(item_id, day_of_week) WHERE available = TRUE;

-- Nutritional indexes for health-conscious filtering
CREATE INDEX CONCURRENTLY idx_menu_items_calories ON menu_items(school_id, calories, active) WHERE active = TRUE AND calories IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_menu_items_protein ON menu_items(school_id, protein DESC, active) WHERE active = TRUE AND protein IS NOT NULL;

-- Allergen safety indexes (critical for student safety)
CREATE INDEX CONCURRENTLY idx_ingredients_allergen ON ingredients(is_allergen, allergen_category) WHERE is_allergen = TRUE;
CREATE INDEX CONCURRENTLY idx_menu_item_ingredients_allergen ON menu_item_ingredients(item_id, is_allergen) WHERE is_allergen = TRUE;

-- Partitioning for multi-school scale (if needed for very large deployments)
-- This can be implemented later for enterprise scale
-- ALTER TABLE menu_items PARTITION BY HASH(school_id);

-- Performance tuning settings
-- These should be applied based on server specifications

-- Example settings for a medium-scale deployment:
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
-- random_page_cost = 1.1 (for SSD)

-- Insert sample dietary types
INSERT INTO dietary_types (name, slug, description, icon, color) VALUES
('Vegetarian', 'vegetarian', 'Contains no meat or fish', '🥬', '#4CAF50'),
('Vegan', 'vegan', 'Contains no animal products', '🌱', '#8BC34A'),
('High Protein', 'high-protein', 'Rich in protein content', '💪', '#FF9800'),
('Gluten-Free', 'gluten-free', 'Contains no gluten', '🌾', '#3F51B5'),
('Dairy-Free', 'dairy-free', 'Contains no dairy products', '🥛', '#9C27B0'),
('Low Calorie', 'low-calorie', 'Lower calorie option', '⚖️', '#009688'),
('High Fiber', 'high-fiber', 'Rich in dietary fiber', '🌾', '#795548'),
('Traditional', 'traditional', 'Traditional Indian cuisine', '🏛️', '#FF5722'),
('Street Food', 'street-food', 'Indian street food style', '🛣️', '#F44336'),
('Kid-Friendly', 'kid-friendly', 'Mild spices, suitable for children', '👶', '#E91E63'),
('Healthy', 'healthy', 'Nutritious and wholesome', '💚', '#4CAF50'),
('Vitamin Rich', 'vitamin-rich', 'High in vitamins and minerals', '🍊', '#FF9800'),
('Sweet', 'sweet', 'Dessert or sweet item', '🍯', '#FFC107'),
('Mild Spice', 'mild-spice', 'Gentle spicing for sensitive palates', '🌶️', '#FFEB3B'),
('Comfort Food', 'comfort-food', 'Familiar, comforting dishes', '🏠', '#607D8B');

-- Insert common allergen ingredients
INSERT INTO ingredients (name, slug, is_allergen, allergen_category, description) VALUES
('Peanuts', 'peanuts', TRUE, 'nuts', 'Tree nut allergen'),
('Tree Nuts', 'tree-nuts', TRUE, 'nuts', 'Various tree nuts'),
('Milk', 'milk', TRUE, 'dairy', 'Dairy product'),
('Eggs', 'eggs', TRUE, 'eggs', 'Chicken eggs'),
('Wheat', 'wheat', TRUE, 'gluten', 'Contains gluten'),
('Soy', 'soy', TRUE, 'soy', 'Soy products'),
('Fish', 'fish', TRUE, 'seafood', 'Fish products'),
('Shellfish', 'shellfish', TRUE, 'seafood', 'Shellfish products'),
('Sesame', 'sesame', TRUE, 'seeds', 'Sesame seeds');

-- Add common non-allergen ingredients
INSERT INTO ingredients (name, slug, is_allergen, allergen_category, description) VALUES
('Rice', 'rice', FALSE, NULL, 'Basmati or regular rice'),
('Lentils', 'lentils', FALSE, NULL, 'Various types of dal'),
('Tomatoes', 'tomatoes', FALSE, NULL, 'Fresh tomatoes'),
('Onions', 'onions', FALSE, NULL, 'Fresh onions'),
('Ginger', 'ginger', FALSE, NULL, 'Fresh ginger'),
('Garlic', 'garlic', FALSE, NULL, 'Fresh garlic'),
('Turmeric', 'turmeric', FALSE, NULL, 'Turmeric powder'),
('Cumin', 'cumin', FALSE, NULL, 'Cumin seeds or powder'),
('Coriander', 'coriander', FALSE, NULL, 'Fresh coriander leaves'),
('Coconut', 'coconut', FALSE, NULL, 'Fresh coconut or coconut milk');