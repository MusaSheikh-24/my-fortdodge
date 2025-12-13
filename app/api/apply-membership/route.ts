import { NextResponse } from "next/server";
import { getApplyMembershipContent } from "@/lib/apply-membership.service";

export async function GET() {
    try {
        const applyMembership = await getApplyMembershipContent();

        return NextResponse.json({ ok: true, applyMembership });
    } catch (error: any) {
        console.error("[apply-membership API] Error:", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Failed to fetch apply membership content",
                error: error?.message ?? String(error),
            },
            { status: 500 }
        );
    }
}

