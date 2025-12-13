"use client";

import { useState, useEffect } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import { ReserveBasementSectionConfig } from "@/lib/reserve-basement.service";
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

export default function ReserveBasementPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    header: [
      { id: "drawer-title", label: "Drawer Title", type: "text", value: "Fort Dodge Islamic Center Basement Reservation Form" },
      { id: "drawer-subtitle", label: "Drawer Subtitle", type: "rich-text", value: "Provide your event details to request basement usage for classes, gatherings, or community events." },
    ],
    content: [
      {
        id: "introCopy",
        label: "Introduction Paragraphs",
        type: "array",
        value: [
          { text: "This form is intended for members and affiliates of Fort Dodge Islamic Center seeking to reserve the basement space for various activities and events. Our basement is a versatile space, ideal for gatherings, educational sessions, community events, and more. Please fill out this form to begin the reservation process. All requests are subject to review based on our policy guidelines and availability." },
          { text: "Note: Please allow at least 2 days for us to process your request. We do not guarantee same-day reservations, so plan in advance." },
        ],
        arrayItemSchema: [
          { id: "text", label: "Paragraph Text", type: "rich-text" },
        ],
      },
      {
        id: "contactDetails",
        label: "Contact Details",
        type: "array",
        value: [
          { label: "Phone", value: "(515) 528-3618", href: "tel:15155283618" },
          { label: "Email", value: "info@arqum.org", href: "mailto:info@arqum.org" },
        ],
        arrayItemSchema: [
          { id: "label", label: "Label", type: "text" },
          { id: "value", label: "Display Value", type: "text" },
          { id: "href", label: "Link URL", type: "url" },
        ],
      },
      { id: "policy-title", label: "Policy Section Title", type: "text", value: "Basement Usage Policy" },
      {
        id: "policyItems",
        label: "Policy Items",
        type: "array",
        value: [
          { title: "1. Safety First:", description: "The safety of our community is our top priority. The basement contains electrical components and utility rooms, which can be hazardous, especially to children. It is imperative that these areas are treated with caution." },
          { title: "2. Adult Supervision Required for Children:", description: "Children are welcome to participate in activities held in the basement; however, they must be under adult supervision at all times. Unscheduled, unsupervised access by children to the basement is strictly prohibited to prevent accidents." },
          { title: "3. Prioritizing Space for Community Activities:", description: "While we understand the need for recreational space for children, the primary purpose of the basement is to serve as an additional space for community activities, educational purposes, and events. Therefore, reservation requests will be prioritized based on these needs." },
          { title: "4. Respect for the Space:", description: "All users of the basement are expected to respect the space. This includes maintaining cleanliness, ensuring all equipment and facilities are used appropriately, and leaving the space in the same condition as it was found." },
          { title: "5. Compliance with Islamic Center Rules and Regulations:", description: "All activities in the basement must adhere to the overall rules and guidelines of the Fort Dodge Islamic Center. Any activities contrary to these guidelines will not be permitted." },
          { title: "6. Reservation Review and Confirmation:", description: "Submission of this form does not guarantee a reservation. All requests will be reviewed. We will contact you via email communications as soon as possible to confirm availability. Please wait for our confirmation before proceeding with arrangements." },
          { title: "7. Cleaning:", description: "The reservation holder will be responsible to clean and remove trash from the basement after the reservation ends. They will also vacuum and return everything as it was before the reservation." },
          { title: "8. Community Use:", description: "The basement is intended for community use and a safe, respectful, and beneficial use of the basement space for our community." },
        ],
        arrayItemSchema: [
          { id: "title", label: "Policy Title", type: "text" },
          { id: "description", label: "Policy Description", type: "rich-text" },
        ],
      },
      { id: "form-url", label: "Reservation Form URL", type: "url", value: "https://forms.gle/ReserveBasementForm" },
    ],
    // formConfig intentionally omitted so admins cannot edit form fields.
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Fetch Reserve Basement data from database
  useEffect(() => {
    async function fetchReserveBasementData() {
      try {
        const response = await fetch("/api/reserve-basement", { cache: 'no-store' });
        const result = await response.json();

        if (result.ok && result.reserveBasement?.data) {
          const data = result.reserveBasement.data;
          
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
                case "introCopy":
                  const introCopyData = contentData.introCopy || contentData['intro-copy'];
                  if (Array.isArray(introCopyData) && introCopyData.length > 0) {
                    const introCopyItems = introCopyData.map((item: any) => 
                      typeof item === 'string' ? { text: item } : item
                    );
                    return { ...field, value: introCopyItems };
                  }
                  return field;
                case "contactDetails":
                  const contactDetailsData = contentData.contactDetails || contentData['contact-details'];
                  if (Array.isArray(contactDetailsData) && contactDetailsData.length > 0) {
                    return { ...field, value: contactDetailsData };
                  }
                  return field;
                case "policy-title":
                  return {
                    ...field,
                    value: contentData["policy-title"] || contentData.policyTitle || field.value,
                  };
                case "policyItems":
                  const policyItemsData = contentData.policyItems || contentData['policy-items'];
                  if (Array.isArray(policyItemsData) && policyItemsData.length > 0) {
                    return { ...field, value: policyItemsData };
                  }
                  return field;
                case "form-url":
                  return {
                    ...field,
                    value: contentData["form-url"] || contentData.formUrl || contentData.reservationFormUrl || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch reserve basement data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReserveBasementData();
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
      console.log(`[ReserveBasement] Saving ${sectionId}:`, {
        fields: fields.map(f => ({ id: f.id, type: f.type, value: f.value })),
        sectionData,
        completeData,
      });

      const requestBody = {
        sectionKey: sectionId,
        sectionData: {
          enabled: true,
          data: completeData,
        } as ReserveBasementSectionConfig,
      };

      const response = await fetch("/api/reserve-basement/update-section", {
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
        console.error(`[ReserveBasement] Save failed:`, result);
        toast.error(result.message || "Failed to save");
      }
    } catch (err: any) {
      console.error(`[ReserveBasement] Save error:`, err);
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Reserve Basement Drawer"
      pageDescription="Edit all content for the Reserve Basement drawer including header, content sections, and form configuration."
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

