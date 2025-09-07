# HASIVU Platform - Backend Architecture Design

## Executive Summary

This document outlines the comprehensive backend architecture design for the HASIVU school food delivery platform to support the enhanced ShadCN UI frontend components and provide scalable, secure, and performant APIs.

## Architecture Overview

### System Design Principles

1. **Microservices Architecture**: Decomposed services for scalability and maintainability
2. **API-First Design**: RESTful APIs with GraphQL for complex queries
3. **Event-Driven Architecture**: Asynchronous communication with message queues
4. **Real-time Capabilities**: WebSocket integration for live updates
5. **Mobile-First Performance**: Optimized for mobile app consumption
6. **Security by Design**: Zero-trust security model with RBAC

## Core Services Architecture

### 1. API Gateway Service
```typescript
// API Gateway Configuration
const apiGatewayConfig = {
  routes: {
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_1: 'auth-service',
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_2: 'meal-service', 
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_3: 'order-service',
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_4: 'payment-service',
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_5: 'rfid-service',
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_6: 'search-service',
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_7: 'notification-service',
    '/ws/*': 'websocket-service'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP'
  },
  cors: {
    origin: [process.env.._BACKEND-ARCHITECTURE_PASSWORD_8, process.env.._BACKEND-ARCHITECTURE_PASSWORD_9, process.env.._BACKEND-ARCHITECTURE_PASSWORD_10],
    credentials: true
  }
}
```

### 2. Authentication & Authorization Service
```typescript
// JWT + RBAC Implementation
interface UserProfile {
  id: string
  email: string
  role: 'student' | 'parent' | 'teacher' | 'admin' | 'kitchen_staff'
  school_id: string
  grade?: string
  section?: string
  rfid_cards: string[]
  wallet_balance: number
  dietary_preferences: string[]
  allergies: string[]
}

// Role-Based Access Control
const permissions = {
  student: ['order:create', 'order:read', 'meal:read', 'wallet:read'],
  parent: ['order:read', 'payment:create', 'wallet:manage', 'child:monitor'],
  teacher: ['order:read', 'student:monitor', 'meal:read'],
  admin: ['*'],
  kitchen_staff: ['order:read', 'order:update', 'meal:manage']
}
```

### 3. Meal Service - Enhanced for Command Palette
```typescript
// Optimized Meal Data Structure for Search
interface MealDocument {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  price: number
  nutritional_info: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
    sugar: number
  }
  allergens: string[]
  dietary_tags: string[] // vegetarian, vegan, gluten-free, etc.
  availability: {
    days_of_week: number[]
    time_slots: string[]
    grades: string[]
  }
  images: {
    thumbnail: string
    main: string
    gallery: string[]
  }
  rating: number
  preparation_time: number
  ingredients: string[]
  search_tags: string[] // for command palette
  popularity_score: number
}

// Command Palette Search API
POST /api/v1/meals/search
{
  "query": "paneer butter",
  "filters": {
    "category": ["main_course"],
    "dietary": ["vegetarian"],
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_11: [50, 150],
    process.env.._BACKEND-ARCHITECTURE_PASSWORD_12: 500
  },
  "student_context": {
    "grade": "8",
    "allergies": ["nuts"],
    "dietary_preferences": ["vegetarian"]
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

### 4. Real-time WebSocket Service
```typescript
// WebSocket Event Architecture
interface WebSocketEvents {
  // Order Events
  'order:created': OrderCreatedEvent
  'order:confirmed': OrderConfirmedEvent  
  'order:preparing': OrderPreparingEvent
  'order:ready': OrderReadyEvent
  'order:delivered': OrderDeliveredEvent
  
  // Kitchen Events
  'kitchen:order_received': KitchenOrderEvent
  'kitchen:preparation_started': PreparationStartedEvent
  'kitchen:meal_ready': MealReadyEvent
  
  // Notification Events
  'notification:new': NotificationEvent
  'notification:read': NotificationReadEvent
  
  // RFID Events
  'rfid:scan_detected': RFIDScanEvent
  'rfid:verification_complete': RFIDVerificationEvent
  
  // System Events
  'system:maintenance': MaintenanceEvent
  'system:announcement': AnnouncementEvent
}

// WebSocket Server Implementation
class WebSocketService {
  private io: Server
  private redisAdapter: RedisAdapter
  
