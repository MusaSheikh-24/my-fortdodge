import { NextResponse } from "next/server";
import { getRequestDoorAccessContent } from "@/lib/request-door-access.service";

export async function GET() {
    try {
        const requestDoorAccess = await getRequestDoorAccessContent();

        return NextResponse.json({ ok: true, requestDoorAccess });
    } catch (error: any) {
        console.error("[request-door-access API] Error:", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Failed to fetch request door access content",
                error: error?.message ?? String(error),
            },
            { status: 500 }
        );
    }
}

