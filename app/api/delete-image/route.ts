import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-side API route for deleting images from Supabase Storage.
 *
 * POST /api/delete-image?bucket=Public&folder=Home
 * Body (JSON):
 *   { "pathOrName": "Home/your-file.jpg" }  // full path
 *   or
 *   { "pathOrName": "your-file.jpg" }       // filename (folder inferred)
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = env.supabaseUrl;
    const supabaseServiceKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;

    if (!supabaseServiceKey) {
      console.error("[delete-image] Missing Supabase credentials");
      return NextResponse.json(
        {
          ok: false,
          message: "Server configuration error: Missing Supabase credentials",
        },
        { status: 500 }
      );
    }

    const isServiceRole = env.isServiceRoleConfigured;
    console.log(
      "[delete-image] Using key type:",
      isServiceRole ? "SERVICE_ROLE_KEY" : "ANON_KEY"
    );

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          apikey: supabaseServiceKey,
        },
      },
    });

    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket") || "Public";
    const folder = searchParams.get("folder") || "Home";

    const body = await request.json().catch(() => null);
    const pathOrName: string | undefined = body?.pathOrName;

    if (!pathOrName || typeof pathOrName !== "string") {
      return NextResponse.json(
        { ok: false, message: "pathOrName is required" },
        { status: 400 }
      );
    }

    // Never try to delete blob URLs or legacy public folder images
    if (pathOrName.startsWith("blob:")) {
      console.warn(
        "[delete-image] Ignoring blob URL, nothing to delete:",
        pathOrName
      );
      return NextResponse.json(
        {
          ok: true,
          message: "Blob URL ignored; nothing deleted from storage",
        },
        { status: 200 }
      );
    }

    if (
      pathOrName.startsWith("/images/") ||
      pathOrName.startsWith("images/") ||
      pathOrName.startsWith("/public/") ||
      pathOrName.startsWith("public/")
    ) {
      console.warn(
        "[delete-image] Ignoring legacy public folder path, nothing deleted from storage:",
        pathOrName
      );
      return NextResponse.json(
        {
          ok: true,
          message: "Legacy public asset path ignored; nothing deleted from storage",
        },
        { status: 200 }
      );
    }

    // If the value already contains a slash, treat as full path.
    // Otherwise, prepend the folder.
    const trimmed = pathOrName.startsWith("/")
      ? pathOrName.slice(1)
      : pathOrName;
    const fullPath = trimmed.includes("/") ? trimmed : `${folder}/${trimmed}`;

    console.log("[delete-image] Deleting file from storage:", {
      bucket,
      fullPath,
      original: pathOrName,
    });

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([fullPath]);

    if (error) {
      console.error("[delete-image] Delete failed:", {
        error: error.message,
        errorDetails: error,
        usingServiceRole: isServiceRole,
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Failed to delete image from storage",
          error: error.message,
          usingServiceRole: isServiceRole,
        },
        { status: 500 }
      );
    }

    console.log("[delete-image] Delete successful");

    return NextResponse.json(
      {
        ok: true,
        message: "Image deleted from storage",
        path: fullPath,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[delete-image] Exception:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to delete image",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}