  constructor() {
    this.io = new Server(server, {
      cors: { origin: "*" },
      adapter: createAdapter(redisClient, redisClient.duplicate())
    })
    
    this.setupEventHandlers()
  }
  
  // Student-specific room management
  joinStudentRoom(studentId: string, socket: Socket) {
    socket.join(`student:${studentId}`)
    socket.join(`school:${student.school_id}`)
    socket.join(`grade:${student.grade}`)
  }
  
  // Real-time order updates
  broadcastOrderUpdate(orderId: string, event: OrderEvent) {
    this.io.to(`order:${orderId}`).emit('order:update', event)
  }
  
  // Kitchen notifications
  notifyKitchen(schoolId: string, event: KitchenEvent) {
    this.io.to(`kitchen:${schoolId}`).emit('kitchen:notification', event)
  }
}
```

### 5. RFID Service - Enhanced OTP Integration
```typescript
// RFID Service with OTP Verification
interface RFIDCard {
  id: string
  rfid_number: string
  student_id: string
  status: 'active' | 'blocked' | 'lost'
  issued_date: Date
  last_used: Date
  school_id: string
}

interface OTPVerification {
  id: string
  rfid_card_id: string
  otp_code: string
  expires_at: Date
  verified: boolean
  attempts: number
  max_attempts: 3
}

// RFID Verification API
POST /api/v1/rfid/verify
{
  process.env.._BACKEND-ARCHITECTURE_PASSWORD_13: process.env.._BACKEND-ARCHITECTURE_PASSWORD_14,
  process.env.._BACKEND-ARCHITECTURE_PASSWORD_15: "123456",
  process.env.._BACKEND-ARCHITECTURE_PASSWORD_16: process.env.._BACKEND-ARCHITECTURE_PASSWORD_17,
  process.env.._BACKEND-ARCHITECTURE_PASSWORD_18: process.env.._BACKEND-ARCHITECTURE_PASSWORD_19
}

class RFIDService {
  async generateOTP(rfidNumber: string): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString()
    
    await redis.setex(
      `rfid_otp:${rfidNumber}`, 
      300, // 5 minutes expiry
      otp
    )
    
    // Send OTP via notification service
    await this.notificationService.sendOTP(rfidNumber, otp)
    
    return otp
  }
  
  async verifyRFIDWithOTP(rfidNumber: string, otp: string): Promise<boolean> {
    const storedOTP = await redis.get(`rfid_otp:${rfidNumber}`)
    
    if (storedOTP === otp) {
      await redis.del(`rfid_otp:${rfidNumber}`)
      return true
    }
    
    return false
  }
}
```

### 6. Enhanced Notification Service
```typescript
// Notification Service for Sonner Integration
interface Notification {
  id: string
  user_id: string
  type: 'order' | 'payment' | 'system' | 'promotion' | 'alert'
  title: string
  message: string
  data: any
  channels: ('push' | 'email' | 'sms' | 'in_app')[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduled_at?: Date
  read: boolean
  action_url?: string
  expires_at?: Date
}

// Push Notification Templates
const notificationTemplates = {
  order_confirmed: {
    title: "Order Confirmed! 🎉",
    message: "Your order for {meal_name} has been confirmed. Pickup time: {pickup_time}",
    action_url: "/orders/{order_id}",
    priority: "medium"
  },
  meal_ready: {
    title: "Your meal is ready! 🍽️",
    message: "{meal_name} is ready for pickup at Counter {counter_number}",
    action_url: "/pickup/{order_id}",
    priority: "high"
  },
  low_balance: {
    title: "Low wallet balance ⚠️",
    message: "Your wallet balance is ₹{balance}. Add money to continue ordering.",
    action_url: "/wallet/recharge",
    priority: "medium"
  }
}

class NotificationService {
  async sendNotification(notification: Notification) {
    // Multi-channel notification delivery
    const promises = notification.channels.map(async (channel) => {
      switch (channel) {
        case 'push':
          return this.sendPushNotification(notification)
        case 'email':
          return this.sendEmailNotification(notification)  
        case 'sms':
          return this.sendSMSNotification(notification)
        case 'in_app':
          return this.sendInAppNotification(notification)
      }
    })
    
    await Promise.allSettled(promises)
  }
  
  async sendPushNotification(notification: Notification) {
    // Firebase FCM integration for push notifications
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        action_url: notification.action_url || '',
        notification_id: notification.id
      },
      topic: `user_${notification.user_id}`
    }
    
