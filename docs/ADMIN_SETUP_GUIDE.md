# Admin Panel Setup Guide

## Quick Start (5 Steps)

### Step 1: Run Database Migration

```bash
cd /Users/burhanuddin.c/projects/bhendi-bazaar
npx prisma migrate dev --name add_admin_features
```

This will:
- Add `role`, `isBlocked`, `lastActiveAt` fields to User
- Add `sku`, `lowStockThreshold` fields to Product
- Add `isApproved` field to Review
- Create new `AdminLog` model for activity tracking
- Add necessary indexes for performance

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Create Your First Admin User

**Option A: Using Prisma Studio (Recommended)**
```bash
npx prisma studio
```
- Open browser at http://localhost:5555
- Navigate to "User" model
- Find your user by email
- Change `role` field from "USER" to "ADMIN"
- Save

**Option B: Using SQL**
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

**Option C: Using Prisma (create migration script)**
```typescript
// prisma/seed-admin.ts
import { prisma } from './src/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  const hashedPassword = await hash('your-secure-password', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@bhendibazaar.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@bhendibazaar.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: hashedPassword,
    },
  });
}

main();
```

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Access Admin Panel

Navigate to: **http://localhost:3000/admin**

If you're not logged in, you'll be redirected to signin page.
After signing in with your admin account, you'll see the dashboard!

---

## Environment Variables

Make sure you have these in your `.env` file:

```env
# Database
DATABASE_URL="your-postgres-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# OAuth (if using)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## Testing the Admin Panel

### 1. Test Dashboard
- Visit `/admin`
- Should see revenue metrics, order stats, etc.

### 2. Test Orders Management
- Visit `/admin/orders`
- Try searching for orders
- Try changing order status
- Try filtering by status/payment

### 3. Test Users Management
- Visit `/admin/users`
- Try searching for users
- Try blocking/unblocking a user
- Try filtering by role

### 4. Test Products Management
- Visit `/admin/products`
- View products list
- Try searching and filtering

---

## Troubleshooting

### Issue: "Unauthorized" when accessing /admin

**Solution:**
1. Make sure you're logged in
2. Verify your user has `role: "ADMIN"` in database
3. Clear browser cache/cookies and login again

### Issue: Migration fails with "duplicate column"

**Solution:**
The fields might already exist. Drop the migration and create a new one:
```bash
rm -rf prisma/migrations/[timestamp]_add_admin_features
npx prisma migrate dev --name add_admin_features
```

### Issue: Prisma Client errors

**Solution:**
Regenerate the client:
```bash
npx prisma generate
```

### Issue: Can't see any data in dashboard

**Solution:**
Make sure you have:
1. Orders in the database
2. Products in the database
3. The database connection is working

---

## What's Next?

### Immediate Todos:
1. ✅ Run migration
2. ✅ Create admin user
3. ✅ Login and test dashboard

### Optional Enhancements:
- [ ] Add product create/edit forms
- [ ] Add category management UI
- [ ] Add review moderation UI
- [ ] Implement Excel import/export
- [ ] Add email reminders for abandoned carts
- [ ] Add charts to dashboard (using recharts or similar)

### Production Checklist:
- [ ] Add rate limiting to admin APIs
- [ ] Set up admin activity monitoring
- [ ] Add backup for admin actions
- [ ] Configure proper error logging
- [ ] Add admin notification system
- [ ] Set up database backups

---

## Admin Routes Reference

### Dashboard
- `GET /admin` - Dashboard page
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/dashboard/activities` - Recent activities
- `GET /api/admin/dashboard/revenue` - Revenue chart data

### Users
- `GET /admin/users` - Users management page
- `GET /api/admin/users` - List users (with pagination/filters)
- `GET /api/admin/users/:id` - Get single user
- `PATCH /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/block` - Block/unblock user

### Orders
- `GET /admin/orders` - Orders management page
- `GET /api/admin/orders` - List orders (with pagination/filters)
- `GET /api/admin/orders/:id` - Get single order
- `PATCH /api/admin/orders/:id` - Update order status
- `POST /api/admin/orders/bulk-update` - Bulk update order status

### Products
- `GET /admin/products` - Products management page
- `GET /api/admin/products` - List products (with pagination/filters)
- `GET /api/admin/products/:id` - Get single product
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Categories (API Only - UI to be implemented)
- `GET /api/admin/categories` - List categories
- `GET /api/admin/categories/:id` - Get single category
- `POST /api/admin/categories` - Create category
- `PATCH /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

---

## Support

If you encounter issues:
1. Check the console logs (both browser and server)
2. Verify database connection
3. Ensure all environment variables are set
4. Check that migrations ran successfully

Happy administrating! 🎉


