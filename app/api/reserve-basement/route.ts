import { NextResponse } from "next/server";
import { getReserveBasementContent } from "@/lib/reserve-basement.service";

export async function GET() {
    try {
        const reserveBasement = await getReserveBasementContent();

        return NextResponse.json({ ok: true, reserveBasement });
    } catch (error: any) {
        console.error("[reserve-basement API] Error:", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Failed to fetch reserve basement content",
                error: error?.message ?? String(error),
            },
            { status: 500 }
        );
    }
}

