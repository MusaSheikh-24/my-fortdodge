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
  // Don't initialize with any data - wait for data from database
  // Never use cache on initialization to avoid showing stale/static data
  const [localHeader, setLocalHeader] = useState<{ title?: string; description?: string } | null>(null);
  const [introCopy, setIntroCopy] = useState<string[]>([]);
  const [contactDetails, setContactDetails] = useState<any[]>([]);
  const [policyTitle, setPolicyTitle] = useState<string>("");
  const [policyItems, setPolicyItems] = useState<any[]>([]);
  const [reservationFormUrl, setReservationFormUrl] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Always fetch from database - only use real data from Supabase
  const applySrcToState = (src: any) => {
    if (!src) return;
    const extracted = extractReserveBasementData(src);
    
    // Always update header from database
    console.log('[ReserveBasementDrawer] Updating header:', { 
      hasSrc: !!src, 
      hasHeaderData: !!src?.header?.data,
      extractedHeader: extracted.header 
    });
    
    // Update header state - always set to extracted value (even if null)
    setLocalHeader(extracted.header);
    setIntroCopy(extracted.introCopy);
    setContactDetails(extracted.contactDetails);
    setPolicyTitle(extracted.policyTitle);
    setPolicyItems(extracted.policyItems);
    setReservationFormUrl(extracted.reservationFormUrl);
    setDataLoaded(true);
  };

  // Set up subscription (only subscribe, don't fetch on mount)
  useEffect(() => {
    let mounted = true;

    // Subscribe to cache updates so we update when cache changes (even when drawer is closed)
    const unsubscribe = subscribeToReserveBasementCache((data) => {
      if (!mounted) return;
      if (data) {
        applySrcToState(data);
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
      if (mounted && data) {
        applySrcToState(data);
      }
    }).catch((err) => {
      console.error('[ReserveBasementDrawer] fetchReserveBasementCached error:', err);
    });

    return () => { mounted = false; };
  }, [isOpen]);

  // Only use localHeader from Supabase - ignore header prop to avoid showing static data
  // Only show header when data is loaded from Supabase
  const effectiveHeader = dataLoaded ? localHeader : null;
  
  // Only use real data from Supabase - no fallbacks
  const displayIntroCopy = introCopy;
  const displayContactDetails = contactDetails;
  const displayPolicyTitle = policyTitle;
  const displayPolicyItems = policyItems;
  const displayReservationFormUrl = reservationFormUrl;
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
            {effectiveHeader?.title && (
              <h2 id="reserve-basement-title" className="text-xl font-semibold tracking-tight">
                {effectiveHeader.title}
              </h2>
            )}
            {effectiveHeader?.description && (
              <p 
                className="mt-1 text-sm text-white/80"
                dangerouslySetInnerHTML={{ __html: effectiveHeader.description }}
              />
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
          {!dataLoaded ? (
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

              {displayPolicyTitle && (
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
              )}

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

