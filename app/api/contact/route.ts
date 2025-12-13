import { NextResponse } from "next/server";
import { getContactContent } from "@/lib/contact.service";

export async function GET() {
    try {
        const contact = await getContactContent();

        return NextResponse.json({ ok: true, contact });
    } catch (error: any) {
        console.error("[contact API] Error:", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Failed to fetch contact content",
                error: error?.message ?? String(error),
            },
            { status: 500 }
        );
    }
}
