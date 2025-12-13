"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { IslamicSchoolSectionConfig } from "@/lib/islamic-school.service";
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

export default function IslamicSchoolPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    intro: [
      { id: "intro-title", label: "Title", type: "text", value: "Islamic School" },
      { id: "intro-content", label: "Content", type: "rich-text", value: "Fort Dodge Islamic School (DAIS) is our weekend educational program dedicated to providing quality Islamic education to children in our community." },
    ],
    vision: [
      { id: "vision-title", label: "Section Title", type: "text", value: "VISION" },
      { id: "vision-content", label: "Content", type: "rich-text", value: "DAIS' vision is to cultivate tomorrow's leaders; proud, and practicing Muslims who will positively shape our families, communities, nation, and the world inshaAllah." },
    ],
    mission: [
      { id: "mission-title", label: "Section Title", type: "text", value: "MISSION" },
      { id: "mission-content", label: "Content", type: "rich-text", value: "DAIS — a Sunday school — provides Islamic education based on the Quran and Sunnah to elementary and middle school students at DAIC. DAIS prepares students to meet the challenges of our changing world by teaching them Quran, Islamic studies, and Arabic in an enriching and stimulating Islamic environment." },
    ],
    principal: [
      { id: "principal-title", label: "Section Title", type: "text", value: "HIRING A PRINCIPAL FOR THE ISLAMIC SCHOOL" },
      { id: "principal-content", label: "Content", type: "rich-text", value: "We are looking for a principal for our Islamic school. Please check the principal position description and apply by sending your CV and any supported documents to: education@arqum.org." },
      { id: "principal-pdf-link", label: "Principal Position PDF Link", type: "url", value: "/files/dais-principal-position-description.pdf" },
      { id: "principal-email", label: "Contact Email", type: "text", value: "education@arqum.org" },
    ],
    administration: [
      { id: "admin-title", label: "Section Title", type: "text", value: "ADMINISTRATION" },
      { id: "admin-principal-label", label: "Principal Label", type: "text", value: "Principal:" },
      { id: "admin-principal", label: "Principal Name", type: "text", value: "(To be announced)" },
      { id: "admin-info-text", label: "Info Text", type: "rich-text", value: "For more information e-mail us at education@arqum.org." },
      { id: "admin-email", label: "Contact Email", type: "text", value: "education@arqum.org" },
      { id: "admin-note", label: "Additional Note", type: "rich-text", value: "Information about the starting date of the school and the deadline for registration will be posted as soon as they are available." },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchIslamicSchoolData() {
      try {
        const response = await fetch("/api/islamic-school");
        const result = await response.json();

        if (result.ok && result.islamicSchool?.data) {
          const data = result.islamicSchool.data;

          // Support both shapes:
          // 1) { page, hero, intro, ... }
          // 2) { page, data: { hero, intro, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;
          const transformed: Record<string, SectionField[]> = {
            hero: [
              { id: "hero-image", label: "Hero Image", type: "image", value: "/images/fortdoge-masjid.jpg" },
            ],
            intro: [
              { id: "intro-title", label: "Title", type: "text", value: "Islamic School" },
              { id: "intro-content", label: "Content", type: "rich-text", value: "Fort Dodge Islamic School (DAIS) is our weekend educational program dedicated to providing quality Islamic education to children in our community." },
            ],
            vision: [
              { id: "vision-title", label: "Section Title", type: "text", value: "VISION" },
              { id: "vision-content", label: "Content", type: "rich-text", value: "DAIS' vision is to cultivate tomorrow's leaders; proud, and practicing Muslims who will positively shape our families, communities, nation, and the world inshaAllah." },
            ],
            mission: [
              { id: "mission-title", label: "Section Title", type: "text", value: "MISSION" },
              { id: "mission-content", label: "Content", type: "rich-text", value: "DAIS — a Sunday school — provides Islamic education based on the Quran and Sunnah to elementary and middle school students at DAIC. DAIS prepares students to meet the challenges of our changing world by teaching them Quran, Islamic studies, and Arabic in an enriching and stimulating Islamic environment." },
            ],
            principal: [
              { id: "principal-title", label: "Section Title", type: "text", value: "HIRING A PRINCIPAL FOR THE ISLAMIC SCHOOL" },
              { id: "principal-content", label: "Content", type: "rich-text", value: "We are looking for a principal for our Islamic school. Please check the principal position description and apply by sending your CV and any supported documents to: education@arqum.org." },
              { id: "principal-pdf-link", label: "Principal Position PDF Link", type: "url", value: "/files/dais-principal-position-description.pdf" },
              { id: "principal-email", label: "Contact Email", type: "text", value: "education@arqum.org" },
            ],
            administration: [
              { id: "admin-title", label: "Section Title", type: "text", value: "ADMINISTRATION" },
              { id: "admin-principal-label", label: "Principal Label", type: "text", value: "Principal:" },
              { id: "admin-principal", label: "Principal Name", type: "text", value: "(To be announced)" },
              { id: "admin-info-text", label: "Info Text", type: "rich-text", value: "For more information e-mail us at education@arqum.org." },
              { id: "admin-email", label: "Contact Email", type: "text", value: "education@arqum.org" },
              { id: "admin-note", label: "Additional Note", type: "rich-text", value: "Information about the starting date of the school and the deadline for registration will be posted as soon as they are available." },
            ],
          };

          // Map existing data from Supabase into editor fields
          if (sectionsSource.intro?.data) {
            const introData = sectionsSource.intro.data as any;
            transformed.intro = [
              { id: "intro-title", label: "Title", type: "text", value: introData["intro-title"] || introData.introTitle || transformed.intro[0].value },
              { id: "intro-content", label: "Content", type: "rich-text", value: introData["intro-content"] || introData.introContent || transformed.intro[1].value },
            ];
          }

          if (sectionsSource.vision?.data) {
            const visionData = sectionsSource.vision.data as any;
            transformed.vision = [
              { id: "vision-title", label: "Section Title", type: "text", value: visionData["vision-title"] || visionData.visionTitle || transformed.vision[0].value },
              { id: "vision-content", label: "Content", type: "rich-text", value: visionData["vision-content"] || visionData.visionContent || transformed.vision[1].value },
            ];
          }

          if (sectionsSource.mission?.data) {
            const missionData = sectionsSource.mission.data as any;
            transformed.mission = [
              { id: "mission-title", label: "Section Title", type: "text", value: missionData["mission-title"] || missionData.missionTitle || transformed.mission[0].value },
              { id: "mission-content", label: "Content", type: "rich-text", value: missionData["mission-content"] || missionData.missionContent || transformed.mission[1].value },
            ];
          }

          if (sectionsSource.principal?.data) {
            const principalData = sectionsSource.principal.data as any;
            transformed.principal = [
              { id: "principal-title", label: "Section Title", type: "text", value: principalData["principal-title"] || principalData.principalTitle || transformed.principal[0].value },
              { id: "principal-content", label: "Content", type: "rich-text", value: principalData["principal-content"] || principalData.principalContent || transformed.principal[1].value },
              { id: "principal-pdf-link", label: "Principal Position PDF Link", type: "url", value: principalData["principal-pdf-link"] || principalData.principalPdfLink || transformed.principal[2].value },
              { id: "principal-email", label: "Contact Email", type: "text", value: principalData["principal-email"] || principalData.principalEmail || transformed.principal[3].value },
            ];
          }

          if (sectionsSource.administration?.data) {
            const adminData = sectionsSource.administration.data as any;
            transformed.administration = [
              { id: "admin-title", label: "Section Title", type: "text", value: adminData["admin-title"] || adminData.adminTitle || transformed.administration[0].value },
              { id: "admin-principal-label", label: "Principal Label", type: "text", value: adminData["admin-principal-label"] || adminData.adminPrincipalLabel || transformed.administration[1].value },
              { id: "admin-principal", label: "Principal Name", type: "text", value: adminData["admin-principal"] || adminData.adminPrincipal || transformed.administration[2].value },
              { id: "admin-info-text", label: "Info Text", type: "rich-text", value: adminData["admin-info-text"] || adminData.adminInfoText || transformed.administration[3].value },
              { id: "admin-email", label: "Contact Email", type: "text", value: adminData["admin-email"] || adminData.adminEmail || transformed.administration[4].value },
              { id: "admin-note", label: "Additional Note", type: "rich-text", value: adminData["admin-note"] || adminData.adminNote || transformed.administration[5].value },
            ];
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch islamic school data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchIslamicSchoolData();
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
        data[field.id] =
          typeof field.value === "string" ? field.value : "";
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
        } as IslamicSchoolSectionConfig,
      };

      const response = await fetch("/api/islamic-school/update-section", {
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
    { id: "intro", label: "Introduction", icon: "📝" },
    { id: "vision", label: "Vision", icon: "👁️" },
    { id: "mission", label: "Mission", icon: "🎯" },
    { id: "principal", label: "Principal Hiring", icon: "👔" },
    { id: "administration", label: "Administration", icon: "🏢" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      intro: "Introduction Section",
      vision: "Vision Section",
      mission: "Mission Section",
      principal: "Principal Hiring Section",
      administration: "Administration Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Islamic School Page"
      pageDescription="Edit all sections of the Islamic School page including hero, vision, mission, principal hiring, and administration."
    >
      <VisibilityToggle pageName="islamic-school" apiEndpoint="/api/islamic-school" />
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
                      folder="islamic-school"
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

