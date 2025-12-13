import { NextResponse } from "next/server";
import { getFinancialAssistanceContent } from "@/lib/financial-assistance.service";

export async function GET() {
    try {
        const financialAssistance = await getFinancialAssistanceContent();

        return NextResponse.json({ ok: true, financialAssistance });
    } catch (error: any) {
        console.error("[financial-assistance API] Error:", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Failed to fetch financial assistance content",
                error: error?.message ?? String(error),
            },
            { status: 500 }
        );
    }
}

