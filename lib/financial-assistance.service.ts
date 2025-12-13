import { supabase } from "./supabase";

export type FinancialAssistanceSectionConfig<TData = any> = {
    enabled?: boolean | null;
    data?: TData | null;
};

export type FinancialAssistanceContentJson = {
    page: string;
    data: {
        header?: FinancialAssistanceSectionConfig;
        content?: FinancialAssistanceSectionConfig;
        [key: string]: FinancialAssistanceSectionConfig | undefined;
    };
};

export type FinancialAssistanceContent = {
    id: number;
    data: FinancialAssistanceContentJson;
    created_at?: string | null;
    updated_at?: string | null;
};

const HOME_TABLE = "Home";

export async function getFinancialAssistanceContent(): Promise<FinancialAssistanceContent | null> {
    const { data, error } = await supabase
        .from(HOME_TABLE)
        .select("*")
        .eq("page_name", "financial-assistance")
        .single();

    if (error) {
        console.error("[financial-assistance.service] Failed to fetch Financial Assistance content:", error);
        return null;
    }

    return data as FinancialAssistanceContent;
}

export async function updateFinancialAssistanceSection(
    sectionKey: string,
    sectionData: FinancialAssistanceSectionConfig
): Promise<{ success: boolean; error?: string; data?: FinancialAssistanceContent }> {
    try {
        const current = await getFinancialAssistanceContent();

        // CREATE NEW ROW IF NOT EXISTS
        if (!current) {
            const newData: FinancialAssistanceContentJson = {
                page: "financial-assistance",
                data: {
                    [sectionKey]: sectionData,
                },
            };

            const { data: insertData, error: insertError } = await supabase
                .from(HOME_TABLE)
                .insert({ data: newData, page_name: "financial-assistance" })
                .select()
                .single();

            if (insertError) {
                console.error("[financial-assistance.service] Failed to create Financial Assistance row:", insertError);
                return { success: false, error: insertError.message };
            }

            return { success: true, data: insertData as FinancialAssistanceContent };
        }

        // UPDATE EXISTING
        const updatedData: FinancialAssistanceContentJson = {
            page: "financial-assistance",
            data: {
                ...(current.data?.data || {}),
                [sectionKey]: sectionData, // overwrite updated section
            },
        };

        const { data: updateData, error: updateError } = await supabase
            .from(HOME_TABLE)
            .update({ data: updatedData, updated_at: new Date().toISOString() })
            .eq("id", current.id)
            .select()
            .single();

        if (updateError) {
            console.error("[financial-assistance.service] Failed to update Financial Assistance section:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true, data: updateData as FinancialAssistanceContent };
    } catch (error: any) {
        console.error("[financial-assistance.service] Error updating Financial Assistance section:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}

