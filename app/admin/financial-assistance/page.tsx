"use client";

import { useState, useEffect } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import { FinancialAssistanceSectionConfig } from "@/lib/financial-assistance.service";
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

export default function FinancialAssistancePageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    header: [
      { id: "drawer-title", label: "Drawer Title", type: "text", value: "Fort Dodge Islamic Center Financial Assistance Form" },
      { id: "drawer-subtitle", label: "Drawer Subtitle", type: "rich-text", value: "Share your information below. You will finish the official Google Form in the next step." },
    ],
    content: [
      {
        id: "overview",
        label: "Overview Paragraphs",
        type: "array",
        value: [
          { text: "The aim of the financial assistance program is to provide short-term financial aid to community members experiencing hardship. This support is made possible through Zakat, Sadaqa, and Fitra contributions." },
        ],
        arrayItemSchema: [
          { id: "text", label: "Paragraph Text", type: "rich-text" },
        ],
      },
      {
        id: "howToApply",
        label: "How to Apply Steps",
        type: "array",
        value: [
          { title: "Online Application", description: "The fastest and most convenient method is to complete the Google Form linked below.", bullets: [] },
          { title: "Printable Application (optional)", description: "Download the latest application from our website, fill it out, and return it using any of the options below:", bullets: ["Place the completed form in the donation box located in the prayer hall.", "Email the completed form to treasurer@arqum.org."] },
          { title: "Supporting Documents", description: "Please include recent documents such as bank statements and receipts. These can be scanned and emailed to treasurer@arqum.org.", bullets: [] },
        ],
        arrayItemSchema: [
          { id: "title", label: "Step Title", type: "text" },
          { id: "description", label: "Description", type: "rich-text" },
          { id: "bullets", label: "Bullet Points (one per line)", type: "textarea" },
        ],
      },
      { id: "financial-form-url", label: "Financial Form URL", type: "url", value: "https://forms.gle/financial-assistance" },
      { id: "help-email", label: "Help Email", type: "text", value: "treasurer@arqum.org" },
      { id: "website-url", label: "Website URL", type: "url", value: "https://arqum.org" },
    ],
    // formConfig intentionally omitted so admins cannot edit form fields.
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Fetch Financial Assistance data from database
  useEffect(() => {
    async function fetchFinancialData() {
      try {
        const response = await fetch("/api/financial-assistance", { cache: 'no-store' });
        const result = await response.json();

        if (result.ok && result.financialAssistance?.data) {
          const data = result.financialAssistance.data;
          
          // Handle nested data structure: data.data contains the actual sections
          const sectionsSource = data.data && typeof data.data === 'object' ? data.data : data;
          
          const transformed = { ...sections };

          // Header
          if (sectionsSource.header?.data) {
            const headerData = sectionsSource.header.data as any;
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

          // Content
          if (sectionsSource.content?.data) {
            const contentData = sectionsSource.content.data as any;
            transformed.content = transformed.content.map((field) => {
              switch (field.id) {
                case "overview":
                  const overviewData = contentData.overview;
                  if (Array.isArray(overviewData) && overviewData.length > 0) {
                    const overviewItems = overviewData.map((item: any) => 
                      typeof item === 'string' ? { text: item } : item
                    );
                    return { ...field, value: overviewItems };
                  }
                  return field;
                case "howToApply":
                  const howToApplyData = contentData.howToApply;
                  if (Array.isArray(howToApplyData) && howToApplyData.length > 0) {
                    const howToApplyItems = howToApplyData.map((item: any) => {
                      // Keep bullets as string for textarea (newline-separated)
                      let bullets = item.bullets || '';
                      if (Array.isArray(bullets)) {
                        bullets = bullets.filter((b: any) => b && b.trim()).join('\n');
                      } else if (typeof bullets !== 'string') {
                        bullets = '';
                      }
                      return {
                        title: item.title || '',
                        description: item.description || '',
                        bullets: bullets,
                      };
                    });
                    return { ...field, value: howToApplyItems };
                  }
                  return field;
                case "financial-form-url":
                  return {
                    ...field,
                    value: contentData["financial-form-url"] || contentData.financialFormUrl || field.value,
                  };
                case "help-email":
                  return {
                    ...field,
                    value: contentData["help-email"] || contentData.helpEmail || field.value,
                  };
                case "website-url":
                  return {
                    ...field,
                    value: contentData["website-url"] || contentData.websiteUrl || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch financial assistance data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSectionUpdate = (sectionId: string, fields: SectionField[]) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: fields,
    }));
  };

  // Convert fields to clean Supabase format
  const transformFieldsToSupabase = (sectionId: string, fields: SectionField[]) => {
    const data: any = {};
    
    // Ensure ALL fields are included, even if value is empty
    fields.forEach((field) => {
      if (field.type === "array" || field.type === "table") {
        if (Array.isArray(field.value)) {
          // Clean array items to match schema
          const cleanedArray = field.value.map((item: any) => {
            // If item is already a proper object with schema fields, use it
            if (typeof item === "object" && item !== null && !Array.isArray(item)) {
              const cleaned: any = {};
              if (field.arrayItemSchema) {
                field.arrayItemSchema.forEach((schema) => {
                  // For bullets, keep as string (already newline-separated from textarea)
                  cleaned[schema.id] = item[schema.id] || "";
                });
              } else {
                // Fallback: preserve all properties
                Object.keys(item).forEach((key) => {
                  cleaned[key] = item[key];
                });
              }
              return cleaned;
            }
            // If item is a string, convert to object with "text" field (or first schema field)
            if (typeof item === "string") {
              return field.arrayItemSchema?.[0] 
                ? { [field.arrayItemSchema[0].id]: item }
                : { text: item };
            }
            return item;
          });
          data[field.id] = cleanedArray;
        } else {
          data[field.id] = [];
        }
      } else {
        // For non-array fields, always include them (even if empty string)
        data[field.id] = typeof field.value === "string" ? field.value : (field.value || "");
      }
    });
    
    return data;
  };

  // Save function
  const handleSave = async (sectionId: string) => {
    setSaving((prev) => ({ ...prev, [sectionId]: true }));

    try {
      const fields = sections[sectionId];
      const sectionData = transformFieldsToSupabase(sectionId, fields);

      // Ensure all fields are included - if a field is missing from sectionData but exists in fields, include it
      const completeData: any = { ...sectionData };
      fields.forEach((field) => {
        // Only add if not already present (to avoid overwriting with empty values)
        if (!(field.id in completeData) && field.value !== undefined && field.value !== null && field.value !== '') {
          if (field.type === "array" || field.type === "table") {
            completeData[field.id] = Array.isArray(field.value) ? field.value : [];
          } else {
            completeData[field.id] = typeof field.value === "string" ? field.value : "";
          }
        }
      });

      // Debug: Log what we're saving
      console.log(`[FinancialAssistance] Saving ${sectionId}:`, {
        fields: fields.map(f => ({ id: f.id, type: f.type, value: f.value })),
        sectionData,
        completeData,
      });

      const requestBody = {
        sectionKey: sectionId,
        sectionData: {
          enabled: true,
          data: completeData,
        } as FinancialAssistanceSectionConfig,
      };

      const response = await fetch("/api/financial-assistance/update-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(`${sectionId === "header" ? "Header" : "Content"} saved successfully!`);
        // Reload to get fresh data
        window.location.reload();
      } else {
        console.error(`[FinancialAssistance] Save failed:`, result);
        toast.error(result.message || "Failed to save");
      }
    } catch (err: any) {
      console.error(`[FinancialAssistance] Save error:`, err);
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Financial Assistance Drawer"
      pageDescription="Edit all content for the Financial Assistance drawer including header, content sections, and form configuration."
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
            sectionTitle="Content Section"
            fields={sections.content}
            onUpdate={handleSectionUpdate}
            onSave={() => handleSave("content")}
            saving={saving["content"] || false}
            alwaysExpanded={true}
          />
          {sections.formConfig && (
            <SectionEditor
              sectionId="formConfig"
              sectionTitle="Form Configuration"
              fields={sections.formConfig}
              onUpdate={handleSectionUpdate}
            />
          )}
        </div>
      )}
    </PageEditorLayout>
  );
}

