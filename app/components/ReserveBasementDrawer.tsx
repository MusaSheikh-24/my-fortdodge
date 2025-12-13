"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "./Toaster";

interface ReserveBasementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  header?: { title?: string; description?: string } | null;
}

// In-memory client-side cache and subscription for reserve basement content.
// This ensures we fetch from the API only once and then listen for
// Supabase realtime updates to refresh the cache when the data changes.
let reserveBasementCache: any = null;
let reserveBasementFetchPromise: Promise<any> | null = null;
const reserveBasementSubscribers = new Set<(data: any) => void>();
let reserveBasementChannel: any = null;

async function fetchReserveBasementCached(force = false) {
  if (reserveBasementCache && !force) return reserveBasementCache;
  if (reserveBasementFetchPromise && !force) return reserveBasementFetchPromise;

  reserveBasementFetchPromise = (async () => {
    const res = await fetch('/api/reserve-basement', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch reserve basement');
    const json = await res.json();
    if (!json.ok || !json.reserveBasement?.data) {
      reserveBasementCache = null;
    } else {
      // normalize shape used by the component
      const data = json.reserveBasement.data;
      const src = data.data && typeof data.data === 'object' ? data.data : data;
      reserveBasementCache = src;
    }

    reserveBasementFetchPromise = null;

    // notify subscribers
    reserveBasementSubscribers.forEach((cb) => {
      try { cb(reserveBasementCache); } catch (e) { console.error(e); }
    });

    return reserveBasementCache;
  })();

  return reserveBasementFetchPromise;
}

function ensureReserveBasementRealtimeSubscription() {
  if (reserveBasementChannel) return;

  reserveBasementChannel = supabase
    .channel('reserve-basement-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Home', filter: "page_name=eq.reserve-basement" },
      async (payload: any) => {
        console.log('[ReserveBasementDrawer] Supabase change payload:', payload);
        try {
          await fetchReserveBasementCached(true); // force refresh cache
        } catch (err) {
          console.error('[ReserveBasementDrawer] Failed to refresh reserve basement cache after change:', err);
        }
      }
    )
    .subscribe();
}

function subscribeToReserveBasementCache(cb: (data: any) => void) {
  reserveBasementSubscribers.add(cb);
  // ensure the realtime subscription is active when there is at least one subscriber
  ensureReserveBasementRealtimeSubscription();
  return () => {
    reserveBasementSubscribers.delete(cb);
    if (reserveBasementSubscribers.size === 0 && reserveBasementChannel) {
      supabase.removeChannel(reserveBasementChannel);
      reserveBasementChannel = null;
    }
  };
}

// Default values as fallback
const DEFAULT_INTRO_COPY = [
  "This form is intended for members and affiliates of Fort Dodge Islamic Center seeking to reserve the basement space for various activities and events. Our basement is a versatile space, ideal for gatherings, educational sessions, community events, and more. Please fill out this form to begin the reservation process. All requests are subject to review based on our policy guidelines and availability.",
  "Note: Please allow at least 2 days for us to process your request. We do not guarantee same-day reservations, so plan in advance.",
];

const DEFAULT_CONTACT_DETAILS = [
  { label: "Phone", value: "(515) 528-3618", href: "tel:15155283618" },
  { label: "Email", value: "info@arqum.org", href: "mailto:info@arqum.org" },
];

