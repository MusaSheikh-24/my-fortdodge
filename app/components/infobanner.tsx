"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { resolveStorageImageUrl } from "../../lib/storage.service";
import ApplyMembershipDrawer from "./ApplyMembershipDrawer";
import ContactDrawer from "./ContactDrawer";
import ReserveBasementDrawer from "./ReserveBasementDrawer";
import DoorAccessDrawer from "./DoorAccessDrawer";
import FinancialDrawer from "./FinancialDrawer";

export type InfoBannerIcon = {
  label?: string;
  src?: string;
  href?: string;
  url?: string; // Supabase uses "url" instead of "href"
  iconPath?: string; // Supabase uses "iconPath" instead of "src"
  external?: boolean;
  drawer?: "membership" | "contact" | "reserveBasement" | "doorAccess" | "financialAssistance";
};

export type InfoBannerData = {
  bannerCards?: string[] | Array<{ text?: string }>; // Supabase uses objects with "text" property
  icons?: InfoBannerIcon[];
  quickLinks?: InfoBannerIcon[]; // Supabase uses "quickLinks" key for icons
};

export type InfoBannerProps = {
  data?: InfoBannerData | null;
};

const defaultBannerCards: string[] = [
  "Our Islamic Center is solely dependent on generous donations. Your support keeps every program running.",
  "Need help or know someone who needs help? Try our IhsanConnect line so we can support the community together.",
];

const defaultIconItems: InfoBannerIcon[] = [
  { label: "By Laws", src: "/images/laws-aq.png", href: "https://drive.google.com/file/d/1xFQ6g0plhCzVIaCvglVPC1nykuICqRWL/view?usp=sharing", external: true },
  { label: "Report a Death", src: "/images/phone-aq.png", href: "/report-death" },
  { label: "Financial Assistance", src: "/images/financial-aq.png", href: "/resources#financial-assistance", drawer: "financialAssistance" },
  { label: "Request a Visit", src: "/images/request-aq.png", href: "/resources/request-a-visit" },
  { label: "Visitor Guide", src: "/images/visit-aq.png", href: "/resources/visitors-guide" },
  { label: "New Muslim", src: "/images/new-aq.png", href: "/new-musilm" },
  { label: "Become a Member", src: "/images/member-aq.png", href: "/resources/apply-renew-membership", drawer: "membership" },
  { label: "Monthly Prayer Times", src: "/images/time-aq.png", href: "/resources/islamic-prayer" },
  { label: "Meeting Minutes", src: "/images/meetin-aq.png", href: "https://drive.google.com/drive/folders/17nWT8C6jEZm5XK8oqKNEM1fzzXOcDsa0", external: true },
  { label: "Contact Us", src: "/images/contact-aq.png", href: "/contact", drawer: "contact" },
  { label: "Reserve Basement", src: "/images/reserve-aq.png", href: "/resources#reserve-basement", drawer: "reserveBasement" },
  { label: "Request Door Access", src: "/images/door-aq.png", href: "/resources#request-door-access", drawer: "doorAccess" },
];

