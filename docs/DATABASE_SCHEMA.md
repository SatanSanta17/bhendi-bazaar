# Database Schema - Entity Relationship Diagram

## Complete Schema Overview

```
┌─────────────┐
│  Category   │
│─────────────│
│ id          │◄──────────┐
│ slug        │           │
│ name        │           │
│ description │           │
│ heroImage   │           │
│ order       │           │
└─────────────┘           │
                          │
                          │ 1:N
                          │
                    ┌─────────────┐
                    │   Product   │
                    │─────────────│
                    │ id          │◄──────────┐
                    │ slug        │           │
                    │ name        │           │
                    │ description │           │
                    │ price       │           │
                    │ salePrice   │           │
                    │ categoryId  ├───────────┘
                    │ tags[]      │
                    │ isFeatured  │
                    │ isHero      │
                    │ isOnOffer   │
                    │ rating      │
                    │ reviewsCount│
                    │ images[]    │
                    │ thumbnail   │
                    │ sizes[]     │
                    │ colors[]    │
                    │ stock       │
                    └─────────────┘
                          │
                          │ 1:N
                          │
                    ┌─────▼───────┐
                    │   Review    │
                    │─────────────│
                    │ id          │
                    │ productId   │
                    │ userId      ├───────┐
                    │ rating      │       │
                    │ title       │       │
                    │ comment     │       │
                    │ userName    │       │
                    │ isVerified  │       │
                    └─────────────┘       │
                                          │
                                          │ N:1
                                          │ (optional)
                                          │
┌─────────────┐                           │
│    User     │◄──────────────────────────┘
│─────────────│
│ id          │◄──────────┐
│ name        │           │
│ email       │           │
│ mobile      │           │
│ passwordHash│           │
└─────────────┘           │
      │                   │
      │ 1:1               │ 1:1
      │                   │
      ├─────────────┐     │
      │             │     │
      ▼             ▼     │
┌─────────┐   ┌──────────┐
│ Profile │   │   Cart   │
│─────────│   │──────────│
│ id      │   │ id       │
│ userId  │   │ userId   │
│addresses│   │ items    │
│profilePic   │ (JSON)   │
└─────────┘   └──────────┘
      │
      │ 1:N
      │
      ▼
┌─────────────┐
│    Order    │
│─────────────│
│ id          │
│ code        │ (BB-XXXX)
│ userId      │ (nullable for guests)
│ items       │ (JSON)
│ totals      │ (JSON)
│ status      │
│ address     │ (JSON)
│ notes       │
│ paymentMethod
│ paymentStatus
│ paymentId   │
│ estimatedDelivery
└─────────────┘


┌──────────────────────────────────────────┐
│       NextAuth.js Models                 │
│──────────────────────────────────────────│
│                                          │
│  ┌──────────┐     ┌──────────┐          │
│  │ Account  │     │ Session  │          │
│  │──────────│     │──────────│          │
│  │ id       │     │ id       │          │
│  │ userId   ├──┐  │ userId   ├──┐       │
│  │ provider │  │  │sessionToken │       │
│  │ ...      │  │  │ expires  │  │       │
│  └──────────┘  │  └──────────┘  │       │
│                │                 │       │
│                └────┬────────────┘       │
│                     │                    │
│                     ▼                    │
│              ┌──────────┐                │
│              │   User   │                │
│              │──────────│                │
│              │ id       │                │
│              │ email    │                │
│              │ name     │                │
│              └──────────┘                │
│                                          │
│  ┌────────────────────┐                 │
│  │ VerificationToken  │                 │
│  │────────────────────│                 │
│  │ identifier         │                 │
│  │ token              │                 │
│  │ expires            │                 │
│  └────────────────────┘                 │
└──────────────────────────────────────────┘
```

## Relationships Summary

### Category ↔ Product (1:N)
- One category has many products
- Each product belongs to one category
- Cascade delete: Deleting category deletes its products

### Product ↔ Review (1:N)
- One product has many reviews
- Each review belongs to one product
- Cascade delete: Deleting product deletes its reviews

