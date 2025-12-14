"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "./Toaster";

interface FinancialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  header?: { title?: string; description?: string } | null;
}

// In-memory client-side cache and subscription for financial assistance content.
// This ensures we fetch from the API only once and then listen for
// Supabase realtime updates to refresh the cache when the data changes.
let financialCache: any = null;
let financialFetchPromise: Promise<any> | null = null;
const financialSubscribers = new Set<(data: any) => void>();
let financialChannel: any = null;

async function fetchFinancialCached(force = false) {
  if (financialCache && !force) return financialCache;
  if (financialFetchPromise && !force) return financialFetchPromise;

  financialFetchPromise = (async () => {
    const res = await fetch('/api/financial-assistance', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch financial assistance');
    const json = await res.json();
    if (!json.ok || !json.financialAssistance?.data) {
      financialCache = null;
    } else {
      // normalize shape used by the component
      const data = json.financialAssistance.data;
      const src = data.data && typeof data.data === 'object' ? data.data : data;
      financialCache = src;
    }

    financialFetchPromise = null;

    // notify subscribers
    financialSubscribers.forEach((cb) => {
      try { cb(financialCache); } catch (e) { console.error(e); }
    });

    return financialCache;
  })();

  return financialFetchPromise;
}

function ensureFinancialRealtimeSubscription() {
  if (financialChannel) return;

  financialChannel = supabase
    .channel('financial-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Home', filter: "page_name=eq.financial-assistance" },
      async (payload: any) => {
        console.log('[FinancialDrawer] Supabase change payload:', payload);
        try {
          await fetchFinancialCached(true); // force refresh cache
        } catch (err) {
          console.error('[FinancialDrawer] Failed to refresh financial cache after change:', err);
        }
      }
    )
    .subscribe();
}

function subscribeToFinancialCache(cb: (data: any) => void) {
  financialSubscribers.add(cb);
  // ensure the realtime subscription is active when there is at least one subscriber
  ensureFinancialRealtimeSubscription();
  return () => {
    financialSubscribers.delete(cb);
    if (financialSubscribers.size === 0 && financialChannel) {
      supabase.removeChannel(financialChannel);
      financialChannel = null;
    }
  };
}

const maritalStatusOptions = ["Married", "Single", "Divorced", "Widowed"];