    return admin.messaging().send(message)
  }
}
```

### 7. Search Service - ElasticSearch Integration
```typescript
// ElasticSearch Configuration for Command Palette
const elasticSearchConfig = {
  index: 'hasivu_meals',
  mappings: {
    properties: {
      name: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' }
        }
      },
      description: { type: 'text', analyzer: 'standard' },
      category: { type: 'keyword' },
      price: { type: 'float' },
      rating: { type: 'float' },
      nutritional_info: {
        type: 'object',
        properties: {
          calories: { type: 'integer' },
          protein: { type: 'float' },
          carbs: { type: 'float' }
        }
      },
      allergens: { type: 'keyword' },
      dietary_tags: { type: 'keyword' },
      search_tags: { type: 'keyword' },
      popularity_score: { type: 'float' }
    }
  }
}

class SearchService {
  async searchMeals(query: SearchQuery): Promise<SearchResults> {
    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query.query,
                fields: ['name^3', process.env.._BACKEND-ARCHITECTURE_PASSWORD_20, process.env.._BACKEND-ARCHITECTURE_PASSWORD_21, 'ingredients'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: [
            ...this.buildFilters(query.filters),
            ...this.buildStudentContextFilters(query.student_context)
          ]
        }
      },
      sort: [
        { popularity_score: 'desc' },
        { rating: 'desc' },
        '_score'
      ],
      highlight: {
        fields: {
          name: {},
          description: {}
        }
      }
    }
    
    return this.elasticClient.search({
      index: 'hasivu_meals',
      body: searchBody
    })
  }
  
  async getMealSuggestions(prefix: string): Promise<string[]> {
    // Auto-complete for command palette
    const suggestions = await this.elasticClient.search({
      index: 'hasivu_meals',
      body: {
        suggest: {
          meal_suggest: {
            prefix: prefix,
            completion: {
              field: 'name.suggest',
              size: 10
            }
          }
        }
      }
    })
    
    return suggestions.body.suggest.meal_suggest[0].options.map(
      option => option.text
    )
  }
}
```

### 8. Performance Optimization APIs
```typescript
// Caching Strategy for Mobile Performance
class CacheService {
  private redisClient: Redis
  
  // Meal data caching with invalidation
  async getMealData(schoolId: string, grade: string): Promise<any> {
    const cacheKey = `meals:${schoolId}:${grade}`
    let cachedData = await this.redisClient.get(cacheKey)
    
    if (!cachedData) {
      cachedData = await this.mealService.getMealsForStudent(schoolId, grade)
      await this.redisClient.setex(cacheKey, 1800, JSON.stringify(cachedData)) // 30 min cache
    }
    
    return JSON.parse(cachedData)
  }
  
  // Student profile caching
  async getStudentProfile(studentId: string): Promise<UserProfile> {
    const cacheKey = `profile:${studentId}`
    let profile = await this.redisClient.get(cacheKey)
    
    if (!profile) {
      profile = await this.authService.getStudentProfile(studentId)
      await this.redisClient.setex(cacheKey, 3600, JSON.stringify(profile)) // 1 hour cache
    }
    
    return JSON.parse(profile)
  }
}

// API Response Optimization
class ResponseOptimizer {
  // Compress API responses
  enableCompression = compression({ 
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false
      return compression.filter(req, res)
    }
  })
  
  // Paginated responses for mobile
  paginateResponse(data: any[], page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit
    const paginatedData = data.slice(offset, offset + limit)
    
    return {
      data: paginatedData,
      pagination: {
        current_page: page,
        per_page: limit,
        total: data.length,
        total_pages: Math.ceil(data.length / limit),
        has_next_page: offset + limit < data.length,
        has_prev_page: page > 1
      }
    }
  }
}
```

## Database Architecture

### 1. Primary Database (PostgreSQL)
```sql
-- Core Tables with Optimized Indexes

-- Users table with partitioning by school
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL,
    school_id UUID NOT NULL,
    grade VARCHAR(10),
    section VARCHAR(10),
    wallet_balance DECIMAL(10,2) DEFAULT 0,
    dietary_preferences TEXT[],
    allergies TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
) PARTITION BY HASH (school_id);

