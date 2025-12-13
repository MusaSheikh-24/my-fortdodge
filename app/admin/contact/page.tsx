"use client";

import { useState, useEffect } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import { toast } from "@/app/components/Toaster";

type SectionField = {
    id: string;
    label: string;
    type: "text" | "textarea" | "image" | "rich-text" | "url" | "time" | "array" | "table";
    value: string | any[];
    placeholder?: string;
    arrayItemSchema?: { id: string; label: string; type: string }[];
    tableColumns?: { id: string; label: string }[];
};

export default function ContactPageEditor() {
    const [sections, setSections] = useState<Record<string, SectionField[]>>({
        header: [
            {
                id: "drawer-title",
                label: "Drawer Title",
                type: "text",
                value: "Fort Dodge Islamic Center - Contact Us",
            },
            {
                id: "drawer-subtitle",
                label: "Drawer Subtitle",
                type: "rich-text",
                value:
                    "To serve you better, we suggest to use any of the different contact means we have available. But, we are happy to receive any anonymous queries or questions via this form.",
            },
        ],

        content: [
            {
                id: "contact-facebook",
                label: "Facebook Link",
                type: "url",
                value: "https://www.facebook.com/DAIC.Ames/",
            },
            {
                id: "contact-whatsapp",
                label: "WhatsApp Link",
                type: "url",
                value: "https://wa.me/?phone=15152923683",
            },
            {
                id: "contact-email",
                label: "Email",
                type: "text",
                value: "info@arqum.org",
            },
            {
                id: "contact-voicemail",
                label: "Voicemail Number",
                type: "text",
                value: "(515) 292-3683",
            },
        ],
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    // ✅ Fetch Contact Drawer Data — reusable function
    const fetchContactData = async () => {
        try {
            const res = await fetch("/api/contact", { cache: 'no-store' });
            const json = await res.json();

            if (json.ok && json.contact?.data) {
                // Handle nested data structure: json.contact.data.data contains the actual sections
                const data = json.contact.data.data && typeof json.contact.data.data === 'object' 
                    ? json.contact.data.data 
                    : json.contact.data;

                // Create transformed object with default values
                const transformed: Record<string, SectionField[]> = {
                    header: [
                        {
                            id: "drawer-title",
                            label: "Drawer Title",
                            type: "text",
                            value: "Fort Dodge Islamic Center - Contact Us",
                        },
                        {
                            id: "drawer-subtitle",
                            label: "Drawer Subtitle",
                            type: "rich-text",
                            value:
                                "To serve you better, we suggest to use any of the different contact means we have available. But, we are happy to receive any anonymous queries or questions via this form.",
                        },
                    ],
                    content: [
                        {
                            id: "contact-facebook",
                            label: "Facebook Link",
                            type: "url",
                            value: "https://www.facebook.com/DAIC.Ames/",
                        },
                        {
                            id: "contact-whatsapp",
                            label: "WhatsApp Link",
                            type: "url",
                            value: "https://wa.me/?phone=15152923683",
                        },
                        {
                            id: "contact-email",
                            label: "Email",
                            type: "text",
                            value: "info@arqum.org",
                        },
                        {
                            id: "contact-voicemail",
                            label: "Voicemail Number",
                            type: "text",
                            value: "(515) 292-3683",
                        },
                    ],
                };

                // HEADER
                if (data.header?.data) {
                    const headerData = data.header.data as any;
                    transformed.header = [
                        {
                            id: "drawer-title",
                            label: "Drawer Title",
                            type: "text",
                            value: headerData["drawer-title"] || headerData.drawerTitle || transformed.header[0].value,
                        },
                        {
                            id: "drawer-subtitle",
                            label: "Drawer Subtitle",
                            type: "rich-text",
                            value: headerData["drawer-subtitle"] || headerData.drawerSubtitle || transformed.header[1].value,
                        },
                    ];
                }

                // CONTENT
                if (data.content?.data) {
                    const contentData = data.content.data as any;
                    transformed.content = [
                        {
                            id: "contact-facebook",
                            label: "Facebook Link",
                            type: "url",
                            value: contentData["contact-facebook"] || contentData.contactFacebook || transformed.content[0].value,
                        },
                        {
                            id: "contact-whatsapp",
                            label: "WhatsApp Link",
                            type: "url",
                            value: contentData["contact-whatsapp"] || contentData.contactWhatsapp || transformed.content[1].value,
                        },
                        {
                            id: "contact-email",
                            label: "Email",
                            type: "text",
                            value: contentData["contact-email"] || contentData.contactEmail || transformed.content[2].value,
                        },
                        {
                            id: "contact-voicemail",
                            label: "Voicemail Number",
                            type: "text",
                            value: contentData["contact-voicemail"] || contentData.contactVoicemail || transformed.content[3].value,
                        },
                    ];
                }

                setSections(transformed);
            }
        } catch (err) {
            console.error("Failed to fetch contact data:", err);
        } finally {
            setLoading(false);
        }
    };

    // ❗ API call only once when page loads
    useEffect(() => {
        fetchContactData();
    }, []);

    // Convert fields to clean Supabase format
    const transformFieldsToSupabase = (sectionId: string, fields: SectionField[]) => {
        const data: any = {};
        fields.forEach((field) => {
            data[field.id] =
                field.type === "array"
                    ? Array.isArray(field.value)
                        ? field.value
                        : []
                    : typeof field.value === "string"
                        ? field.value
                        : "";
        });
        return data;
    };

    // SAVE function (no reload, real-time update)
    const handleSave = async (sectionId: string) => {
        setSaving((prev) => ({ ...prev, [sectionId]: true }));

        try {
            const fields = sections[sectionId];
            const sectionData = transformFieldsToSupabase(sectionId, fields);

            const requestBody = {
                sectionKey: sectionId,
                sectionData: {
                    enabled: true,
                    data: sectionData,
                },
            };

            const response = await fetch("/api/contact/update-section", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (result.ok) {
                toast.success(`${sectionId} saved successfully!`);
                // Data is already in state, no need to refetch
            } else {
                toast.error(result.message || "Failed to save");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to save");
        } finally {
            setSaving((prev) => ({ ...prev, [sectionId]: false }));
        }
    };

    // Update local UI when typing
    const handleSectionUpdate = (sectionId: string, fields: SectionField[]) => {
        setSections((prev) => ({
            ...prev,
            [sectionId]: fields,
        }));
    };

    return (
        <PageEditorLayout
            pageTitle="Edit Contact Drawer"
            pageDescription="Edit the header and contact information. The form fields are not editable from the admin panel."
        >
            {loading ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <SectionEditor
                        sectionId="header"
                        sectionTitle="Header Section"
                        fields={sections.header}
                        onUpdate={handleSectionUpdate}
                        onSave={() => handleSave("header")}
                        saving={saving["header"] || false}
                        alwaysExpanded={true}
                    />

                    <SectionEditor
                        sectionId="content"
                        sectionTitle="Contact Methods"
                        fields={sections.content}
                        onUpdate={handleSectionUpdate}
                        onSave={() => handleSave("content")}
                        saving={saving["content"] || false}
                    />
                </div>
            )}
        </PageEditorLayout>
    );
}