const DEFAULT_POLICY_ITEMS = [
  {
    title: "1. Safety First:",
    description:
      "The safety of our community is our top priority. The basement contains electrical components and utility rooms, which can be hazardous, especially to children. It is imperative that these areas are treated with caution.",
  },
  {
    title: "2. Adult Supervision Required for Children:",
    description:
      "Children are welcome to participate in activities held in the basement; however, they must be under adult supervision at all times. Unscheduled, unsupervised access by children to the basement is strictly prohibited to prevent accidents.",
  },
  {
    title: "3. Prioritizing Space for Community Activities:",
    description:
      "While we understand the need for recreational space for children, the primary purpose of the basement is to serve as an additional space for community activities, educational purposes, and events. Therefore, reservation requests will be prioritized based on these needs.",
  },
  {
    title: "4. Respect for the Space:",
    description:
      "All users of the basement are expected to respect the space. This includes maintaining cleanliness, ensuring all equipment and facilities are used appropriately, and leaving the space in the same condition as it was found.",
  },
  {
    title: "5. Compliance with Islamic Center Rules and Regulations:",
    description:
      "All activities in the basement must adhere to the overall rules and guidelines of the Fort Dodge Islamic Center. Any activities contrary to these guidelines will not be permitted.",
  },
  {
    title: "6. Reservation Review and Confirmation:",
    description:
      "Submission of this form does not guarantee a reservation. All requests will be reviewed. We will contact you via email communications as soon as possible to confirm availability. Please wait for our confirmation before proceeding with arrangements.",
  },
  {
    title: "7. Cleaning:",
    description:
      "The reservation holder will be responsible to clean and remove trash from the basement after the reservation ends. They will also vacuum and return everything as it was before the reservation.",
  },
  {
    title: "8. Community Use:",
    description:
      "The basement is intended for community use and a safe, respectful, and beneficial use of the basement space for our community.",
  },
];

const DEFAULT_RESERVATION_FORM_URL = "https://forms.gle/ReserveBasementForm";
const DEFAULT_POLICY_TITLE = "Basement Usage Policy";

// Helper function to extract data from cache (no defaults - only returns what's in database)
function extractReserveBasementData(src: any) {
  const result = {
    header: null as { title?: string; description?: string } | null,
    introCopy: [] as string[],
    contactDetails: [] as any[],
    policyTitle: "",
    policyItems: [] as any[],
    reservationFormUrl: "",
  };

  if (!src) return result;

  // Extract header
  if (src.header?.data) {
    const headerData = src.header.data as any;
    const title = headerData['drawer-title'] || headerData.drawerTitle || undefined;
    const description = headerData['drawer-subtitle'] || headerData.drawerSubtitle || undefined;
    result.header = { title, description };
  }

  // Extract content
  const contentData = src.content?.data || {};
  
  // Intro copy paragraphs
  const introCopyData = contentData.introCopy || contentData['intro-copy'];
  if (Array.isArray(introCopyData) && introCopyData.length > 0) {
    result.introCopy = introCopyData.map((item: any) => 
      typeof item === 'string' ? item : item.text || ''
    ).filter(Boolean);
  }

  // Contact details
  const contactDetailsData = contentData.contactDetails || contentData['contact-details'];
  if (Array.isArray(contactDetailsData) && contactDetailsData.length > 0) {
    result.contactDetails = contactDetailsData.map((item: any) => {
      if (typeof item === 'string') {
        return { label: item, value: '', href: '' };
      }
      return {
        label: item.label || '',
        value: item.value || '',
        href: item.href || '',
      };
    }).filter((item: any) => item.label);
  }

  // Policy title
  if (contentData['policy-title'] || contentData.policyTitle) {
    result.policyTitle = contentData['policy-title'] || contentData.policyTitle || "";
  }

  // Policy items
  const policyItemsData = contentData.policyItems || contentData['policy-items'];
  if (Array.isArray(policyItemsData) && policyItemsData.length > 0) {
    result.policyItems = policyItemsData.map((item: any) => {
      if (typeof item === 'string') {
        return { title: item, description: '' };
      }
      return {
        title: item.title || '',
        description: item.description || '',
      };
    }).filter((item: any) => item.title);
  }

  // Reservation form URL
  if (contentData['form-url'] || contentData.formUrl || contentData.reservationFormUrl) {
    result.reservationFormUrl = contentData['form-url'] || contentData.formUrl || contentData.reservationFormUrl || "";
  }

  return result;
}

