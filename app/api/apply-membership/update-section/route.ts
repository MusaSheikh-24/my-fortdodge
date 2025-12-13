import { NextResponse } from "next/server";
import { updateApplyMembershipSection } from "@/lib/apply-membership.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sectionKey, sectionData } = body;

        if (!sectionKey) {
            return NextResponse.json({ ok: false, message: "Missing sectionKey" }, { status: 400 });
        }

        const result = await updateApplyMembershipSection(sectionKey, sectionData);

        if (!result.success) {
            return NextResponse.json({ ok: false, message: result.error || "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, applyMembership: result.data });
    } catch (error: any) {
        console.error("[apply-membership/update-section] Exception:", error);
        return NextResponse.json({ ok: false, message: "Failed to update apply membership section", error: error?.message ?? String(error) }, { status: 500 });
    }
}

