import { NextResponse } from "next/server";
import { updateReserveBasementSection } from "@/lib/reserve-basement.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sectionKey, sectionData } = body;

        if (!sectionKey) {
            return NextResponse.json({ ok: false, message: "Missing sectionKey" }, { status: 400 });
        }

        const result = await updateReserveBasementSection(sectionKey, sectionData);

        if (!result.success) {
            return NextResponse.json({ ok: false, message: result.error || "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, reserveBasement: result.data });
    } catch (error: any) {
        console.error("[reserve-basement/update-section] Exception:", error);
        return NextResponse.json({ ok: false, message: "Failed to update reserve basement section", error: error?.message ?? String(error) }, { status: 500 });
    }
}

