"use client";

import { useEffect, useState } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { SectionField } from "@/lib/home-default-sections";
import { toast } from "@/app/components/Toaster";

export default function DonatePageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>({
    intro: [
      { id: "quote", label: "Quranic Quote", type: "textarea", value: "Those who give charity night and day, secretly and openly, have their reward with their Lord. They will have no fear, and they will not grieve." },
      { id: "quote-reference", label: "Quote Reference", type: "text", value: "-Quran 2:274" },
      { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "Fort Dodge Islamic Center is a non-profit organization that provides a variety of religious, educational, and social services to the Muslim community in Ames, Iowa. The center is a vital part of the community, relying on donations from generous individuals and businesses to operate." },
    ],
    need_for_donations: [
      { id: "need-subtitle", label: "Section Subtitle", type: "text", value: "NEED FOR DONATIONS" },
      { id: "need-title", label: "Section Title", type: "text", value: "Your support sustains vital programs and services" },
      { 
        id: "funds", 
        label: "Donation Funds", 
        type: "array", 
        value: [
          { title: "General Fund", description: "Supports the general operation of the Islamic Center, including maintenance, landscaping, cleaning, utilities, and other day-to-day expenses." },
          { title: "Imam Fund", description: "Goes directly toward paying the Imam's salary. The Imam plays a vital role in serving the community." },
          { title: "Islamic School Fund", description: "Operates and manages the Islamic school — hiring teachers, purchasing supplies, and providing student support." },
          { title: "Sadaqa & Zakat Al-Mal Fund", description: "Helps needy people in Ames through financial assistance, food banks, and other social service programs." },
        ],
        arrayItemSchema: [
          { id: "title", label: "Fund Title", type: "text" },
          { id: "description", label: "Fund Description", type: "textarea" },
        ],
      },
    ],
    options: [
      { id: "options-subtitle", label: "Section Subtitle", type: "text", value: "DONATION OPTIONS" },
      { id: "options-title", label: "Section Title", type: "text", value: "Choose the method that works best for you" },
      { 
        id: "donation-methods", 
        label: "Donation Methods", 
        type: "array", 
        value: [
          { 
            title: "Donation Box", 
            description: "Located in the main prayer hall and sisters' prayer hall. Use designated envelopes to direct your contribution.",
            bullets: "Deposit cash securely in any of the donation boxes.\nClearly mark the envelope with your intended fund."
          },
          { 
            title: "Checks", 
            description: "Write checks payable to Fort Dodge Islamic Center and include the designated fund in the memo line.",
            bullets: ""
          },
          { 
            title: "MOHID Kiosk", 
            description: "Located in the main prayer hall and accepts major credit cards for one-time or recurring donations.",
            bullets: "Select the fund you would like to support directly on the kiosk.\nReceive an instant receipt for your records."
          },
          { 
            title: "MOHID Online", 
            description: "Submit donations via the MOHID online portal. Choose your fund and donate from anywhere.",
            linkLabel: "us.mohid.co/ia/desmoines/daic/masjid/online/donation",
            linkHref: "https://us.mohid.co/ia/desmoines/daic/masjid/online/donation",
            bullets: ""
          },
          { 
            title: "Venmo", 
            description: "Give through Venmo at Fort Dodge Islamic Center.",
            linkLabel: "venmo.com/DarulArqumIslamicCenter",
            linkHref: "https://venmo.com/DarulArqumIslamicCenter",
            bullets: ""
          },
          { 
            title: "PayPal", 
            description: "Donate quickly and securely using PayPal.",
            linkLabel: "paypal.me/daicpaypal",
            linkHref: "https://paypal.me/daicpaypal",
            bullets: ""
          },
          { 
            title: "Direct Transfer to the Bank", 
            description: "Contact our treasurer to set up a direct bank transfer for larger or recurring gifts.",
            linkLabel: "treasurer@arqum.org",
            linkHref: "mailto:treasurer@arqum.org",
            bullets: ""
          },
        ],
        arrayItemSchema: [
          { id: "title", label: "Method Title", type: "text" },
          { id: "description", label: "Description", type: "textarea" },
          { id: "bullets", label: "Bullet Points (one per line)", type: "textarea" },
          { id: "linkLabel", label: "Link Label (optional)", type: "text" },
          { id: "linkHref", label: "Link URL (optional)", type: "url" },
        ],
      },
    ],
    closing: [
      { id: "closing-content", label: "Closing Message", type: "rich-text", value: "Fort Dodge Islamic Center is a vital part of the Muslim community in Ames, Iowa. The center relies on donations from generous individuals and businesses to operate. Your donation helps support programs and services that benefit many people. Jazakum Allah Khairan for your generosity." },
    ],
    giveToday: [
      { id: "give-subtitle", label: "Section Subtitle", type: "text", value: "GIVE TODAY" },
      { id: "give-title", label: "Section Title", type: "text", value: "Click or Scan QR to Donate Now" },
      { id: "give-description", label: "Section Description", type: "textarea", value: "Every contribution sustains programs, outreach, and community services at Fort Dodge Islamic Center." },
      { id: "qr-image", label: "QR Codes Image", type: "image", value: "" },
      { 
        id: "quick-links", 
        label: "Quick Action Links", 
        type: "array", 
        value: [
          { label: "PayPal", href: "https://paypal.me/daicpaypal", description: "Open PayPal donation page" },
          { label: "Venmo", href: "https://venmo.com/DarulArqumIslamicCenter", description: "Open Venmo donation page" },
          { label: "Mohid", href: "https://us.mohid.co/ia/desmoines/daic/masjid/online/donation", description: "Open Mohid donation page" },
        ],
        arrayItemSchema: [
          { id: "label", label: "Link Label", type: "text" },
          { id: "href", label: "Link URL", type: "url" },
          { id: "description", label: "Link Description", type: "text" },
        ],
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<string>("intro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchDonateData() {
      try {
        const response = await fetch("/api/donate");
        const result = await response.json();

        if (result.ok && result.donate?.data) {
          const data = result.donate.data;

          // Support both shapes:
          // 1) { page, hero, ... }
          // 2) { page, data: { hero, ... } }
          const sectionsSource =
            data.data && typeof data.data === "object" ? data.data : data;
          const transformed: Record<string, SectionField[]> = {
            hero: [
              // Start empty so we don't try to load a non-existent Supabase file path.
              // Admin can upload a real image which will be stored as "donate/....jpg".
              { id: "hero-image", label: "Hero Image", type: "image", value: "" },
            ],
            intro: [
              { id: "quote", label: "Quranic Quote", type: "textarea", value: "Those who give charity night and day, secretly and openly, have their reward with their Lord. They will have no fear, and they will not grieve." },
              { id: "quote-reference", label: "Quote Reference", type: "text", value: "-Quran 2:274" },
              { id: "intro-content", label: "Introduction Content", type: "rich-text", value: "Fort Dodge Islamic Center is a non-profit organization that provides a variety of religious, educational, and social services to the Muslim community in Ames, Iowa. The center is a vital part of the community, relying on donations from generous individuals and businesses to operate." },
            ],
            need_for_donations: [
              { id: "need-subtitle", label: "Section Subtitle", type: "text", value: "NEED FOR DONATIONS" },
              { id: "need-title", label: "Section Title", type: "text", value: "Your support sustains vital programs and services" },
              { 
                id: "funds", 
                label: "Donation Funds", 
                type: "array", 
                value: [],
                arrayItemSchema: [
                  { id: "title", label: "Fund Title", type: "text" },
                  { id: "description", label: "Fund Description", type: "textarea" },
                ],
              },
            ],
            options: [
              { id: "options-subtitle", label: "Section Subtitle", type: "text", value: "DONATION OPTIONS" },
              { id: "options-title", label: "Section Title", type: "text", value: "Choose the method that works best for you" },
              { 
                id: "donation-methods", 
                label: "Donation Methods", 
                type: "array", 
                value: [],
                arrayItemSchema: [
                  { id: "title", label: "Method Title", type: "text" },
                  { id: "description", label: "Description", type: "textarea" },
                  { id: "bullets", label: "Bullet Points (one per line)", type: "textarea" },
                  { id: "linkLabel", label: "Link Label (optional)", type: "text" },
                  { id: "linkHref", label: "Link URL (optional)", type: "url" },
                ],
              },
            ],
            closing: [
              { id: "closing-content", label: "Closing Message", type: "rich-text", value: "Fort Dodge Islamic Center is a vital part of the Muslim community in Ames, Iowa. The center relies on donations from generous individuals and businesses to operate. Your donation helps support programs and services that benefit many people. Jazakum Allah Khairan for your generosity." },
            ],
            giveToday: [
              { id: "give-subtitle", label: "Section Subtitle", type: "text", value: "GIVE TODAY" },
              { id: "give-title", label: "Section Title", type: "text", value: "Click or Scan QR to Donate Now" },
              { id: "give-description", label: "Section Description", type: "textarea", value: "Every contribution sustains programs, outreach, and community services at Fort Dodge Islamic Center." },
              { id: "qr-image", label: "QR Codes Image", type: "image", value: "" },
              { 
                id: "quick-links", 
                label: "Quick Action Links", 
                type: "array", 
                value: [],
                arrayItemSchema: [
                  { id: "label", label: "Link Label", type: "text" },
                  { id: "href", label: "Link URL", type: "url" },
                  { id: "description", label: "Link Description", type: "text" },
                ],
              },
            ],
          };

          // Map existing data from Supabase into editor fields
          if (sectionsSource.hero?.data) {
            const heroData = sectionsSource.hero.data as any;
            transformed.hero = [
              {
                id: "hero-image",
                label: "Hero Image",
                type: "image",
                value: heroData["hero-image"] || heroData.heroImage || "",
              },
            ];
          }

          if (sectionsSource.intro?.data) {
            const introData = sectionsSource.intro.data as any;
            transformed.intro = [
              { id: "quote", label: "Quranic Quote", type: "textarea", value: introData.quote || transformed.intro[0].value },
              { id: "quote-reference", label: "Quote Reference", type: "text", value: introData["quote-reference"] || introData.quoteReference || transformed.intro[1].value },
              { id: "intro-content", label: "Introduction Content", type: "rich-text", value: introData["intro-content"] || introData.introContent || transformed.intro[2].value },
            ];
          }

          // Support both "need" and "need_for_donations" for backward compatibility
          const needSource = sectionsSource.need_for_donations ?? sectionsSource.need ?? null;
          if (needSource?.data) {
            const needData = needSource.data as any;
            transformed.need_for_donations = [
              { id: "need-subtitle", label: "Section Subtitle", type: "text", value: needData["need-subtitle"] || needData.needSubtitle || transformed.need_for_donations[0].value },
              { id: "need-title", label: "Section Title", type: "text", value: needData["need-title"] || needData.needTitle || transformed.need_for_donations[1].value },
              { 
                id: "funds", 
                label: "Donation Funds", 
                type: "array", 
                value: Array.isArray(needData.funds) ? needData.funds : transformed.need_for_donations[2].value,
                arrayItemSchema: [
                  { id: "title", label: "Fund Title", type: "text" },
                  { id: "description", label: "Fund Description", type: "textarea" },
                ],
              },
            ];
          }

          if (sectionsSource.options?.data) {
            const optionsData = sectionsSource.options.data as any;
            transformed.options = [
              { id: "options-subtitle", label: "Section Subtitle", type: "text", value: optionsData["options-subtitle"] || optionsData.optionsSubtitle || transformed.options[0].value },
              { id: "options-title", label: "Section Title", type: "text", value: optionsData["options-title"] || optionsData.optionsTitle || transformed.options[1].value },
              { 
                id: "donation-methods", 
                label: "Donation Methods", 
                type: "array", 
                value: Array.isArray(optionsData["donation-methods"]) ? optionsData["donation-methods"] : (Array.isArray(optionsData.donationMethods) ? optionsData.donationMethods : transformed.options[2].value),
                arrayItemSchema: [
                  { id: "title", label: "Method Title", type: "text" },
                  { id: "description", label: "Description", type: "textarea" },
                  { id: "bullets", label: "Bullet Points (one per line)", type: "textarea" },
                  { id: "linkLabel", label: "Link Label (optional)", type: "text" },
                  { id: "linkHref", label: "Link URL (optional)", type: "url" },
                ],
              },
            ];
          }

          if (sectionsSource.closing?.data) {
            const closingData = sectionsSource.closing.data as any;
            transformed.closing = [
              { id: "closing-content", label: "Closing Message", type: "rich-text", value: closingData["closing-content"] || closingData.closingContent || transformed.closing[0].value },
            ];
          }

          if (sectionsSource.giveToday?.data) {
            const giveTodayData = sectionsSource.giveToday.data as any;
            transformed.giveToday = [
              { id: "give-subtitle", label: "Section Subtitle", type: "text", value: giveTodayData["give-subtitle"] || giveTodayData.giveSubtitle || transformed.giveToday[0].value },
              { id: "give-title", label: "Section Title", type: "text", value: giveTodayData["give-title"] || giveTodayData.giveTitle || transformed.giveToday[1].value },
              { id: "give-description", label: "Section Description", type: "textarea", value: giveTodayData["give-description"] || giveTodayData.giveDescription || transformed.giveToday[2].value },
              { id: "qr-image", label: "QR Codes Image", type: "image", value: giveTodayData["qr-image"] || giveTodayData.qrImage || transformed.giveToday[3].value },
              { 
                id: "quick-links", 
                label: "Quick Action Links", 
                type: "array", 
                value: Array.isArray(giveTodayData["quick-links"]) ? giveTodayData["quick-links"] : (Array.isArray(giveTodayData.quickLinks) ? giveTodayData.quickLinks : transformed.giveToday[4].value),
                arrayItemSchema: [
                  { id: "label", label: "Link Label", type: "text" },
                  { id: "href", label: "Link URL", type: "url" },
                  { id: "description", label: "Link Description", type: "text" },
                ],
              },
            ];
          }

          setSections(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch donate data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDonateData();
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
        },
      };

      const response = await fetch("/api/donate/update-section", {
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
    { id: "need_for_donations", label: "Need for Donations", icon: "💝" },
    { id: "options", label: "Donations Options", icon: "💳" },
    { id: "closing", label: "Closing Message", icon: "✍️" },
    { id: "giveToday", label: "Give Today", icon: "📱" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      intro: "Introduction Section",
      need_for_donations: "Need for Donations Section",
      options: "Donation Options Section",
      closing: "Closing Message Section",
      giveToday: "Give Today Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Donate Page"
      pageDescription="Edit all sections of the donation page including hero, introduction, donation options, and closing message."
    >
      <VisibilityToggle pageName="donate" apiEndpoint="/api/donate" />
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
                      folder="donate"
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