-- Create partitions for better performance
CREATE TABLE users_partition_0 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE users_partition_1 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE users_partition_2 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE users_partition_3 PARTITION OF users FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Meals table with full-text search
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category meal_category NOT NULL,
    subcategory VARCHAR(100),
    price DECIMAL(8,2) NOT NULL,
    nutritional_info JSONB,
    allergens TEXT[],
    dietary_tags TEXT[],
    images JSONB,
    availability JSONB,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', name), 'A') ||
        setweight(to_tsvector('english', description), 'B') ||
        setweight(to_tsvector('english', array_to_string(dietary_tags, ' ')), 'C')
    ) STORED,
    popularity_score FLOAT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_meals_category ON meals (category);
CREATE INDEX idx_meals_price ON meals (price);
CREATE INDEX idx_meals_rating ON meals (rating DESC);
CREATE INDEX idx_meals_search ON meals USING GIN (search_vector);
CREATE INDEX idx_meals_dietary ON meals USING GIN (dietary_tags);
CREATE INDEX idx_meals_popularity ON meals (popularity_score DESC);

-- Orders table with time-series partitioning
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    school_id UUID NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    pickup_code VARCHAR(20),
    rfid_verified BOOLEAN DEFAULT FALSE,
    pickup_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for orders
CREATE TABLE orders_2024_01 PARTITION OF orders 
FOR VALUES FROM (process.env.._BACKEND-ARCHITECTURE_PASSWORD_22) TO ('2024-02-01');
-- ... continue for other months

-- RFID cards with constraints
CREATE TABLE rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfid_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL,
    status rfid_status DEFAULT 'active',
    issued_date DATE DEFAULT CURRENT_DATE,
    last_used TIMESTAMP,
    school_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rfid_student ON rfid_cards (student_id);
CREATE INDEX idx_rfid_number ON rfid_cards (rfid_number);
CREATE INDEX idx_rfid_school ON rfid_cards (school_id);
```

### 2. Cache Layer (Redis)
```typescript
// Redis Configuration for Different Use Cases
const redisConfig = {
  // Session storage
  session: {
    db: 0,
    prefix: 'sess:',
    ttl: 86400 // 24 hours
  },
  
  // API response caching  
  cache: {
    db: 1,
    prefix: 'cache:',
    ttl: 1800 // 30 minutes
  },
  
  // Real-time data
  realtime: {
    db: 2,
    prefix: 'rt:',
    ttl: 300 // 5 minutes
  },
  
  // Rate limiting
  ratelimit: {
    db: 3,
    prefix: 'rl:',
    ttl: 900 // 15 minutes
  }
}
```

### 3. Search Database (ElasticSearch)
```typescript
// ElasticSearch Index Configuration
const searchIndices = {
  meals: {
    settings: {
      number_of_shards: 2,
      number_of_replicas: 1,
      analysis: {
        analyzer: {
          meal_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'stop', 'snowball']
          }
        }
      }
    },
    mappings: {
      properties: {
        name: {
          type: 'text',
          analyzer: 'meal_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            suggest: { type: 'completion' }
          }
        },
        // ... other field mappings
      }
    }
  }
}
```

## Security Architecture

### 1. Authentication & Authorization
```typescript
// JWT Token Strategy
interface JWTPayload {
  sub: string // user id
  email: string
  role: string
  school_id: string
  iat: number
  exp: number
  permissions: string[]
}

// Token Generation
class AuthService {
  generateAccessToken(user: UserProfile): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        school_id: user.school_id,
        permissions: permissions[user.role]
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
  }
  
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )
  }
}
```

### 2. API Security Measures
```typescript
// Security Middleware Stack
const securityMiddleware = [
  helmet(), // Security headers
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }),
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
  }),
  express.json({ limit: '10mb' }),
  compression(),
  morgan('combined')
]

// Input Validation
const validateInput = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      })
    }
    next()
  }
}
```

### 3. Data Protection
```typescript
// Encryption for sensitive data
class EncryptionService {
  private algorithm = process.env.._BACKEND-ARCHITECTURE_PASSWORD_23
  private key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32)
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, this.key)
    cipher.setAAD(Buffer.from('HASIVU', 'utf8'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }
  
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipher(this.algorithm, this.key)
    decipher.setAAD(Buffer.from('HASIVU', 'utf8'))
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}
```

## API Design Specifications

### 1. RESTful API Endpoints

#### Authentication APIs
```typescript
// Auth endpoints
POST /api/v1/auth/register
POST /api/v1/auth/login  
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
GET  /api/v1/auth/profile
PUT  /api/v1/auth/profile
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

