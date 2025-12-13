"use client";

import { useState, useEffect } from "react";
import PageEditorLayout from "../components/PageEditorLayout";
import SectionEditor from "../components/SectionEditor";
import VisibilityToggle from "../components/VisibilityToggle";
import { getDefaultSections, SectionField } from "@/lib/home-default-sections";
import { toast } from "@/app/components/Toaster";

export default function HomePageEditor() {
  const [sections, setSections] = useState<Record<string, SectionField[]>>(getDefaultSections());
  const [activeTab, setActiveTab] = useState<string>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Fetch current data from Supabase on mount
  useEffect(() => {
    async function fetchHomeData() {
      try {
        const response = await fetch("/api/test-home");
        const result = await response.json();
        
        if (result.ok && result.home?.data) {
          const homeData = result.home.data;
          
          // Transform Supabase data to form fields
          const transformedSections: Record<string, SectionField[]> = getDefaultSections();
          
          // Hero Section
          if (homeData.heroSection?.data) {
            const heroData = homeData.heroSection.data;
            console.log("[Admin Load] Hero section data from DB:", heroData);
            
            // Filter out blob URLs from DB - they shouldn't be there
            let heroImageValue = heroData.heroImage || "/images/fortdoge-masjid.jpg";
            if (heroImageValue.startsWith("blob:")) {
              console.warn("[Admin Load] Found blob URL in DB, clearing it:", heroImageValue);
              heroImageValue = "/images/fortdoge-masjid.jpg"; // Reset to default
            }
            
            transformedSections.hero = [
              { id: "hero-image", label: "Hero Image", type: "image", value: heroImageValue },
            ];
            console.log("[Admin Load] Hero image value set to:", heroImageValue);
          } else {
            console.log("[Admin Load] No hero section data found in DB");
          }
          
          // Prayer Times
          if (homeData.prayerTime?.data) {
            const prayerData = homeData.prayerTime.data;
            transformedSections.prayerTimes = [
              {
                id: "prayer-date",
                label: "Date Display",
                type: "text",
                value: prayerData.dateLabel || "",
                placeholder: "Monday • November 24, 2025",
              },
              {
                id: "prayer-note",
                label: "Note Text",
                type: "textarea",
                value: prayerData.description || "",
                placeholder: "Times are subject to moon sighting confirmations.",
              },
              {
                id: "jamaat-status",
                label: "Jamaat Status Button Text",
                type: "text",
                value: prayerData.statusValue || "",
                placeholder: "Jamaat Status: On-Site",
              },
              {
                id: "prayer-times-table",
                label: "Prayer Times",
                type: "table",
                value: prayerData.prayers || [],
                tableColumns: [
                  { id: "name", label: "Prayer Name" },
                  { id: "adhan", label: "Adhan Time" },
                  { id: "iqama", label: "Iqama Time" },
                ],
              },
            ];
          }
          
          // Friday Prayers
          if (homeData.fridayPrayers?.data) {
            const fridayData = homeData.fridayPrayers.data;
            transformedSections.fridayPrayers = [
              {
                id: "friday-subtitle",
                label: "Subtitle",
                type: "text",
                value: fridayData.eyebrow || "",
                placeholder: "Jumu'ah Services",
              },
              {
                id: "friday-title",
                label: "Title",
                type: "text",
                value: fridayData.title || "",
                placeholder: "Friday Prayers",
              },
              {
                id: "friday-description",
                label: "Description",
                type: "textarea",
                value: fridayData.description || "",
                placeholder:
                  "Doors open 30 minutes before each Khutbah. Please arrive early to secure parking and seating.",
              },
              {
                id: "friday-location",
                label: "Location Text",
                type: "text",
                value: fridayData.locationValue || "",
                placeholder: "Main Prayer Hall",
              },
              {
                id: "khutbahs",
                label: "Friday Khutbahs",
                type: "array",
                value: fridayData.khutbahs || [],
                arrayItemSchema: [
                  { id: "slot", label: "Slot Label", type: "text" },
                  { id: "time", label: "Time", type: "time" },
                  { id: "imam", label: "Khateeb Name", type: "text" },
                ],
              },
            ];
          }
          
          // Donation
          if (homeData.donation?.data) {
            const donationData = homeData.donation.data;
            transformedSections.donation = [
              { id: "donation-subtitle", label: "Subtitle", type: "text", value: donationData.subtitle || donationData.eyebrow || "", placeholder: "Give Today" },
              { id: "donation-title", label: "Title", type: "text", value: donationData.title || "", placeholder: "Click or Scan QR to Donate Now" },
              { id: "donation-description", label: "Description", type: "textarea", value: donationData.description || "", placeholder: "Every contribution sustains..." },
              { id: "donation-qr-image", label: "QR Code Image", type: "image", value: donationData.qrCodeImage || donationData.heroImage || "/images/aq-paypal.png" },
              {
                id: "payment-links",
                label: "Payment Links",
                type: "array",
                value: donationData.paymentLinks || donationData.links || [],
                arrayItemSchema: [
                  { id: "label", label: "Label", type: "text" },
                  { id: "href", label: "URL", type: "url" },
                  { id: "accent", label: "Accent Color Class", type: "text" },
                ],
              },
              { id: "quick-actions-title", label: "Quick Actions Title", type: "text", value: donationData.quickActionsTitle || "", placeholder: "Prefer a direct link?" },
              { id: "quick-actions-description", label: "Quick Actions Description", type: "textarea", value: donationData.quickActionsDescription || "", placeholder: "Tap below to open..." },
            ];
          }
          
          // Info Banner / Quick Links
          // Supabase historically uses "quickLinks" as the key, but we also support "infoBanner" for backwards compatibility.
          if (homeData.quickLinks?.data || homeData.infoBanner?.data) {
            const bannerData = homeData.quickLinks?.data || homeData.infoBanner?.data;
            
            console.log("[Admin Load] Banner data from DB:", JSON.stringify(bannerData, null, 2));
            console.log("[Admin Load] Quick Links array from DB:", bannerData.quickLinks);
            
            // Normalize quick links: ensure "src" field exists (map from "iconPath" if needed)
            const dbQuickLinks = bannerData.quickLinks || bannerData.icons || [];
            console.log("[Admin Load] DB Quick Links count:", dbQuickLinks.length);
            
            const normalizedQuickLinks = dbQuickLinks.map((item: any, index: number) => {
              const normalized = {
                ...item,
                src: item.src || item.iconPath || "", // Use src if available, otherwise iconPath
                href: item.href || item.url || "", // Use href if available, otherwise url
              };
              console.log(`[Admin Load] Quick Link ${index}:`, {
                label: normalized.label,
                src: normalized.src,
                href: normalized.href
              });
              return normalized;
            });
            
            transformedSections.infoBanner = [
              {
                id: "banner-cards",
                label: "Banner Cards",
                type: "array",
                value: bannerData.bannerCards || [],
                arrayItemSchema: [
                  { id: "text", label: "Banner Text", type: "textarea" },
                ],
              },
              {
                id: "quick-links",
                label: "Quick Links / Icon Items",
                type: "array",
                value: normalizedQuickLinks,
                arrayItemSchema: [
                  { id: "label", label: "Label", type: "text" },
                  { id: "src", label: "Icon Image", type: "image" },
                  { id: "href", label: "Link URL", type: "url" },
                  { id: "external", label: "External Link (true/false)", type: "text" },
                  { id: "drawer", label: "Drawer Type", type: "text" },
                ],
              },
            ];
          } else {
            console.log("[Admin Load] No quickLinks data found in DB, using defaults");
          }
          
          // Calendar
          if (homeData.calendar?.data) {
            const calendarData = homeData.calendar.data;
            transformedSections.calendar = [
              { id: "stay-connected", label: "Stay Connected", type: "text", value: calendarData.stayConnected || "", placeholder: "Stay Connected" },
              { id: "community-events-calendar", label: "Community Events Calendar", type: "text", value: calendarData.communityEventsCalendar || "", placeholder: "Community Events Calendar" },
            ];
          }
          
          setSections(transformedSections);
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHomeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSectionUpdate = (sectionId: string, fields: SectionField[]) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: fields,
    }));
  };

  // Transform form fields to Supabase format
  const transformFieldsToSupabase = (sectionId: string, fields: SectionField[]): any => {
    const data: any = {};
    
    fields.forEach((field) => {
      if (field.type === "array" || field.type === "table") {
        data[field.id] = Array.isArray(field.value) ? field.value : [];
      } else {
        let value = typeof field.value === "string" ? field.value : "";
        
        // Filter out blob URLs - these should never be saved to DB
        if (value.startsWith("blob:")) {
          console.warn("[Admin Save] Blob URL detected in field, skipping:", field.id, value);
          value = ""; // Clear the blob URL
        }
        
        data[field.id] = value;
      }
    });
    
    // Map field IDs to component data structure
    const sectionMapping: Record<string, (data: any) => any> = {
      hero: (d) => ({
        heroImage: d["hero-image"] || "",
      }),
      prayerTimes: (d) => ({
        // Shape expected by PrayerTimes component
        heading: "Prayer Schedule",
        dateLabel: d["prayer-date"] || "",
        description: d["prayer-note"] || "",
        statusLabel: "Jamaat Status",
        statusValue: d["jamaat-status"] || "",
        prayers: d["prayer-times-table"] || [],
      }),
      fridayPrayers: (d) => ({
        // Shape expected by FridayPrayers component
        eyebrow: d["friday-subtitle"] || "",
        title: d["friday-title"] || "",
        description: d["friday-description"] || "",
        locationLabel: "Location",
        locationValue: d["friday-location"] || "",
        khutbahs: d["khutbahs"] || [],
      }),
      donation: (d) => ({
        subtitle: d["donation-subtitle"] || "",
        title: d["donation-title"] || "",
        description: d["donation-description"] || "",
        qrCodeImage: d["donation-qr-image"] || "",
        paymentLinks: d["payment-links"] || [],
        quickActionsTitle: d["quick-actions-title"] || "",
        quickActionsDescription: d["quick-actions-description"] || "",
      }),
      infoBanner: (d) => {
        // Ensure we're saving the actual array data, not nested structure
        const quickLinksArray = Array.isArray(d["quick-links"]) ? d["quick-links"] : [];
        const bannerCardsArray = Array.isArray(d["banner-cards"]) ? d["banner-cards"] : [];
        
        console.log("[Admin Save] infoBanner transform - quickLinks count:", quickLinksArray.length);
        quickLinksArray.forEach((link: any, idx: number) => {
          console.log(`[Admin Save] Quick Link ${idx}:`, {
            label: link?.label,
            src: link?.src,
            href: link?.href
          });
        });
        
        return {
          bannerCards: bannerCardsArray,
          quickLinks: quickLinksArray,
        };
      },
      calendar: (d) => ({
        stayConnected: d["stay-connected"] || "",
        communityEventsCalendar: d["community-events-calendar"] || "",
      }),
    };
    
    const mapper = sectionMapping[sectionId];
    return mapper ? mapper(data) : data;
  };

  // Map section IDs to Supabase keys
  const getSupabaseSectionKey = (sectionId: string): string => {
    const mapping: Record<string, string> = {
      hero: "heroSection",
      prayerTimes: "prayerTime",
      fridayPrayers: "fridayPrayers",
      donation: "donation",
      // Use "quickLinks" for Supabase storage (original schema), while still reading "infoBanner" if present.
      infoBanner: "quickLinks",
      calendar: "calendar",
    };
    return mapping[sectionId] || sectionId;
  };

  const handleSave = async (sectionId: string) => {
    setSaving((prev) => ({ ...prev, [sectionId]: true }));
    
    try {
      const fields = sections[sectionId];
      const sectionData = transformFieldsToSupabase(sectionId, fields);
      const supabaseKey = getSupabaseSectionKey(sectionId);
      
      console.log("[Admin Save] Section ID:", sectionId);
      console.log("[Admin Save] Supabase Key:", supabaseKey);
      console.log("[Admin Save] Transformed Data:", sectionData);
      
      // Log quick links data specifically for debugging
      if (sectionId === "infoBanner" && sectionData.quickLinks) {
        console.log("[Admin Save] Quick Links Data:", JSON.stringify(sectionData.quickLinks, null, 2));
        sectionData.quickLinks.forEach((link: any, index: number) => {
          console.log(`[Admin Save] Quick Link ${index}:`, {
            label: link.label,
            src: link.src,
            href: link.href
          });
        });
      }
      
      const requestBody = {
        sectionKey: supabaseKey,
        sectionData: {
          enabled: true,
          data: sectionData,
        },
      };
      
      console.log("[Admin Save] Request Body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch("/api/home/update-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      console.log("[Admin Save] Response:", result);
      
      if (result.ok) {
        toast.success(`${getSectionTitle(sectionId)} saved successfully!`);
        // Refresh the page data after successful save
        window.location.reload();
      } else {
        console.error("[Admin Save] Error:", result);
        toast.error(`Failed to save: ${result.message || result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("[Admin Save] Exception:", error);
      toast.error(`Failed to save: ${error.message || "Network error"}`);
    } finally {
      setSaving((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  const tabs = [
    { id: "hero", label: "Hero Section", icon: "🖼️" },
    { id: "prayerTimes", label: "Prayer Times", icon: "🕌" },
    { id: "fridayPrayers", label: "Friday Prayers", icon: "📿" },
    { id: "donation", label: "Donation", icon: "💝" },
    { id: "infoBanner", label: "Quick Links", icon: "🔗" },
    { id: "calendar", label: "Calendar", icon: "📅" },
  ];

  const getSectionTitle = (sectionId: string) => {
    const titles: Record<string, string> = {
      hero: "Hero Section",
      prayerTimes: "Prayer Times Section",
      fridayPrayers: "Friday Prayers Section",
      donation: "Donation Section",
      infoBanner: "Info Banner & Quick Links Section",
      calendar: "Calendar Section",
    };
    return titles[sectionId] || sectionId;
  };

  return (
    <PageEditorLayout
      pageTitle="Edit Home Page"
      pageDescription="Edit all sections of the homepage including hero, prayer times, donations, and more."
    >
      <VisibilityToggle pageName="home" apiEndpoint="/api/test-home" />
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
              {activeTab === "hero" && (
                <SectionEditor
                  sectionId="hero"
                  sectionTitle={getSectionTitle("hero")}
                  fields={sections.hero}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("hero")}
                  saving={saving["hero"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "prayerTimes" && (
                <SectionEditor
                  sectionId="prayerTimes"
                  sectionTitle={getSectionTitle("prayerTimes")}
                  fields={sections.prayerTimes}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("prayerTimes")}
                  saving={saving["prayerTimes"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "fridayPrayers" && (
                <SectionEditor
                  sectionId="fridayPrayers"
                  sectionTitle={getSectionTitle("fridayPrayers")}
                  fields={sections.fridayPrayers}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("fridayPrayers")}
                  saving={saving["fridayPrayers"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "donation" && (
                <SectionEditor
                  sectionId="donation"
                  sectionTitle={getSectionTitle("donation")}
                  fields={sections.donation}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("donation")}
                  saving={saving["donation"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "infoBanner" && (
                <SectionEditor
                  sectionId="infoBanner"
                  sectionTitle={getSectionTitle("infoBanner")}
                  fields={sections.infoBanner}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("infoBanner")}
                  saving={saving["infoBanner"] || false}
                  alwaysExpanded={true}
                />
              )}

              {activeTab === "calendar" && (
                <SectionEditor
                  sectionId="calendar"
                  sectionTitle={getSectionTitle("calendar")}
                  fields={sections.calendar}
                  onUpdate={handleSectionUpdate}
                  onSave={() => handleSave("calendar")}
                  saving={saving["calendar"] || false}
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

