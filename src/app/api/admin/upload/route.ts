/**
 * Image Upload API Route
 * Uploads images to Vercel Blob storage with organized folder structure
 * POST /api/admin/upload?type=products - Upload single or multiple images
 * 
 * Supported types:
 * - products: Product images
 * - categories: Category hero images
 * - reviews: Review images
 */

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyAdminSession } from "@/lib/admin-auth";

// Valid upload types and their folder paths
const UPLOAD_TYPES = {
  products: "products",
  categories: "categories",
  reviews: "reviews",
} as const;

type UploadType = keyof typeof UPLOAD_TYPES;

// Supported image types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await verifyAdminSession();
  if (session instanceof NextResponse) return session;

  try {
    // Get upload type from query parameter
    const { searchParams } = new URL(request.url);
    const uploadType = (searchParams.get("type") || "products") as UploadType;

    // Validate upload type
    if (!UPLOAD_TYPES[uploadType]) {
      return NextResponse.json(
        { error: `Invalid upload type. Allowed types: ${Object.keys(UPLOAD_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const folder = UPLOAD_TYPES[uploadType];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Allowed: JPEG, PNG, WebP, GIF` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name} (max 5MB)` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop();
      const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });

      uploadedUrls.push(blob.url);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      type: uploadType,
      folder,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload images",
      },
      { status: 500 }
    );
  }
}
