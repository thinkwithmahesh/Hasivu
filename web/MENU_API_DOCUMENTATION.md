# HASIVU Menu Management API Documentation

## Overview

The HASIVU Menu Management API provides comprehensive endpoints for managing school meal delivery menus. This API is designed specifically for the HASIVU platform and includes school-specific features like age group filtering, nutritional information, and popularity tracking.

## Base URL

```
http://localhost:3000/api/menu
```

## Authentication

Currently, the API uses mock data for development. In production, admin endpoints (POST, PUT, DELETE) should be protected with proper authentication.

---

## API Endpoints

### 1. Menu Items Management

#### GET `/api/menu` - List Menu Items

Retrieve menu items with optional filtering, pagination, and sorting.

**Query Parameters:**

- `category` (string): Filter by category (e.g., "Breakfast", "Lunch")
- `search` (string): Search in name, description, and dietary tags
- `dietary` (string): Filter by dietary restriction (e.g., "Vegetarian")
- `ageGroup` (string): Filter by age group ("6-10", "11-15", "16-18")
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20)
- `sortBy` (string): Sort field ("name", "price", "rating", "popularity", "prepTime")
- `sortOrder` (string): Sort direction ("asc", "desc", default: "desc")

**Example Requests:**

```bash
# Get all menu items
GET /api/menu

# Get breakfast items for younger kids
GET /api/menu?category=Breakfast&ageGroup=6-10

# Search for vegetarian items under ₹50
GET /api/menu?search=vegetarian&sortBy=price&sortOrder=asc
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Mini Idli with Sambar",
      "description": "Soft steamed rice cakes with protein-rich lentil curry and coconut chutney",
      "category": "Breakfast",
      "price": "₹45",
      "rating": 4.7,
      "prepTime": "8 min",
      "dietary": ["Vegetarian", "High Protein", "Gluten-Free"],
      "image": "🥟",
      "priceValue": 45,
      "nutritionalInfo": {
        "calories": 420,
        "protein": 15,
        "carbs": 65,
        "fat": 8,
        "fiber": 4,
        "sugar": 2
      },
      "ingredients": ["Rice", "Urad Dal", "Fenugreek Seeds"],
      "allergens": ["May contain traces of nuts"],
      "availability": {
        "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "timeSlots": ["7:00 AM - 9:00 AM"]
      },
      "schoolSpecific": {
        "ageGroup": ["6-10", "11-15", "16-18"],
        "popularity": 92,
        "lastOrdered": "2024-09-12"
      }
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "categories": ["Breakfast", "Lunch", "Snack", "Dessert", "Curry", "Side"]
  }
}
```

#### POST `/api/menu` - Create Menu Item (Admin Only)

Create a new menu item.

**Request Body:**

```json
{
  "name": "New Dish Name",
  "description": "Description of the dish",
  "category": "Lunch",
  "price": "₹60",
  "rating": 4.5,
  "prepTime": "10 min",
  "dietary": ["Vegetarian", "High Protein"],
  "image": "🍛",
  "priceValue": 60,
  "nutritionalInfo": {
    "calories": 400,
    "protein": 20,
    "carbs": 60,
    "fat": 10,
    "fiber": 5,
    "sugar": 3
  },
  "ingredients": ["Rice", "Dal", "Spices"],
  "allergens": ["None"],
  "availability": {
    "days": ["Monday", "Wednesday", "Friday"],
    "timeSlots": ["12:00 PM - 2:00 PM"]
  },
  "schoolSpecific": {
    "ageGroup": ["11-15", "16-18"],
    "popularity": 80
  }
}
```

### 2. Individual Menu Item Operations

#### GET `/api/menu/[menuId]` - Get Specific Menu Item

Retrieve detailed information about a specific menu item.

**Example:**

```bash
GET /api/menu/1
```

#### PUT `/api/menu/[menuId]` - Update Menu Item (Admin Only)

Update an existing menu item.

**Example:**

```bash
PUT /api/menu/1
Content-Type: application/json

{
  "price": "₹50",
  "priceValue": 50,
  "rating": 4.8
}
```

#### DELETE `/api/menu/[menuId]` - Delete Menu Item (Admin Only)

Remove a menu item from the system.

**Example:**

```bash
DELETE /api/menu/1
```

### 3. Advanced Search

#### POST `/api/menu/search` - Advanced Search with Filters

Perform complex searches with multiple filters and nutritional requirements.

**Request Body:**

```json
{
  "filters": {
    "query": "dal rice",
    "categories": ["Lunch", "Breakfast"],
    "dietary": ["Vegetarian", "High Protein"],
    "priceRange": {
      "min": 20,
      "max": 80
    },
    "ratingRange": {
      "min": 4.0,
      "max": 5.0
    },
    "prepTimeMax": 15,
    "ageGroups": ["11-15", "16-18"],
    "allergenFree": ["nuts", "gluten"],
    "availableDay": "Monday",
    "nutritionalRequirements": {
      "maxCalories": 500,
      "minProtein": 15,
      "maxFat": 20,
      "maxSugar": 10
    },
    "sortBy": "popularity",
    "sortOrder": "desc",
    "limit": 10,
    "offset": 0
  }
}
```

**Response:**

```json
{
  "status": "success",
  "data": [...], // Array of matching menu items
  "meta": {
    "total": 15,
    "filtered": 8,
    "filters": {...}, // Applied filters
    "suggestions": ["Did you mean 'idli'?"],
    "popularSearches": ["vegetarian lunch", "high protein breakfast", ...]
  }
}
```

