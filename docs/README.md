# Bhendi Bazaar - Complete Documentation

Welcome to the Bhendi Bazaar documentation! This comprehensive guide covers all aspects of our e-commerce platform.

## 🏪 About Bhendi Bazaar

Bhendi Bazaar is a modern, production-ready e-commerce platform built with Next.js 16, featuring:
- Full-featured shopping experience with cart and checkout
- Secure payment processing via Razorpay
- Comprehensive admin panel for store management
- Real-time cart synchronization for authenticated users
- Responsive design with modern UI components

## 📚 Documentation Structure

### Getting Started
- **[Tech Stack](./TECH_STACK.md)** - Complete list of technologies and dependencies
- **[Architecture Overview](./ARCHITECTURE.md)** - System architecture and design patterns
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - Setup guide and environment variables
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

### Client-Side Documentation
- **[Admin Panel](./client-side/admin-panel/)** - Admin interface documentation
  - [Dashboard](./client-side/admin-panel/DASHBOARD.md)
  - [Products Management](./client-side/admin-panel/PRODUCTS.md)
  - [Orders Management](./client-side/admin-panel/ORDERS.md)
  - [Categories Management](./client-side/admin-panel/CATEGORIES.md)
  - [Users Management](./client-side/admin-panel/USERS.md)
  - [Reviews Management](./client-side/admin-panel/REVIEWS.md)
  - [Abandoned Carts](./client-side/admin-panel/ABANDONED_CARTS.md)

- **[User Interface](./client-side/user-interface/)** - Customer-facing pages
  - [Home Page](./client-side/user-interface/HOME.md)
  - [Product Pages](./client-side/user-interface/PRODUCT_PAGES.md)
  - [Categories](./client-side/user-interface/CATEGORIES.md)
  - [Shopping Cart](./client-side/user-interface/CART.md)
  - [Checkout Process](./client-side/user-interface/CHECKOUT.md)
  - [User Profile](./client-side/user-interface/PROFILE.md)
  - [Authentication](./client-side/user-interface/AUTHENTICATION.md)
  - [Orders & Tracking](./client-side/user-interface/ORDERS.md)
  - [Search](./client-side/user-interface/SEARCH.md)

- **[Shared Components](./client-side/shared-components/)** - Reusable UI components
  - [UI Components (Shadcn)](./client-side/shared-components/UI_COMPONENTS.md)
  - [Custom Components](./client-side/shared-components/SHARED_COMPONENTS.md)

### Server-Side Documentation
- **[Architecture Pattern](./server-side/ARCHITECTURE_PATTERN.md)** - Repository-Service pattern explained
- **[Repositories](./server-side/repositories/)** - Database access layer
  - [Overview](./server-side/repositories/OVERVIEW.md)
  - [Product Repository](./server-side/repositories/PRODUCT_REPOSITORY.md)
  - [Order Repository](./server-side/repositories/ORDER_REPOSITORY.md)
  - [Cart Repository](./server-side/repositories/CART_REPOSITORY.md)
  - [Admin Repositories](./server-side/repositories/admin/ADMIN_REPOSITORIES.md)

- **[Services](./server-side/services/)** - Business logic layer
  - [Overview](./server-side/services/OVERVIEW.md)
  - [Product Service](./server-side/services/PRODUCT_SERVICE.md)
  - [Order Service](./server-side/services/ORDER_SERVICE.md)
  - [Payment Service](./server-side/services/PAYMENT_SERVICE.md)

- **[API Routes](./server-side/api-routes/)** - REST API documentation
  - [API Structure](./server-side/api-routes/API_STRUCTURE.md)
  - [Authentication API](./server-side/api-routes/AUTHENTICATION_API.md)
  - [Products API](./server-side/api-routes/PRODUCTS_API.md)
  - [Orders API](./server-side/api-routes/ORDERS_API.md)
  - [Webhooks](./server-side/api-routes/WEBHOOKS.md)

### Database Documentation
- **[Schema Overview](./database/SCHEMA_OVERVIEW.md)** - Complete database schema
- **[Models](./database/MODELS.md)** - All Prisma models explained
- **[Relationships](./database/RELATIONSHIPS.md)** - Model relationships
- **[Migrations](./database/MIGRATIONS.md)** - Migration management
- **[Seeding](./database/SEEDING.md)** - Database seeding process

### Integration Documentation
- **[NextAuth Integration](./integrations/NEXTAUTH.md)** - Authentication setup
- **[Razorpay Integration](./integrations/RAZORPAY.md)** - Payment gateway
- **[Vercel Blob Storage](./integrations/VERCEL_BLOB.md)** - Image storage
- **[Google OAuth](./integrations/GOOGLE_OAUTH.md)** - OAuth configuration

### Advanced Topics
- **[State Management](./advanced/STATE_MANAGEMENT.md)** - Zustand cart store
- **[Cart Synchronization](./advanced/CART_SYNC.md)** - Cart sync mechanism
- **[Middleware](./advanced/MIDDLEWARE.md)** - Admin route protection
- **[Error Handling](./advanced/ERROR_HANDLING.md)** - Error management patterns
- **[Security](./advanced/SECURITY.md)** - Security best practices

### Developer Guides
- **[Adding New Features](./developer-guides/ADDING_NEW_FEATURE.md)**
- **[Adding Products](./developer-guides/ADDING_NEW_PRODUCT.md)**
- **[Debugging Guide](./developer-guides/DEBUGGING_GUIDE.md)**
- **[Testing Guide](./developer-guides/TESTING_GUIDE.md)**

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd bhendi-bazaar
   npm install
   ```

2. **Setup Environment**
   - Copy `.env.example` to `.env`
   - Configure database and API keys
   - See [Environment Setup](./ENVIRONMENT_SETUP.md) for details

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - User Interface: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## 🏗️ Architecture Highlights

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Payments**: Razorpay integration
- **State**: Zustand for cart management
- **Styling**: Tailwind CSS v4 with Shadcn/ui
- **Pattern**: Repository-Service architecture

## 📞 Support

For questions or issues:
1. Check the relevant documentation section
2. Review the [Debugging Guide](./developer-guides/DEBUGGING_GUIDE.md)
3. Consult the [Common Issues](#) section

## 🤝 Contributing

See [Contribution Guide](./developer-guides/CONTRIBUTION_GUIDE.md) for development guidelines.

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Status**: Production Ready

