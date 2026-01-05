# Image Upload Helper

This script helps you upload local images to Vercel Blob storage for seeding purposes.

## Setup

1. Create a folder structure for your images:
```bash
mkdir -p seed-images/{products,categories,profile,reviews}
```

2. Place your images in the appropriate folders:
```
seed-images/
├── categories/
│   ├── abayas.jpg
│   ├── attars.jpg
│   ├── jewellery.jpg
│   └── prayer-essentials.jpg
├── products/
│   ├── emerald-abaya-1.jpg
│   ├── emerald-abaya-2.jpg
│   ├── black-jilbab.jpg
│   └── ...
└── profile/
    ├── user-1.jpg
    └── ...
```

## Usage

Run the script with the folder path and upload type:

```bash
# Upload category images
npx tsx scripts/upload-images.ts seed-images/categories categories

# Upload product images
npx tsx scripts/upload-images.ts seed-images/products products

# Upload profile pictures
npx tsx scripts/upload-images.ts seed-images/profile profile

# Upload review images
npx tsx scripts/upload-images.ts seed-images/reviews reviews
```

## Output

The script will:
1. Upload all images to Vercel Blob
2. Display progress for each file
3. Output all URLs in a copy-paste friendly format

Example output:
```
📤 Uploading 4 images to Vercel Blob...

✅ abayas.jpg → https://abc123.public.blob.vercel-storage.com/categories/abayas-1703123456.jpg
✅ attars.jpg → https://abc123.public.blob.vercel-storage.com/categories/attars-1703123457.jpg
✅ jewellery.jpg → https://abc123.public.blob.vercel-storage.com/categories/jewellery-1703123458.jpg
✅ prayer-essentials.jpg → https://abc123.public.blob.vercel-storage.com/categories/prayer-essentials-1703123459.jpg

🎉 Successfully uploaded 4/4 images

📋 URLs for your seed data:

// abayas.jpg
"https://abc123.public.blob.vercel-storage.com/categories/abayas-1703123456.jpg",

// attars.jpg
"https://abc123.public.blob.vercel-storage.com/categories/attars-1703123457.jpg",

...
```

## Update Seed Data

After uploading:
1. Copy the generated URLs
2. Update the appropriate seed data files:
   - `src/data/seed/categories.seed.ts` - for category images
   - `src/data/seed/products.seed.ts` - for product images
   - `src/data/seed/users.seed.ts` - for profile pictures
3. Re-run the seed script: `npx prisma db seed`

## Environment Variables

Make sure you have `BLOB_READ_WRITE_TOKEN` set in your `.env` file.

