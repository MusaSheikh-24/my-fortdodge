"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "./Toaster";

interface DoorAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMembershipDrawer: () => void;
  header?: { title?: string; description?: string } | null;
}

// In-memory client-side cache and subscription for door access content.
// This ensures we fetch from the API only once and then listen for
// Supabase realtime updates to refresh the cache when the data changes.
let doorAccessCache: any = null;
let doorAccessFetchPromise: Promise<any> | null = null;
const doorAccessSubscribers = new Set<(data: any) => void>();
let doorAccessChannel: any = null;

async function fetchDoorAccessCached(force = false) {
  if (doorAccessCache && !force) return doorAccessCache;
  if (doorAccessFetchPromise && !force) return doorAccessFetchPromise;

  doorAccessFetchPromise = (async () => {
    const res = await fetch('/api/request-door-access', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch door access');
    const json = await res.json();
    if (!json.ok || !json.requestDoorAccess?.data) {
      doorAccessCache = null;
    } else {
      // normalize shape used by the component
      const data = json.requestDoorAccess.data;
      const src = data.data && typeof data.data === 'object' ? data.data : data;
      doorAccessCache = src;
    }

    doorAccessFetchPromise = null;

    // notify subscribers
    doorAccessSubscribers.forEach((cb) => {
      try { cb(doorAccessCache); } catch (e) { console.error(e); }
    });

    return doorAccessCache;
  })();

  return doorAccessFetchPromise;
}

function ensureDoorAccessRealtimeSubscription() {
  if (doorAccessChannel) return;

  doorAccessChannel = supabase
    .channel('door-access-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Home', filter: "page_name=eq.request-door-access" },
      async (payload: any) => {
        console.log('[DoorAccessDrawer] Supabase change payload:', payload);
        try {
          await fetchDoorAccessCached(true); // force refresh cache
        } catch (err) {
          console.error('[DoorAccessDrawer] Failed to refresh door access cache after change:', err);
        }
      }
    )
    .subscribe();
}

function subscribeToDoorAccessCache(cb: (data: any) => void) {
  doorAccessSubscribers.add(cb);
  // ensure the realtime subscription is active when there is at least one subscriber
  ensureDoorAccessRealtimeSubscription();
  return () => {
    doorAccessSubscribers.delete(cb);
    if (doorAccessSubscribers.size === 0 && doorAccessChannel) {
      supabase.removeChannel(doorAccessChannel);
      doorAccessChannel = null;
    }
  };
}


