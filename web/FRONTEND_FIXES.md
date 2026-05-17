# Frontend Integration Tasks for HASIVU Menu System

## Current State Analysis

✅ Backend API routes are implemented (`/api/menu/*`)
❌ Frontend still using hardcoded mock data
❌ TypeScript interface conflicts between frontend and Redux store
❌ Non-functional UI elements (Add Item button, search filters)

## Issues Identified

### 1. TypeScript Interface Conflicts

**Problem**: MenuItem interface inconsistencies

- **Frontend** (`page.tsx`): `id: number`, `price: string`
- **Redux store** (`menuSlice.ts`): `id: string`, `price: number`
- **API routes**: `id: number`, `price: string`, `priceValue: number`

### 2. API Integration Issues

- Frontend still using hardcoded `menuItems` array
- Redux store not being used in main menu page
- API client has basic menu methods but not connected
- Search functionality not connected to `/api/menu/search`

### 3. Non-Functional UI Elements

- "Add Item" button doesn't connect to POST `/api/menu`
- Advanced search filters not connected to backend
- Nutrition modal shows static data instead of API data
- Loading states missing for async operations

## Implementation Plan

### Phase 1: Fix TypeScript Interfaces

1. ✅ Standardize MenuItem interface across all files
2. ✅ Update Redux store interface to match API
3. ✅ Fix component prop types
4. ✅ Ensure consistent ID and price types

### Phase 2: Connect Redux to API

1. ✅ Update menuSlice to use new API endpoints
2. ✅ Add search, create, update thunks
3. ✅ Connect main menu page to Redux store
4. ✅ Add loading states and error handling

### Phase 3: Update Components

1. ✅ Connect FoodItemCard to real API data
2. ✅ Fix nutrition modal with real nutritional info
3. ✅ Update search filters to use API
4. ✅ Add loading spinners and error states

### Phase 4: Enhanced Features

1. ✅ Implement "Add Item" functionality for admins
2. ✅ Connect advanced search with all filters
3. ✅ Add proper error boundaries
4. ✅ Implement optimistic UI updates

## Files to Modify

- `src/store/slices/menuSlice.ts` - Fix interfaces, add API integration
- `src/app/menu/page.tsx` - Connect to Redux, remove hardcoded data
- `src/components/ui/food-item-card.tsx` - Fix interface, real nutrition data
- `src/components/ui/menu-search-filter.tsx` - Connect to search API
- `src/lib/api-client.ts` - Enhance menu API methods
- Add new API service layer for better organization

## Success Criteria

✅ No TypeScript compilation errors
✅ All UI elements functional with real API data
✅ Search works with backend filtering
✅ CRUD operations work for menu items
✅ Loading states and error handling implemented
✅ Redux store properly integrated
