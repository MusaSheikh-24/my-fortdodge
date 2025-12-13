"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { NewMuslimSectionConfig } from "@/lib/new-muslim.service";
import { toast } from "@/app/components/Toaster";

type SectionField = {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "image"
    | "rich-text"
    | "url"
    | "time"
    | "array"
    | "table";
  value: string | any[];
  placeholder?: string;
  arrayItemSchema?: { id: string; label: string; type: string }[];
  tableColumns?: { id: string; label: string }[];
};

export default function NewMuslimPageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    journeyIntro: [
      { id: "intro-subtitle", label: "Section Subtitle", type: "text", value: "Fort Dodge Islamic Center" },
      { id: "intro-title", label: "Section Title", type: "text", value: "Welcome to Your Islamic Journey" },
      { id: "intro-quote", label: "Quote", type: "textarea", value: "Whoever follows a path in the pursuit of knowledge, Allah will make a path to Paradise easy for him." },
      { id: "intro-quote-source", label: "Quote Source", type: "text", value: "(Bukhaari)" },
      { id: "intro-content-1", label: "Introduction Content - Paragraph 1", type: "rich-text", value: "It is our pleasure to accompany you on this important path to deepening your knowledge of Islam. The Prophet Muhammad (peace and blessings be upon him) emphasized that seeking knowledge is a fundamental duty for every Muslim, and that the scholars are the heirs of the Prophets—passing on the priceless inheritance of guidance." },
      { id: "intro-content-2", label: "Introduction Content - Paragraph 2", type: "rich-text", value: "To assist you on this journey, we have compiled authentic resources rooted in the Quran—the word of Allah—and the Sunnah, the example of Prophet Muhammad (peace be upon him). Become familiar with these essentials as you continue to nurture your faith and understanding." },
    ],
    foundations: [
      { id: "foundations-subtitle", label: "Section Subtitle", type: "text", value: "The Foundations" },
      { id: "foundations-title", label: "Section Title", type: "text", value: "Build steady knowledge roots" },
      { id: "foundations-description", label: "Section Description", type: "rich-text", value: "Start with reliable resources covering the Quran, the Sunnah, and the shining example of Prophet Muhammad ﷺ." },
      {
        id: "quranic-resources",
        label: "Quranic Resources",
        type: "array",
        value: [
          {
            title: "The Clear Quran by Dr. Mustafa Khattab",
            webUrl: "https://online.theclearquran.org/surah",
            mobileUrl: "https://theclearquran.org/tcq-app/",
            description: "",
          },
          {
            title: "Quran translation",
            webUrl: "http://www.islamicstudies.info/quran/saheeh/",
            mobileUrl: "",
            description: "",
          },
          {
            title: "An annotated linguistic resource which shows the Arabic grammar, syntax, and morphology for each word in the Holy Quran",
            webUrl: "http://corpus.quran.com/wordbyword.jsp",
            mobileUrl: "",
            description: "",
          },
          {
            title: "Quran recitation/memorizing – various reciters",
            webUrl: "https://quranexplorer.com",
            mobileUrl: "",
            description: "",
          },
        ],
        arrayItemSchema: [
          { id: "title", label: "Resource Title", type: "text" },
          { id: "webUrl", label: "Web URL", type: "url" },
          { id: "mobileUrl", label: "Mobile App URL (optional)", type: "url" },
          { id: "description", label: "Description (optional)", type: "rich-text" },
        ],
      },
      {
        id: "sunnah-resources",
        label: "Sunnah Resources",
        type: "array",
        value: [
          {
            title: "The Sealed Nectar [PDF]– book on the biography of the Prophet",
            url: "",
            description: "",
          },
          {
            title: "Riyad us Saleheen",
            url: "https://sunnah.com/riyadussalihin",
            description: "A comprehensive list of says of the Prophet",
          },
        ],
        arrayItemSchema: [
          { id: "title", label: "Resource Title", type: "text" },
          { id: "url", label: "URL (optional)", type: "url" },
          { id: "description", label: "Description (optional)", type: "rich-text" },
        ],
      },
    ],
    support: [
      { id: "support-subtitle", label: "Learning and Support Subtitle", type: "text", value: "Learning and Support" },
      {
        id: "support-items",
        label: "Support Items",
        type: "array",
        value: [
          {
            title: "24-Hour Hotline for Non-Muslims and New Muslims",
            phone: "1-800-662-ISLAM (4752)",
            url: "",
            description: "",
          },
          {
            title: "New Muslim Academy",
            phone: "",
            url: "https://www.newmuslimacademy.org/",
            description: "Andrew's story (YouTube Video) New Muslim Academy is an online platform designed to support new Muslims in learning about their faith. It offers free access to structured video classes, webinars, and live interactions with qualified mentors and instructors.",
          },
          {
            title: "Zad Academy Program",
            phone: "",
            url: "https://zad-academy.com/en",
            description: "Embark on a 2-year learning journey with free online program. Learn the core principles, beliefs, and teachings of Islam taught by renowned scholars, all from the comfort of your own home.",
          },
        ],
        arrayItemSchema: [
          { id: "title", label: "Title", type: "text" },
          { id: "phone", label: "Phone Number (optional)", type: "text" },
          { id: "url", label: "URL (optional)", type: "url" },
          { id: "description", label: "Description (optional)", type: "textarea" },
        ],
      },
      { id: "community-subtitle", label: "Connect with Community Subtitle", type: "text", value: "Connect with your community" },
      { id: "community-text", label: "Community Text", type: "rich-text", value: "Find a local mosque near you using The Islamic Finder (https://www.islamicfinder.org/)." },
    ],
    resources: [
      { id: "resources-subtitle", label: "Section Subtitle", type: "text", value: "Resources on Islam" },
      { id: "resources-title", label: "Section Title", type: "text", value: "Study, review, and grow with confidence" },
      {
        id: "resource-items",
        label: "Resource Items",
        type: "array",
        value: [
          {
            title: "The New Muslim Guide",
            pdfUrl: "https://www.newmuslimguide.com/en/download/",
            hardCopyUrl: "https://www.newmuslimguide.com/en/order/",
            wikiUrl: "",
            description: "Simple rules and important Islamic guidelines for new Muslims in all aspects of life. This exquisitely illustrated guide presents you with the first step and the foundation stage in learning about this great religion, which is undoubtedly the best blessing Allah has bestowed on upon man.",
          },
          {
            title: "Tell Me How To Pray",
            pdfUrl: "https://www.newmuslimguide.com/en/wp-content/uploads/2020/10/Tell-Me-How-to-Pray.pdf",
            hardCopyUrl: "https://www.newmuslimguide.com/en/order/",
            wikiUrl: "https://en.wikipedia.org/wiki/Salah",
            description: "Learn the basics of praying, from making wudu to positioning your hands in prayer. The basics are covered for you in this detailed guide so that you can gain a better understanding.",
          },
          {
            title: "Tell Me About Allah",
            pdfUrl: "",
            hardCopyUrl: "https://www.newmuslimguide.com/en/order/",
            wikiUrl: "",
            description: "This little gem of a book guides you through all the 99 of Allah (SWT) so you can get to know Allah (SWT) In sha Allah.",
          },
          {
            title: "Tell Me About Islam",
            pdfUrl: "",
            hardCopyUrl: "https://www.newmuslimguide.com/en/order/",
            wikiUrl: "",
            description: "This guide takes you through the six articles of faith in detail, followed by the five pillars and some further aspects of Islam.",
          },
          {
            title: "New Muslim Guide",
            pdfUrl: "",
            hardCopyUrl: "",
            wikiUrl: "",
            url: "https://www.newmuslimguide.com/",
            description: "",
          },
        ],
        arrayItemSchema: [
          { id: "title", label: "Resource Title", type: "text" },
          { id: "pdfUrl", label: "PDF URL (optional)", type: "url" },
          { id: "hardCopyUrl", label: "Hard Copy URL (optional)", type: "url" },
          { id: "wikiUrl", label: "Wiki URL (optional)", type: "url" },
          { id: "url", label: "General URL (optional)", type: "url" },
          { id: "description", label: "Description (optional)", type: "textarea" },
        ],
      },
    ],
    explore: [
      { id: "explore-subtitle", label: "Section Subtitle", type: "text", value: "Explore further" },
      { id: "explore-title", label: "Section Title", type: "text", value: "Expand your circle of learning" },
      { id: "explore-description", label: "Section Description", type: "textarea", value: "We hope these resources guide you on your path to gaining beneficial knowledge and bringing you closer to Allah." },
      {
        id: "explore-items",
        label: "Explore Items",
        type: "array",
        value: [
          {
            title: "GainPeace",
            url: "https://gainpeace.com",
            description: "is a non-profit organization whose main goal is to educate the general public about Islam and clarify many misconceptions they may hold.",
          },
          {
            title: "Islamic Circle of North America",
            url: "https://www.icna.org",
            description: "The Mission of ICNA is to seek the pleasure of Allah (SWT) through the struggle for Iqamat-ud-Deen (application of the Islamic system of life) as spelled out in the Qur'an and the Sunnah of Prophet Muhammad (SAW).",
          },
          {
            title: "Islam Web",
            url: "http://www.islamweb.net/en/",
            description: "includes a comprehensive Islamic resource offering a wide range of content including fatwas, articles, Quran recitations, lectures, and prayer times.",
          },
          {
            title: "Discover Islam",
            url: "http://www.ediscoverislam.com/",
            description: "offers a platform with comprehensive resources about Islam, the Quran, and Prophet Muhammad. The site includes sections on the Quran, the purpose of life, scientific aspects of Islam, prophets and messengers, and various Islamic resources. It also provides free literature.",
          },
          {
            title: "New Muslims",
            url: "https://www.newmuslims.com/",
            description: "It is for new Muslim reverts who would like to learn their new religion in an easy and systematic way. Lessons here are organized under levels. So first you go to lesson 1 under level 1. Study it and then take its quiz. When you pass it move on to lesson 2 and so on. Best wishes.",
          },
        ],
        arrayItemSchema: [
          { id: "title", label: "Resource Title", type: "text" },
          { id: "url", label: "URL", type: "url" },
          { id: "description", label: "Description (optional)", type: "textarea" },
        ],
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("journeyIntro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchNewMuslimData() {
      try {
        const response = await fetch("/api/new-muslim");
        const result = await response.json();

        if (result.ok && result.newMuslim?.data) {
          const data = result.newMuslim.data;

          // Support both shapes:
          // 1) { page, hero, ... }
          // 2) { page, data: { hero, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;

          const transformed = { ...sections };

          // Journey Intro
          if (sectionsSource.journeyIntro?.data) {
            const intro = sectionsSource.journeyIntro.data as any;
            transformed.journeyIntro = transformed.journeyIntro.map((field) => {
              switch (field.id) {
                case "intro-subtitle":
                  return {
                    ...field,
                    value:
                      intro["intro-subtitle"] || intro.subtitle || field.value,
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
                case "intro-quote-source":
                  return {
                    ...field,
                    value:
                      intro["intro-quote-source"] ||
                      intro.quoteSource ||
                      field.value,
                  };
                case "intro-content-1":
                  return {
                    ...field,
                    value:
                      intro["intro-content-1"] || intro.content1 || field.value,
                  };
                case "intro-content-2":
                  return {
                    ...field,
                    value:
                      intro["intro-content-2"] || intro.content2 || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Foundations
          if (sectionsSource.foundations?.data) {
            const f = sectionsSource.foundations.data as any;
            transformed.foundations = transformed.foundations.map((field) => {
              switch (field.id) {
                case "foundations-subtitle":
                  return {
                    ...field,
                    value:
                      f["foundations-subtitle"] || f.subtitle || field.value,
                  };
                case "foundations-title":
                  return {
                    ...field,
                    value: f["foundations-title"] || f.title || field.value,
                  };
                case "foundations-description":
                  return {
                    ...field,
                    value:
                      f["foundations-description"] ||
                      f.description ||
                      field.value,
                  };
                case "quranic-resources":
                  return {
                    ...field,
                    value: Array.isArray(f["quranic-resources"])
                      ? f["quranic-resources"]
                      : field.value,
                  };
                case "sunnah-resources":
                  return {
                    ...field,
                    value: Array.isArray(f["sunnah-resources"])
                      ? f["sunnah-resources"]
                      : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Support
          if (sectionsSource.support?.data) {
            const s = sectionsSource.support.data as any;
            transformed.support = transformed.support.map((field) => {
              switch (field.id) {
                case "support-subtitle":
                  return {
                    ...field,
                    value:
                      s["support-subtitle"] || s.subtitle || field.value,
                  };
                case "support-items":
                  return {
                    ...field,
                    value: Array.isArray(s["support-items"])
                      ? s["support-items"]
                      : field.value,
                  };
                case "community-subtitle":
                  return {
                    ...field,
                    value:
                      s["community-subtitle"] ||
                      s.communitySubtitle ||
                      field.value,
                  };
                case "community-text":
                  return {
                    ...field,
                    value:
                      s["community-text"] || s.communityText || field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Resources
          if (sectionsSource.resources?.data) {
            const r = sectionsSource.resources.data as any;
            transformed.resources = transformed.resources.map((field) => {
              switch (field.id) {
                case "resources-subtitle":
                  return {
                    ...field,
                    value:
                      r["resources-subtitle"] || r.subtitle || field.value,
                  };
                case "resources-title":
                  return {
                    ...field,
                    value: r["resources-title"] || r.title || field.value,
                  };
                case "resource-items":
                  return {
                    ...field,
                    value: Array.isArray(r["resource-items"])
                      ? r["resource-items"]
                      : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          // Explore
          if (sectionsSource.explore?.data) {
            const e = sectionsSource.explore.data as any;
            transformed.explore = transformed.explore.map((field) => {
              switch (field.id) {
                case "explore-subtitle":
                  return {
                    ...field,
                    value:
                      e["explore-subtitle"] || e.subtitle || field.value,
                  };
                case "explore-title":
                  return {
                    ...field,
                    value: e["explore-title"] || e.title || field.value,
                  };
                case "explore-description":
                  return {
                    ...field,
                    value:
                      e["explore-description"] ||
                      e.description ||
                      field.value,
                  };
                case "explore-items":
                  return {
                    ...field,
                    value: Array.isArray(e["explore-items"])
                      ? e["explore-items"]
                      : field.value,
                  };
                default:
                  return field;
              }
            });
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch new-muslim data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNewMuslimData();
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
      journeyIntro: (d) => ({
        subtitle: d["intro-subtitle"] || "",
        title: d["intro-title"] || "",
        quote: d["intro-quote"] || "",
        quoteSource: d["intro-quote-source"] || "",
        content1: d["intro-content-1"] || "",
        content2: d["intro-content-2"] || "",
      }),
      foundations: (d) => ({
        subtitle: d["foundations-subtitle"] || "",
        title: d["foundations-title"] || "",
        description: d["foundations-description"] || "",
        "quranic-resources": Array.isArray(d["quranic-resources"])
          ? d["quranic-resources"]
          : [],
        "sunnah-resources": Array.isArray(d["sunnah-resources"])
          ? d["sunnah-resources"]
          : [],
      }),
      support: (d) => ({
        "support-subtitle": d["support-subtitle"] || "",
        "support-items": Array.isArray(d["support-items"])
          ? d["support-items"]
          : [],
        "community-subtitle": d["community-subtitle"] || "",
        "community-text": d["community-text"] || "",
      }),
      resources: (d) => ({
        "resources-subtitle": d["resources-subtitle"] || "",
        "resources-title": d["resources-title"] || "",
        "resource-items": Array.isArray(d["resource-items"])
          ? d["resource-items"]
          : [],
      }),
      explore: (d) => ({
        "explore-subtitle": d["explore-subtitle"] || "",
        "explore-title": d["explore-title"] || "",
        "explore-description": d["explore-description"] || "",
        "explore-items": Array.isArray(d["explore-items"])
          ? d["explore-items"]
          : [],
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
        } as NewMuslimSectionConfig,
      };

      const response = await fetch("/api/new-muslim/update-section", {
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
    { id: "journeyIntro", label: "Journey Introduction", icon: "📖" },
    { id: "foundations", label: "Foundations", icon: "🏛️" },
    { id: "support", label: "Support & Community", icon: "🤝" },
    { id: "resources", label: "Resources", icon: "📚" },
    { id: "explore", label: "Explore Further", icon: "🔍" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      journeyIntro: "Journey Introduction Section",
      foundations: "Foundations Section",
      support: "Support and Community Section",
      resources: "Resources Section",
      explore: "Explore Further Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit New Muslim Page"
      pageDescription="Edit all sections of the new Muslim page including journey introduction, foundations, support, and resources."
    >
      <VisibilityToggle pageName="new-muslim" apiEndpoint="/api/new-muslim" />
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
              {activeTab === "journeyIntro" && (
            <SectionEditor
              sectionId="journeyIntro"
              sectionTitle={getSectionTitle("journeyIntro")}
              fields={sections.journeyIntro}
              onUpdate={handleSectionUpdate}
              onSave={() => handleSave("journeyIntro")}
              saving={saving["journeyIntro"] || false}
              alwaysExpanded={true}
              bucket="Public"
              folder="newmuslim"
            />
          )}

          {activeTab === "foundations" && (
            <SectionEditor
              sectionId="foundations"
              sectionTitle={getSectionTitle("foundations")}
              fields={sections.foundations}
              onUpdate={handleSectionUpdate}
              onSave={() => handleSave("foundations")}
              saving={saving["foundations"] || false}
              alwaysExpanded={true}
              bucket="Public"
              folder="newmuslim"
            />
          )}

          {activeTab === "support" && (
            <SectionEditor
              sectionId="support"
              sectionTitle={getSectionTitle("support")}
              fields={sections.support}
              onUpdate={handleSectionUpdate}
              onSave={() => handleSave("support")}
              saving={saving["support"] || false}
              alwaysExpanded={true}
              bucket="Public"
              folder="newmuslim"
            />
          )}

          {activeTab === "resources" && (
            <SectionEditor
              sectionId="resources"
              sectionTitle={getSectionTitle("resources")}
              fields={sections.resources}
              onUpdate={handleSectionUpdate}
              onSave={() => handleSave("resources")}
              saving={saving["resources"] || false}
              alwaysExpanded={true}
              bucket="Public"
              folder="newmuslim"
            />
          )}

          {activeTab === "explore" && (
            <SectionEditor
              sectionId="explore"
              sectionTitle={getSectionTitle("explore")}
              fields={sections.explore}
              onUpdate={handleSectionUpdate}
              onSave={() => handleSave("explore")}
              saving={saving["explore"] || false}
              alwaysExpanded={true}
              bucket="Public"
              folder="newmuslim"
            />
          )}
            </>
          )}
        </div>
      </div>
    </PageEditorLayout>
  );
}

