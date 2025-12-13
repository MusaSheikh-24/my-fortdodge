"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "./Toaster";

// In-memory client-side cache and subscription for contact content.
// This ensures we fetch from the API only once and then listen for
// Supabase realtime updates to refresh the cache when the data changes.
let contactCache: any = null;
let contactFetchPromise: Promise<any> | null = null;
const contactSubscribers = new Set<(data: any) => void>();
let contactChannel: any = null;

async function fetchContactCached(force = false) {
  if (contactCache && !force) return contactCache;
  if (contactFetchPromise && !force) return contactFetchPromise;

  contactFetchPromise = (async () => {
    const res = await fetch('/api/contact', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch contact');
    const json = await res.json();
    if (!json.ok || !json.contact?.data) {
      contactCache = null;
    } else {
      // normalize shape used by the component
      const src = json.contact.data.data && typeof json.contact.data.data === 'object' ? json.contact.data.data : json.contact.data;
      contactCache = src;
    }

    contactFetchPromise = null;

    // notify subscribers
    contactSubscribers.forEach((cb) => {
      try { cb(contactCache); } catch (e) { console.error(e); }
    });

    return contactCache;
  })();

  return contactFetchPromise;
}

function ensureContactRealtimeSubscription() {
  if (contactChannel) return;

  contactChannel = supabase
    .channel('contact-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Home', filter: "page_name=eq.contact" },
      async (payload: any) => {
        console.log('[ContactDrawer] Supabase change payload:', payload);
        try {
          await fetchContactCached(true); // force refresh cache
        } catch (err) {
          console.error('[ContactDrawer] Failed to refresh contact cache after change:', err);
        }
      }
    )
    .subscribe();
}

function subscribeToContactCache(cb: (data: any) => void) {
  contactSubscribers.add(cb);
  // ensure the realtime subscription is active when there is at least one subscriber
  ensureContactRealtimeSubscription();
  return () => {
    contactSubscribers.delete(cb);
    if (contactSubscribers.size === 0 && contactChannel) {
      supabase.removeChannel(contactChannel);
      contactChannel = null;
    }
  };
}

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  header?: { title?: string; description?: string } | null;
  methods?: Array<{ label: string; href: string; external?: boolean; display?: string }> | null;
}

const DEFAULT_CONTACT_METHODS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/DAIC.Ames/",
    external: true,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/?phone=15152923683",
    external: true,
  },
  {
    label: "Email",
    href: "mailto:info@arqum.org",
    external: false,
  },
  {
    label: "Voicemail",
    href: "tel:15152923683",
    external: false,
    display: "(515) 292-3683",
  },
];