### User ↔ Review (1:N, Optional)
- One user can write many reviews
- Each review may belong to a user (nullable for guests)
- Set null on delete: Deleting user keeps reviews (preserves userName)

### User ↔ Profile (1:1)
- One user has one profile
- Profile stores addresses and avatar
- No explicit cascade (handled by application)

### User ↔ Cart (1:1)
- One user has one cart
- Cart items stored as JSON
- Cascade delete: Deleting user deletes cart

### User ↔ Order (1:N, Optional)
- One user can have many orders
- Orders can be guest orders (userId nullable)
- Set null on delete: Deleting user keeps orders (for record keeping)

### User ↔ Account (1:N)
- One user can have multiple OAuth accounts (Google, GitHub, etc.)
- Managed by NextAuth.js

### User ↔ Session (1:N)
- One user can have multiple active sessions
- Managed by NextAuth.js

## Field Types Summary

### String Fields
- IDs: `cuid()` generated
- Slugs: Unique, indexed for fast lookup
- Text: Regular text fields
- Text (long): `@db.Text` for descriptions, comments

### Number Fields
- `Float`: Prices, ratings
- `Int`: Counts, ratings (1-5), stock

### Boolean Fields
- Feature flags: `isFeatured`, `isHero`, `isOnOffer`
- Verification: `isVerified`

### Array Fields
- `String[]`: tags, images, sizes, colors
- Stored as PostgreSQL arrays

### JSON Fields
- Complex nested data: addresses, cart items, order data
- Flexible schema for evolving data structures

### DateTime Fields
- `@default(now())`: Creation timestamp
- `@updatedAt`: Automatic update timestamp

## Indexes

### Performance Indexes
```prisma
// Fast lookups
@@index([slug])        // Categories, Products
@@index([categoryId])  // Products by category
@@index([productId])   // Reviews by product
@@index([userId])      // User's data

// Filtering
@@index([isFeatured])  // Featured products
@@index([isHero])      // Hero products
@@index([isOnOffer])   // Offer products
@@index([rating])      // Reviews by rating

// Sorting
@@index([order])       // Category order
@@index([createdAt])   // Newest first

// Search
@@index([code])        // Order lookup (BB-XXXX)
```

### Unique Constraints
```prisma
@unique                  // Single field unique
@@unique([field1, field2]) // Composite unique
```

## Data Sizes

### Estimated Row Counts (Production)
- Categories: 10-20
- Products: 100-10,000+
- Reviews: 1,000-100,000+
- Users: 1,000-1,000,000+
- Orders: 10,000-10,000,000+
- Carts: 1,000-1,000,000+ (active users)

### Storage Estimates
- Product images: Stored as URLs (external CDN)
- Order history: Grows continuously (archive old orders)
- Reviews: Text content (moderate growth)
- Carts: Small JSON blobs (1-50 items typical)

## Migration Strategy

### Phase 1: Initial Setup ✅
- Create all models
- Add indexes
- Seed initial data

### Phase 2: Switch Repositories
- Update product repository to use Prisma
- Update category repository to use Prisma
- Keep mock data as fallback

### Phase 3: Production
- Deploy with migrations
- Monitor query performance
- Add caching layer if needed

### Phase 4: Optimization
- Add full-text search (PostgreSQL)
- Implement database-level caching
- Add read replicas for scaling
- Archive old orders

## Best Practices

### JSON vs Relations
**Use JSON for:**
- Flexible schemas (addresses with varying fields)
- Embedded data (cart items snapshot in orders)
- Rarely queried structured data

**Use Relations for:**
- Data that needs querying/filtering
- Data with referential integrity
- Highly structured data

### Cascading Deletes
- **Cascade**: Child data is meaningless without parent (Cart → User)
- **Set Null**: Preserve history (Order → User, Review → User)
- **Restrict**: Prevent accidental deletion (requires manual cleanup)

### Indexes
- Add indexes for frequently queried fields
- Avoid over-indexing (slows down writes)
- Monitor slow queries in production
- Use composite indexes for multiple field queries

### Data Integrity
- Use unique constraints for business rules
- Add check constraints in database when possible
- Implement validation in service layer
- Log all data modifications

