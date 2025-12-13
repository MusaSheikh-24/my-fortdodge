"use client";

import { useState, useEffect } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import { ApplyMembershipSectionConfig } from "@/lib/apply-membership.service";
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

export default function ApplyRenewMembershipPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    header: [
      { id: "drawer-title", label: "Drawer Title", type: "text", value: "Fort Dodge Islamic Center Membership Application Form" },
      { id: "drawer-subtitle", label: "Drawer Subtitle", type: "rich-text", value: "Join our membership program to stay connected, receive special offers, and unlock features created to enhance your overall experience." },
    ],
    content: [
      {
        id: "overview",
        label: "Overview Paragraphs",
        type: "array",
        value: [
          { text: "Fort Dodge Islamic Center offers two types of membership: paid full membership and associate membership." },
          { text: "Paid full members have the right to vote in General Assembly elections and are eligible to serve on the Board of Directors. The annual membership fee is $30 and applies to members of the General Membership." },
          { text: "Associate members do not have voting privileges, but they are still entitled to all other benefits of membership, such as access to the Center's facilities and programs." },
          { text: "Please complete this form to establish or renew your membership at Fort Dodge Islamic Center. If you have any questions, please email membership@darularqam.org." },
        ],
        arrayItemSchema: [
          { id: "text", label: "Paragraph Text", type: "textarea" },
        ],
      },
      {
        id: "highlights",
        label: "Membership Highlights",
        type: "array",
        value: [
          { text: "Voting eligibility" },
          { text: "Facility access" },
          { text: "Community updates" },
        ],
        arrayItemSchema: [
          { id: "text", label: "Highlight Text", type: "text" },
        ],
      },
      {
        id: "instructions",
        label: "Instructions",
        type: "array",
        value: [
          { text: "Complete all required parts clearly." },
          { text: "Submit the form." },
          { text: "The fee for full membership is $30 per person per year. There is no fee for associate membership." },
          { text: "Select the method of payment: debit or credit card through our website, MOHID, or by submitting the fees into the donation box." },
        ],
        arrayItemSchema: [
          { id: "text", label: "Instruction Text", type: "textarea" },
        ],
      },
      { id: "donate-link", label: "Online Link (Donate Page)", type: "url", value: "https://www.arqum.org/donate" },
      { id: "mohid-link", label: "MOHID Link", type: "url", value: "https://us.mohid.co/tx/dallas/daic/masjid/online/donation" },
      { id: "mailing-list-note", label: "Mailing List Note", type: "text", value: "Once your application is processed, we will add your email to our members mailing list." },
    ],
    // formConfig intentionally omitted so admins cannot edit form fields.
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Fetch Apply Membership data from database
  useEffect(() => {
    async function fetchMembershipData() {
      try {
        const response = await fetch("/api/apply-membership", { cache: 'no-store' });
        const result = await response.json();

        if (result.ok && result.applyMembership?.data) {
          const data = result.applyMembership.data;
          
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
                case "highlights":
                  const highlightsData = contentData.highlights;
                  if (Array.isArray(highlightsData) && highlightsData.length > 0) {
                    const highlightsItems = highlightsData.map((item: any) => 
                      typeof item === 'string' ? { text: item } : item
                    );
                    return { ...field, value: highlightsItems };
                  }
                  return field;
                case "instructions":
                  const instructionsData = contentData.instructions;
                  if (Array.isArray(instructionsData) && instructionsData.length > 0) {
                    const instructionsItems = instructionsData.map((item: any) => 
                      typeof item === 'string' ? { text: item } : item
                    );
                    return { ...field, value: instructionsItems };
                  }
                  return field;
                case "donate-link":
                  return {
                    ...field,
                    value: contentData["donate-link"] || contentData.donateLink || field.value,
                  };
                case "mohid-link":
                  return {
                    ...field,
                    value: contentData["mohid-link"] || contentData.mohidLink || field.value,
                  };
                case "mailing-list-note":
                  return {
                    ...field,
                    value: contentData["mailing-list-note"] || contentData.mailingListNote || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch membership data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembershipData();
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
        // This ensures donate-link, mohid-link, mailing-list-note are always saved
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
      console.log(`[ApplyMembership] Saving ${sectionId}:`, {
        fields: fields.map(f => ({ id: f.id, type: f.type, value: f.value })),
        sectionData,
        completeData,
      });

      const requestBody = {
        sectionKey: sectionId,
        sectionData: {
          enabled: true,
          data: completeData,
        } as ApplyMembershipSectionConfig,
      };

      const response = await fetch("/api/apply-membership/update-section", {
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
        console.error(`[ApplyMembership] Save failed:`, result);
        toast.error(result.message || "Failed to save");
      }
    } catch (err: any) {
      console.error(`[ApplyMembership] Save error:`, err);
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Apply/Renew Membership Drawer"
      pageDescription="Edit all content for the Apply/Renew Membership drawer including header, content sections, and form configuration."
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

