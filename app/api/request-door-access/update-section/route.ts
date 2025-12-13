import { NextResponse } from "next/server";
import { updateRequestDoorAccessSection } from "@/lib/request-door-access.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sectionKey, sectionData } = body;

        if (!sectionKey) {
            return NextResponse.json({ ok: false, message: "Missing sectionKey" }, { status: 400 });
        }

        const result = await updateRequestDoorAccessSection(sectionKey, sectionData);

        if (!result.success) {
            return NextResponse.json({ ok: false, message: result.error || "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, requestDoorAccess: result.data });
    } catch (error: any) {
        console.error("[request-door-access/update-section] Exception:", error);
        return NextResponse.json({ ok: false, message: "Failed to update request door access section", error: error?.message ?? String(error) }, { status: 500 });
    }
}

