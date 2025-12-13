"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { ElectionNominationSectionConfig } from "@/lib/election-nomination.service";
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

export default function ElectionsNominationsPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    election: [
      { id: "election-title", label: "Section Title", type: "text", value: "DAIC Board of Directors Election" },
      { id: "election-intro", label: "Introduction", type: "rich-text", value: "The DAIC Board of Directors Election will be held on Sunday, September 28th 2025 after Dhuhr Prayer. Nomination forms are available on the DAIC bulletin boards and via the link below:" },
      { id: "nomination-form-link", label: "Nomination Form Link", type: "url", value: "/files/board-of-directors-nomination-form.pdf" },
      { id: "nomination-form-label", label: "Nomination Form Label", type: "text", value: "Board of Directors Nomination Form" },
      { id: "nomination-deadline", label: "Nomination Deadline", type: "rich-text", value: "If you would like to nominate someone, please complete the appropriate form, and submit it by Isha prayer on Friday, September 26th." },
    ],
    membership: [
      { id: "membership-title", label: "Section Title", type: "text", value: "MEMBERSHIP & VOTING" },
      { id: "membership-intro", label: "Introduction", type: "rich-text", value: "To vote in the upcoming election you must be a DAIC member. The membership dues are $30 per person for a one-year membership. You can renew your membership in one of the following ways:" },
      {
        id: "membership-methods",
        label: "Membership Payment Methods",
        type: "array",
        value: [
          { method: "Donation Box", description: "Drop off an envelope in the Islamic Center Donation Box with your NAME and \"MEMBERSHIP\" written on the envelope." },
          { method: "Mohid Kiosk", description: "Select the Membership option on the kiosk and follow the instructions." },
          { method: "Online", description: "Membership dues can also be paid through the Islamic Center website. To pay dues online go to www.arqum.org and press the donate button, then choose DAIC Membership in the category and follow the instructions.", link: "https://www.arqum.org" },
        ],
        arrayItemSchema: [
          { id: "method", label: "Method Name", type: "text" },
          { id: "description", label: "Description", type: "textarea" },
          { id: "link", label: "Link URL (optional)", type: "url" },
        ],
      },
    ],
    questions: [
      { id: "questions-title", label: "Section Title", type: "text", value: "QUESTIONS" },
      { id: "questions-content", label: "Content", type: "rich-text", value: "For any further questions contact DAIC Treasurer at treasurer@arqum.org." },
      { id: "treasurer-email", label: "Treasurer Email", type: "text", value: "treasurer@arqum.org" },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchElectionNominationData() {
      try {
        const response = await fetch("/api/election-nomination");
        const result = await response.json();

        if (result.ok && result.electionNomination?.data) {
          const data = result.electionNomination.data;

          // Support both shapes:
          // 1) { page, hero, election, ... }
          // 2) { page, data: { hero, election, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;
          const transformed: Record<string, SectionField[]> = {
            hero: [
              { id: "hero-image", label: "Hero Image", type: "image", value: "/images/fortdoge-masjid.jpg" },
            ],
            election: [
              { id: "election-title", label: "Section Title", type: "text", value: "DAIC Board of Directors Election" },
              { id: "election-intro", label: "Introduction", type: "rich-text", value: "The DAIC Board of Directors Election will be held on Sunday, September 28th 2025 after Dhuhr Prayer. Nomination forms are available on the DAIC bulletin boards and via the link below:" },
              { id: "nomination-form-link", label: "Nomination Form Link", type: "url", value: "/files/board-of-directors-nomination-form.pdf" },
              { id: "nomination-form-label", label: "Nomination Form Label", type: "text", value: "Board of Directors Nomination Form" },
              { id: "nomination-deadline", label: "Nomination Deadline", type: "rich-text", value: "If you would like to nominate someone, please complete the appropriate form, and submit it by Isha prayer on Friday, September 26th." },
            ],
            membership: [
              { id: "membership-title", label: "Section Title", type: "text", value: "MEMBERSHIP & VOTING" },
              { id: "membership-intro", label: "Introduction", type: "rich-text", value: "To vote in the upcoming election you must be a DAIC member. The membership dues are $30 per person for a one-year membership. You can renew your membership in one of the following ways:" },
              {
                id: "membership-methods",
                label: "Membership Payment Methods",
                type: "array",
                value: [
                  { method: "Donation Box", description: "Drop off an envelope in the Islamic Center Donation Box with your NAME and \"MEMBERSHIP\" written on the envelope." },
                  { method: "Mohid Kiosk", description: "Select the Membership option on the kiosk and follow the instructions." },
                  { method: "Online", description: "Membership dues can also be paid through the Islamic Center website. To pay dues online go to www.arqum.org and press the donate button, then choose DAIC Membership in the category and follow the instructions.", link: "https://www.arqum.org" },
                ],
                arrayItemSchema: [
                  { id: "method", label: "Method Name", type: "text" },
                  { id: "description", label: "Description", type: "textarea" },
                  { id: "link", label: "Link URL (optional)", type: "url" },
                ],
              },
            ],
            questions: [
              { id: "questions-title", label: "Section Title", type: "text", value: "QUESTIONS" },
              { id: "questions-content", label: "Content", type: "rich-text", value: "For any further questions contact DAIC Treasurer at treasurer@arqum.org." },
              { id: "treasurer-email", label: "Treasurer Email", type: "text", value: "treasurer@arqum.org" },
            ],
          };

          // Map existing data from Supabase into editor fields
          if (sectionsSource.election?.data) {
            const electionData = sectionsSource.election.data as any;
            transformed.election = [
              { id: "election-title", label: "Section Title", type: "text", value: electionData["election-title"] || electionData.electionTitle || transformed.election[0].value },
              { id: "election-intro", label: "Introduction", type: "rich-text", value: electionData["election-intro"] || electionData.electionIntro || transformed.election[1].value },
              { id: "nomination-form-link", label: "Nomination Form Link", type: "url", value: electionData["nomination-form-link"] || electionData.nominationFormLink || transformed.election[2].value },
              { id: "nomination-form-label", label: "Nomination Form Label", type: "text", value: electionData["nomination-form-label"] || electionData.nominationFormLabel || transformed.election[3].value },
              { id: "nomination-deadline", label: "Nomination Deadline", type: "rich-text", value: electionData["nomination-deadline"] || electionData.nominationDeadline || transformed.election[4].value },
            ];
          }

          if (sectionsSource.membership?.data) {
            const membershipData = sectionsSource.membership.data as any;
            // Clean array items - remove numeric keys and keep only schema fields
            let membershipMethods = Array.isArray(membershipData["membership-methods"]) 
              ? membershipData["membership-methods"] 
              : (Array.isArray(membershipData.membershipMethods) ? membershipData.membershipMethods : transformed.membership[2].value);
            
            if (Array.isArray(membershipMethods)) {
              membershipMethods = membershipMethods.map((item: any) => {
                if (typeof item === "object" && item !== null) {
                  // Remove numeric keys (0, 1, 2, etc.) and keep only schema fields
                  const cleaned: any = {};
                  if (item.method) cleaned.method = item.method;
                  if (item.description) cleaned.description = item.description;
                  if (item.link) cleaned.link = item.link;
                  return cleaned;
                }
                return item;
              });
            }
            
            transformed.membership = [
              {
                id: "membership-title",
                label: "Section Title",
                type: "text",
                value: membershipData["membership-title"] || membershipData.membershipTitle || transformed.membership[0].value,
              },
              {
                id: "membership-intro",
                label: "Introduction",
                type: "rich-text",
                value: membershipData["membership-intro"] || membershipData.membershipIntro || transformed.membership[1].value,
              },
              {
                id: "membership-methods",
                label: "Membership Payment Methods",
                type: "array",
                value: membershipMethods,
                arrayItemSchema: [
                  { id: "method", label: "Method Name", type: "text" },
                  { id: "description", label: "Description", type: "textarea" },
                  { id: "link", label: "Link URL (optional)", type: "url" },
                ],
              },
            ];
          }

          if (sectionsSource.questions?.data) {
            const questionsData = sectionsSource.questions.data as any;
            transformed.questions = [
              { id: "questions-title", label: "Section Title", type: "text", value: questionsData["questions-title"] || questionsData.questionsTitle || transformed.questions[0].value },
              { id: "questions-content", label: "Content", type: "rich-text", value: questionsData["questions-content"] || questionsData.questionsContent || transformed.questions[1].value },
              { id: "treasurer-email", label: "Treasurer Email", type: "text", value: questionsData["treasurer-email"] || questionsData.treasurerEmail || transformed.questions[2].value },
            ];
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch election nomination data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchElectionNominationData();
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
        // Clean array items - ensure they're proper objects with schema fields only
        if (Array.isArray(field.value)) {
          const cleanedArray = field.value.map((item: any) => {
            // If item is already a proper object with schema fields, clean it
            if (typeof item === "object" && item !== null && !Array.isArray(item)) {
              // Remove ALL numeric keys (0, 1, 2, etc.) and keep ONLY schema fields
              const cleaned: any = {};
              if (field.arrayItemSchema) {
                field.arrayItemSchema.forEach((schema) => {
                  // First, try to get value from the schema field
                  let value = item[schema.id];
                  
                  // If value is empty/undefined/null, try to reconstruct from numeric keys
                  if (!value || value === "") {
                    const numericKeys = Object.keys(item)
                      .filter(key => !isNaN(Number(key)) && key !== schema.id);
                    
                    if (numericKeys.length > 0) {
                      // Reconstruct text from numeric keys
                      value = numericKeys
                        .sort((a, b) => Number(a) - Number(b))
                        .map(key => String(item[key] || ""))
                        .join("");
                    }
                  }
                  
                  // Set the cleaned value (only schema field, no numeric keys)
                  cleaned[schema.id] = value || "";
                });
              } else {
                // Fallback: if no schema, try to extract "text" field or reconstruct
                if (item.text && typeof item.text === "string") {
                  cleaned.text = item.text;
                } else {
                  // Reconstruct from numeric keys
                  const numericKeys = Object.keys(item)
                    .filter(key => !isNaN(Number(key)) && key !== "text");
                  
                  if (numericKeys.length > 0) {
                    cleaned.text = numericKeys
                      .sort((a, b) => Number(a) - Number(b))
                      .map(key => String(item[key] || ""))
                      .join("");
                  } else {
                    cleaned.text = "";
                  }
                }
              }
              
              // Return ONLY the cleaned object (no numeric keys, only schema fields)
              return cleaned;
            }
            // If item is a string, convert to object with "text" field
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
        data[field.id] = typeof field.value === "string" ? field.value : "";
      }
    });

    return data;
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
        } as ElectionNominationSectionConfig,
      };

      const response = await fetch("/api/election-nomination/update-section", {
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
    { id: "election", label: "Election Section", icon: "🗳️" },
    { id: "membership", label: "Membership & Voting", icon: "👥" },
    { id: "questions", label: "Questions", icon: "❓" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      election: "Election Section",
      membership: "Membership & Voting Section",
      questions: "Questions Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Elections & Nominations Page"
      pageDescription="Edit all sections of the Elections & Nominations page including hero and content sections."
    >
      <VisibilityToggle pageName="elections-nominations" apiEndpoint="/api/election-nomination" />
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
              {tabs.map((tab) => (
                <div key={tab.id}>
                  {activeTab === tab.id && sections[tab.id] && (
                    <SectionEditor
                      sectionId={tab.id}
                      sectionTitle={getSectionTitle(tab.id)}
                      fields={sections[tab.id] || []}
                      onUpdate={handleSectionUpdate}
                      onSave={() => handleSave(tab.id)}
                      saving={saving[tab.id] || false}
                      alwaysExpanded={true}
                      bucket="Public"
                      folder="election-nomination"
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </PageEditorLayout>
  );
}

