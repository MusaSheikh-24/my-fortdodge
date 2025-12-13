import { NextResponse } from "next/server";
import { updateContactSection } from "@/lib/contact.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { sectionKey, sectionData } = body;

        if (!sectionKey) {
            return NextResponse.json({ ok: false, message: "Missing sectionKey" }, { status: 400 });
        }

        const result = await updateContactSection(sectionKey, sectionData);

        if (!result.success) {
            return NextResponse.json({ ok: false, message: result.error || "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, contact: result.data });
    } catch (error: any) {
        console.error("[contact/update-section] Exception:", error);
        return NextResponse.json({ ok: false, message: "Failed to update contact section", error: error?.message ?? String(error) }, { status: 500 });
    }
}
