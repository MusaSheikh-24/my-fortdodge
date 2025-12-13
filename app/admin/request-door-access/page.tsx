"use client";

import { useState, useEffect } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import { RequestDoorAccessSectionConfig } from "@/lib/request-door-access.service";
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

export default function RequestDoorAccessPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    header: [
      { id: "drawer-title", label: "Drawer Title", type: "text", value: "Fort Dodge Islamic Center Door Security Access Code Request Form" },
      { id: "drawer-subtitle", label: "Drawer Subtitle", type: "rich-text", value: "Request your unique access code for entry outside regular prayer times." },
    ],
    content: [
      {
        id: "policyIntro",
        label: "Policy Introduction Paragraphs",
        type: "array",
        value: [
          { text: "Fort Dodge Islamic Center is committed to the safety and security of its members. In line with this commitment, we are introducing a new door security policy. Starting 2/1/2024, The doors of the Islamic Center will be unlocked during regular prayer times (15 minutes before Athan and will remain open 15 minutes past Iqama), but access will be restricted at other times for enhanced security. To access the center's premises at other times, community members are required to sign up and obtain a unique access code." },
          { text: "Please complete the following form accurately and thoroughly to request your access code. Once your request is approved, you will receive a confirmation email containing your unique access code. This code will be necessary for entry into the Fort Dodge Islamic Center outside prayer times." },
        ],
        arrayItemSchema: [
          { id: "text", label: "Paragraph Text", type: "rich-text" },
        ],
      },
      {
        id: "policyAgreement",
        label: "Policy Agreement Items",
        type: "array",
        value: [
          { text: "I understand that the access code provided is for my personal use only." },
          { text: "I agree not to share my access code with anyone else." },
          { text: "I will promptly report any loss or compromise of my access code to the Fort Dodge Islamic Center management." },
        ],
        arrayItemSchema: [
          { id: "text", label: "Agreement Text", type: "text" },
        ],
      },
      { id: "policy-agreement-intro", label: "Policy Agreement Introduction", type: "rich-text", value: "By submitting this form, I confirm that all the information provided is accurate and complete and I have read and agree to abide by the following Fort Dodge Islamic Center's door security policy:" },
      { id: "membership-drawer-link", label: "Membership Drawer Link", type: "url", value: "https://forms.gle/xtiX7nYHEWLfoEfy8" },
    ],
    // formConfig intentionally omitted so admins cannot edit form fields.
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Fetch Request Door Access data from database
  useEffect(() => {
    async function fetchDoorAccessData() {
      try {
        const response = await fetch("/api/request-door-access", { cache: 'no-store' });
        const result = await response.json();

        if (result.ok && result.requestDoorAccess?.data) {
          const data = result.requestDoorAccess.data;
          
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
                case "policyIntro":
                  const policyIntroData = contentData.policyIntro;
                  if (Array.isArray(policyIntroData) && policyIntroData.length > 0) {
                    const policyIntroItems = policyIntroData.map((item: any) => 
                      typeof item === 'string' ? { text: item } : item
                    );
                    return { ...field, value: policyIntroItems };
                  }
                  return field;
                case "policyAgreement":
                  const policyAgreementData = contentData.policyAgreement;
                  if (Array.isArray(policyAgreementData) && policyAgreementData.length > 0) {
                    const policyAgreementItems = policyAgreementData.map((item: any) => 
                      typeof item === 'string' ? { text: item } : item
                    );
                    return { ...field, value: policyAgreementItems };
                  }
                  return field;
                case "policy-agreement-intro":
                  return {
                    ...field,
                    value: contentData["policy-agreement-intro"] || contentData.policyAgreementIntro || field.value,
                  };
                case "membership-drawer-link":
                  return {
                    ...field,
                    value: contentData["membership-drawer-link"] || contentData.membershipDrawerLink || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch door access data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDoorAccessData();
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
      console.log(`[RequestDoorAccess] Saving ${sectionId}:`, {
        fields: fields.map(f => ({ id: f.id, type: f.type, value: f.value })),
        sectionData,
        completeData,
      });

      const requestBody = {
        sectionKey: sectionId,
        sectionData: {
          enabled: true,
          data: completeData,
        } as RequestDoorAccessSectionConfig,
      };

      const response = await fetch("/api/request-door-access/update-section", {
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
        console.error(`[RequestDoorAccess] Save failed:`, result);
        toast.error(result.message || "Failed to save");
      }
    } catch (err: any) {
      console.error(`[RequestDoorAccess] Save error:`, err);
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Request Door Access Drawer"
      pageDescription="Edit all content for the Request Door Access drawer including header, policy content, and form configuration."
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

