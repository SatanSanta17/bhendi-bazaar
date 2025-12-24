# Admin Panel Architecture Diagram

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ADMIN PANEL                                 │
│                     (Bhendi Bazaar E-commerce)                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        1. PRESENTATION LAYER                         │
│                         (Client Components)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  app/(admin)/admin/                                                  │
│  ├── layout.tsx          ← Sidebar + Layout                         │
│  ├── page.tsx            ← Dashboard (Stats, Activities)            │
│  ├── orders/page.tsx     ← Orders Table (Search, Filter, Update)    │
│  ├── users/page.tsx      ← Users Table (Search, Filter, Block)      │
│  └── products/page.tsx   ← Products Table (Search, Filter, CRUD)    │
│                                                                      │
│  components/admin/                                                   │
│  ├── sidebar.tsx         ← Navigation sidebar                       │
│  ├── stats-card.tsx      ← Reusable stat display                    │
│  └── data-table.tsx      ← Generic table with pagination            │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Uses
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     2. CLIENT SERVICE LAYER                          │
│                      (API Communication)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  services/admin/                                                     │
│  ├── dashboardService.ts  → getDashboardStats(), getActivities()    │
│  ├── userService.ts       → getUsers(), updateUser(), blockUser()   │
│  ├── orderService.ts      → getOrders(), updateStatus(), bulk()     │
│  ├── productService.ts    → getProducts(), createProduct(), etc.    │
│  └── categoryService.ts   → getCategories(), CRUD operations        │
│                                                                      │
│  Each service makes fetch() calls to API routes                     │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      3. MIDDLEWARE LAYER                             │
│                   (Route Protection)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  middleware.ts                                                       │
│  ├── Check authentication (JWT token)                               │
│  ├── Verify admin role                                              │
│  ├── Redirect if unauthorized                                       │
│  └── Allow access if admin                                          │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Protected Routes
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         4. API LAYER                                 │
│                      (Next.js API Routes)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  app/api/admin/                                                      │
│  ├── dashboard/route.ts           → GET stats                       │
│  ├── users/route.ts               → GET list, filters               │
│  ├── users/[id]/route.ts          → GET, PATCH single               │
│  ├── users/[id]/block/route.ts    → POST block/unblock              │
│  ├── orders/route.ts              → GET list, filters               │
│  ├── orders/[id]/route.ts         → GET, PATCH single               │
│  ├── orders/bulk-update/route.ts  → POST bulk update                │
│  ├── products/route.ts            → GET, POST (list, create)        │
│  ├── products/[id]/route.ts       → GET, PATCH, DELETE              │
│  └── categories/...                → Full CRUD                       │
│                                                                      │
│  Each route:                                                         │
│  1. Verifies admin session                                          │
│  2. Parses request params                                           │
│  3. Calls appropriate service                                       │
│  4. Returns JSON response                                           │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Delegates to
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    5. SERVICE LAYER (Server)                         │
│                       (Business Logic)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  server/services/admin/                                              │
│  ├── userService.ts                                                  │
│  │   ├── Validation logic                                           │
│  │   ├── Business rules                                             │
│  │   └── Calls userRepository + logRepository                       │
│  │                                                                   │
│  ├── orderService.ts                                                 │
│  │   ├── Status validation                                          │
│  │   ├── Bulk update logic                                          │
│  │   └── Calls orderRepository + logRepository                      │
│  │                                                                   │
│  ├── productService.ts                                               │
│  │   ├── Price validation                                           │
│  │   ├── Stock validation                                           │
│  │   └── Calls productRepository + logRepository                    │
│  │                                                                   │
│  └── dashboardService.ts                                             │
│      └── Orchestrates multiple repository calls                     │
│                                                                      │
│  Responsibilities:                                                   │
│  • Input validation                                                  │
│  • Business logic enforcement                                        │
│  • Logging admin actions                                            │
│  • Error handling                                                    │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Uses
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    6. REPOSITORY LAYER                               │
│                       (Data Access)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  server/repositories/admin/                                          │
│  ├── userRepository.ts                                               │
│  │   ├── getUsers(filters) → Query with pagination                  │
│  │   ├── getUserById(id)                                            │
│  │   ├── updateUser(id, data)                                       │
│  │   └── getUserStats()                                             │
│  │                                                                   │
│  ├── orderRepository.ts                                              │
│  │   ├── getOrders(filters) → Complex queries                       │
│  │   ├── getOrderById(id)                                           │
│  │   ├── updateOrderStatus(id, data)                                │
│  │   ├── bulkUpdateStatus(ids, status)                              │
│  │   └── getOrderStats()                                            │
│  │                                                                   │
│  ├── productRepository.ts                                            │
│  │   ├── getProducts(filters)                                       │
│  │   ├── createProduct(data)                                        │
│  │   ├── updateProduct(id, data)                                    │
│  │   ├── deleteProduct(id)                                          │
│  │   ├── bulkUpdateStock(updates)                                   │
│  │   └── getProductStats()                                          │
│  │                                                                   │
│  ├── dashboardRepository.ts                                          │
│  │   ├── getDashboardStats() → Aggregations                         │
│  │   ├── getRecentActivities(limit)                                 │
│  │   ├── getTopProducts(limit)                                      │
│  │   └── getRevenueChart(days)                                      │
│  │                                                                   │
│  └── logRepository.ts                                                │
│      ├── createLog(data) → Record admin action                      │
│      └── getLogs(filters)                                           │
│                                                                      │
│  Responsibilities:                                                   │
│  • Prisma queries                                                    │
│  • Data transformation                                               │
│  • No business logic                                                 │
│  • Return typed data                                                 │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Queries
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        7. DATABASE LAYER                             │
│                         (PostgreSQL)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Tables:                                                             │
│  ├── User (with role, isBlocked, lastActiveAt)                      │
│  ├── Product (with sku, lowStockThreshold)                          │
│  ├── Order (with status, paymentStatus indexes)                     │
│  ├── Review (with isApproved)                                       │
│  ├── Category                                                        │
│  ├── Cart                                                            │
│  └── AdminLog (new - tracks all admin actions)                      │
│                                                                      │
│  Indexes for Performance:                                            │
│  • User: role, isBlocked, lastActiveAt                              │
│  • Order: status, paymentStatus, createdAt                          │
│  • Product: stock, categoryId                                       │
│  • AdminLog: adminId, createdAt, resource                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
                           CROSS-CUTTING CONCERNS
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION                                │
├─────────────────────────────────────────────────────────────────────┤
│  • NextAuth.js with JWT strategy                                    │
│  • Session includes: id, email, name, role                          │
│  • Middleware checks role === "ADMIN"                               │
│  • API routes use verifyAdminSession()                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          TYPE SAFETY                                 │
├─────────────────────────────────────────────────────────────────────┤
│  • server/domain/admin/* → Server-side types                        │
│  • domain/admin.ts → Client-side types (re-exports)                 │
│  • End-to-end TypeScript coverage                                   │
│  • No any types (except legacy session)                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        ACTIVITY LOGGING                              │
├─────────────────────────────────────────────────────────────────────┤
│  All admin actions are logged:                                      │
│  • USER_BLOCKED, USER_UNBLOCKED                                     │
│  • ORDER_UPDATED, ORDERS_BULK_UPDATED                               │
│  • PRODUCT_CREATED, PRODUCT_UPDATED, PRODUCT_DELETED               │
│  • CATEGORY_CREATED, CATEGORY_UPDATED, CATEGORY_DELETED            │
│  • REVIEW_APPROVED, REVIEW_DELETED                                  │
│                                                                      │
│  Stored with: adminId, action, resource, resourceId, metadata       │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
                          KEY ARCHITECTURE PRINCIPLES
═══════════════════════════════════════════════════════════════════════

✅ SINGLE RESPONSIBILITY PRINCIPLE
   Each file/class has ONE responsibility
   - userService handles ONLY user business logic
   - userRepository handles ONLY user data access

✅ SEPARATION OF CONCERNS
   Client code NEVER imports server code
   - Clear boundary at API routes
   - Types are properly separated

✅ DRY (Don't Repeat Yourself)
   - Reusable DataTable component
   - Shared StatsCard component
   - Common verifyAdminSession() utility

✅ OPEN/CLOSED PRINCIPLE
   Easy to extend without modifying existing code
   - Add new admin feature? Just create new service/repo
   - Add new filter? Extend FilterType

✅ DEPENDENCY INVERSION
   Services depend on abstractions (types), not concrete implementations
   - Easy to swap Prisma for another ORM
   - Easy to add caching layer

✅ TYPE SAFETY
   End-to-end TypeScript prevents runtime errors
   - Compile-time checks
   - IDE autocomplete
   - Refactoring safety