#### Meal Management APIs
```typescript
// Meal endpoints with enhanced search
GET  /api/v1/meals                    # List meals with filtering
GET  /api/v1/meals/search             # Command palette search
GET  /api/v1/meals/suggestions        # Auto-complete suggestions
GET  /api/v1/meals/categories         # Available categories
GET  /api/v1/meals/:id                # Meal details
GET  /api/v1/meals/:id/reviews        # Meal reviews
POST /api/v1/meals/:id/reviews        # Add review
GET  /api/v1/meals/popular            # Popular meals
GET  /api/v1/meals/recommendations    # Personalized recommendations
```

#### Order Management APIs  
```typescript
// Order endpoints
GET  /api/v1/orders                   # User's orders
POST /api/v1/orders                   # Create order
GET  /api/v1/orders/:id               # Order details
PUT  /api/v1/orders/:id               # Update order
DELETE /api/v1/orders/:id             # Cancel order
POST /api/v1/orders/:id/verify-pickup # RFID pickup verification
GET  /api/v1/orders/:id/track         # Real-time order tracking
```

#### RFID APIs
```typescript
// RFID management endpoints
GET  /api/v1/rfid/cards               # User's RFID cards
POST /api/v1/rfid/cards/register      # Register new card
PUT  /api/v1/rfid/cards/:id/status    # Update card status  
POST /api/v1/rfid/verify              # Verify RFID with OTP
POST /api/v1/rfid/generate-otp        # Generate OTP for pickup
```

#### Notification APIs
```typescript
// Notification endpoints
GET  /api/v1/notifications            # User notifications
PUT  /api/v1/notifications/:id/read   # Mark as read
POST /api/v1/notifications/preferences # Update preferences
DELETE /api/v1/notifications/:id      # Delete notification
```

### 2. GraphQL Schema for Complex Queries
```typescript
// GraphQL Schema for complex frontend needs
const typeDefs = `
  type Query {
    meals(filter: MealFilter, pagination: Pagination): MealConnection
    mealRecommendations(studentId: ID!): [Meal]
    orderHistory(studentId: ID!, limit: Int): [Order]
    nutritionalAnalysis(studentId: ID!, period: DateRange): NutritionStats
    studentDashboard(studentId: ID!): StudentDashboard
  }
  
  type Mutation {
    createOrder(input: CreateOrderInput!): OrderResult
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order
    verifyRFIDPickup(input: RFIDVerificationInput!): VerificationResult
  }
  
  type Subscription {
    orderUpdates(orderId: ID!): OrderUpdate
    kitchenNotifications(schoolId: ID!): KitchenNotification
    studentNotifications(studentId: ID!): Notification
  }
`
```

## Performance & Monitoring

### 1. Performance Optimization
```typescript
// Performance monitoring and optimization
class PerformanceService {
  // Database query optimization
  async optimizeQueries() {
    // Connection pooling
    const pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: 5432,
      max: 20, // Maximum number of clients in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
    
    // Prepared statements for frequently used queries
    const preparedStatements = {
      getMealsByCategory: 'SELECT * FROM meals WHERE category = $1 AND availability @> $2',
      getStudentOrders: 'SELECT * FROM orders WHERE student_id = $1 ORDER BY created_at DESC LIMIT $2',
      verifyRFID: 'SELECT * FROM rfid_cards WHERE rfid_number = $1 AND status = \'active\''
    }
  }
  
  // API response caching
  cacheMiddleware(ttl: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const cacheKey = `api:${req.originalUrl}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return res.json(JSON.parse(cached))
      }
      
      const originalSend = res.send
      res.send = function(body) {
        redis.setex(cacheKey, ttl, body)
        originalSend.call(this, body)
      }
      
      next()
    }
  }
}
```

### 2. Monitoring & Analytics
```typescript
// Comprehensive monitoring setup
class MonitoringService {
  private prometheus = require('prom-client')
  
  setupMetrics() {
    // Custom metrics
    const httpDuration = new this.prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status']
    })
    
    const orderMetrics = new this.prometheus.Counter({
      name: 'orders_total',
      help: 'Total number of orders',
      labelNames: ['school', 'status']
    })
    
    const rfidScans = new this.prometheus.Counter({
      name: 'rfid_scans_total', 
      help: 'Total RFID scans',
      labelNames: ['location', 'success']
    })
  }
  
  // Health check endpoint
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        elasticsearch: await this.checkElasticsearch(),
        external_apis: await this.checkExternalAPIs()
      }
    }
  }
}
```

## Deployment Architecture

### 1. Container Configuration
```dockerfile
# Multi-stage Docker build for production
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS development  
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm run build
EXPOSE 8080
USER node
CMD ["npm", "start"]
```

### 2. Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hasivu-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hasivu-api
  template:
    metadata:
      labels:
        app: hasivu-api
    spec:
      containers:
      - name: api
        image: hasivu/api:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hasivu-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi" 
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
```

