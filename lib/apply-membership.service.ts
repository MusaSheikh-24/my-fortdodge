import { supabase } from "./supabase";

export type ApplyMembershipSectionConfig<TData = any> = {
    enabled?: boolean | null;
    data?: TData | null;
};

export type ApplyMembershipContentJson = {
    page: string;
    data: {
        header?: ApplyMembershipSectionConfig;
        content?: ApplyMembershipSectionConfig;
        [key: string]: ApplyMembershipSectionConfig | undefined;
    };
};

export type ApplyMembershipContent = {
    id: number;
    data: ApplyMembershipContentJson;
    created_at?: string | null;
    updated_at?: string | null;
};

const HOME_TABLE = "Home";

export async function getApplyMembershipContent(): Promise<ApplyMembershipContent | null> {
    const { data, error } = await supabase
        .from(HOME_TABLE)
        .select("*")
        .eq("page_name", "apply-membership")
        .single();

    if (error) {
        console.error("[apply-membership.service] Failed to fetch Apply Membership content:", error);
        return null;
    }

    return data as ApplyMembershipContent;
}

export async function updateApplyMembershipSection(
    sectionKey: string,
    sectionData: ApplyMembershipSectionConfig
): Promise<{ success: boolean; error?: string; data?: ApplyMembershipContent }> {
    try {
        const current = await getApplyMembershipContent();

        // CREATE NEW ROW IF NOT EXISTS
        if (!current) {
            const newData: ApplyMembershipContentJson = {
                page: "apply-membership",
                data: {
                    [sectionKey]: sectionData,
                },
            };

            const { data: insertData, error: insertError } = await supabase
                .from(HOME_TABLE)
                .insert({ data: newData, page_name: "apply-membership" })
                .select()
                .single();

            if (insertError) {
                console.error("[apply-membership.service] Failed to create Apply Membership row:", insertError);
                return { success: false, error: insertError.message };
            }

            return { success: true, data: insertData as ApplyMembershipContent };
        }

        // UPDATE EXISTING
        const updatedData: ApplyMembershipContentJson = {
            page: "apply-membership",
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
            console.error("[apply-membership.service] Failed to update Apply Membership section:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true, data: updateData as ApplyMembershipContent };
    } catch (error: any) {
        console.error("[apply-membership.service] Error updating Apply Membership section:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}