#### GET `/api/menu/search` - Get Search Metadata

Get popular searches and filter options.

**Query Parameters:**

- `type`: "popular", "categories", "dietary", "ageGroups", "allergens"

**Examples:**

```bash
# Get popular search terms
GET /api/menu/search?type=popular

# Get available categories
GET /api/menu/search?type=categories

# Get dietary options
GET /api/menu/search?type=dietary
```

### 4. Categories Management

#### GET `/api/menu/categories` - List Menu Categories

Get all menu categories with statistics and metadata.

**Query Parameters:**

- `includeStats` (boolean): Include statistics (default: true)
- `ageGroup` (string): Filter categories by age group
- `timeSlot` (string): Filter by available time slot

**Example:**

```bash
# Get all categories with stats
GET /api/menu/categories

# Get categories available for younger students
GET /api/menu/categories?ageGroup=6-10

# Get categories available during lunch time
GET /api/menu/categories?timeSlot=12:00
```

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "breakfast",
      "name": "Breakfast",
      "description": "Nutritious South Indian breakfast options to start the day right",
      "image": "🌅",
      "itemCount": 3,
      "popularItems": [
        "Mini Idli with Sambar",
        "Masala Dosa Roll",
        "Vegetable Upma"
      ],
      "availableTimeSlots": ["7:00 AM - 9:00 AM"],
      "ageGroups": ["6-10", "11-15", "16-18"],
      "averagePrice": 45,
      "averageRating": 4.6,
      "popularityScore": 85
    }
  ],
  "meta": {
    "total": 6,
    "totalItems": 15,
    "lastUpdated": "2024-09-13T10:30:00Z"
  }
}
```

#### POST `/api/menu/categories` - Create Category (Admin Only)

Create a new menu category.

**Request Body:**

```json
{
  "name": "New Category",
  "description": "Description of the new category",
  "image": "🍽️",
  "availableTimeSlots": ["12:00 PM - 2:00 PM"],
  "ageGroups": ["6-10", "11-15", "16-18"]
}
```

---

## MenuItem Interface

The API returns menu items matching this TypeScript interface:

```typescript
interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string; // Display price with currency (₹45)
  rating: number; // 0-5 rating
  prepTime: string; // "8 min"
  dietary: string[]; // ["Vegetarian", "High Protein"]
  image: string; // Emoji or image URL
  priceValue: number; // Numeric value for sorting/filtering
  nutritionalInfo?: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber: number; // grams
    sugar: number; // grams
  };
  ingredients?: string[];
  allergens?: string[];
  availability?: {
    days: string[]; // ["Monday", "Tuesday", ...]
    timeSlots: string[]; // ["7:00 AM - 9:00 AM"]
  };
  schoolSpecific?: {
    ageGroup: string[]; // ["6-10", "11-15", "16-18"]
    popularity: number; // 0-100 popularity score
    lastOrdered?: string; // ISO date string
  };
}
```

---

## HASIVU-Specific Features

### 1. Age Group Filtering

All menu items include age group specifications:

- `6-10`: Primary school students
- `11-15`: Middle school students
- `16-18`: High school students

### 2. School Meal Context

- **Nutritional Information**: Comprehensive nutrition data for each item
- **Popularity Tracking**: Student preference scores
- **Availability Schedules**: Day and time-based availability
- **Dietary Restrictions**: Detailed allergen and dietary information

### 3. Time Slot Management

Menu items are available during specific time slots:

- **Breakfast**: 7:00 AM - 9:00 AM
- **Lunch**: 12:00 PM - 2:00 PM
- **Snacks**: 3:00 PM - 5:00 PM

### 4. Regional Bangalore Focus

Menu items include local Bangalore specialties like:

- Bisi Bele Bath
- Masala Dosa variations
- South Indian breakfast items
- Regional spice preferences

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "status": "error",
  "message": "Description of the error"
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate resources)
- `500`: Internal Server Error

---

## Integration with Frontend

The API is designed to work seamlessly with the existing HASIVU menu page (`/src/app/menu/page.tsx`). The MenuItem interface exactly matches the frontend expectations.

### Example Frontend Integration:

```typescript
// Fetch menu items
const response = await fetch('/api/menu?category=Lunch');
const { data: menuItems } = await response.json();

// Use directly with existing components
<FoodItemCard
  item={menuItems[0]}
  onAddToCart={addToCart}
  onShowNutrition={openNutritionModal}
  onQuickOrder={handleQuickOrder}
  cartQuantity={cart.find(cartItem => cartItem.id === menuItems[0].id)?.quantity || 0}
/>
```

---

## Testing

Run the API test suite:

```bash
node test-menu-api.js
```

This will validate:

- All endpoint functionality
- Frontend interface compatibility
- HASIVU-specific features
- Error handling
- Performance benchmarks

---

## Future Enhancements

Planned features for production deployment:

1. **Authentication & Authorization**: JWT-based auth for admin endpoints
2. **Database Integration**: PostgreSQL/MongoDB integration
3. **Real-time Updates**: WebSocket integration for live menu updates
4. **Caching**: Redis caching for improved performance
5. **Rate Limiting**: API rate limiting for production security
6. **Image Upload**: Support for actual food images
7. **Inventory Integration**: Real-time availability based on kitchen inventory
8. **Order Integration**: Connection with ordering and payment systems