### 3. Infrastructure as Code (Terraform)
```hcl
# AWS infrastructure setup
resource "aws_ecs_cluster" "hasivu_cluster" {
  name = "hasivu-production"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_rds_cluster" "hasivu_db" {
  cluster_identifier      = "hasivu-postgres"
  engine                  = "aurora-postgresql"
  engine_version          = "13.7"
  availability_zones      = [process.env.._BACKEND-ARCHITECTURE_PASSWORD_24, process.env.._BACKEND-ARCHITECTURE_PASSWORD_25, process.env.._BACKEND-ARCHITECTURE_PASSWORD_26]
  database_name           = "hasivu"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
  
  serverlessv2_scaling_configuration {
    max_capacity = 4
    min_capacity = 0.5
  }
}

resource "aws_elasticache_cluster" "hasivu_redis" {
  cluster_id           = "hasivu-cache"
  engine               = "redis"
  node_type            = process.env.._BACKEND-ARCHITECTURE_PASSWORD_27
  num_cache_nodes      = 1
  parameter_group_name = process.env.._BACKEND-ARCHITECTURE_PASSWORD_28
  port                 = 6379
}
```

## Security Implementation

### 1. Zero Trust Security Model
```typescript
// Zero trust implementation
class SecurityService {
  // Multi-factor authentication for sensitive operations
  async requireMFA(userId: string, operation: string) {
    const mfaRequired = ['payment', 'rfid_register', 'profile_update']
    
    if (mfaRequired.includes(operation)) {
      const mfaToken = await this.generateMFAToken(userId)
      // Send MFA token via SMS/Email
      return { requiresMFA: true, mfaToken }
    }
    
    return { requiresMFA: false }
  }
  
  // API rate limiting per user/IP
  async checkRateLimit(identifier: string, endpoint: string) {
    const key = `rate_limit:${identifier}:${endpoint}`
    const current = await redis.get(key)
    
    if (current && parseInt(current) >= this.getLimitForEndpoint(endpoint)) {
      throw new Error('Rate limit exceeded')
    }
    
    await redis.incr(key)
    await redis.expire(key, this.getWindowForEndpoint(endpoint))
  }
  
  // Request validation and sanitization
  sanitizeInput(data: any): any {
    return validator.escape(DOMPurify.sanitize(data))
  }
}
```

### 2. Audit Logging
```typescript
// Comprehensive audit logging
class AuditService {
  async logUserAction(userId: string, action: string, details: any) {
    const auditLog = {
      id: uuidv4(),
      user_id: userId,
      action: action,
      details: details,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      timestamp: new Date(),
      session_id: req.sessionID
    }
    
    // Store in secure audit database
    await this.auditDb.collection('audit_logs').insertOne(auditLog)
    
    // Send to SIEM for monitoring
    await this.sendToSIEM(auditLog)
  }
}
```

## Integration Points