export default function ContactDrawer({
  isOpen,
  onClose,
  header,
  methods,
}: ContactDrawerProps) {
  // Initialize state from cache if available, otherwise use defaults
  const [localHeader, setLocalHeader] = useState<{ title?: string; description?: string } | null>(() => {
    if (header) return null;
    if (contactCache?.header?.data) {
      const headerData = contactCache.header.data as any;
      const title = headerData['drawer-title'] || headerData.drawerTitle || undefined;
      const description = headerData['drawer-subtitle'] || headerData.drawerSubtitle || undefined;
      return { title, description };
    }
    return null;
  });
  
  const [localMethods, setLocalMethods] = useState(() => {
    if (methods) return DEFAULT_CONTACT_METHODS;
    if (contactCache) {
      const contentSection = contactCache?.content?.data || contactCache?.content || null;
      if (contentSection) {
        const methodsArr = [] as any[];
        if (contentSection['contact-facebook']) methodsArr.push({ label: 'Facebook', href: contentSection['contact-facebook'], external: true });
        if (contentSection['contact-whatsapp']) methodsArr.push({ label: 'WhatsApp', href: contentSection['contact-whatsapp'], external: true });
        if (contentSection['contact-email']) methodsArr.push({ label: 'Email', href: `mailto:${contentSection['contact-email']}`, external: false });
        if (contentSection['contact-voicemail']) methodsArr.push({ label: 'Voicemail', href: `tel:${contentSection['contact-voicemail'].replace(/[^0-9+]/g, '')}`, external: false, display: contentSection['contact-voicemail'] });
        if (methodsArr.length > 0) return methodsArr;
      }
    }
    return DEFAULT_CONTACT_METHODS;
  });

  // Don't pre-fetch on mount - only fetch when drawer opens

  // Update state when drawer opens or cache changes
  useEffect(() => {
    if (header) return;

    let mounted = true;

    const applySrcToState = (src: any) => {
      // Extract header - match ApplyMembershipDrawer pattern
      if (src?.header?.data) {
        const headerData = src.header.data as any;
        const title = headerData['drawer-title'] || headerData.drawerTitle || undefined;
        const description = headerData['drawer-subtitle'] || headerData.drawerSubtitle || undefined;
        if (mounted) {
          setLocalHeader({ title, description });
        }
      }
      
      if (mounted) {

        const contentSection = src?.content?.data || src?.content || null;
        if (contentSection) {
          const methodsArr = [] as any[];
          if (contentSection['contact-facebook']) methodsArr.push({ label: 'Facebook', href: contentSection['contact-facebook'], external: true });
          if (contentSection['contact-whatsapp']) methodsArr.push({ label: 'WhatsApp', href: contentSection['contact-whatsapp'], external: true });
          if (contentSection['contact-email']) methodsArr.push({ label: 'Email', href: `mailto:${contentSection['contact-email']}`, external: false });
          if (contentSection['contact-voicemail']) methodsArr.push({ label: 'Voicemail', href: `tel:${contentSection['contact-voicemail'].replace(/[^0-9+]/g, '')}`, external: false, display: contentSection['contact-voicemail'] });
          if (methodsArr.length > 0) setLocalMethods(methodsArr);
        }
      }
    };

    // Subscribe to cache updates so we update only when cache changes.
    const unsubscribe = subscribeToContactCache((data) => {
      if (!data) return;
      applySrcToState(data);
    });

    // If drawer is open, populate immediately from cache (synchronously if available)
    if (isOpen) {
      // Check cache synchronously first for instant display
      if (contactCache) {
        applySrcToState(contactCache);
      }
      // Also fetch to ensure we have the latest data (will use cache if available)
      fetchContactCached().then((data) => {
        if (mounted && data) applySrcToState(data);
      }).catch((err) => console.error('[ContactDrawer] fetchContactCached error:', err));
    }

    return () => { mounted = false; unsubscribe(); };
  }, [header, isOpen]);

  const effectiveHeader = header ?? localHeader;
  const effectiveMethods = methods ?? localMethods;
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: "Contact Form",
          subject: `Contact form: ${data["fullName"] || "(no name)"}`,
          text: Object.entries(data)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send message");

      toast.success("Thank you for your message! We will get back to you soon.");
      form.reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("There was an error sending your message. Please try again later.");
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
        aria-labelledby="contact-drawer-title"
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-slate-900 to-sky-900 px-6 py-5 text-white">
          <div className="max-w-xl">
            <h2 id="contact-drawer-title" className="text-xl font-semibold tracking-tight">
              {effectiveHeader?.title ?? "Fort Dodge Islamic Center - Contact Us"}
            </h2>
            {effectiveHeader?.description ? (
              <p 
                className="mt-1 text-sm text-white/80"
                dangerouslySetInnerHTML={{ __html: effectiveHeader.description }}
              />
            ) : (
              <p className="mt-1 text-sm text-white/80">
                To serve you better, we suggest to use any of the different contact means we have available. But, we are happy to receive any anonymous queries or questions via this form.
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close contact form"
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
          <div className="space-y-6">
            {/* Contact Methods Section */}
            <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-white to-sky-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 mb-4">
                Contact Methods
              </p>
              <div className="space-y-3">
                {effectiveMethods.map((method) => (
                  <div
                    key={method.label}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {method.label}:
                    </span>
                    <Link
                      href={method.href}
                      target={method.external ? "_blank" : undefined}
                      rel={method.external ? "noreferrer" : undefined}
                      className="break-all text-sm text-sky-700 underline underline-offset-2 hover:text-sky-900"
                    >
                      {method.display || method.href.replace(/^(mailto:|tel:)/, "")}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Section */}
            <form
              id="contact-form"
              onSubmit={handleFormSubmit}
              className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs text-gray-500 mb-4">
                <span className="text-rose-600">*</span> Indicates required question
              </p>

              <div className="space-y-2">
                <label htmlFor="full-name" className="text-sm font-semibold text-gray-900">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Your answer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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
                  placeholder="Your answer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-gray-900">
                  Phone <span className="text-rose-600">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="Your answer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold text-gray-900">
                  Message <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Your answer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="submit"
            form="contact-form"
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-700 hover:to-purple-800"
          >
            Submit
          </button>
        </div>
      </aside>
    </>
  );
}