// Helper function to extract data from cache (no defaults - only returns what's in database)
function extractDoorAccessData(src: any) {
  const result = {
    header: null as { title?: string; description?: string } | null,
    policyIntro: [] as string[],
    policyAgreement: [] as string[],
    policyAgreementIntro: "",
    membershipDrawerLink: "",
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
  
  // Policy intro paragraphs
  if (Array.isArray(contentData.policyIntro) && contentData.policyIntro.length > 0) {
    result.policyIntro = contentData.policyIntro.map((item: any) => 
      typeof item === 'string' ? item : item.text || ''
    ).filter(Boolean);
  }

  // Policy agreement items
  if (Array.isArray(contentData.policyAgreement) && contentData.policyAgreement.length > 0) {
    result.policyAgreement = contentData.policyAgreement.map((item: any) => 
      typeof item === 'string' ? item : item.text || ''
    ).filter(Boolean);
  }

  // Other fields
  if (contentData['policy-agreement-intro'] || contentData.policyAgreementIntro) {
    result.policyAgreementIntro = contentData['policy-agreement-intro'] || contentData.policyAgreementIntro || "";
  }
  if (contentData['membership-drawer-link'] || contentData.membershipDrawerLink) {
    result.membershipDrawerLink = contentData['membership-drawer-link'] || contentData.membershipDrawerLink || "";
  }

  return result;
}

export default function DoorAccessDrawer({
  isOpen,
  onClose,
  onOpenMembershipDrawer,
  header,
}: DoorAccessDrawerProps) {
  // Don't initialize with any data - wait for data from database
  // Never use cache on initialization to avoid showing stale/static data
  const [localHeader, setLocalHeader] = useState<{ title?: string; description?: string } | null>(null);
  const [policyIntro, setPolicyIntro] = useState<string[]>([]);
  const [policyAgreement, setPolicyAgreement] = useState<string[]>([]);
  const [policyAgreementIntro, setPolicyAgreementIntro] = useState<string>("");
  const [membershipDrawerLink, setMembershipDrawerLink] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Always fetch from database - only use real data from Supabase
  const applySrcToState = (src: any) => {
    if (!src) return;
    const extracted = extractDoorAccessData(src);
    
    // Always update header from database
    console.log('[DoorAccessDrawer] Updating header:', { 
      hasSrc: !!src, 
      hasHeaderData: !!src?.header?.data,
      extractedHeader: extracted.header 
    });
    
    // Update header state - always set to extracted value (even if null)
    setLocalHeader(extracted.header);
    setPolicyIntro(extracted.policyIntro);
    setPolicyAgreement(extracted.policyAgreement);
    setPolicyAgreementIntro(extracted.policyAgreementIntro);
    setMembershipDrawerLink(extracted.membershipDrawerLink);
    setDataLoaded(true);
  };

  // Set up subscription (only subscribe, don't fetch on mount)
  useEffect(() => {
    let mounted = true;

    // Subscribe to cache updates so we update when cache changes (even when drawer is closed)
    const unsubscribe = subscribeToDoorAccessCache((data) => {
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
    fetchDoorAccessCached(true).then((data) => {
      if (mounted && data) {
        applySrcToState(data);
      }
    }).catch((err) => {
      console.error('[DoorAccessDrawer] fetchDoorAccessCached error:', err);
    });

    return () => { mounted = false; };
  }, [isOpen]);

  // Only use localHeader from Supabase - ignore header prop to avoid showing static data
  // Only show header when data is loaded from Supabase
  const effectiveHeader = dataLoaded ? localHeader : null;
  
  // Only use real data from Supabase - no fallbacks
  const displayPolicyIntro = policyIntro;
  const displayPolicyAgreement = policyAgreement;
  const displayPolicyAgreementIntro = policyAgreementIntro;
  const displayMembershipDrawerLink = membershipDrawerLink;
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: "Door Access Request",
          subject: `Door access: ${data["fullName"] || "(no name)"}`,
          text: Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      toast.success("Your request was submitted. We will contact you by email with the access code if approved.");
      form.reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("There was an error submitting the request. Please try again later.");
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
        aria-labelledby="door-access-drawer-title"
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-slate-900 to-sky-900 px-6 py-5 text-white">
          <div className="max-w-xl">
            {effectiveHeader?.title && (
              <h2 id="door-access-drawer-title" className="text-xl font-semibold tracking-tight">
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
            aria-label="Close door access details"
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
              <div className="space-y-4">
                {displayPolicyIntro.length > 0 ? (
                  displayPolicyIntro.map((text, index) => (
                    <div 
                      key={index} 
                      className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: text || '' }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No policy introduction available.</p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-sky-100 bg-linear-to-br from-white to-sky-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Security Policy
            </p>
            <p className="mt-3 text-xs text-gray-600">
              * Indicates required question
            </p>
          </div>

          <form
            id="door-access-form"
            onSubmit={handleFormSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-semibold text-gray-900">
                Full Name (First and Last name) <span className="text-rose-600">*</span>
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="mobile-number" className="text-sm font-semibold text-gray-900">
                Mobile Number <span className="text-rose-600">*</span>
              </label>
              <input
                id="mobile-number"
                name="mobileNumber"
                type="tel"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="residential-address" className="text-sm font-semibold text-gray-900">
                Residential Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="residential-address"
                name="residentialAddress"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="organization" className="text-sm font-semibold text-gray-900">
                Working/studying Organization <span className="text-rose-600">*</span>
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="access-reason" className="text-sm font-semibold text-gray-900">
                Specify the reason for requiring access (prayer, event, meeting, etc.) at times outside the regular prayer times. Access outside regular unlock times, will be reviewed based on the need of the personnel. <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="access-reason"
                name="accessReason"
                required
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
              <legend className="text-sm font-semibold text-gray-900">
                Do you want to become a member of Fort Dodge Islamic Center? We advise everyone to apply for membership. Regular membership is always free. The voting membership costs $30 per year.
                <span className="text-rose-600"> *</span>
              </legend>
              <div className="space-y-2 text-sm text-gray-800">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="membership"
                    value="yes"
                    required
                    className="mt-1 h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  <span>
                    Yes, please fill the form via the membership drawer{" "}
                    <Link
                      href={displayMembershipDrawerLink}
                      className="text-sky-700 underline underline-offset-2"
                      onClick={(event) => {
                        event.preventDefault();
                        onClose();
                        onOpenMembershipDrawer();
                      }}
                    >
                      Open Membership Drawer
                    </Link>
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="membership"
                    value="no"
                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  No
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="membership"
                    value="current"
                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  I am currently a member
                </label>
              </div>
            </fieldset>

            <div className="rounded-xl border border-gray-200 bg-slate-50/60 p-4">
              {displayPolicyAgreementIntro ? (
                <div 
                  className="text-sm text-gray-900 mb-3 prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: displayPolicyAgreementIntro }}
                />
              ) : (
                <p className="text-sm text-gray-500 italic mb-3">No policy agreement introduction available.</p>
              )}
              <ul className="space-y-2 mb-4">
                {displayPolicyAgreement.length > 0 ? (
                  displayPolicyAgreement.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-800">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-600" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-500 italic">No policy agreement items available.</li>
                )}
              </ul>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  name="agreement"
                  required
                  className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                />
                I agree
              </label>
              </div>
            </form>
            </>
          )}
        </div>
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="submit"
            form="door-access-form"
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Submit
          </button>
        </div>
      </aside>
    </>
  );
}

