import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-side API route for uploading images to Supabase Storage.
 * This uses service role key for better permissions.
 * 
 * POST /api/upload-image
 * Body: FormData with 'file' field
 * Query: ?bucket=Public&folder=Home
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = env.supabaseUrl;
    const supabaseServiceKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;

    if (!supabaseServiceKey) {
      console.error("[upload-image] Missing Supabase service key");
      return NextResponse.json(
        { ok: false, message: "Server configuration error: Missing Supabase credentials" },
        { status: 500 }
      );
    }

    // Log which key is being used (for debugging)
    const isServiceRole = env.isServiceRoleConfigured;
    console.log("[upload-image] Using key type:", isServiceRole ? "SERVICE_ROLE_KEY" : "ANON_KEY");
    
    if (!isServiceRole) {
      console.warn("[upload-image] WARNING: Using ANON_KEY instead of SERVICE_ROLE_KEY. Uploads may fail due to RLS policies.");
    }

    // Create admin client with service role key for full permissions
    // Service role key bypasses RLS policies
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
        },
      },
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fieldId = formData.get("fieldId") as string || "image";

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          ok: false, 
          message: `File size too large. Maximum is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "Invalid file type. Please upload an image file." },
        { status: 400 }
      );
    }

    // Get bucket and folder from query params or use defaults
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket") || "Public";
    const folder = searchParams.get("folder") || "Home";

    // Sanitize fieldId to remove invalid characters for file paths
    // Replace brackets, dots, and other special chars with underscores
    const sanitizedFieldId = fieldId
      .replace(/[\[\](){}]/g, '_') // Replace brackets and parentheses
      .replace(/\./g, '_') // Replace dots
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace any other non-alphanumeric chars (except - and _)
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${sanitizedFieldId}-${Date.now()}.${ext}`;
    const path = `${folder}/${fileName}`;

    console.log("[upload-image] Uploading file:", {
      fileName,
      path,
      bucket,
      size: file.size,
      type: file.type,
    });

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (error) {
      console.error("[upload-image] Upload failed:", {
        error: error.message,
        statusCode: 'statusCode' in error ? (error as any).statusCode : undefined,
        errorDetails: error,
        usingServiceRole: isServiceRole,
      });

      // Provide helpful error message for RLS policy errors
      let errorMessage = "Failed to upload image to storage";
      let helpText = "";
      
      if (error.message?.includes("row-level security") || error.message?.includes("RLS")) {
        errorMessage = "Storage bucket RLS (Row Level Security) policy is blocking the upload";
        helpText = "\n\nTo fix this:\n" +
          "1. Go to Supabase Dashboard → Storage → Policies\n" +
          "2. Find the 'Public' bucket\n" +
          "3. Add a policy that allows INSERT operations\n" +
          "   OR disable RLS for this bucket (Settings → Disable RLS)\n" +
          "4. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local\n\n" +
          "Example policy SQL:\n" +
          "CREATE POLICY \"Allow public uploads\" ON storage.objects\n" +
          "FOR INSERT WITH CHECK (bucket_id = 'Public');";
      }

      return NextResponse.json(
        {
          ok: false,
          message: errorMessage,
          error: error.message,
          details: 'statusCode' in error ? `Status: ${(error as any).statusCode}` : undefined,
          help: helpText,
          usingServiceRole: isServiceRole,
        },
        { status: 500 }
      );
    }

    console.log("[upload-image] Upload successful:", uploadData);

    // Return just the filename (frontend will resolve the full URL)
    return NextResponse.json(
      {
        ok: true,
        message: "Image uploaded successfully",
        fileName: fileName, // Just the filename, not the full path
        path: path, // Full path for reference
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[upload-image] Exception:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to upload image",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

