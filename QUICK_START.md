# Quick Start Guide - Seed Data

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Seed
```bash
npx prisma db seed
```

This creates:
- ✅ 5 users (2 admins, 3 regular users)
- ✅ 4 categories
- ✅ 12 products  
- ✅ 15 orders
- ✅ 22 reviews
- ✅ 3 abandoned carts

### Step 2: Login & Test

**Admin Access:**
```
URL: http://localhost:3000/admin
Email: admin@bhendibazaar.com
Password: Admin@123
```

**Customer Access:**
```
URL: http://localhost:3000
Email: fatima.khan@gmail.com
Password: Test@123
```

### Step 3: (Optional) Upload Real Images

See `scripts/README.md` for image upload instructions.

---

## 📊 What You Get

### Products (12 total)
- 3 Abayas (prices: ₹2,880 - ₹5,800)
- 3 Attars (prices: ₹1,200 - ₹2,400)
- 3 Jewellery (prices: ₹1,500 - ₹3,200)
- 3 Prayer Items (prices: ₹450 - ₹1,800)

### Stock Levels for Testing
- 1 product out of stock (Rose & Musk Blend)
- 3 products with low stock (< 10 items)
- 8 products with good stock

### Orders for Testing
- Recent orders (1-7 days): 3 processing orders
- Mid-term (10-35 days): 9 packed/shipped orders
- Completed (45-60 days): 3 delivered orders

### Features to Test
✅ Browse categories  
✅ Search products  
✅ Read reviews (22 realistic reviews)  
✅ Add to cart  
✅ Checkout process  
✅ Guest checkout (3 sample guest orders)  
✅ Admin dashboard  
✅ Order management  
✅ Low stock alerts  
✅ Abandoned cart recovery (3 carts)  

---

## 🎯 Test Scenarios

### As Customer
1. Browse products by category
2. View product details with reviews
3. Add items to cart
4. Complete checkout
5. View order history
6. Write product reviews

### As Admin
1. View dashboard analytics
2. Manage products (12 pre-loaded)
3. View orders (15 with different statuses)
4. Monitor stock levels
5. View abandoned carts (3 ready for recovery)
6. Moderate reviews

### Edge Cases Covered
- Out of stock products
- Failed payments
- Unverified email users
- Guest orders
- Multiple addresses
- Low stock warnings

---

## 📁 File Structure

```
src/data/seed/
├── types.ts           # TypeScript types
├── users.seed.ts      # 5 users with profiles
├── categories.seed.ts # 4 categories
├── products.seed.ts   # 12 products
├── orders.seed.ts     # 15 orders
├── reviews.seed.ts    # 22 reviews
├── carts.seed.ts      # 3 abandoned carts
└── index.ts           # Exports all
```

---

## 🔧 Useful Commands

```bash
# Run seed
npx prisma db seed

# Reset database and re-seed
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio

# Upload images to Vercel Blob
npx tsx scripts/upload-images.ts seed-images/products products
```

---

## 💡 Pro Tips

1. **Image Placeholders:** Seed uses placeholder images by default - perfect for testing without real images

2. **Realistic Data:** All names, addresses, and data are Mumbai-based for authenticity

3. **Verified Reviews:** 15/22 reviews are marked as verified purchases (linked to actual orders)

4. **Guest Testing:** 3 orders are guest orders (no user ID) for testing guest checkout

5. **Email Testing:** One user has unverified email for testing verification flow

---

## 🐛 Troubleshooting

**Seed fails?**
- Check database connection: `npx prisma db pull`
- Verify environment variables in `.env`

**Can't login?**
- Passwords are case-sensitive
- Admin: `Admin@123`
- Users: `Test@123`

**No images showing?**
- Normal! Seed uses placeholders
- Upload real images using `scripts/upload-images.ts`
- Or update URLs in seed files

---

## ✨ Ready to Go!

Your application is now fully seeded with realistic data. Start the development server and explore:

```bash
npm run dev
```

Then visit:
- **Customer Site:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin

Happy testing! 🎉