const frequencyScale = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// Helper function to extract data from cache (no defaults - only returns what's in database)
function extractFinancialData(src: any) {
  const result = {
    header: null as { title?: string; description?: string } | null,
    overview: [] as string[],
    howToApply: [] as any[],
    financialFormUrl: "",
    helpEmail: "",
    websiteUrl: "",
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

  // How to apply (support both camelCase and kebab-case)
  const howToApplyData = contentData.howToApply || contentData['how-to-apply'];
  if (Array.isArray(howToApplyData) && howToApplyData.length > 0) {
    result.howToApply = howToApplyData.map((item: any) => {
      if (typeof item === 'string') {
        return { title: item, description: '' };
      }
      // Handle bullets - can be array, newline-separated string, or empty
      let bullets: string[] | undefined = undefined;
      if (item.bullets) {
        if (Array.isArray(item.bullets)) {
          bullets = item.bullets.filter((b: any) => b && b.trim());
        } else if (typeof item.bullets === 'string' && item.bullets.trim()) {
          bullets = item.bullets.split('\n').filter((b: string) => b.trim());
        }
      }
      return {
        title: item.title || item['title'] || '',
        description: item.description || item['description'] || '',
        bullets: bullets && bullets.length > 0 ? bullets : undefined,
      };
    }).filter((item: any) => item.title);
  }

  // Other fields - only set if they exist in database
  if (contentData['financial-form-url'] || contentData.financialFormUrl) {
    result.financialFormUrl = contentData['financial-form-url'] || contentData.financialFormUrl || "";
  }
  if (contentData['help-email'] || contentData.helpEmail) {
    result.helpEmail = contentData['help-email'] || contentData.helpEmail || "";
  }
  if (contentData['website-url'] || contentData.websiteUrl) {
    result.websiteUrl = contentData['website-url'] || contentData.websiteUrl || "";
  }

  return result;
}

export default function FinancialDrawer({
  isOpen,
  onClose,
  header,
}: FinancialDrawerProps) {
  // Don't initialize with any data - wait for data from database
  // Never use cache on initialization to avoid showing stale/static data
  const [localHeader, setLocalHeader] = useState<{ title?: string; description?: string } | null>(null);
  const [overview, setOverview] = useState<string[]>([]);
  const [howToApply, setHowToApply] = useState<any[]>([]);
  const [financialFormUrl, setFinancialFormUrl] = useState<string>("");
  const [helpEmail, setHelpEmail] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Always fetch from database - only use real data from Supabase
  const applySrcToState = (src: any) => {
    if (!src) return;
    const extracted = extractFinancialData(src);
    
    // Always update header from database
    console.log('[FinancialDrawer] Updating header:', { 
      hasSrc: !!src, 
      hasHeaderData: !!src?.header?.data,
      extractedHeader: extracted.header 
    });
    
    // Update header state - always set to extracted value (even if null)
    setLocalHeader(extracted.header);
    setOverview(extracted.overview);
    setHowToApply(extracted.howToApply);
    setFinancialFormUrl(extracted.financialFormUrl);
    setHelpEmail(extracted.helpEmail);
    setWebsiteUrl(extracted.websiteUrl);
    setDataLoaded(true);
  };

  // Set up subscription (only subscribe, don't fetch on mount)
  useEffect(() => {
    let mounted = true;

    // Subscribe to cache updates so we update when cache changes (even when drawer is closed)
    const unsubscribe = subscribeToFinancialCache((data) => {
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
    fetchFinancialCached(true).then((data) => {
      if (mounted && data) {
        applySrcToState(data);
      }
    }).catch((err) => {
      console.error('[FinancialDrawer] fetchFinancialCached error:', err);
    });

    return () => { mounted = false; };
  }, [isOpen]);

  // Only use localHeader from Supabase - ignore header prop to avoid showing static data
  // Only show header when data is loaded from Supabase
  const effectiveHeader = dataLoaded ? localHeader : null;
  
  // Only use real data from Supabase - no fallbacks
  const displayOverview = overview;
  const displayHowToApply = howToApply;
  const displayFinancialFormUrl = financialFormUrl;
  const displayHelpEmail = helpEmail;
  const displayWebsiteUrl = websiteUrl;
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: "Financial Assistance",
          subject: `Financial assistance: ${data["applicantName"] || "(no name)"}`,
          text: Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      toast.success("Your financial assistance application has been submitted. We will contact you by email.");
      form.reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("There was an error submitting your application. Please try again later.");
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
        aria-labelledby="financial-drawer-title"
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-slate-900 to-sky-900 px-6 py-5 text-white">
          <div className="max-w-xl">
            {effectiveHeader?.title && (
              <h2 id="financial-drawer-title" className="text-xl font-semibold tracking-tight">
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
            aria-label="Close financial assistance details"
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
                {displayOverview.length > 0 ? (
                  displayOverview.map((text, index) => (
                    <div 
                      key={index} 
                      className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: text || '' }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No overview content available.</p>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-sky-100 bg-linear-to-br from-white to-sky-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  How to apply
                </p>
                <div className="mt-3 space-y-4 text-sm text-gray-700">
                  {displayHowToApply.map((item, index) => (
                    <div key={item.title || index} className="rounded-xl bg-white/80 p-4 shadow-sm">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      {item.description ? (
                        <div 
                          className="mt-2 prose prose-sm max-w-none [&_*]:max-w-full [&_strong]:font-semibold [&_em]:italic [&_a]:text-sky-700 [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 italic">No description available.</p>
                      )}
                      {item.bullets && Array.isArray(item.bullets) && item.bullets.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                          {item.bullets.map((bullet: string, bulletIndex: number) => (
                            <li key={bulletIndex}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                {displayHelpEmail && (
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">
                    For help, email{" "}
                    <Link
                      href={`mailto:${displayHelpEmail}`}
                      className="text-sky-700 underline underline-offset-2"
                    >
                      {displayHelpEmail}
                    </Link>
                    {displayWebsiteUrl && (
                      <>
                        {" "}or visit our{" "}
                        <Link href={displayWebsiteUrl} className="text-sky-700 underline underline-offset-2">
                          website
                        </Link>
                      </>
                    )}
                    . Your privacy will be respected at every step.
                  </p>
                )}
              </div>
            </>
          )}

          <form
            id="financial-assistance-form"
            onSubmit={handleSubmit}
            className="mt-6 space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="space-y-2">
              <label htmlFor="applicant-name" className="text-sm font-semibold text-gray-900">
                Applicant Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="applicant-name"
                name="applicantName"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="financial-mailing-address" className="text-sm font-semibold text-gray-900">
                Mailing Address <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="financial-mailing-address"
                name="mailingAddress"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="financial-phone" className="text-sm font-semibold text-gray-900">
                Phone <span className="text-rose-600">*</span>
              </label>
              <input
                id="financial-phone"
                name="phone"
                type="tel"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="financial-email" className="text-sm font-semibold text-gray-900">
                Email <span className="text-rose-600">*</span>
              </label>
              <input
                id="financial-email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
              <legend className="text-sm font-semibold text-gray-900">
                Marital Status <span className="text-rose-600">*</span>
              </legend>
              <div className="space-y-2 text-sm text-gray-800">
                {maritalStatusOptions.map((status) => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="maritalStatus"
                      value={status.toLowerCase()}
                      required
                      className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                    />
                    {status}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="household-members" className="text-sm font-semibold text-gray-900">
                List member of your family living with you and their relationship to you{" "}
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="household-members"
                name="householdMembers"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="assistance-reason" className="text-sm font-semibold text-gray-900">
                Reason You Need Assistance <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="assistance-reason"
                name="assistanceReason"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="monthly-income" className="text-sm font-semibold text-gray-900">
                Monthly Income <span className="text-rose-600">*</span>
              </label>
              <p className="text-xs text-gray-600">
                Kindly list your current sources of income. Include grants or assistance you receive
                from local, state, or federal government and any other agency.
              </p>
              <textarea
                id="monthly-income"
                name="monthlyIncome"
                required
                rows={3}
                placeholder="Job ($2000)\nGovernment Assistance ($250)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="monthly-expenses" className="text-sm font-semibold text-gray-900">
                Monthly Expenses <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="monthly-expenses"
                name="monthlyExpenses"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="assistance-amount" className="text-sm font-semibold text-gray-900">
                Amount of assistance you need <span className="text-rose-600">*</span>
              </label>
              <input
                id="assistance-amount"
                name="assistanceAmount"
                type="text"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4">
              <legend className="text-sm font-semibold text-gray-900">
                How often you need assistance? <span className="text-rose-600">*</span>
              </legend>
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  <span>Month</span>
                  <span>Months</span>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-10 text-center text-[0.65rem] font-semibold text-gray-500 sm:text-xs">
                    {frequencyScale.map((value) => (
                      <span key={`label-${value}`}>{value}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-10 gap-1 sm:gap-2">
                    {frequencyScale.map((value, index) => (
                      <label
                        key={value}
                        className="flex flex-col items-center gap-1 text-[0.7rem] text-gray-700"
                      >
                        <input
                          type="radio"
                          name="assistanceFrequency"
                          value={value}
                          required={index === 0}
                          className="peer sr-only"
                        />
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-[0.6rem] shadow-sm transition peer-checked:border-sky-600 peer-checked:bg-sky-50 sm:h-7 sm:w-7"
                          aria-hidden="true"
                        >
                          <span className="h-2 w-2 rounded-full bg-sky-600 opacity-0 transition peer-checked:opacity-100 sm:h-2.5 sm:w-2.5" />
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="submit"
            form="financial-assistance-form"
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Submit
          </button>
        </div>
      </aside>
    </>
  );
}


