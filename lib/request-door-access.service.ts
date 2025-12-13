import { supabase } from "./supabase";

export type RequestDoorAccessSectionConfig<TData = any> = {
    enabled?: boolean | null;
    data?: TData | null;
};

export type RequestDoorAccessContentJson = {
    page: string;
    data: {
        header?: RequestDoorAccessSectionConfig;
        content?: RequestDoorAccessSectionConfig;
        [key: string]: RequestDoorAccessSectionConfig | undefined;
    };
};

export type RequestDoorAccessContent = {
    id: number;
    data: RequestDoorAccessContentJson;
    created_at?: string | null;
    updated_at?: string | null;
};

const HOME_TABLE = "Home";

export async function getRequestDoorAccessContent(): Promise<RequestDoorAccessContent | null> {
    const { data, error } = await supabase
        .from(HOME_TABLE)
        .select("*")
        .eq("page_name", "request-door-access")
        .single();

    if (error) {
        console.error("[request-door-access.service] Failed to fetch Request Door Access content:", error);
        return null;
    }

    return data as RequestDoorAccessContent;
}

export async function updateRequestDoorAccessSection(
    sectionKey: string,
    sectionData: RequestDoorAccessSectionConfig
): Promise<{ success: boolean; error?: string; data?: RequestDoorAccessContent }> {
    try {
        const current = await getRequestDoorAccessContent();

        // CREATE NEW ROW IF NOT EXISTS
        if (!current) {
            const newData: RequestDoorAccessContentJson = {
                page: "request-door-access",
                data: {
                    [sectionKey]: sectionData,
                },
            };

            const { data: insertData, error: insertError } = await supabase
                .from(HOME_TABLE)
                .insert({ data: newData, page_name: "request-door-access" })
                .select()
                .single();

            if (insertError) {
                console.error("[request-door-access.service] Failed to create Request Door Access row:", insertError);
                return { success: false, error: insertError.message };
            }

            return { success: true, data: insertData as RequestDoorAccessContent };
        }

        // UPDATE EXISTING
        const updatedData: RequestDoorAccessContentJson = {
            page: "request-door-access",
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
            console.error("[request-door-access.service] Failed to update Request Door Access section:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true, data: updateData as RequestDoorAccessContent };
    } catch (error: any) {
        console.error("[request-door-access.service] Error updating Request Door Access section:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}

