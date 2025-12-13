"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { AboutSectionConfig } from "@/lib/about.service";
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

export default function AboutPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    introduction: [
      { id: "intro-subtitle", label: "Section Subtitle", type: "text", value: "About Us" },
      { id: "intro-title", label: "Section Title", type: "text", value: "Welcome to Fort Dodge Islamic Center" },
      { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "The Fort Dodge Islamic Center is a non-profit organization founded in 2002 by Muslims to create a place for prayer, learning, and socialization. The center is a vibrant and welcoming community that is committed to providing resources and support for its members to live according to Islamic principles." },
      { id: "by-laws-text", label: "By Laws Notice Text", type: "rich-text", value: "You can find the \"By Laws\" under Resources > By Laws in the menu." },
      { id: "by-laws-link", label: "By Laws Link URL", type: "url", value: "https://drive.google.com/file/d/1xFQ6g0plhCzVIaCvglVPC1nykuICqRWL/view?usp=sharing" },
    ],
    programs: [
      { id: "programs-subtitle", label: "Section Subtitle", type: "text", value: "What We Offer" },
      { id: "programs-title", label: "Section Title", type: "text", value: "Programs and Services" },
      {
        id: "services",
        label: "Services",
        type: "array",
        value: [
          { title: "Five daily prayers", description: "Regular prayer services throughout the day" },
          { title: "Jummah prayer on Fridays", description: "Weekly congregational Friday prayers" },
          { title: "Islamic classes for children and adults", description: "Educational programs for all ages" },
          { title: "A library with books on Islam and other topics", description: "Extensive collection of Islamic literature and resources" },
          { title: "A community hall for events and gatherings", description: "Spacious facility for community activities" },
        ],
        arrayItemSchema: [
          { id: "title", label: "Service Title", type: "text" },
          { id: "description", label: "Service Description", type: "textarea" },
        ],
      },
    ],
    governance: [
      { id: "governance-subtitle", label: "Section Subtitle", type: "text", value: "Leadership" },
      { id: "governance-title", label: "Section Title", type: "text", value: "Governance Structure" },
      { id: "directors-title", label: "Board of Directors Title", type: "text", value: "Board of Directors" },
      { id: "directors-description", label: "Board of Directors Description", type: "rich-text", value: "Responsible for overall management and day-to-day operations of the center. The board of directors is elected annually and works diligently to ensure the center serves the community effectively." },
      { id: "trustees-title", label: "Board of Trustees Title", type: "text", value: "Board of Trustees" },
      { id: "trustees-description", label: "Board of Trustees Description", type: "rich-text", value: "Responsible for overseeing finances and assets of the center. The board of trustees is elected every two years and ensures the financial stability and long-term sustainability of the center." },
    ],
    boardDirectors: [
      { id: "directors-section-subtitle", label: "Section Subtitle", type: "text", value: "Our Leadership Team" },
      { id: "directors-section-title", label: "Section Title", type: "text", value: "Members of the Board of Directors" },
      {
        id: "board-members",
        label: "Board Members",
        type: "array",
        value: [
          { role: "Chair", name: "Br. Mahmoud Gshash", email: "chair@arqum.org" },
          { role: "Vice Chair", name: "Br. Shakil Ahmed", email: "vicechair@arqum.org" },
          { role: "Secretary", name: "Sr. Danielle Walsh", email: "secretary@arqum.org" },
          { role: "Treasurer", name: "Br. Umar Farooq", email: "treasurer@arqum.org" },
          { role: "Public Relations Liaison", name: "Br. Umar Farooq", email: "pr@arqum.org" },
          { role: "Religious Affairs Liaison", name: "Br. Yasir Idris", email: "religious@arqum.org" },
          { role: "Social Affairs Liaison", name: "Br. Kylie Anderson", email: "social@arqum.org" },
          { role: "Building & Property Liaison", name: "Br. Yassir Obeid", email: "building@arqum.org" },
          { role: "Education Liaison", name: "Br. Amir Abdelmawla", email: "education@arqum.org" },
          { role: "Women's Affairs Liaison", name: "Sr. Ayah Dajani", email: "sisters@arqum.org" },
          { role: "Member at-Large", name: "Br. Mohammed Soliman", email: "m.soliman@arqum.org" },
        ],
        arrayItemSchema: [
          { id: "role", label: "Role/Title", type: "text" },
          { id: "name", label: "Name", type: "text" },
          { id: "email", label: "Email", type: "text" },
        ],
      },
    ],
    boardTrustees: [
      { id: "trustees-section-subtitle", label: "Section Subtitle", type: "text", value: "Financial Oversight" },
      { id: "trustees-section-title", label: "Section Title", type: "text", value: "Members of the Board of Trustees" },
      {
        id: "trustees",
        label: "Trustees",
        type: "array",
        value: [
          { name: "Br. Salah Mahjoub" },
          { name: "Br. Ashfaq Khokhar" },
          { name: "Br. Saleem Baig" },
          { name: "Br. Hasan Basri" },
          { name: "Br. Ahmed Tamrawi" },
        ],
        arrayItemSchema: [
          { id: "name", label: "Trustee Name", type: "text" },
        ],
      },
    ],
    formation: [
      { id: "formation-subtitle", label: "Section Subtitle", type: "text", value: "Our Commitment" },
      { id: "formation-title", label: "Section Title", type: "text", value: "Formation of Board of Directors and Board of Trustees" },
      { id: "election-title", label: "Election Process Title", type: "text", value: "Election Process" },
      { id: "election-content", label: "Election Process Content", type: "rich-text", value: "The board of directors is elected annually, while the board of trustees is elected every two years. The board of directors is responsible for the overall management of the center, while the board of trustees is responsible for overseeing the finances and assets of the center." },
      { id: "volunteers-title", label: "Our Dedicated Volunteers Title", type: "text", value: "Our Dedicated Volunteers" },
      { id: "volunteers-content", label: "Our Dedicated Volunteers Content", type: "rich-text", value: "All members of the board of directors and board of trustees are volunteers who are passionate about serving the Muslim community. They bring a diverse range of skills and experience to the center, and they work together to make the center a vibrant and welcoming place for all members of the community. The board of directors and board of trustees play an essential role in the success of the center, and they are committed to providing leadership and guidance to ensure that the center continues to serve the Muslim community for years to come." },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("introduction");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchAboutData() {
      try {
        const response = await fetch("/api/about");
        const result = await response.json();

        if (result.ok && result.about?.data) {
          const data = result.about.data;

          // Support both shapes:
          // 1) { page, hero, ... }
          // 2) { page, data: { hero, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;

          const transformed = { ...sections };

          // Hero
          if (sectionsSource.hero?.data) {
            const heroData = sectionsSource.hero.data as any;
            transformed.hero = [
              {
                id: "hero-image",
                label: "Hero Image",
                type: "image",
                value:
                  heroData["hero-image"] ||
                  heroData.heroImage ||
                  transformed.hero[0].value,
              },
            ];
          }

          // Introduction
          if (sectionsSource.introduction?.data) {
            const intro = sectionsSource.introduction.data as any;
            transformed.introduction = transformed.introduction.map((field) => {
              switch (field.id) {
                case "intro-subtitle":
                  return {
                    ...field,
                    value: intro["intro-subtitle"] || intro.subtitle || field.value,
                  };
                case "intro-title":
                  return {
                    ...field,
                    value: intro["intro-title"] || intro.title || field.value,
                  };
                case "intro-content":
                  return {
                    ...field,
                    value: intro["intro-content"] || intro.content || field.value,
                  };
                case "by-laws-text":
                  return {
                    ...field,
                    value: intro["by-laws-text"] || intro.byLawsText || field.value,
                  };
                case "by-laws-link":
                  return {
                    ...field,
                    value: intro["by-laws-link"] || intro.byLawsLink || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Programs
          if (sectionsSource.programs?.data) {
            const p = sectionsSource.programs.data as any;
            transformed.programs = transformed.programs.map((field) => {
              switch (field.id) {
                case "programs-subtitle":
                  return {
                    ...field,
                    value: p["programs-subtitle"] || p.subtitle || field.value,
                  };
                case "programs-title":
                  return {
                    ...field,
                    value: p["programs-title"] || p.title || field.value,
                  };
                case "services":
                  return {
                    ...field,
                    value: Array.isArray(p.services) ? p.services : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Governance
          if (sectionsSource.governance?.data) {
            const g = sectionsSource.governance.data as any;
            transformed.governance = transformed.governance.map((field) => {
              switch (field.id) {
                case "governance-subtitle":
                  return {
                    ...field,
                    value: g["governance-subtitle"] || g.subtitle || field.value,
                  };
                case "governance-title":
                  return {
                    ...field,
                    value: g["governance-title"] || g.title || field.value,
                  };
                case "directors-title":
                  return {
                    ...field,
                    value: g["directors-title"] || g.directorsTitle || field.value,
                  };
                case "directors-description":
                  return {
                    ...field,
                    value: g["directors-description"] || g.directorsDescription || field.value,
                  };
                case "trustees-title":
                  return {
                    ...field,
                    value: g["trustees-title"] || g.trusteesTitle || field.value,
                  };
                case "trustees-description":
                  return {
                    ...field,
                    value: g["trustees-description"] || g.trusteesDescription || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Board Directors
          if (sectionsSource.boardDirectors?.data) {
            const bd = sectionsSource.boardDirectors.data as any;
            transformed.boardDirectors = transformed.boardDirectors.map((field) => {
              switch (field.id) {
                case "directors-section-subtitle":
                  return {
                    ...field,
                    value: bd["directors-section-subtitle"] || bd.subtitle || field.value,
                  };
                case "directors-section-title":
                  return {
                    ...field,
                    value: bd["directors-section-title"] || bd.title || field.value,
                  };
                case "board-members":
                  return {
                    ...field,
                    value: Array.isArray(bd["board-members"]) ? bd["board-members"] : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Board Trustees
          if (sectionsSource.boardTrustees?.data) {
            const bt = sectionsSource.boardTrustees.data as any;
            transformed.boardTrustees = transformed.boardTrustees.map((field) => {
              switch (field.id) {
                case "trustees-section-subtitle":
                  return {
                    ...field,
                    value: bt["trustees-section-subtitle"] || bt.subtitle || field.value,
                  };
                case "trustees-section-title":
                  return {
                    ...field,
                    value: bt["trustees-section-title"] || bt.title || field.value,
                  };
                case "trustees":
                  return {
                    ...field,
                    value: Array.isArray(bt.trustees) ? bt.trustees : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Formation
          if (sectionsSource.formation?.data) {
            const f = sectionsSource.formation.data as any;
            transformed.formation = transformed.formation.map((field) => {
              switch (field.id) {
                case "formation-subtitle":
                  return {
                    ...field,
                    value: f["formation-subtitle"] || f.subtitle || field.value,
                  };
                case "formation-title":
                  return {
                    ...field,
                    value: f["formation-title"] || f.title || field.value,
                  };
                case "election-title":
                  return {
                    ...field,
                    value: f["election-title"] || f.electionTitle || field.value,
                  };
                case "election-content":
                  return {
                    ...field,
                    value: f["election-content"] || f.electionContent || field.value,
                  };
                case "volunteers-title":
                  return {
                    ...field,
                    value: f["volunteers-title"] || f.volunteersTitle || field.value,
                  };
                case "volunteers-content":
                  return {
                    ...field,
                    value: f["volunteers-content"] || f.volunteersContent || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch about data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAboutData();
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
      introduction: (d) => ({
        subtitle: d["intro-subtitle"] || "",
        title: d["intro-title"] || "",
        content: d["intro-content"] || "",
        byLawsText: d["by-laws-text"] || "",
        byLawsLink: d["by-laws-link"] || "",
      }),
      programs: (d) => ({
        subtitle: d["programs-subtitle"] || "",
        title: d["programs-title"] || "",
        services: Array.isArray(d.services) ? d.services : [],
      }),
      governance: (d) => ({
        subtitle: d["governance-subtitle"] || "",
        title: d["governance-title"] || "",
        directorsTitle: d["directors-title"] || "",
        directorsDescription: d["directors-description"] || "",
        trusteesTitle: d["trustees-title"] || "",
        trusteesDescription: d["trustees-description"] || "",
      }),
      boardDirectors: (d) => ({
        subtitle: d["directors-section-subtitle"] || "",
        title: d["directors-section-title"] || "",
        "board-members": Array.isArray(d["board-members"]) ? d["board-members"] : [],
      }),
      boardTrustees: (d) => ({
        subtitle: d["trustees-section-subtitle"] || "",
        title: d["trustees-section-title"] || "",
        trustees: Array.isArray(d.trustees) ? d.trustees : [],
      }),
      formation: (d) => ({
        subtitle: d["formation-subtitle"] || "",
        title: d["formation-title"] || "",
        electionTitle: d["election-title"] || "",
        electionContent: d["election-content"] || "",
        volunteersTitle: d["volunteers-title"] || "",
        volunteersContent: d["volunteers-content"] || "",
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
        } as AboutSectionConfig,
      };

      const response = await fetch("/api/about/update-section", {
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
    { id: "introduction", label: "Introduction", icon: "📝" },
    { id: "programs", label: "Programs & Services", icon: "🕌" },
    { id: "governance", label: "Governance Structure", icon: "🏛️" },
    { id: "boardDirectors", label: "Board of Directors", icon: "👥" },
    { id: "boardTrustees", label: "Board of Trustees", icon: "💼" },
    { id: "formation", label: "Formation", icon: "📋" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      introduction: "Introduction Section",
      programs: "Programs & Services Section",
      governance: "Governance Structure Section",
      boardDirectors: "Board of Directors Section",
      boardTrustees: "Board of Trustees Section",
      formation: "Formation Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit About Page"
      pageDescription="Edit all sections of the about page including introduction, programs, governance, and board information."
    >
      <VisibilityToggle pageName="about" apiEndpoint="/api/about" />
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
              {activeTab === "introduction" && (
                <SectionEditor
                  sectionId="introduction"
                  sectionTitle={getSectionTitle("introduction")}
                  fields={sections.introduction}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("introduction")}
                  saving={saving["introduction"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="about"
                />
              )}

              {activeTab === "programs" && (
                <SectionEditor
                  sectionId="programs"
                  sectionTitle={getSectionTitle("programs")}
                  fields={sections.programs}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("programs")}
                  saving={saving["programs"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="about"
                />
              )}

              {activeTab === "governance" && (
                <SectionEditor
                  sectionId="governance"
                  sectionTitle={getSectionTitle("governance")}
                  fields={sections.governance}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("governance")}
                  saving={saving["governance"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="about"
                />
              )}

              {activeTab === "boardDirectors" && (
                <SectionEditor
                  sectionId="boardDirectors"
                  sectionTitle={getSectionTitle("boardDirectors")}
                  fields={sections.boardDirectors}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("boardDirectors")}
                  saving={saving["boardDirectors"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="about"
                />
              )}

              {activeTab === "boardTrustees" && (
                <SectionEditor
                  sectionId="boardTrustees"
                  sectionTitle={getSectionTitle("boardTrustees")}
                  fields={sections.boardTrustees}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("boardTrustees")}
                  saving={saving["boardTrustees"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="about"
                />
              )}

              {activeTab === "formation" && (
                <SectionEditor
                  sectionId="formation"
                  sectionTitle={getSectionTitle("formation")}
                  fields={sections.formation}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("formation")}
                  saving={saving["formation"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="about"
                />
              )}
            </>
          )}
        </div>
      </div>
    </PageEditorLayout>
  );
}