export default function ReserveBasementDrawer({
  isOpen,
  onClose,
  header,
}: ReserveBasementDrawerProps) {
  // Don't initialize with defaults - wait for data from database
  // Initialize from cache if available for instant display
  const cachedData = reserveBasementCache ? extractReserveBasementData(reserveBasementCache) : null;
  const [localHeader, setLocalHeader] = useState<{ title?: string; description?: string } | null>(
    cachedData?.header || null
  );
  const [introCopy, setIntroCopy] = useState<string[]>([]);
  const [contactDetails, setContactDetails] = useState<any[]>([]);
  const [policyTitle, setPolicyTitle] = useState<string>("");
  const [policyItems, setPolicyItems] = useState<any[]>([]);
  const [reservationFormUrl, setReservationFormUrl] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Always fetch from database - never use static defaults
  const applySrcToState = (src: any, useDefaults: boolean = false) => {
    if (!src && !useDefaults) return;
    const extracted = extractReserveBasementData(src || null);
    
    // Always update header from database
    console.log('[ReserveBasementDrawer] Updating header:', { 
      hasSrc: !!src, 
      hasHeaderData: !!src?.header?.data,
      extractedHeader: extracted.header 
    });
    
    // Update header state - always set to extracted value (even if null)
    setLocalHeader(extracted.header);
    setIntroCopy(extracted.introCopy.length > 0 ? extracted.introCopy : (useDefaults ? DEFAULT_INTRO_COPY : []));
    setContactDetails(extracted.contactDetails.length > 0 ? extracted.contactDetails : (useDefaults ? DEFAULT_CONTACT_DETAILS : []));
    setPolicyTitle(extracted.policyTitle || (useDefaults ? DEFAULT_POLICY_TITLE : ""));
    setPolicyItems(extracted.policyItems.length > 0 ? extracted.policyItems : (useDefaults ? DEFAULT_POLICY_ITEMS : []));
    setReservationFormUrl(extracted.reservationFormUrl || (useDefaults ? DEFAULT_RESERVATION_FORM_URL : ""));
    setDataLoaded(true);
  };

  // Set up subscription (only subscribe, don't fetch on mount)
  useEffect(() => {
    let mounted = true;

    // Subscribe to cache updates so we update when cache changes (even when drawer is closed)
    const unsubscribe = subscribeToReserveBasementCache((data) => {
      if (!mounted) return;
      if (data) {
        applySrcToState(data, false);
      }
    });

    return () => { mounted = false; unsubscribe(); };
  }, []);

  // Always fetch fresh data when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;

    // Always force fetch fresh data from database when drawer opens
    fetchReserveBasementCached(true).then((data) => {
      if (mounted) {
        if (data) {
          applySrcToState(data, false);
        } else {
          applySrcToState(null, true);
        }
      }
    }).catch((err) => {
      console.error('[ReserveBasementDrawer] fetchReserveBasementCached error:', err);
      if (mounted) {
        applySrcToState(null, true);
      }
    });

    return () => { mounted = false; };
  }, [isOpen]);

  // Always use localHeader from database if available, only fallback to header prop if localHeader is null
  const effectiveHeader = localHeader || header;
  
  // Use defaults only if no data loaded and API failed/returned empty
  const displayIntroCopy = dataLoaded ? (introCopy.length > 0 ? introCopy : DEFAULT_INTRO_COPY) : (introCopy.length > 0 ? introCopy : []);
  const displayContactDetails = contactDetails.length > 0 ? contactDetails : DEFAULT_CONTACT_DETAILS;
  const displayPolicyTitle = policyTitle || DEFAULT_POLICY_TITLE;
  const displayPolicyItems = policyItems.length > 0 ? policyItems : DEFAULT_POLICY_ITEMS;
  const displayReservationFormUrl = reservationFormUrl || DEFAULT_RESERVATION_FORM_URL;
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: "Basement Reservation",
          subject: `Basement reservation: ${data["name"] || "(no name)"}`,
          text: Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      toast.success("Your reservation request was submitted. We will contact you by email to confirm availability.");
      form.reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("There was an error submitting your reservation. Please try again later.");
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 right-0 z-70 flex h-full w-full max-w-2xl flex-col bg-white transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
          }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-basement-title"
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-slate-900 to-sky-900 px-6 py-5 text-white">
          <div className="max-w-xl">
            <h2 id="reserve-basement-title" className="text-xl font-semibold tracking-tight">
              {effectiveHeader?.title ?? "Fort Dodge Islamic Center Basement Reservation Form"}
            </h2>
            {effectiveHeader?.description ? (
              <p 
                className="mt-1 text-sm text-white/80"
                dangerouslySetInnerHTML={{ __html: effectiveHeader.description }}
              />
            ) : (
              <p className="mt-1 text-sm text-white/80">
                Provide your event details to request basement usage for classes, gatherings, or community events.
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close reserve basement drawer"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-7 pt-6">
          {!dataLoaded && displayIntroCopy.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              <section className="space-y-4">
                {displayIntroCopy.length > 0 ? (
                  displayIntroCopy.map((paragraph, index) => (
                    <div 
                      key={index} 
                      className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: paragraph || '' }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No introduction content available.</p>
                )}
              </section>

              <div className="mt-4 flex flex-wrap gap-2">
                {displayContactDetails.length > 0 ? (
                  displayContactDetails.map((detail, index) => (
                    <Link
                      key={detail.label || index}
                      href={detail.href}
                      target={detail.href.startsWith("http") ? "_blank" : undefined}
                      rel={detail.href.startsWith("http") ? "noreferrer" : undefined}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-900 transition hover:bg-sky-100"
                    >
                      <span>{detail.label}</span>
                      <span className="tracking-normal text-slate-900">{detail.value}</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No contact details available.</p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-gray-100 bg-linear-to-br from-white to-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  {displayPolicyTitle}
                </p>
                <ol className="mt-3 space-y-3 text-sm text-gray-700">
                  {displayPolicyItems.length > 0 ? (
                    displayPolicyItems.map((item, index) => (
                      <li key={item.title || index} className="space-y-1">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        {item.description ? (
                          <div 
                            className="prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                            dangerouslySetInnerHTML={{ __html: item.description }}
                          />
                        ) : (
                          <p className="text-gray-500 italic">No description available.</p>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 italic">No policy items available.</li>
                  )}
                </ol>
              </div>

          <form
            id="reserve-basement-form"
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="space-y-2">
              <label htmlFor="reservation-name" className="text-sm font-semibold text-gray-900">
                Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="reservation-name"
                name="name"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reservation-email" className="text-sm font-semibold text-gray-900">
                Email address <span className="text-rose-600">*</span>
              </label>
              <input
                id="reservation-email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reservation-phone" className="text-sm font-semibold text-gray-900">
                Contact number <span className="text-rose-600">*</span>
              </label>
              <input
                id="reservation-phone"
                name="phone"
                type="tel"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="reservation-date" className="text-sm font-semibold text-gray-900">
                  Date of reservation <span className="text-rose-600">*</span>
                </label>
                <input
                  id="reservation-date"
                  name="reservationDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reservation-time" className="text-sm font-semibold text-gray-900">
                  Time of reservation
                </label>
                <input
                  id="reservation-time"
                  name="reservationTime"
                  type="time"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="reservation-purpose" className="text-sm font-semibold text-gray-900">
                Purpose of reservation <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="reservation-purpose"
                name="purpose"
                rows={3}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-slate-50/60 p-3 text-sm text-gray-800">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span>
                I agree to abide by these policies and ensure a safe, respectful, and beneficial use
                of the basement space for our community.
              </span>
            </label>


            </form>
            </>
          )}
        </div>
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="submit"
            form="reserve-basement-form"
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Submit
          </button>
        </div>
      </aside>
    </>
  );
}

