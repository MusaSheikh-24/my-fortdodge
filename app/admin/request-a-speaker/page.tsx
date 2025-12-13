"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { RequestSpeakerSectionConfig } from "@/lib/request-speaker.service";
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

export default function RequestSpeakerPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    content: [
      { id: "greeting", label: "Greeting", type: "text", value: "Peace!" },
      { id: "intro-paragraph", label: "Introduction Paragraph", type: "rich-text", value: "The members of Fort Dodge Islamic Center are available to present programs to your school or college, church or faith group, or civil organization about Islam. We hope that our programs about Islam and Muslims will be informative, build understanding, correct misconceptions, and promote tolerance and diversity within the community." },
      { id: "programs-paragraph", label: "Programs Paragraph", type: "rich-text", value: "Members of the Public Relations Committee would be happy to speak with you about several types of programs about Islam we can present to you. A wide variety of program subjects are available, including Islam as it relates to history, political science, social studies, world religions, or any other relevant subject headings." },
      { id: "visit-paragraph", label: "Visit Paragraph", type: "rich-text", value: "In an attempt to be informative about Islamic religious beliefs and practices, we are also happy to host individuals and groups at Fort Dodge Islamic Center. Should you be interested in visiting our mosque, please contact us to schedule your visit." },
      { id: "contact-paragraph", label: "Contact Paragraph", type: "rich-text", value: "Please contact us or email us at info@arqum.org. You can also leave a message at (515) 292-3683. We will contact you as soon as possible to work out the details." },
      { id: "closing-paragraph", label: "Closing Paragraph", type: "rich-text", value: "In addition, we would appreciate receiving notification of any events in your organization where our participation would be appropriate. Our members represent a wide range of diverse regions and cultures in the world and contribute to the wonderful diversity of Ames and the surrounding communities." },
      { id: "thank-you", label: "Thank You", type: "text", value: "Thank you," },
      { id: "signature", label: "Signature", type: "text", value: "Public Relations Committee" },
      { id: "organization", label: "Organization", type: "text", value: "Fort Dodge Islamic Center" },
      { id: "email-label", label: "Email Label", type: "text", value: "Email:" },
      { id: "email", label: "Email", type: "text", value: "info@arqum.org" },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchRequestSpeakerData() {
      try {
        const response = await fetch("/api/request-a-speaker");
        const result = await response.json();

        if (result.ok && result.requestSpeaker?.data) {
          const data = result.requestSpeaker.data;

          // Support both shapes:
          // 1) { page, hero, content, ... }
          // 2) { page, data: { hero, content, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;

          const transformed = { ...sections };

          // Content
          if (sectionsSource.content?.data) {
            const contentData = sectionsSource.content.data as any;
            transformed.content = transformed.content.map((field) => {
              switch (field.id) {
                case "greeting":
                  return {
                    ...field,
                    value: contentData.greeting || field.value,
                  };
                case "intro-paragraph":
                  return {
                    ...field,
                    value: contentData["intro-paragraph"] || contentData.introParagraph || field.value,
                  };
                case "programs-paragraph":
                  return {
                    ...field,
                    value: contentData["programs-paragraph"] || contentData.programsParagraph || field.value,
                  };
                case "visit-paragraph":
                  return {
                    ...field,
                    value: contentData["visit-paragraph"] || contentData.visitParagraph || field.value,
                  };
                case "contact-paragraph":
                  return {
                    ...field,
                    value: contentData["contact-paragraph"] || contentData.contactParagraph || field.value,
                  };
                case "closing-paragraph":
                  return {
                    ...field,
                    value: contentData["closing-paragraph"] || contentData.closingParagraph || field.value,
                  };
                case "thank-you":
                  return {
                    ...field,
                    value: contentData["thank-you"] || contentData.thankYou || field.value,
                  };
                case "signature":
                  return {
                    ...field,
                    value: contentData.signature || field.value,
                  };
                case "organization":
                  return {
                    ...field,
                    value: contentData.organization || field.value,
                  };
                case "email-label":
                  return {
                    ...field,
                    value: contentData["email-label"] || contentData.emailLabel || field.value,
                  };
                case "email":
                  return {
                    ...field,
                    value: contentData.email || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch request speaker data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequestSpeakerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSectionUpdate = (sectionId: string, fields: SectionField[]) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: fields,
    }));
  };

  const transformFieldsToSupabase = (
    sectionId: string,
    fields: SectionField[]
  ): any => {
    const data: any = {};

    fields.forEach((field) => {
      if (field.type === "array" || field.type === "table") {
        data[field.id] = Array.isArray(field.value) ? field.value : [];
      } else {
        data[field.id] = typeof field.value === "string" ? field.value : "";
      }
    });

    const mapping: Record<string, (d: any) => any> = {
      hero: (d) => ({
        heroImage: d["hero-image"] || "",
      }),
      content: (d) => ({
        greeting: d.greeting || "",
        "intro-paragraph": d["intro-paragraph"] || "",
        "programs-paragraph": d["programs-paragraph"] || "",
        "visit-paragraph": d["visit-paragraph"] || "",
        "contact-paragraph": d["contact-paragraph"] || "",
        "closing-paragraph": d["closing-paragraph"] || "",
        "thank-you": d["thank-you"] || "",
        signature: d.signature || "",
        organization: d.organization || "",
        "email-label": d["email-label"] || "",
        email: d.email || "",
      }),
    };

    const mapper = mapping[sectionId];
    return mapper ? mapper(data) : data;
  };

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
        } as RequestSpeakerSectionConfig,
      };

      const response = await fetch("/api/request-a-speaker/update-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(`${getSectionTitle(sectionId)} saved successfully!`);
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to save");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  const tabs = [
    { id: "content", label: "Content Section", icon: "📝" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      content: "Content Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Request a Speaker Page"
      pageDescription="Edit all sections of the request a speaker page including hero and content sections."
    >
      <VisibilityToggle pageName="request-a-speaker" apiEndpoint="/api/request-a-speaker" />
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="w-full overflow-x-auto horizontal-scroll">
            <nav className="inline-flex min-w-max scroll-px-4 px-8 py-2 md:px-0" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    cursor-pointer mr-2 flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium border-2 transition-colors last:mr-0
                    ${
                      activeTab === tab.id
                        ? "border-sky-600 bg-sky-50 text-sky-700"
                        : "border-transparent bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white hover:text-gray-800"
                    }
                  `}
                >
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="text-left leading-snug">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === "content" && (
                <SectionEditor
                  sectionId="content"
                  sectionTitle={getSectionTitle("content")}
                  fields={sections.content}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("content")}
                  saving={saving["content"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="request-a-speaker"
                />
              )}
            </>
          )}
        </div>
      </div>
    </PageEditorLayout>
  );
}

