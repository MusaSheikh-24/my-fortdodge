import { supabase } from "./supabase";

export type ContactSectionConfig<TData = any> = {
    enabled?: boolean | null;
    data?: TData | null;
};

export type ContactContentJson = {
    page: string;
    data: {
        header?: ContactSectionConfig;
        content?: ContactSectionConfig;
        [key: string]: ContactSectionConfig | undefined;
    };
};

export type ContactContent = {
    id: number;
    data: ContactContentJson;
    created_at?: string | null;
    updated_at?: string | null;
};

const HOME_TABLE = "Home";

export async function getContactContent(): Promise<ContactContent | null> {
    const { data, error } = await supabase
        .from(HOME_TABLE)
        .select("*")
        .eq("page_name", "contact")
        .single();

    if (error) {
        console.error("[contact.service] Failed to fetch Contact content:", error);
        return null;
    }

    return data as ContactContent;
}

export async function updateContactSection(
    sectionKey: string,
    sectionData: ContactSectionConfig
): Promise<{ success: boolean; error?: string; data?: ContactContent }> {
    try {
        const current = await getContactContent();

        // CREATE NEW ROW IF NOT EXISTS
        if (!current) {
            const newData: ContactContentJson = {
                page: "contact",
                data: {
                    [sectionKey]: sectionData,
                },
            };

            const { data: insertData, error: insertError } = await supabase
                .from(HOME_TABLE)
                .insert({ data: newData, page_name: "contact" })
                .select()
                .single();

            if (insertError) {
                console.error("[contact.service] Failed to create Contact row:", insertError);
                return { success: false, error: insertError.message };
            }

            return { success: true, data: insertData as ContactContent };
        }

        // UPDATE EXISTING
        const updatedData: ContactContentJson = {
            page: "contact",
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
            console.error("[contact.service] Failed to update Contact section:", updateError);
            return { success: false, error: updateError.message };
        }

        return { success: true, data: updateData as ContactContent };
    } catch (error: any) {
        console.error("[contact.service] Error updating Contact section:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}
