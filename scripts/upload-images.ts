/**
 * Image Upload Helper Script
 * 
 * This script helps upload local images to Vercel Blob storage
 * Useful for seeding the database with real images
 * 
 * Usage:
 *   node scripts/upload-images.js <folder> <type>
 * 
 * Example:
 *   node scripts/upload-images.js seed-images/products products
 *   node scripts/upload-images.js seed-images/categories categories
 */

import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sanitize name for filename (remove special chars, spaces to hyphens)
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

async function uploadImages() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("❌ Usage: node scripts/upload-images.js <folder> <type>");
    console.error("   Types: products, categories, profile, reviews");
    process.exit(1);
  }

  const [folderPath, uploadType] = args;
  const fullPath = path.join(process.cwd(), folderPath);

  // Check if folder exists
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Folder not found: ${fullPath}`);
    process.exit(1);
  }

  // Read all files in the folder
  const files = fs.readdirSync(fullPath).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
  });

  if (files.length === 0) {
    console.error("❌ No image files found in folder");
    process.exit(1);
  }

  console.log(`📤 Uploading ${files.length} images to Vercel Blob...\n`);

  const uploadedFiles: Array<{ original: string; url: string }> = [];

  for (const file of files) {
    const filePath = path.join(fullPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Generate filename
    const nameWithoutExt = path.parse(file).name;
    const extension = path.extname(file).substring(1);
    const sanitizedName = sanitizeName(nameWithoutExt);
    const timestamp = Date.now();
    const blobFilename = `${uploadType}/${sanitizedName}-${timestamp}.${extension}`;

    try {
      const blob = await put(blobFilename, fileBuffer, {
        access: "public",
        addRandomSuffix: false,
      });

      uploadedFiles.push({
        original: file,
        url: blob.url,
      });

      console.log(`✅ ${file} → ${blob.url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
    }
  }

  console.log(`\n🎉 Successfully uploaded ${uploadedFiles.length}/${files.length} images\n`);
  console.log("📋 URLs for your seed data:\n");

  // Output in a format easy to copy-paste
  uploadedFiles.forEach(({ original, url }) => {
    console.log(`// ${original}`);
    console.log(`"${url}",\n`);
  });
}

uploadImages().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

