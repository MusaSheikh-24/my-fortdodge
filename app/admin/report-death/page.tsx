"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { ReportDeathSectionConfig } from "@/lib/report-death.service";
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

export default function ReportDeathPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    intro: [
      { id: "intro-subtitle", label: "Section Subtitle", type: "text", value: "Fort Dodge Islamic Center" },
      { id: "intro-title", label: "Section Title", type: "text", value: "Report a Death" },
      { id: "intro-quote", label: "Quran Quote", type: "rich-text", value: "Every soul will taste death, and you will only be given your (full) compensation on the Day of Resurrection. So the one who is drawn away from the Fire and admitted to Paradise has attained (his desire); and what is the life of this world except the enjoyment of delusion." },
      { id: "intro-quote-reference", label: "Quote Reference", type: "text", value: "Quran 3:185" },
      { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "It is requested that Muslims become familiar with these issues at all times since death can approach anyone at any given time or place." },
    ],
    guidance: [
      { id: "dying-title", label: "When a Muslim Is Dying - Title", type: "text", value: "When a Muslim Is Dying" },
      {
        id: "dying-guidance",
        label: "Dying Guidance Items",
        type: "array",
        value: [
          { text: "It is recommended by the Prophet Muhammad (S.A.W.) to do the following:" },
          { text: "The dying person should be asked to pronounce, \"Laa ilaaha illal Lah.\" (There is no God but Allah.) before death. The Prophet Muhammad (S.A.W.) said: \"Ask your dying fellows to pronounce, 'Laa ilaaha illal Lah.' (There is no God but Allah.)\" [Reported by Imams Muslim, Abu Dawood, At-Tirmithi, An-Nisa'I and Ibn Majah]" },
          { text: "The Prophet Muhammad (S.A.W.) also said: \"The one whose last words are 'Laa Ilaaha Illal Lah.' (There is no God but Allah) will enter Paradise.\" [Reported by Imams Abu Dawood]" },
        ],
        arrayItemSchema: [
          { id: "text", label: "Guidance Text", type: "textarea" },
        ],
      },
      { id: "death-title", label: "When a Muslim Has Died - Title", type: "text", value: "When a Muslim Has Died" },
      {
        id: "death-steps",
        label: "Death Steps",
        type: "array",
        value: [
          { text: "Close the eyes of the deceased. The Messenger of Allah (S.A.W.) visited Abu Salama after he died and found his eyes open, so he closed them and said, \"When the soul is taken away the eyesight follows it.\" [Reported by Imam Muslim]" },
          { text: "Bind the lower jaw so it is held and does not sag." },
          { text: "Cover the body completely with a clean sheet. The Prophet Muhammad (S.A.W.) was wrapped with a striped cloth upon his death. [Reported by Imams Bukhari and Muslim]" },
          { text: "Make dua to Allah to forgive the deceased." },
          { text: "Hasten to prepare the body for washing, shrouding, and burial." },
          { text: "Pay the deceased's debts from their money. If there is not enough, family members should cover it. The Prophet Muhammad (S.A.W.) said: \"The believer's soul is attached to his debt until it is paid.\" [Reported by Imams Ahmad, Ibn Majah, and At-Tirmithi]" },
        ],
        arrayItemSchema: [
          { id: "text", label: "Step Text", type: "textarea" },
        ],
      },
    ],
    procedure: [
      { id: "procedure-title", label: "Section Title", type: "text", value: "Procedure" },
      { id: "procedure-description", label: "Procedure Description", type: "rich-text", value: "Preparing the dead for burial is a Farḍ Kifayah duty, meaning that if some Muslims properly carry out this duty, others are exempt. The process includes bathing the deceased, wrapping the body with a shroud, praying, and burying the body. At Fort Dodge Islamic Center, the Cemetery and Burial Committee coordinates arrangements in consultation with the family." },
      { id: "contact-name", label: "Contact Person Name", type: "text", value: "Br. Yassir Obeid" },
      { id: "contact-phone", label: "Contact Phone Number", type: "text", value: "(515) 441-1918" },
      { id: "funeral-home-name", label: "Funeral Home Name", type: "text", value: "Adams Funeral Home in Ames" },
      { id: "funeral-home-phone", label: "Funeral Home Phone", type: "text", value: "(515) 232-5121" },
      { id: "funeral-home-address", label: "Funeral Home Address", type: "text", value: "502 Douglas Ave, Ames, IA" },
      {
        id: "information-needed",
        label: "Information Needed by Funeral Director",
        type: "array",
        value: [
          { text: "The caller's name and phone number" },
          { text: "Name and location of deceased" },
          { text: "Birth date and date of death" },
          { text: "If hospice/doctor has been notified" },
        ],
        arrayItemSchema: [
          { id: "text", label: "Information Item", type: "text" },
        ],
      },
      {
        id: "funeral-services",
        label: "Services Provided by Funeral Home",
        type: "array",
        value: [
          { text: "Transferring the deceased from the hospital to the funeral home" },
          { text: "Use of bathing room facilities for washing the deceased" },
          { text: "Casket for transporting the deceased" },
          { text: "Funeral van for one day" },
        ],
        arrayItemSchema: [
          { id: "text", label: "Service Description", type: "text" },
        ],
      },
      { id: "ritual-bathing-note", label: "Ritual Bathing Note", type: "rich-text", value: "The ritual bathing and preparation of the body is done by Muslim Brother(s)/Sister(s) in conjunction with a funeral home. Men for the men and women for the women. It is permissible for either spouse to wash the other after death." },
      { id: "janazah-note", label: "Janazah Prayer Note", type: "rich-text", value: "The funeral director and staff will take the deceased to the masjid for the Janazah Prayer then to the cemetery for the burial." },
      { id: "payment-note", label: "Payment Note", type: "rich-text", value: "Approximate cost of burial (may change) [See below]. Make checks payable to Fort Dodge Islamic Center for the total cost of burial." },
      { id: "source", label: "Source", type: "text", value: "Authentic Step by Step Illustrated Janazah Guide" },
    ],
    costBreakdown: [
      { id: "cost-title", label: "Section Title", type: "text", value: "Approximate Costs" },
      { id: "cost-note", label: "Payment Note", type: "text", value: "Make the cashier's check payable to Fort Dodge Islamic Center." },
      {
        id: "costs-table",
        label: "Cost Breakdown Table",
        type: "table",
        value: [
          { item: "Cost of Gravesite", cost: "*FREE" },
          { item: "Washing the body", cost: "FREE" },
          { item: "Burial kit, Wood", cost: "$100" },
          { item: "Opening and closing the grave", cost: "$1000 - $1200" },
          { item: "Funeral Home (see services description above)", cost: "$3250" },
        ],
        tableColumns: [
          { id: "item", label: "Items" },
          { id: "cost", label: "Cost" },
        ],
      },
      { id: "total-label", label: "Total Label", type: "text", value: "Total costs for burial in the Sunset Gardens Islamic Cemetery" },
      { id: "total-cost", label: "Total Cost", type: "text", value: "$3600 - $4850" },
      { id: "non-resident-note", label: "Non-Resident Note", type: "text", value: "*There is an additional charge of $350 for non-residents of Ames." },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchReportDeathData() {
      try {
        const response = await fetch("/api/report-death");
        const result = await response.json();

        if (result.ok && result.reportDeath?.data) {
          const data = result.reportDeath.data;

          // Support both shapes:
          // 1) { page, hero, ... }
          // 2) { page, data: { hero, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;

          const transformed = { ...sections };

          if (sectionsSource.intro?.data) {
            const intro = sectionsSource.intro.data as any;
            transformed.intro = transformed.intro.map((field) => {
              switch (field.id) {
                case "intro-subtitle":
                  return {
                    ...field,
                    value:
                      intro["intro-subtitle"] ||
                      intro.subtitle ||
                      field.value,
                  };
                case "intro-title":
                  return {
                    ...field,
                    value: intro["intro-title"] || intro.title || field.value,
                  };
                case "intro-quote":
                  return {
                    ...field,
                    value: intro["intro-quote"] || intro.quote || field.value,
                  };
                case "intro-quote-reference":
                  return {
                    ...field,
                    value:
                      intro["intro-quote-reference"] ||
                      intro.quoteReference ||
                      field.value,
                  };
                case "intro-content":
                  return {
                    ...field,
                    value:
                      intro["intro-content"] ||
                      intro.content ||
                      field.value,
                  };
                default:
                  return field;
              }
            });
          }

          if (sectionsSource.guidance?.data) {
            const g = sectionsSource.guidance.data as any;
            transformed.guidance = transformed.guidance.map((field) => {
              switch (field.id) {
                case "dying-title":
                  return {
                    ...field,
                    value: g["dying-title"] || g.dyingTitle || field.value,
                  };
                case "dying-guidance":
                  return {
                    ...field,
                    value: Array.isArray(g["dying-guidance"])
                      ? g["dying-guidance"]
                      : field.value,
                  };
                case "death-title":
                  return {
                    ...field,
                    value: g["death-title"] || g.deathTitle || field.value,
                  };
                case "death-steps":
                  return {
                    ...field,
                    value: Array.isArray(g["death-steps"])
                      ? g["death-steps"]
                      : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          if (sectionsSource.procedure?.data) {
            const p = sectionsSource.procedure.data as any;
            transformed.procedure = transformed.procedure.map((field) => {
              switch (field.id) {
                case "procedure-title":
                  return {
                    ...field,
                    value:
                      p["procedure-title"] ||
                      p.title ||
                      field.value,
                  };
                case "procedure-description":
                  return {
                    ...field,
                    value:
                      p["procedure-description"] ||
                      p.description ||
                      field.value,
                  };
                case "contact-name":
                  return {
                    ...field,
                    value: p["contact-name"] || p.contactName || field.value,
                  };
                case "contact-phone":
                  return {
                    ...field,
                    value:
                      p["contact-phone"] ||
                      p.contactPhone ||
                      field.value,
                  };
                case "funeral-home-name":
                  return {
                    ...field,
                    value:
                      p["funeral-home-name"] ||
                      p.funeralHomeName ||
                      field.value,
                  };
                case "funeral-home-phone":
                  return {
                    ...field,
                    value:
                      p["funeral-home-phone"] ||
                      p.funeralHomePhone ||
                      field.value,
                  };
                case "funeral-home-address":
                  return {
                    ...field,
                    value:
                      p["funeral-home-address"] ||
                      p.funeralHomeAddress ||
                      field.value,
                  };
                case "information-needed":
                  return {
                    ...field,
                    value: Array.isArray(p["information-needed"])
                      ? p["information-needed"]
                      : field.value,
                  };
                case "funeral-services":
                  return {
                    ...field,
                    value: Array.isArray(p["funeral-services"])
                      ? p["funeral-services"]
                      : field.value,
                  };
                case "ritual-bathing-note":
                  return {
                    ...field,
                    value:
                      p["ritual-bathing-note"] ||
                      p.ritualBathingNote ||
                      field.value,
                  };
                case "janazah-note":
                  return {
                    ...field,
                    value:
                      p["janazah-note"] ||
                      p.janazahNote ||
                      field.value,
                  };
                case "payment-note":
                  return {
                    ...field,
                    value:
                      p["payment-note"] ||
                      p.paymentNote ||
                      field.value,
                  };
                case "source":
                  return {
                    ...field,
                    value: p["source"] || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          if (sectionsSource.costBreakdown?.data) {
            const c = sectionsSource.costBreakdown.data as any;
            transformed.costBreakdown = transformed.costBreakdown.map(
              (field) => {
                switch (field.id) {
                  case "cost-title":
                    return {
                      ...field,
                      value:
                        c["cost-title"] ||
                        c.title ||
                        field.value,
                    };
                  case "cost-note":
                    return {
                      ...field,
                      value:
                        c["cost-note"] ||
                        c.note ||
                        field.value,
                    };
                  case "costs-table":
                    return {
                      ...field,
                      value: Array.isArray(c["costs-table"])
                        ? c["costs-table"]
                        : field.value,
                    };
                  case "total-label":
                    return {
                      ...field,
                      value:
                        c["total-label"] ||
                        c.totalLabel ||
                        field.value,
                    };
                  case "total-cost":
                    return {
                      ...field,
                      value:
                        c["total-cost"] ||
                        c.totalCost ||
                        field.value,
                    };
                  case "non-resident-note":
                    return {
                      ...field,
                      value:
                        c["non-resident-note"] ||
                        c.nonResidentNote ||
                        field.value,
                    };
                  default:
                    return field;
                }
              }
            );
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch report-death data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReportDeathData();
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
        } as ReportDeathSectionConfig,
      };

      const response = await fetch("/api/report-death/update-section", {
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
    { id: "guidance", label: "Guidance", icon: "📖" },
    { id: "procedure", label: "Procedure", icon: "📋" },
    { id: "costBreakdown", label: "Cost Breakdown", icon: "💰" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      intro: "Introduction Section",
      guidance: "Guidance Section",
      procedure: "Procedure Section",
      costBreakdown: "Cost Breakdown Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Report a Death Page"
      pageDescription="Edit all sections of the report a death page including hero, introduction, guidance, procedure, and cost breakdown."
    >
      <VisibilityToggle pageName="report-death" apiEndpoint="/api/report-death" />
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
              {activeTab === "intro" && (
                <SectionEditor
                  sectionId="intro"
                  sectionTitle={getSectionTitle("intro")}
                  fields={sections.intro}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("intro")}
                  saving={saving["intro"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "guidance" && (
                <SectionEditor
                  sectionId="guidance"
                  sectionTitle={getSectionTitle("guidance")}
                  fields={sections.guidance}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("guidance")}
                  saving={saving["guidance"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "procedure" && (
                <SectionEditor
                  sectionId="procedure"
                  sectionTitle={getSectionTitle("procedure")}
                  fields={sections.procedure}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("procedure")}
                  saving={saving["procedure"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "costBreakdown" && (
                <SectionEditor
                  sectionId="costBreakdown"
                  sectionTitle={getSectionTitle("costBreakdown")}
                  fields={sections.costBreakdown}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("costBreakdown")}
                  saving={saving["costBreakdown"] || false}
                  alwaysExpanded={true}
                />
              )}
            </>
          )}
        </div>
      </div>
    </PageEditorLayout>
  );
}