export default function InfoBanner({ data }: InfoBannerProps) {
  const [resourcesData, setResourcesData] = useState<any | null>(null);
  const [contactData, setContactData] = useState<any | null>(null);
  const [isMembershipDrawerOpen, setIsMembershipDrawerOpen] = useState(false);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [isReserveBasementDrawerOpen, setIsReserveBasementDrawerOpen] = useState(false);
  const [isDoorAccessDrawerOpen, setIsDoorAccessDrawerOpen] = useState(false);
  const [isFinancialDrawerOpen, setIsFinancialDrawerOpen] = useState(false);
  const scrollPositionRef = useRef(0);

  const overlayActive = isMembershipDrawerOpen || isContactDrawerOpen || isReserveBasementDrawerOpen || isDoorAccessDrawerOpen || isFinancialDrawerOpen;

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (overlayActive) {
      // Save current scroll position
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll position
      const scrollY = scrollPositionRef.current;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [overlayActive]);

  const handleIconClick = (item: InfoBannerIcon, event: React.MouseEvent) => {
    if (item.drawer) {
      event.preventDefault();
      if (item.drawer === "membership") {
        setIsMembershipDrawerOpen(true);
      } else if (item.drawer === "contact") {
        setIsContactDrawerOpen(true);
      } else if (item.drawer === "reserveBasement") {
        setIsReserveBasementDrawerOpen(true);
      } else if (item.drawer === "doorAccess") {
        setIsDoorAccessDrawerOpen(true);
      } else if (item.drawer === "financialAssistance") {
        setIsFinancialDrawerOpen(true);
      }
    }
  };
  // Normalize banner cards: handle both string[] and Array<{ text: string }>
  console.log("data", data);
  const bannerCards = data?.bannerCards && data.bannerCards.length
    ? data.bannerCards.map((card) => (typeof card === "string" ? card : card?.text ?? ""))
    : defaultBannerCards;

  // Normalize icons: use quickLinks if available, otherwise icons, otherwise defaults
  // IMPORTANT: Prefer `src` field over `iconPath` because `src` contains newly uploaded images
  // `iconPath` is the old format for manually added images

  const icons = (
    data?.quickLinks && data.quickLinks.length
      ? data.quickLinks
      : data?.icons && data.icons.length
        ? data.icons
        : defaultIconItems
  ).map((item) => {
    // Map Supabase structure to component structure.
    // IMPORTANT: Prefer `src` (new uploaded images) over `iconPath` (old manually added images)
    // Support both legacy `href` / `src` and Supabase `url` / `iconPath`.
    return {
      label: item.label,
      src: item.src ?? item.iconPath ?? "", // Prefer src (new) over iconPath (old)
      href: item.href ?? item.url,
      external: item.external,
      drawer: item.drawer,
    };
  });

  // Auto-detect drawer type from URL patterns if not explicitly set
  const iconsWithDrawers = icons.map((item) => {
    if (item.drawer) return item;

    const href = item.href ?? "";
    if (href.includes("apply-renew-membership") || href.includes("membership")) {
      return { ...item, drawer: "membership" as const };
    }
    if (href === "/contact" || href.includes("/contact")) {
      return { ...item, drawer: "contact" as const };
    }
    if (href.includes("reserve-basement") || href.includes("#reserve-basement")) {
      return { ...item, drawer: "reserveBasement" as const };
    }
    if (href.includes("request-door-access") || href.includes("#request-door-access")) {
      return { ...item, drawer: "doorAccess" as const };
    }
    if (href.includes("financial-assistance") || href.includes("#financial-assistance")) {
      return { ...item, drawer: "financialAssistance" as const };
    }
    return item;
  });

  return (
    <section className="w-full mt-10">
      <div className="bg-[#5E7A8A] px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 md:flex-row md:gap-6">
          {bannerCards.map((text, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-md bg-[#EFF4F7] px-5 py-4 text-center text-sm text-[#355160] shadow md:text-left"
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#F3F3F3] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-6">
          {iconsWithDrawers.map((item) => {
            if (!item.label || !item.href || !item.src) {
              console.warn("[InfoBanner] Missing required fields:", { label: item.label, href: item.href, src: item.src });
              return null;
            }

            const iconSrc = resolveStorageImageUrl(item.src, { bucket: "Public", folder: "Home" });

            console.log("[InfoBanner] Resolving icon:", {
              label: item.label,
              src: item.src,
              resolved: iconSrc
            });

            // If we can't resolve a Supabase URL, skip rendering the icon image
            if (!iconSrc) {
              console.warn("[InfoBanner] Could not resolve image URL for:", item.label, "src:", item.src);
              return null;
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                onClick={(e) => handleIconClick(item, e)}
                className="flex flex-col items-center space-y-3 text-center text-xs font-semibold text-[#2E2E2E] leading-tight transition-transform hover:-translate-y-1 cursor-pointer"
              >
                <Image
                  src={iconSrc}
                  alt={item.label}
                  width={56}
                  height={56}
                  className="object-contain"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <ApplyMembershipDrawer
        isOpen={isMembershipDrawerOpen}
        onClose={() => setIsMembershipDrawerOpen(false)}
        header={{
          title: resourcesData?.applyRenewMembership?.data?.title || resourcesData?.applyRenewMembership?.title || undefined,
          description: resourcesData?.applyRenewMembership?.data?.description || resourcesData?.applyRenewMembership?.description || undefined,
        }}
      />
      <ContactDrawer
        isOpen={isContactDrawerOpen}
        onClose={() => setIsContactDrawerOpen(false)}
        methods={
          contactData?.content?.data
            ? [
              contactData.content.data['contact-facebook'] && { label: 'Facebook', href: contactData.content.data['contact-facebook'], external: true },
              contactData.content.data['contact-whatsapp'] && { label: 'WhatsApp', href: contactData.content.data['contact-whatsapp'], external: true },
              contactData.content.data['contact-email'] && { label: 'Email', href: `mailto:${contactData.content.data['contact-email']}`, external: false },
              contactData.content.data['contact-voicemail'] && { label: 'Voicemail', href: `tel:${contactData.content.data['contact-voicemail'].replace(/[^0-9+]/g, '')}`, external: false, display: contactData.content.data['contact-voicemail'] },
            ].filter(Boolean)
            : undefined
        }
      />
      <ReserveBasementDrawer
        isOpen={isReserveBasementDrawerOpen}
        onClose={() => setIsReserveBasementDrawerOpen(false)}
        header={{
          title: resourcesData?.reserveBasement?.data?.title || resourcesData?.reserveBasement?.title || undefined,
          description: resourcesData?.reserveBasement?.data?.description || resourcesData?.reserveBasement?.description || undefined,
        }}
      />
      <DoorAccessDrawer
        isOpen={isDoorAccessDrawerOpen}
        onClose={() => setIsDoorAccessDrawerOpen(false)}
        onOpenMembershipDrawer={() => {
          setIsDoorAccessDrawerOpen(false);
          setIsMembershipDrawerOpen(true);
        }}
        header={{
          title: resourcesData?.requestDoorAccess?.data?.title || resourcesData?.requestDoorAccess?.title || undefined,
          description: resourcesData?.requestDoorAccess?.data?.description || resourcesData?.requestDoorAccess?.description || undefined,
        }}
      />
      <FinancialDrawer
        isOpen={isFinancialDrawerOpen}
        onClose={() => setIsFinancialDrawerOpen(false)}
        header={{
          title: resourcesData?.financialAssistance?.data?.title || resourcesData?.financialAssistance?.title || undefined,
          description: resourcesData?.financialAssistance?.data?.description || resourcesData?.financialAssistance?.description || undefined,
        }}
      />
    </section>
  );
}