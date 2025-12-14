"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "./Toaster";

interface ApplyMembershipDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  header?: { title?: string; description?: string } | null;
}

// In-memory client-side cache and subscription for membership content.
// This ensures we fetch from the API only once and then listen for
// Supabase realtime updates to refresh the cache when the data changes.
let membershipCache: any = null;
let membershipFetchPromise: Promise<any> | null = null;
const membershipSubscribers = new Set<(data: any) => void>();
let membershipChannel: any = null;

async function fetchMembershipCached(force = false) {
  if (membershipCache && !force) return membershipCache;
  if (membershipFetchPromise && !force) return membershipFetchPromise;

  membershipFetchPromise = (async () => {
    const res = await fetch('/api/apply-membership', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch membership');
    const json = await res.json();
    if (!json.ok || !json.applyMembership?.data) {
      membershipCache = null;
    } else {
      // normalize shape used by the component
      const data = json.applyMembership.data;
      const src = data.data && typeof data.data === 'object' ? data.data : data;
      membershipCache = src;
    }

    membershipFetchPromise = null;

    // notify subscribers
    membershipSubscribers.forEach((cb) => {
      try { cb(membershipCache); } catch (e) { console.error(e); }
    });

    return membershipCache;
  })();

  return membershipFetchPromise;
}

function ensureMembershipRealtimeSubscription() {
  if (membershipChannel) return;

  membershipChannel = supabase
    .channel('membership-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Home', filter: "page_name=eq.apply-membership" },
      async (payload: any) => {
        console.log('[ApplyMembershipDrawer] Supabase change payload:', payload);
        try {
          await fetchMembershipCached(true); // force refresh cache
        } catch (err) {
          console.error('[ApplyMembershipDrawer] Failed to refresh membership cache after change:', err);
        }
      }
    )
    .subscribe();
}

function subscribeToMembershipCache(cb: (data: any) => void) {
  membershipSubscribers.add(cb);
  // ensure the realtime subscription is active when there is at least one subscriber
  ensureMembershipRealtimeSubscription();
  return () => {
    membershipSubscribers.delete(cb);
    if (membershipSubscribers.size === 0 && membershipChannel) {
      supabase.removeChannel(membershipChannel);
      membershipChannel = null;
    }
  };
}


