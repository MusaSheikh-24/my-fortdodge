"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { VisitorGuideSectionConfig } from "@/lib/visitor-guide.service";
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

export default function VisitorsGuidePageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    intro: [
      { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "Thank you for your interest in visiting Fort Dodge Islamic Center. Our center welcomes all visitors and request that the following guidelines are closely followed:" },
    ],
    dressCode: [
      { id: "dress-title", label: "Section Title", type: "text", value: "DRESS CODE" },
      {
        id: "dress-items",
        label: "Dress Code Items",
        type: "array",
        value: [
          "Clothing should be modest for both men and women. This means an ankle length skirt or trousers, which should not be tight fitting or translucent, together with a long sleeved and high-necked top. A headscarf (of any color) is encouraged for women.",
          "Before entering the prayer hall one must remove any footwear and place it on a rack. Clean and presentable socks, stockings, or tights are therefore a good idea.",
        ],
        arrayItemSchema: [
          { id: "text", label: "Item Text", type: "textarea" },
        ],
      },
    ],
    enteringCenter: [
      { id: "entering-title", label: "Section Title", type: "text", value: "ENTERING THE CENTER" },
      {
        id: "entering-items",
        label: "Entering Center Items",
        type: "array",
        value: [
          "Visitors may be greeted by the Arabic greeting \"As-salam Alaikum\" which means \"peace be upon you.\" The answer, if the visitor chooses to use it, is \"Wa alaikum-as-salam\", which means \"peace be upon you too\".",
          "Do not offer, or expect, to shake hands with people of the opposite sex.",
          "Before entering the prayer hall or prayer room, Muslim men and women perform wudhu or cleansing ablutions if they have not already done so earlier or from home. This is not necessary for non-Muslim visitors who do not join in the prayer.",
        ],
        arrayItemSchema: [
          { id: "text", label: "Item Text", type: "textarea" },
        ],
      },
    ],
    multipurposeRoom: [
      { id: "multipurpose-title", label: "Section Title", type: "text", value: "THE MULTIPURPOSE ROOM" },
      { id: "multipurpose-content", label: "Content", type: "rich-text", value: "There are multipurpose rooms in Fort Dodge Islamic Center in which community gatherings and meetings take place. Visitors are welcomed in one of these rooms before being escorted to the Prayer Halls." },
    ],
    prayerHall: [
      { id: "prayer-title", label: "Section Title", type: "text", value: "THE PRAYER HALL" },
      {
        id: "prayer-items",
        label: "Prayer Hall Items",
        type: "array",
        value: [
          "Before you enter the prayer hall, ensure that your phone is turned on silent, your footwear is removed, and all food and drink items (if any) have been stored or discarded.",
          "Enter the prayer hall quietly. Muslims sit and pray on the floor in the prayer hall. Chairs are available for visitors in the rear of the prayer hall but you are welcome to sit on the floor as well.",
          "If visiting as a group during a time when prayers are taking place, sit together toward the rear of the hall.",
          "If a visitor arrives when the prayer is in progress, he or she should find a place near the rear wall and quietly observe the prayer.",
          "Muslims do not make sacred offerings or carry out blessing of food during prayer. Additionally, there are no sacred or holy objects in the masjid, except copies of the Quran on bookshelves along the side walls or elsewhere in the prayer hall. Note that Quran copies can only be touched by those who have performed wudhu.",
          "The only gestures expected of visitors are to remove their shoes, act respectfully in the prayer hall and silently observe the ritual of prayer.",
        ],
        arrayItemSchema: [
          { id: "text", label: "Item Text", type: "textarea" },
        ],
      },
    ],
    closing: [
      { id: "closing-content", label: "Closing Content", type: "rich-text", value: "Thank you once again for your interest in visiting us. If you have any questions or require clarification, please e-mail us at info@arqum.org. We also invite you to write about your visit experience. Enjoy Your Visit." },
      { id: "contact-email", label: "Contact Email", type: "text", value: "info@arqum.org" },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchVisitorGuideData() {
      try {
        const response = await fetch("/api/visitor-guide");
        const result = await response.json();

        if (result.ok && result.visitorGuide?.data) {
          const data = result.visitorGuide.data;

          // Support both shapes:
          // 1) { page, hero, intro, ... }
          // 2) { page, data: { hero, intro, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;

          const transformed = { ...sections };

          // Intro
          if (sectionsSource.intro?.data) {
            const introData = sectionsSource.intro.data as any;
            transformed.intro = [
              {
                id: "intro-content",
                label: "Introduction Content",
                type: "rich-text",
                value: introData["intro-content"] || introData.introContent || transformed.intro[0].value,
              },
            ];
          }

          // Dress Code
          if (sectionsSource.dressCode?.data) {
            const dressCodeData = sectionsSource.dressCode.data as any;
            // Clean array items - remove numeric keys and keep only schema fields
            let dressItems = Array.isArray(dressCodeData["dress-items"]) 
              ? dressCodeData["dress-items"] 
              : (Array.isArray(dressCodeData.dressItems) ? dressCodeData.dressItems : transformed.dressCode[1].value);
            
            if (Array.isArray(dressItems)) {
              dressItems = dressItems.map((item: any) => {
                if (typeof item === "object" && item !== null) {
                  // Remove numeric keys (0, 1, 2, etc.) and keep only "text" field
                  const cleaned: any = {};
                  if (item.text) {
                    cleaned.text = item.text;
                  } else {
                    // If no text field, try to reconstruct from numeric keys
                    const textValue = Object.keys(item)
                      .filter(key => !isNaN(Number(key)))
                      .sort((a, b) => Number(a) - Number(b))
                      .map(key => item[key])
                      .join("");
                    cleaned.text = textValue || "";
                  }
                  return cleaned;
                }
                return typeof item === "string" ? { text: item } : item;
              });
            }
            
            transformed.dressCode = [
              {
                id: "dress-title",
                label: "Section Title",
                type: "text",
                value: dressCodeData["dress-title"] || dressCodeData.dressTitle || transformed.dressCode[0].value,
              },
              {
                id: "dress-items",
                label: "Dress Code Items",
                type: "array",
                value: dressItems,
                arrayItemSchema: [
                  { id: "text", label: "Item Text", type: "textarea" },
                ],
              },
            ];
          }

          // Entering Center
          if (sectionsSource.enteringCenter?.data) {
            const enteringCenterData = sectionsSource.enteringCenter.data as any;
            // Clean array items - remove numeric keys and keep only schema fields
            let enteringItems = Array.isArray(enteringCenterData["entering-items"]) 
              ? enteringCenterData["entering-items"] 
              : (Array.isArray(enteringCenterData.enteringItems) ? enteringCenterData.enteringItems : transformed.enteringCenter[1].value);
            
            if (Array.isArray(enteringItems)) {
              enteringItems = enteringItems.map((item: any) => {
                if (typeof item === "object" && item !== null) {
                  // Remove numeric keys (0, 1, 2, etc.) and keep only "text" field
                  const cleaned: any = {};
                  if (item.text) {
                    cleaned.text = item.text;
                  } else {
                    // If no text field, try to reconstruct from numeric keys
                    const textValue = Object.keys(item)
                      .filter(key => !isNaN(Number(key)))
                      .sort((a, b) => Number(a) - Number(b))
                      .map(key => item[key])
                      .join("");
                    cleaned.text = textValue || "";
                  }
                  return cleaned;
                }
                return typeof item === "string" ? { text: item } : item;
              });
            }
            
            transformed.enteringCenter = [
              {
                id: "entering-title",
                label: "Section Title",
                type: "text",
                value: enteringCenterData["entering-title"] || enteringCenterData.enteringTitle || transformed.enteringCenter[0].value,
              },
              {
                id: "entering-items",
                label: "Entering Center Items",
                type: "array",
                value: enteringItems,
                arrayItemSchema: [
                  { id: "text", label: "Item Text", type: "textarea" },
                ],
              },
            ];
          }

          // Multipurpose Room
          if (sectionsSource.multipurposeRoom?.data) {
            const multipurposeRoomData = sectionsSource.multipurposeRoom.data as any;
            transformed.multipurposeRoom = [
              {
                id: "multipurpose-title",
                label: "Section Title",
                type: "text",
                value: multipurposeRoomData["multipurpose-title"] || multipurposeRoomData.multipurposeTitle || transformed.multipurposeRoom[0].value,
              },
              {
                id: "multipurpose-content",
                label: "Content",
                type: "rich-text",
                value: multipurposeRoomData["multipurpose-content"] || multipurposeRoomData.multipurposeContent || transformed.multipurposeRoom[1].value,
              },
            ];
          }

          // Prayer Hall
          if (sectionsSource.prayerHall?.data) {
            const prayerHallData = sectionsSource.prayerHall.data as any;
            // Clean array items - remove numeric keys and keep only schema fields
            let prayerItems = Array.isArray(prayerHallData["prayer-items"]) 
              ? prayerHallData["prayer-items"] 
              : (Array.isArray(prayerHallData.prayerItems) ? prayerHallData.prayerItems : transformed.prayerHall[1].value);
            
            if (Array.isArray(prayerItems)) {
              prayerItems = prayerItems.map((item: any) => {
                if (typeof item === "object" && item !== null) {
                  // Remove numeric keys (0, 1, 2, etc.) and keep only "text" field
                  const cleaned: any = {};
                  if (item.text) {
                    cleaned.text = item.text;
                  } else {
                    // If no text field, try to reconstruct from numeric keys
                    const textValue = Object.keys(item)
                      .filter(key => !isNaN(Number(key)))
                      .sort((a, b) => Number(a) - Number(b))
                      .map(key => item[key])
                      .join("");
                    cleaned.text = textValue || "";
                  }
                  return cleaned;
                }
                return typeof item === "string" ? { text: item } : item;
              });
            }
            
            transformed.prayerHall = [
              {
                id: "prayer-title",
                label: "Section Title",
                type: "text",
                value: prayerHallData["prayer-title"] || prayerHallData.prayerTitle || transformed.prayerHall[0].value,
              },
              {
                id: "prayer-items",
                label: "Prayer Hall Items",
                type: "array",
                value: prayerItems,
                arrayItemSchema: [
                  { id: "text", label: "Item Text", type: "textarea" },
                ],
              },
            ];
          }

          // Closing
          if (sectionsSource.closing?.data) {
            const closingData = sectionsSource.closing.data as any;
            transformed.closing = [
              {
                id: "closing-content",
                label: "Closing Content",
                type: "rich-text",
                value: closingData["closing-content"] || closingData.closingContent || transformed.closing[0].value,
              },
              {
                id: "contact-email",
                label: "Contact Email",
                type: "text",
                value: closingData["contact-email"] || closingData.contactEmail || transformed.closing[1].value,
              },
            ];
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch visitor guide data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVisitorGuideData();
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

    const mapping: Record<string, (d: any) => any> = {
      hero: (d) => ({
        "hero-image": d["hero-image"] || "",
      }),
      intro: (d) => ({
        "intro-content": d["intro-content"] || "",
      }),
      dressCode: (d) => ({
        "dress-title": d["dress-title"] || "",
        "dress-items": Array.isArray(d["dress-items"]) ? d["dress-items"] : [],
      }),
      enteringCenter: (d) => ({
        "entering-title": d["entering-title"] || "",
        "entering-items": Array.isArray(d["entering-items"]) ? d["entering-items"] : [],
      }),
      multipurposeRoom: (d) => ({
        "multipurpose-title": d["multipurpose-title"] || "",
        "multipurpose-content": d["multipurpose-content"] || "",
      }),
      prayerHall: (d) => ({
        "prayer-title": d["prayer-title"] || "",
        "prayer-items": Array.isArray(d["prayer-items"]) ? d["prayer-items"] : [],
      }),
      closing: (d) => ({
        "closing-content": d["closing-content"] || "",
        "contact-email": d["contact-email"] || "",
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
        } as VisitorGuideSectionConfig,
      };

      const response = await fetch("/api/visitor-guide/update-section", {
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
    { id: "dressCode", label: "Dress Code", icon: "👔" },
    { id: "enteringCenter", label: "Entering Center", icon: "🚪" },
    { id: "multipurposeRoom", label: "Multipurpose Room", icon: "🏛️" },
    { id: "prayerHall", label: "Prayer Hall", icon: "🕌" },
    { id: "closing", label: "Closing", icon: "✍️" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      intro: "Introduction Section",
      dressCode: "Dress Code Section",
      enteringCenter: "Entering the Center Section",
      multipurposeRoom: "Multipurpose Room Section",
      prayerHall: "Prayer Hall Section",
      closing: "Closing Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Visitors Guide Page"
      pageDescription="Edit all sections of the visitors guide page including hero, introduction, dress code, behavior, and prayer hall information."
    >
      <VisibilityToggle pageName="visitors-guide" apiEndpoint="/api/visitor-guide" />
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
                  bucket="Public"
                  folder="visitor-guide"
                />
              )}

              {activeTab === "dressCode" && (
                <SectionEditor
                  sectionId="dressCode"
                  sectionTitle={getSectionTitle("dressCode")}
                  fields={sections.dressCode}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("dressCode")}
                  saving={saving["dressCode"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="visitor-guide"
                />
              )}

              {activeTab === "enteringCenter" && (
                <SectionEditor
                  sectionId="enteringCenter"
                  sectionTitle={getSectionTitle("enteringCenter")}
                  fields={sections.enteringCenter}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("enteringCenter")}
                  saving={saving["enteringCenter"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="visitor-guide"
                />
              )}

              {activeTab === "multipurposeRoom" && (
                <SectionEditor
                  sectionId="multipurposeRoom"
                  sectionTitle={getSectionTitle("multipurposeRoom")}
                  fields={sections.multipurposeRoom}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("multipurposeRoom")}
                  saving={saving["multipurposeRoom"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="visitor-guide"
                />
              )}

              {activeTab === "prayerHall" && (
                <SectionEditor
                  sectionId="prayerHall"
                  sectionTitle={getSectionTitle("prayerHall")}
                  fields={sections.prayerHall}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("prayerHall")}
                  saving={saving["prayerHall"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="visitor-guide"
                />
              )}

              {activeTab === "closing" && (
                <SectionEditor
                  sectionId="closing"
                  sectionTitle={getSectionTitle("closing")}
                  fields={sections.closing}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("closing")}
                  saving={saving["closing"] || false}
                  alwaysExpanded={true}
                  bucket="Public"
                  folder="visitor-guide"
                />
              )}
            </>
          )}
        </div>
      </div>
    </PageEditorLayout>
  );
}

