import { Metadata } from "next";

const siteName = "Fort Dodge Islamic Center";
const siteDescription =
  "Fort Dodge Islamic Center - Serving the Muslim community in Fort Dodge, Iowa with prayer services, educational programs, community support, and Islamic guidance since 2002.";

// Use process.env directly with fallback to avoid module load issues during build
// The env validation in validate-env.ts will catch missing vars at runtime
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arqum.org";
const siteImage = `${siteUrl}/images/fortlogos.png`;

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
}

/**
 * Generates comprehensive SEO metadata for pages
 */
export function generateMetadata({
  title,
  description,
  path = "",
  image = siteImage,
  noIndex = false,
  keywords = [],
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  category,
}: SEOProps): Metadata {
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} - Islamic Center in Fort Dodge, Iowa`;

  const fullDescription = description || siteDescription;
  const url = `${siteUrl}${path}`;

  const defaultKeywords = [
    "Fort Dodge Islamic Center",
    "Fort Dodge masjid",
    "Islamic center Iowa",
    "Muslim community Fort Dodge",
    "prayer times Fort Dodge",
    "Islamic education",
    "Muslim community Iowa",
    "Darul Arqum",
    "Islamic services Fort Dodge",
  ];

  const allKeywords = [...defaultKeywords, ...keywords];

  const openGraphBase = {
    type: type === "article" ? ("article" as const) : ("website" as const),
    locale: "en_US" as const,
    url,
    siteName,
    title: fullTitle,
    description: fullDescription,
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: fullTitle,
      },
    ],
  };

  const openGraph: NonNullable<Metadata["openGraph"]> = (type === "article"
    ? {
        ...openGraphBase,
        article: {
          ...(publishedTime && { publishedTime }),
          ...(modifiedTime && { modifiedTime }),
          ...(author && { authors: [author] }),
          ...(category && { section: category }),
        },
      }
    : openGraphBase) as NonNullable<Metadata["openGraph"]>;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords.join(", "),
    authors: author ? [{ name: author }] : [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    category: category,
    classification: "Religious Organization",
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [image],
      creator: "@fortdodgeislamic", // Update with actual Twitter handle if available
    },
    alternates: {
      canonical: url,
    },
    metadataBase: new URL(siteUrl),
    verification: {
      // Add verification codes when available
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
      // yahoo: "your-yahoo-verification-code",
    },
  };
}

/**
 * Generates JSON-LD structured data for Organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ReligiousOrganization",
    "@id": `${siteUrl}#organization`,
    name: siteName,
    alternateName: "Darul Arqum",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: siteImage,
      width: 400,
      height: 100,
    },
    description: siteDescription,
    foundingDate: "2002",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Fort Dodge",
      addressRegion: "IA",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "General Inquiry",
      areaServed: "US",
      availableLanguage: ["en", "ar", "ur"],
    },
    sameAs: [
      // Add social media links if available
      // "https://www.facebook.com/fortdodgeislamic",
      // "https://www.instagram.com/fortdodgeislamic",
    ],
  };
}

/**
 * Generates JSON-LD structured data for a WebPage
 */
export function generateWebPageSchema({
  title,
  description,
  path = "",
}: {
  title: string;
  description?: string;
  path?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description || siteDescription,
    url: `${siteUrl}${path}`,
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
    about: {
      "@id": `${siteUrl}#organization`,
    },
  };
}

/**
 * Generates JSON-LD structured data for Website
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: siteName,
    description: siteDescription,
    publisher: {
      "@id": `${siteUrl}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generates JSON-LD structured data for Place of Worship
 */
export function generatePlaceOfWorshipSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "PlaceOfWorship",
    "@id": `${siteUrl}#place`,
    name: siteName,
    alternateName: "Darul Arqum",
    description: siteDescription,
    url: siteUrl,
    image: {
      "@type": "ImageObject",
      url: siteImage,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Fort Dodge",
      addressRegion: "IA",
      postalCode: "50501",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Add actual coordinates if available
      // latitude: 42.4975,
      // longitude: -94.1680,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "05:00",
      closes: "22:00",
    },
  };
}

/**
 * Generates JSON-LD structured data for BreadcrumbList
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates JSON-LD structured data for FAQPage
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