### 1. Payment Gateway Integration
```typescript
// Payment service integration
class PaymentService {
  private razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  })
  
  async createPaymentOrder(amount: number, studentId: string) {
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${studentId}_${Date.now()}`,
      notes: {
        student_id: studentId,
        purpose: 'wallet_recharge'
      }
    }
    
    return this.razorpay.orders.create(options)
  }
  
  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    const body = orderId + "|" + paymentId
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')
    
    return expectedSignature === signature
  }
}
```

### 2. SMS/Email Service Integration
```typescript
// Communication service
class CommunicationService {
  // SMS via Twilio
  async sendSMS(phoneNumber: string, message: string) {
    return this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    })
  }
  
  // Email via SendGrid
  async sendEmail(to: string, template: string, data: any) {
    const msg = {
      to: to,
      from: 'noreply@hasivu.com',
      templateId: template,
      dynamic_template_data: data
    }
    
    return sgMail.send(msg)
  }
}
```

## Testing Strategy

### 1. API Testing Framework
```typescript
// Comprehensive API testing
describe('HASIVU API Tests', () => {
  // Authentication tests
  describe('Authentication', () => {
    test('should register new student', async () => {
      const response = await request(app)
        .post(process.env.._BACKEND-ARCHITECTURE_PASSWORD_29)
        .send({
          email: 'test@student.com',
          password: process.env.._BACKEND-ARCHITECTURE_PASSWORD_30,
          role: 'student',
          school_id: 'school-uuid'
        })
        
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('token')
    })
  })
  
  // Meal search tests
  describe('Meal Search', () => {
    test('should return relevant meals for command palette', async () => {
      const response = await request(app)
        .post(process.env.._BACKEND-ARCHITECTURE_PASSWORD_31)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'paneer',
          student_context: { grade: '8', allergies: [] }
        })
        
      expect(response.status).toBe(200)
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })
  
  // RFID tests
  describe('RFID Verification', () => {
    test('should verify RFID with valid OTP', async () => {
      const response = await request(app)
        .post(process.env.._BACKEND-ARCHITECTURE_PASSWORD_32)
        .send({
          rfid_number: process.env.._BACKEND-ARCHITECTURE_PASSWORD_33,
          otp_code: '123456',
          location: process.env.._BACKEND-ARCHITECTURE_PASSWORD_34
        })
        
      expect(response.status).toBe(200)
      expect(response.body.verified).toBe(true)
    })
  })
})
```

### 2. Load Testing
```typescript
// Performance testing with Artillery
const loadTestConfig = {
  config: {
    target: 'https://api.hasivu.com',
    phases: [
      { duration: 300, arrivalRate: 10, name: 'Ramp up' },
      { duration: 600, arrivalRate: 50, name: 'Sustained load' },
      { duration: 300, arrivalRate: 100, name: 'Peak load' }
    ]
  },
  scenarios: [
    {
      name: 'Meal Search',
      weight: 60,
      flow: [
        { post: { url: process.env.._BACKEND-ARCHITECTURE_PASSWORD_35, json: { email: '{{ email }}', password: '{{ password }}' } } },
        { post: { url: process.env.._BACKEND-ARCHITECTURE_PASSWORD_36, json: { query: '{{ meal_query }}' } } }
      ]
    },
    {
      name: 'Order Creation',
      weight: 30,
      flow: [
        { post: { url: process.env.._BACKEND-ARCHITECTURE_PASSWORD_37, json: { email: '{{ email }}', password: '{{ password }}' } } },
        { post: { url: process.env.._BACKEND-ARCHITECTURE_PASSWORD_38, json: { items: [{ meal_id: '{{ meal_id }}', quantity: 1 }] } } }
      ]
    }
  ]
}
```

## Conclusion

This comprehensive backend architecture provides:

### ✅ **Scalability Features**
- Microservices architecture for horizontal scaling
- Database partitioning and read replicas
- Redis caching for performance optimization
- Load balancing and auto-scaling capabilities

### ✅ **Real-time Capabilities** 
- WebSocket integration for live order tracking
- Push notifications with Firebase FCM
- Real-time kitchen notifications
- Live RFID verification feedback

### ✅ **Enhanced Search**
- ElasticSearch integration for command palette
- Auto-complete and suggestion APIs
- Personalized meal recommendations
- Advanced filtering and faceted search

### ✅ **Security & Compliance**
- Zero-trust security model
- RBAC with granular permissions
- Comprehensive audit logging
- Data encryption and PCI compliance

### ✅ **Mobile Performance**
- API response compression and caching
- Optimized database queries
- CDN integration for static assets
- Efficient pagination and lazy loading

### ✅ **Developer Experience**
- Comprehensive API documentation
- GraphQL for complex queries
- Automated testing and deployment
- Monitoring and observability

The architecture is designed to support the enhanced frontend features while maintaining high performance, security, and scalability for a school food delivery platform serving thousands of students across multiple institutions.

**Key Performance Targets:**
- API response time: <200ms (95th percentile)
- WebSocket latency: <50ms
- Search response: <100ms
- Concurrent users: 10,000+
- Uptime: 99.9%
- Error rate: <0.1%

**Technology Stack:**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with custom middleware
- **Database**: PostgreSQL 14+ with Redis caching
- **Search**: ElasticSearch 8+
- **Message Queue**: Redis Pub/Sub or Apache Kafka
- **Monitoring**: Prometheus + Grafana
- **Deployment**: Docker + Kubernetes on AWS