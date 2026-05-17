-- HASIVU Platform - Database Performance Optimizations
-- Optimized for school meal delivery platform with 1000+ concurrent users
-- Target: <200ms API responses during lunch rush (11:30-13:30)

-- ============================================================================
-- 1. CRITICAL PERFORMANCE INDEXES FOR LUNCH RUSH
-- ============================================================================

-- Enhanced menu browsing indexes (most critical for lunch rush)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_lunch_rush 
  ON menu_items(school_id, active, category_id, popularity_score DESC, price_value) 
  WHERE active = TRUE;

-- School-specific menu filtering (multi-tenant optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_school_category_active 
  ON menu_items(school_id, category_id, active, rating DESC) 
  WHERE active = TRUE;

-- Price-based filtering with school context
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_price_range 
  ON menu_items(school_id, price_value, active) 
  WHERE active = TRUE AND price_value BETWEEN 10 AND 100;

-- Quick availability lookup for real-time availability checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_availability_realtime 
  ON menu_availability(item_id, day_of_week, start_time, end_time) 
  WHERE available = TRUE;

-- ============================================================================
-- 2. ADVANCED SEARCH PERFORMANCE INDEXES
-- ============================================================================

-- Composite search index for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_search_composite 
  ON menu_items(school_id, active, category_id, price_value, rating DESC, prep_time_minutes) 
  WHERE active = TRUE;

-- Nutritional filtering indexes (health-conscious students)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_nutrition_health 
  ON menu_items(school_id, calories, protein DESC, active) 
  WHERE active = TRUE AND calories IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_nutrition_calories_range 
  ON menu_items(school_id, calories, active) 
  WHERE active = TRUE AND calories BETWEEN 100 AND 800;

-- ============================================================================
-- 3. DIETARY RESTRICTIONS & ALLERGEN SAFETY INDEXES
-- ============================================================================

-- Critical for student safety - allergen checking must be <50ms
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergen_safety_lookup 
  ON menu_item_ingredients(item_id, is_allergen, ingredient_name) 
  WHERE is_allergen = TRUE;

-- Dietary preference filtering (vegetarian, vegan, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dietary_preference_lookup 
  ON menu_item_dietary(dietary_type, item_id);

-- Multi-dietary filtering support
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dietary_multi_filter 
  ON menu_item_dietary(item_id, dietary_type_id, dietary_type);

-- ============================================================================
-- 4. AGE GROUP & SCHOOL-SPECIFIC TARGETING
-- ============================================================================

-- Age-appropriate meal recommendations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_age_group_targeting 
  ON menu_item_age_groups(age_group_name, item_id);

-- School-specific age group lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_school_age_groups 
  ON age_groups(school_id, min_age, max_age);

-- ============================================================================
-- 5. POPULARITY & ORDERING PATTERN INDEXES
-- ============================================================================

-- Trending items during lunch rush
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trending_items 
  ON menu_items(school_id, order_count DESC, last_ordered DESC, active) 
  WHERE active = TRUE;

-- Popular items by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_popular_by_category 
  ON menu_items(school_id, category_id, popularity_score DESC, active) 
  WHERE active = TRUE;

-- ============================================================================
-- 6. TIME-BASED AVAILABILITY OPTIMIZATION
-- ============================================================================

-- Current day availability lookup (lunch rush optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_current_day_availability 
  ON menu_availability(day_of_week, available, item_id, start_time, end_time) 
  WHERE available = TRUE;

-- Time slot optimization for meal periods
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meal_period_availability 
  ON menu_availability(item_id, day_of_week) 
  WHERE available = TRUE 
    AND start_time <= '14:00:00'::time 
    AND end_time >= '11:30:00'::time;

-- ============================================================================
-- 7. FULL-TEXT SEARCH PERFORMANCE ENHANCEMENTS
-- ============================================================================

-- Enhanced search vector index with better ranking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_vector_ranked 
  ON menu_items USING GIN(search_vector) 
  WHERE active = TRUE;

-- Trigram indexes for fuzzy searching and typo tolerance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_name_fuzzy 
  ON menu_items USING GIN(name gin_trgm_ops) 
  WHERE active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_description_fuzzy 
  ON menu_items USING GIN(description gin_trgm_ops) 
  WHERE active = TRUE;

-- ============================================================================
-- 8. CATEGORY & HIERARCHY PERFORMANCE
-- ============================================================================

-- Category browsing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_school_order 
  ON menu_categories(school_id, display_order, active) 
  WHERE active = TRUE;

-- Category item count for UI display
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_item_count 
  ON menu_items(category_id, active) 
  WHERE active = TRUE;

-- ============================================================================
-- 9. PERFORMANCE MONITORING INDEXES
-- ============================================================================

-- Query performance tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_created_at 
  ON menu_items(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_updated_at 
  ON menu_items(updated_at DESC) 
  WHERE active = TRUE;

-- School activity monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schools_active_timezone 
  ON schools(active, timezone) 
  WHERE active = TRUE;

-- ============================================================================
-- 10. MATERIALIZED VIEW FOR HEAVY AGGREGATIONS
-- ============================================================================

-- Pre-computed menu statistics for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_menu_stats AS
SELECT 
    s.id as school_id,
    s.name as school_name,
    COUNT(mi.id) as total_items,
    COUNT(mi.id) FILTER (WHERE mi.active = TRUE) as active_items,
    COUNT(DISTINCT mi.category_id) as total_categories,
    AVG(mi.rating) as avg_rating,
    MIN(mi.price_value) as min_price,
    MAX(mi.price_value) as max_price,
    AVG(mi.price_value) as avg_price,
    COUNT(mi.id) FILTER (WHERE 'Vegetarian' = ANY(string_to_array((SELECT string_agg(dietary_type, '|') FROM menu_item_dietary WHERE item_id = mi.id), '|'))) as vegetarian_count,
    COUNT(mi.id) FILTER (WHERE mi.calories < 400) as low_calorie_count,
    COUNT(mi.id) FILTER (WHERE mi.prep_time_minutes <= 10) as quick_prep_count,
    MAX(mi.updated_at) as last_menu_update
FROM schools s
LEFT JOIN menu_items mi ON s.id = mi.school_id
WHERE s.active = TRUE
GROUP BY s.id, s.name;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_menu_stats_school 
  ON mv_menu_stats(school_id);

-- ============================================================================
-- 11. LUNCH RUSH OPTIMIZATION VIEW
-- ============================================================================

-- Pre-computed view for lunch rush queries (11:30-13:30)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_lunch_menu AS
SELECT 
    mi.id,
    mi.school_id,
    mi.name,
    mi.description,
    mi.price_value,
    mi.price_display,
    mi.rating,
    mi.prep_time_minutes,
    mi.popularity_score,
    mi.image_emoji,
    mc.name as category_name,
    mc.slug as category_slug,
    ARRAY_AGG(DISTINCT mid.dietary_type) FILTER (WHERE mid.dietary_type IS NOT NULL) as dietary_types,
    ARRAY_AGG(DISTINCT miag.age_group_name) FILTER (WHERE miag.age_group_name IS NOT NULL) as age_groups,
    mi.calories,
    mi.protein,
    mi.carbs,
    mi.fat,
    mi.search_vector,
    -- Pre-compute lunch availability
    EXISTS(
        SELECT 1 FROM menu_availability ma 
        WHERE ma.item_id = mi.id 
        AND ma.available = TRUE
        AND ma.start_time <= '13:30:00'::time
        AND ma.end_time >= '11:30:00'::time
    ) as available_lunch,
    -- Pre-compute allergen flags
    COALESCE((
        SELECT COUNT(*) > 0 
        FROM menu_item_ingredients mii 
        WHERE mii.item_id = mi.id AND mii.is_allergen = TRUE
    ), false) as has_allergens
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
LEFT JOIN menu_item_dietary mid ON mi.id = mid.item_id
LEFT JOIN menu_item_age_groups miag ON mi.id = miag.item_id
WHERE mi.active = TRUE
GROUP BY 
    mi.id, mi.school_id, mi.name, mi.description, mi.price_value, 
    mi.price_display, mi.rating, mi.prep_time_minutes, mi.popularity_score,
    mi.image_emoji, mc.name, mc.slug, mi.calories, mi.protein, 
    mi.carbs, mi.fat, mi.search_vector;

-- Indexes for lunch menu view
CREATE INDEX IF NOT EXISTS idx_mv_lunch_school_popular 
  ON mv_lunch_menu(school_id, popularity_score DESC) 
  WHERE available_lunch = TRUE;

CREATE INDEX IF NOT EXISTS idx_mv_lunch_search 
  ON mv_lunch_menu USING GIN(search_vector) 
  WHERE available_lunch = TRUE;

CREATE INDEX IF NOT EXISTS idx_mv_lunch_category_price 
  ON mv_lunch_menu(school_id, category_slug, price_value) 
  WHERE available_lunch = TRUE;

-- ============================================================================
-- 12. REFRESH PROCEDURES FOR MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh menu statistics (run every 5 minutes)
CREATE OR REPLACE FUNCTION refresh_menu_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_menu_stats;
    -- Log refresh for monitoring
    INSERT INTO performance_logs(action, timestamp, details) 
    VALUES ('mv_menu_stats_refresh', NOW(), 'Menu statistics refreshed');
EXCEPTION 
    WHEN OTHERS THEN
        -- Log error but don't fail
        INSERT INTO performance_logs(action, timestamp, details, error) 
        VALUES ('mv_menu_stats_refresh_error', NOW(), SQLERRM, true);
END;
$$ LANGUAGE plpgsql;

-- Function to refresh lunch menu (run every hour during school hours)
CREATE OR REPLACE FUNCTION refresh_lunch_menu()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lunch_menu;
    INSERT INTO performance_logs(action, timestamp, details) 
    VALUES ('mv_lunch_menu_refresh', NOW(), 'Lunch menu refreshed');
EXCEPTION 
    WHEN OTHERS THEN
        INSERT INTO performance_logs(action, timestamp, details, error) 
        VALUES ('mv_lunch_menu_refresh_error', NOW(), SQLERRM, true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. PERFORMANCE LOGGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT,
    execution_time_ms INTEGER,
    error BOOLEAN DEFAULT FALSE,
    school_id UUID,
    query_type VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp 
  ON performance_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_performance_logs_action_time 
  ON performance_logs(action, timestamp DESC);

-- ============================================================================
-- 14. DATABASE CONFIGURATION OPTIMIZATIONS
-- ============================================================================

-- These settings should be applied to postgresql.conf for optimal performance
/*
Recommended PostgreSQL settings for HASIVU lunch rush optimization:

-- Memory Settings (adjust based on server specs)
shared_buffers = 512MB                    -- 25% of total RAM
effective_cache_size = 2GB                -- 75% of total RAM  
work_mem = 16MB                           -- For sorting/hashing operations
maintenance_work_mem = 256MB              -- For VACUUM, CREATE INDEX

-- Connection Settings
max_connections = 200                      -- Handle lunch rush connections
max_prepared_transactions = 100            -- For transaction management

-- Query Planning
default_statistics_target = 100           -- Better query plans
random_page_cost = 1.1                    -- SSD optimization
seq_page_cost = 1.0                       -- SSD optimization
effective_io_concurrency = 200            -- SSD concurrent I/O

-- WAL Settings
wal_buffers = 16MB                        -- Write-ahead log buffering
checkpoint_completion_target = 0.9        -- Smooth checkpointing
max_wal_size = 2GB                        -- WAL size management
min_wal_size = 512MB

-- Logging for Performance Monitoring
log_duration = on                         -- Log query duration
log_min_duration_statement = 1000         -- Log slow queries (>1s)
log_checkpoints = on                      -- Log checkpoint activity
log_connections = on                      -- Monitor connections
log_disconnections = on
log_lock_waits = on                       -- Monitor lock waits

-- Auto Vacuum Settings (important for high-traffic tables)
autovacuum = on
autovacuum_max_workers = 6
autovacuum_naptime = 15s
autovacuum_vacuum_threshold = 25
autovacuum_analyze_threshold = 10
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05
*/

-- ============================================================================
-- 15. PARTITION TABLES FOR ENTERPRISE SCALE (Optional)
-- ============================================================================

-- If scaling to 100+ schools, consider partitioning by school_id
-- This is commented out as it requires careful migration planning

/*
-- Example partitioning for enterprise scale
ALTER TABLE menu_items PARTITION BY HASH(school_id);
CREATE TABLE menu_items_part_0 PARTITION OF menu_items FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE menu_items_part_1 PARTITION OF menu_items FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE menu_items_part_2 PARTITION OF menu_items FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE menu_items_part_3 PARTITION OF menu_items FOR VALUES WITH (MODULUS 4, REMAINDER 3);
*/

-- ============================================================================
-- 16. AUTOMATED MAINTENANCE PROCEDURES
-- ============================================================================

-- Daily maintenance procedure
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS void AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
BEGIN
    start_time := clock_timestamp();
    
    -- Update table statistics
    ANALYZE menu_items;
    ANALYZE menu_categories;
    ANALYZE menu_item_dietary;
    ANALYZE menu_availability;
    
    -- Refresh materialized views
    PERFORM refresh_menu_stats();
    PERFORM refresh_lunch_menu();
    
    -- Cleanup old performance logs (keep 30 days)
    DELETE FROM performance_logs 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    end_time := clock_timestamp();
    
    INSERT INTO performance_logs(action, timestamp, execution_time_ms, details)
    VALUES (
        'daily_maintenance', 
        NOW(), 
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
        'Daily maintenance completed successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. MONITORING QUERIES FOR PERFORMANCE ANALYSIS
-- ============================================================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW v_performance_monitoring AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('menu_items', 'menu_categories', 'menu_item_dietary')
ORDER BY tablename, attname;

-- Index usage statistics
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        ELSE 'GOOD_USAGE'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- OPTIMIZATION COMPLETE
-- ============================================================================

-- Log the optimization completion
INSERT INTO performance_logs(action, timestamp, details)
VALUES ('database_optimization_applied', NOW(), 'Complete HASIVU performance optimization applied');

-- Display optimization summary
SELECT 
    'HASIVU Database Performance Optimization Complete' as status,
    (
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
    ) as total_indexes_created,
    (
        SELECT COUNT(*) 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    ) as materialized_views_created;

COMMIT;