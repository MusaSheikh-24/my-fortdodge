import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const HOME_TABLE = "Home";

// Force dynamic rendering for real-time visibility updates
export const dynamic = 'force-dynamic';

/**
 * GET /api/page-visibility
 * Get visibility status for all pages at once
 */
export async function GET() {
  try {
    // Fetch all pages from Home table
    const { data, error } = await supabase
      .from(HOME_TABLE)
      .select("page_name, data");

    if (error) {
      console.error("[page-visibility] Failed to fetch page visibility:", error);
      return NextResponse.json(
        {
          ok: false,
          message: "Failed to fetch page visibility",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const visibility: Record<string, boolean> = {};

    // Default all pages to visible
    const defaultPages = [
      "home",
      "ramadan",
      "donate",
      "new-muslim",
      "report-death",
      "resources",
      "about",
      "request-a-speaker",
      "request-a-visit",
      "visitors-guide",
      "islamic-prayer",
      "islamic-school",
      "elections-nominations",
    ];

    defaultPages.forEach((page) => {
      visibility[page] = true; // Default to visible
    });

    // Update with actual visibility from database
    if (data) {
      data.forEach((row: any) => {
        const pageName = row.page_name || row.data?.page || null;
        if (pageName) {
          // Check visibility at root level of data
          let vis = row.data?.visibility;
          if (vis === undefined && row.data?.data && typeof row.data.data === 'object') {
            vis = row.data.data.visibility;
          }
          if (vis !== undefined) {
            visibility[pageName] = vis;
          }
        }
      });
    }

    return NextResponse.json(
      {
        ok: true,
        visibility,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error("[page-visibility] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch page visibility",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