// Helper function to extract data from cache (no defaults - only returns what's in database)
function extractMembershipData(src: any) {
  const result = {
    header: null as { title?: string; description?: string } | null,
    overview: [] as string[],
    highlights: [] as string[],
    instructions: [] as string[],
    donateLink: "",
    mohidLink: "",
    mailingListNote: "",
    googleFormUrl: "",
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
  
  // Overview paragraphs
  if (Array.isArray(contentData.overview) && contentData.overview.length > 0) {
    result.overview = contentData.overview.map((item: any) => 
      typeof item === 'string' ? item : item.text || ''
    ).filter(Boolean);
  }

  // Highlights
  if (Array.isArray(contentData.highlights) && contentData.highlights.length > 0) {
    result.highlights = contentData.highlights.map((item: any) => 
      typeof item === 'string' ? item : item.text || ''
    ).filter(Boolean);
  }

  // Instructions
  if (Array.isArray(contentData.instructions) && contentData.instructions.length > 0) {
    result.instructions = contentData.instructions.map((item: any) => 
      typeof item === 'string' ? item : item.text || ''
    ).filter(Boolean);
  }

  // Other fields - only set if they exist in database
  if (contentData['donate-link'] || contentData.donateLink) {
    result.donateLink = contentData['donate-link'] || contentData.donateLink || "";
  }
  if (contentData['mohid-link'] || contentData.mohidLink) {
    result.mohidLink = contentData['mohid-link'] || contentData.mohidLink || "";
  }
  if (contentData['mailing-list-note'] || contentData.mailingListNote) {
    result.mailingListNote = contentData['mailing-list-note'] || contentData.mailingListNote || "";
  }
  if (contentData['google-form-url'] || contentData.googleFormUrl) {
    result.googleFormUrl = contentData['google-form-url'] || contentData.googleFormUrl || "";
  }

  return result;
}

export default function ApplyMembershipDrawer({
  isOpen,
  onClose,
  header,
}: ApplyMembershipDrawerProps) {
  // Don't initialize with any data - wait for data from database
  // Never use cache on initialization to avoid showing stale/static data
  const [localHeader, setLocalHeader] = useState<{ title?: string; description?: string } | null>(null);
  const [overview, setOverview] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [donateLink, setDonateLink] = useState("");
  const [mohidLink, setMohidLink] = useState("");
  const [mailingListNote, setMailingListNote] = useState("");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Always fetch from database - only use real data from Supabase
  const applySrcToState = (src: any) => {
    if (!src) return;
    const extracted = extractMembershipData(src);
    
    setLocalHeader(extracted.header);
    setOverview(extracted.overview);
    setHighlights(extracted.highlights);
    setInstructions(extracted.instructions);
    setDonateLink(extracted.donateLink);
    setMohidLink(extracted.mohidLink);
    setMailingListNote(extracted.mailingListNote);
    setGoogleFormUrl(extracted.googleFormUrl);
    setDataLoaded(true);
  };

  // Set up subscription (only subscribe, don't fetch on mount)
  useEffect(() => {
    let mounted = true;

    // Subscribe to cache updates so we update when cache changes (even when drawer is closed)
    const unsubscribe = subscribeToMembershipCache((data) => {
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
    fetchMembershipCached(true).then((data) => {
      if (mounted && data) {
        applySrcToState(data);
      }
    }).catch((err) => {
      console.error('[ApplyMembershipDrawer] fetchMembershipCached error:', err);
    });

    return () => { mounted = false; };
  }, [isOpen]);

  // Only use localHeader from Supabase - ignore header prop to avoid showing static data
  // Only show header when data is loaded from Supabase
  const effectiveHeader = dataLoaded ? localHeader : null;
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: "Membership Application",
          subject: `Membership: ${data["fullName"] || "(no name)"}`,
          text: Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      // Show success message
      toast.success("Thank you! Your membership application has been submitted successfully.");

      form.reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("There was an error submitting the membership form. Please try again later.");
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
        aria-labelledby="membership-drawer-title"
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-slate-900 to-sky-900 px-6 py-5 text-white">
          <div className="max-w-xl">
            {effectiveHeader?.title && (
              <h2 id="membership-drawer-title" className="text-xl font-semibold tracking-tight">
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
            aria-label="Close membership details"
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
              {overview.length > 0 && (
            <div className="space-y-4">
              {overview.map((text, index) => (
                <div 
                  key={index} 
                  className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: text || '' }}
                />
              ))}
            </div>
          )}
          {highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {highlights.map((item, index) => (
                <span
                  key={index}
                  className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {(instructions.length > 0 || donateLink || mohidLink || mailingListNote) && (
            <div className="mt-6 rounded-2xl border border-sky-100 bg-linear-to-br from-white to-sky-50 p-5">
              {instructions.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Instructions
                  </p>
                  <ul className="mt-3 space-y-3 text-sm text-gray-700">
                    {instructions.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-600" />
                        <div 
                          className="prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: step || '' }}
                        />
                      </li>
                    ))}
                    {donateLink && (
                      <li className="flex flex-col gap-1 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Online link:</span>
                        <Link
                          href={donateLink}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sky-700 underline underline-offset-2"
                        >
                          {donateLink.startsWith('http') ? donateLink : `https://www.arqum.org${donateLink}`}
                        </Link>
                      </li>
                    )}
                    {mohidLink && (
                      <li className="flex flex-col gap-1 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">MOHID link:</span>
                        <Link
                          href={mohidLink}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sky-700 underline underline-offset-2"
                        >
                          {mohidLink}
                        </Link>
                      </li>
                    )}
                  </ul>
                </>
              )}
              {mailingListNote && (
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">
                  {mailingListNote}
                </p>
              )}
            </div>
          )}

              <form
                id="apply-membership-form"
                onSubmit={handleFormSubmit}
                className="mt-6 space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-sm font-semibold text-gray-900">
                Full Name <span className="text-rose-600">*</span>
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
              <label htmlFor="mailing-address" className="text-sm font-semibold text-gray-900">
                Mailing Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="mailing-address"
                name="mailingAddress"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone-number" className="text-sm font-semibold text-gray-900">
                Phone Number <span className="text-rose-600">*</span>
              </label>
              <input
                id="phone-number"
                name="phoneNumber"
                type="tel"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                Email <span className="text-rose-600">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
              <legend className="text-sm font-semibold text-gray-900">
                Do you want to be added to Fort Dodge Islamic Center mailing list to receive updates and notifications?
                <span className="text-rose-600"> *</span>
              </legend>
              <div className="space-y-2 text-sm text-gray-800">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mailingList"
                    value="yes"
                    required
                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mailingList"
                    value="no"
                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  No
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-gray-200 bg-slate-50/60 p-4">
              <legend className="text-sm font-semibold text-gray-900">
                Type of Membership <span className="text-rose-600">*</span>
              </legend>
              <div className="space-y-2 text-sm text-gray-800">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="membershipType"
                    value="full"
                    required
                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  Full Member ($30/Year)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="membershipType"
                    value="associate"
                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                  />
                  Associate Member
                </label>
              </div>
            </fieldset>
              </form>
            </>
          )}
        </div>
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="submit"
            form="apply-membership-form"
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Submit
          </button>
        </div>
      </aside>
    </>
  );
}


