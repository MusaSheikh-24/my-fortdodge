import { supabase } from "./supabase";

export type ReserveBasementSectionConfig<TData = any> = {
    enabled?: boolean | null;
    data?: TData | null;
};

export type ReserveBasementContentJson = {
    page: string;
    data: {
        header?: ReserveBasementSectionConfig;
        content?: ReserveBasementSectionConfig;
        [key: string]: ReserveBasementSectionConfig | undefined;
    };
};

export type ReserveBasementContent = {
    id: number;
    data: ReserveBasementContentJson;
    created_at?: string | null;
    updated_at?: string | null;
};

const HOME_TABLE = "Home";

export async function getReserveBasementContent(): Promise<ReserveBasementContent | null> {
    const { data, error } = await supabase
        .from(HOME_TABLE)
        .select("*")
        .eq("page_name", "reserve-basement")
        .single();

    if (error) {
        console.error("[reserve-basement.service] Failed to fetch Reserve Basement content:", error);
        return null;
    }

    return data as ReserveBasementContent;
}

export async function updateReserveBasementSection(
    sectionKey: string,
    sectionData: ReserveBasementSectionConfig
): Promise<{ success: boolean; error?: string; data?: ReserveBasementContent }> {
    try {
        const current = await getReserveBasementContent();

        // CREATE NEW ROW IF NOT EXISTS
        if (!current) {
            const newData: ReserveBasementContentJson = {
                page: "reserve-basement",
                data: {
                    [sectionKey]: sectionData,
                },
            };

            const { data: insertData, error: insertError } = await supabase
                .from(HOME_TABLE)
                .insert({ data: newData, page_name: "reserve-basement" })
                .select()
                .single();

            if (insertError) {
                console.error("[reserve-basement.service] Failed to create Reserve Basement row:", insertError);
                return { success: false, error: insertError.message };
            }

            return { success: true, data: insertData as ReserveBasementContent };
        }

        // UPDATE EXISTING
        const updatedData: ReserveBasementContentJson = {
            page: "reserve-basement",
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
            console.error("[reserve-basement.service] Failed to update Reserve Basement section:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true, data: updateData as ReserveBasementContent };
    } catch (error: any) {
        console.error("[reserve-basement.service] Error updating Reserve Basement section:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}

