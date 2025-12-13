"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { IslamicPrayerSectionConfig } from "@/lib/islamic-prayer.service";
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

export default function IslamicPrayerPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    intro: [
      { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "Muslims pray five times a day. The salah (Arabic word for prayer) generally lasts five to ten minutes and is led by the Imam. He leads the congregation from the front and faces towards the direction of Makkah, as does the rest of the congregation. The congregation will form straight lines and act in unison during the entire prayer and follow the motions of the Imam. Here are translations to what's being said during salah:" },
    ],
    standing: [
      { id: "standing-title", label: "Section Title", type: "text", value: "WHILE STANDING" },
      { id: "standing-intro", label: "Introduction", type: "rich-text", value: "While standing, the first chapter of the Quran is recited. This chapter can be translated as follows:" },
      { id: "standing-quote", label: "Quote/Translation", type: "rich-text", value: "\"In the name of Allah, Most Gracious, Most Merciful. Praise be to Allah, Lord of the Worlds. Most Gracious, Most Merciful. Master of the Day of Judgment. Thee (alone) we worship and Thee (alone) we ask for help. Show us the straight path. The path of those whom Thou hast favoured; Not (the path) of those who earn Thine anger nor of those who go astray.\" (1:1-7)" },
      { id: "standing-outro", label: "Outro", type: "rich-text", value: "After the first chapter, any other passage from the Quran is recited. Depending on the time (and type) of the prayers, some recitations are done silently." },
    ],
    bowing: [
      { id: "bowing-title", label: "Section Title", type: "text", value: "WHILE BOWING" },
      { id: "bowing-content", label: "Content", type: "rich-text", value: "Muslims then bow to God and glorify Him. This glorification can be translated as follows: \"Glory be to my Lord, the Almighty.\"" },
    ],
    prostrating: [
      { id: "prostrating-title", label: "Section Title", type: "text", value: "WHILE PROSTRATING" },
      { id: "prostrating-quote", label: "Quote/Translation", type: "rich-text", value: "\"Glory be to my Lord, the most High.\"" },
      { id: "prostrating-content", label: "Content", type: "rich-text", value: "Muslims then sit for a few seconds and prostrate one more time before standing up again. Depending on the time (and type) of the prayer, Muslims repeat this cycle once, twice or thrice in each prayer." },
    ],
    sitting: [
      { id: "sitting-title", label: "Section Title", type: "text", value: "WHILE SITTING" },
      { id: "sitting-intro", label: "Introduction", type: "rich-text", value: "In the end (and also in the middle for some prayers) Muslims sit and testify before God that:" },
      { id: "sitting-quote", label: "Quote/Translation", type: "rich-text", value: "\"All service is for Allah and all acts of worship and good deeds are for Him. Peace and the mercy and blessings of Allah be upon you O Prophet. Peace be upon us and all of Allah's righteous slaves. I bear witness that none has the right to be worshipped except Allah and I bear witness that Muhammad is His slave and Messenger. O Allah exalt Muhammad and the followers of Muhammad, just as you exalted Abraham and the followers of Abraham. Verily you are full of praise and majesty. O Allah send blessings on Muhammad and the family of Muhammad, just as you sent blessings on Abraham and upon the followers of Abraham. Verily you are full of praise and majesty.\"" },
      { id: "sitting-outro", label: "Outro", type: "rich-text", value: "At the very end, Muslims turn their face to the right and the left, sending God's Peace on the angels surrounding them, saying: \"Peace be upon you and the mercy of Allah\"" },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchIslamicPrayerData() {
      try {
        const response = await fetch("/api/islamic-prayer");
        const result = await response.json();

        if (result.ok && result.islamicPrayer?.data) {
          const data = result.islamicPrayer.data;

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
              { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "Muslims pray five times a day. The salah (Arabic word for prayer) generally lasts five to ten minutes and is led by the Imam. He leads the congregation from the front and faces towards the direction of Makkah, as does the rest of the congregation. The congregation will form straight lines and act in unison during the entire prayer and follow the motions of the Imam. Here are translations to what's being said during salah:" },
            ],
            standing: [
              { id: "standing-title", label: "Section Title", type: "text", value: "WHILE STANDING" },
              { id: "standing-intro", label: "Introduction", type: "rich-text", value: "While standing, the first chapter of the Quran is recited. This chapter can be translated as follows:" },
              { id: "standing-quote", label: "Quote/Translation", type: "rich-text", value: "\"In the name of Allah, Most Gracious, Most Merciful. Praise be to Allah, Lord of the Worlds. Most Gracious, Most Merciful. Master of the Day of Judgment. Thee (alone) we worship and Thee (alone) we ask for help. Show us the straight path. The path of those whom Thou hast favoured; Not (the path) of those who earn Thine anger nor of those who go astray.\" (1:1-7)" },
              { id: "standing-outro", label: "Outro", type: "rich-text", value: "After the first chapter, any other passage from the Quran is recited. Depending on the time (and type) of the prayers, some recitations are done silently." },
            ],
            bowing: [
              { id: "bowing-title", label: "Section Title", type: "text", value: "WHILE BOWING" },
              { id: "bowing-content", label: "Content", type: "rich-text", value: "Muslims then bow to God and glorify Him. This glorification can be translated as follows: \"Glory be to my Lord, the Almighty.\"" },
            ],
            prostrating: [
              { id: "prostrating-title", label: "Section Title", type: "text", value: "WHILE PROSTRATING" },
              { id: "prostrating-quote", label: "Quote/Translation", type: "rich-text", value: "\"Glory be to my Lord, the most High.\"" },
              { id: "prostrating-content", label: "Content", type: "rich-text", value: "Muslims then sit for a few seconds and prostrate one more time before standing up again. Depending on the time (and type) of the prayer, Muslims repeat this cycle once, twice or thrice in each prayer." },
            ],
            sitting: [
              { id: "sitting-title", label: "Section Title", type: "text", value: "WHILE SITTING" },
              { id: "sitting-intro", label: "Introduction", type: "rich-text", value: "In the end (and also in the middle for some prayers) Muslims sit and testify before God that:" },
              { id: "sitting-quote", label: "Quote/Translation", type: "rich-text", value: "\"All service is for Allah and all acts of worship and good deeds are for Him. Peace and the mercy and blessings of Allah be upon you O Prophet. Peace be upon us and all of Allah's righteous slaves. I bear witness that none has the right to be worshipped except Allah and I bear witness that Muhammad is His slave and Messenger. O Allah exalt Muhammad and the followers of Muhammad, just as you exalted Abraham and the followers of Abraham. Verily you are full of praise and majesty. O Allah send blessings on Muhammad and the family of Muhammad, just as you sent blessings on Abraham and upon the followers of Abraham. Verily you are full of praise and majesty.\"" },
              { id: "sitting-outro", label: "Outro", type: "rich-text", value: "At the very end, Muslims turn their face to the right and the left, sending God's Peace on the angels surrounding them, saying: \"Peace be upon you and the mercy of Allah\"" },
            ],
          };

          // Map existing data from Supabase into editor fields
          if (sectionsSource.intro?.data) {
            const introData = sectionsSource.intro.data as any;
            transformed.intro = [
              { id: "intro-content", label: "Introduction Content", type: "rich-text", value: introData["intro-content"] || introData.introContent || transformed.intro[0].value },
            ];
          }

          if (sectionsSource.standing?.data) {
            const standingData = sectionsSource.standing.data as any;
            transformed.standing = [
              { id: "standing-title", label: "Section Title", type: "text", value: standingData["standing-title"] || standingData.standingTitle || transformed.standing[0].value },
              { id: "standing-intro", label: "Introduction", type: "rich-text", value: standingData["standing-intro"] || standingData.standingIntro || transformed.standing[1].value },
              { id: "standing-quote", label: "Quote/Translation", type: "rich-text", value: standingData["standing-quote"] || standingData.standingQuote || transformed.standing[2].value },
              { id: "standing-outro", label: "Outro", type: "rich-text", value: standingData["standing-outro"] || standingData.standingOutro || transformed.standing[3].value },
            ];
          }

          if (sectionsSource.bowing?.data) {
            const bowingData = sectionsSource.bowing.data as any;
            transformed.bowing = [
              { id: "bowing-title", label: "Section Title", type: "text", value: bowingData["bowing-title"] || bowingData.bowingTitle || transformed.bowing[0].value },
              { id: "bowing-content", label: "Content", type: "rich-text", value: bowingData["bowing-content"] || bowingData.bowingContent || transformed.bowing[1].value },
            ];
          }

          if (sectionsSource.prostrating?.data) {
            const prostratingData = sectionsSource.prostrating.data as any;
            transformed.prostrating = [
              { id: "prostrating-title", label: "Section Title", type: "text", value: prostratingData["prostrating-title"] || prostratingData.prostratingTitle || transformed.prostrating[0].value },
              { id: "prostrating-quote", label: "Quote/Translation", type: "rich-text", value: prostratingData["prostrating-quote"] || prostratingData.prostratingQuote || transformed.prostrating[1].value },
              { id: "prostrating-content", label: "Content", type: "rich-text", value: prostratingData["prostrating-content"] || prostratingData.prostratingContent || transformed.prostrating[2].value },
            ];
          }

          if (sectionsSource.sitting?.data) {
            const sittingData = sectionsSource.sitting.data as any;
            transformed.sitting = [
              { id: "sitting-title", label: "Section Title", type: "text", value: sittingData["sitting-title"] || sittingData.sittingTitle || transformed.sitting[0].value },
              { id: "sitting-intro", label: "Introduction", type: "rich-text", value: sittingData["sitting-intro"] || sittingData.sittingIntro || transformed.sitting[1].value },
              { id: "sitting-quote", label: "Quote/Translation", type: "rich-text", value: sittingData["sitting-quote"] || sittingData.sittingQuote || transformed.sitting[2].value },
              { id: "sitting-outro", label: "Outro", type: "rich-text", value: sittingData["sitting-outro"] || sittingData.sittingOutro || transformed.sitting[3].value },
            ];
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch islamic prayer data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchIslamicPrayerData();
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
        } as IslamicPrayerSectionConfig,
      };

      const response = await fetch("/api/islamic-prayer/update-section", {
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
    { id: "standing", label: "While Standing", icon: "🧍" },
    { id: "bowing", label: "While Bowing", icon: "🙇" },
    { id: "prostrating", label: "While Prostrating", icon: "🤲" },
    { id: "sitting", label: "While Sitting", icon: "🧘" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      intro: "Introduction Section",
      standing: "While Standing Section",
      bowing: "While Bowing Section",
      prostrating: "While Prostrating Section",
      sitting: "While Sitting Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Islamic Prayer Page"
      pageDescription="Edit all sections of the Islamic Prayer page including hero, introduction, and prayer postures."
    >
      <VisibilityToggle pageName="islamic-prayer" apiEndpoint="/api/islamic-prayer" />
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
                      folder="islamic-prayer"
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
